import { DOMMessage, DOMMessageResponse } from 'src/types';
import Common from './common';

/**
 * Main background proccess
 */
export class Background extends Common {

  constructor() {
    super();
    chrome.runtime.onInstalled.addListener(async (
      event: chrome.runtime.InstalledDetails): Promise<void> => {
      this.logger('background works', event);
      // chrome.action.setBadgeBackgroundColor({ color: '#333' });
      // chrome.action.setBadgeTextColor({ color: '#fff' });
      await chrome.action.setBadgeText({ text: 'LOL' });
    });

    chrome.runtime.onMessage.addListener(async (
      msg: DOMMessage,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: DOMMessageResponse) => void): Promise<void> => {
      switch (msg.from) {
        default: this.logger('bg runner', msg); break;
      }

      // sendResponse(msg as DOMMessageResponse);
    });

    // chrome.tabs.onUpdated.addListener(async (
    //   id: number,
    //   info: chrome.tabs.TabChangeInfo,
    //   tab: chrome.tabs.Tab) => {
    //   this.this.this.logger('tab updated', [id, info, tab]);
    // });

    // chrome.idle.onStateChanged.addListener(async (
    //   browserActivityState) => {
    //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     this.this.this.logger('onStateChanged', [browserActivityState, tabs]);
    //     // this.sendToTab(tabs[0].id, { browserActivityState: browserActivityState });
    //   });
    // });
  }
}
new Background();