// Runs against the BUILT helper in lib/, so it exercises the artifact consumers load,
// including resolution of the native bcrypt binding. Build first: `npx linked build`.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import PasswordHelper from '../lib/esm/helpers/password.js';

// Hashes produced by bcrypt 5.1.1 (node-pre-gyp build). Stored credentials were written in
// this format, so every one of them must keep verifying after a bcrypt upgrade.
const BCRYPT_5_HASHES = [
  {
    password: 'correct horse battery staple',
    // A historical hash using bcrypt's minimum cost remains supported.
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

test('a new hash has the $2b$ format and round-trips', async () => {
  const hash = await PasswordHelper.generateHashedPassword('s3cret');
  assert.match(hash, /^\$2b\$12\$[./A-Za-z0-9]{53}$/);
  assert.equal(await PasswordHelper.checkPassword('s3cret', hash), true);
  assert.equal(await PasswordHelper.checkPassword('S3cret', hash), false);
});

test('a malformed stored hash fails closed instead of throwing', async () => {
  assert.equal(await PasswordHelper.checkPassword('s3cret', 'not-a-hash'), false);
});

test('password sign-in can match a later duplicate credential', async () => {
  const credentials = [
    { id: 'old', passwordHash: BCRYPT_5_HASHES[0].hash },
    { id: 'current', passwordHash: BCRYPT_5_HASHES[3].hash },
  ];

  assert.equal(
    await PasswordHelper.findMatchingCredential('legacy-2a', credentials),
    credentials[1]
  );
  assert.equal(
    await PasswordHelper.findMatchingCredential('not-the-password', credentials),
    null
  );
});
