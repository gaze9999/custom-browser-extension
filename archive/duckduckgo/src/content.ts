import { isDOMMessage, isPopupSender } from './messages.ts';
import type { DOMMessageResponse } from './messages.ts';

if (location.protocol === 'https:' && location.hostname === 'duckduckgo.com') {
  let scheduled = false;

  const removeHeaderItems = (): void => {
    scheduled = false;
    document.querySelectorAll('div.header--aside .header--aside__item').forEach(element => element.remove());
  };

  new MutationObserver((): void => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(removeHeaderItems, 50);
  }).observe(document, { childList: true, subtree: true });
  removeHeaderItems();

  chrome.runtime.onMessage.addListener((
    message: unknown,
    sender,
    sendResponse: (response: DOMMessageResponse) => void,
  ): boolean => {
    if (!isPopupSender(sender) || !isDOMMessage(message) || message.from !== 'popup tabs') return false;
    sendResponse({ from: 'ddg-search', title: document.title });
    return false;
  });
}
