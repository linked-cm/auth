// Runs against the BUILT helper in lib/, so it exercises the artifact consumers load,
// including resolution of the native bcrypt binding. Build first: `npx linked build`.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import PasswordHelper, {PASSWORD_HASH_COST} from '../lib/esm/helpers/password.js';

// Hashes produced by bcrypt 5.1.1 (node-pre-gyp build). Stored credentials were written in
// this format, so every one of them must keep verifying after a bcrypt upgrade.
const BCRYPT_5_HASHES = [
  {
    password: 'correct horse battery staple',
    // generateHashedPassword used 3 rounds before 3.0.4; bcrypt clamps that to the minimum of 4.
    hash: '$2b$04$eye1NrzS0IIvhvF2J5vUSev86XW.nY.Hn/2cnBV/0ecIMgys8pvGC',
  },
  {
    password: 'pässwörd-\u{1F511}',
    hash: '$2b$10$o6jnU3DHE3YVK4wm8MkRR.aDLIogwOSnYQ1Ff0p.eFQ/gvwvIHq66',
  },
  {
    password: '',
    hash: '$2b$04$k6hiuy6xfAenh3WPkUD71uiSywDSGrvVPvn90q5wvtw2TcI7iYIv2',
  },
  {
    password: 'legacy-2a',
    hash: '$2a$05$bkrWb.lUIBHpfCxxSmR4V.Fs4MLbBOQUm2QELkQvMJgkUES8TED3K',
  },
];

for (const {password, hash} of BCRYPT_5_HASHES) {
  test(`a bcrypt 5 hash (${hash.slice(0, 7)}) still verifies`, async () => {
    assert.equal(await PasswordHelper.checkPassword(password, hash), true);
    assert.equal(await PasswordHelper.checkPassword(password + 'x', hash), false);
  });
}

test('a new hash has the $2b$ format, cost 10, and round-trips', async () => {
  const hash = await PasswordHelper.generateHashedPassword('s3cret');
  assert.match(hash, /^\$2b\$10\$[./A-Za-z0-9]{53}$/);
  assert.equal(bcrypt.getRounds(hash), 10);
  assert.equal(PASSWORD_HASH_COST, 10);
  assert.equal(await PasswordHelper.checkPassword('s3cret', hash), true);
  assert.equal(await PasswordHelper.checkPassword('S3cret', hash), false);
});

test('needsRehash: only a valid hash below the current cost needs one', () => {
  assert.equal(PasswordHelper.needsRehash(BCRYPT_5_HASHES[0].hash), true); // cost 4
  assert.equal(PasswordHelper.needsRehash(BCRYPT_5_HASHES[3].hash), true); // $2a$, cost 5
  assert.equal(PasswordHelper.needsRehash(BCRYPT_5_HASHES[1].hash), false); // cost 10
  assert.equal(PasswordHelper.needsRehash('not-a-hash'), false);
  assert.equal(PasswordHelper.needsRehash(undefined), false);
});

test('a malformed stored hash fails closed instead of throwing', async () => {
  assert.equal(await PasswordHelper.checkPassword('s3cret', 'not-a-hash'), false);
});
