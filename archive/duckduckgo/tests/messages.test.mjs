import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isDOMMessage, isPopupSender, sendToTab } from '../src/messages.ts';

test('message boundary rejects incomplete and unrelated payloads', () => {
  for (const value of [null, undefined, true, 'PING', {}, { type: 'GET_DOM' },
    { type: 'PING', from: 'page' }, { from: 'popup tabs' }]) {
    assert.equal(isDOMMessage(value), false);
  }
  assert.equal(isDOMMessage({ type: 'PING', from: 'popup runtime' }), true);
  assert.equal(isDOMMessage({ type: 'PING', from: 'popup tabs' }), true);
});

test('sender identity and exact popup URL are both required', () => {
  globalThis.chrome = { runtime: { id: 'test', getURL: file => `chrome-extension://test/${file}` } };
  assert.equal(isPopupSender({ id: 'test', url: 'chrome-extension://test/index.html' }), true);
  assert.equal(isPopupSender({ id: 'other', url: 'chrome-extension://test/index.html' }), false);
  assert.equal(isPopupSender({ id: 'test', url: 'https://duckduckgo.com/' }), false);
  assert.equal(isPopupSender({ id: 'test' }), false);
});

test('failed tab messaging preserves its target and does not retry another tab', async () => {
  const calls = [];
  const failure = new Error('No receiving content script');
  globalThis.chrome = { tabs: { sendMessage: async (...args) => { calls.push(args); throw failure; } } };
  const message = { type: 'PING', from: 'popup tabs' };
  await assert.rejects(sendToTab(7, message), error => error === failure);
  assert.deepEqual(calls, [[7, message]]);
  for (const id of [-1, 1.5, undefined, NaN]) await assert.rejects(sendToTab(id, message), /Invalid tab ID/);
  assert.equal(calls.length, 1);
});
