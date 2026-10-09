// The account-removed event waits for its listeners, so their cleanup has finished before the
// account itself is deleted.
//
// Runs against the BUILT package in lib/.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const libDir = new URL('../lib/esm/', import.meta.url);
const events = await import(new URL('utils/events.js', libDir));

test('emitAccountWillBeRemovedEvent waits for async listeners', async () => {
  let finished = false;
  const listener = async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    finished = true;
  };
  events.onAccountWillBeRemoved(listener);
  try {
    await events.emitAccountWillBeRemovedEvent({ id: 'acc' });
    assert.equal(finished, true);
  } finally {
    events.offAccountWillBeRemoved(listener);
  }
});

test('a failing listener does not stop the others, and the failure is reported', async () => {
  let ran = false;
  const failing = async () => {
    throw new Error('listener failed');
  };
  const other = async () => {
    ran = true;
  };
  events.onAccountWillBeRemoved(failing);
  events.onAccountWillBeRemoved(other);
  try {
    await assert.rejects(events.emitAccountWillBeRemovedEvent({ id: 'acc' }), /listener failed/);
    assert.equal(ran, true);
  } finally {
    events.offAccountWillBeRemoved(failing);
    events.offAccountWillBeRemoved(other);
  }
});

test('onAccountWillBeRemoved returns an unsubscribe function', async () => {
  let calls = 0;
  const unsubscribe = events.onAccountWillBeRemoved(() => {
    calls++;
  });
  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
  await events.emitAccountWillBeRemovedEvent({ id: 'acc' });
  assert.equal(calls, 0);
});
