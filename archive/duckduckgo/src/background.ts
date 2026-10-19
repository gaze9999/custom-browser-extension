import { isDOMMessage, isPopupSender } from './messages.ts';
import type { DOMMessageResponse } from './messages.ts';

chrome.runtime.onInstalled.addListener((): void => {
  void chrome.action.setBadgeText({ text: 'LOL' }).catch(console.error);
});

chrome.runtime.onMessage.addListener((
  message: unknown,
  sender,
  sendResponse: (response: DOMMessageResponse) => void,
): boolean => {
  if (!isPopupSender(sender) || !isDOMMessage(message) || message.from !== 'popup runtime') return false;
  sendResponse({ from: 'background', title: 'DuckDuckGo Extension' });
  return false;
});
