// import { DOMMessage, DOMMessageResponse } from 'src/types';
import { DOMMessage, DOMMessageResponse } from 'src/types';
import Common from '../common';

/**
 * For duck duck go search
 */
new class DDGSearch extends Common {

  constructor() {
    super();
    this.logger('main init');

    /**
     * Remove useless ads and share button
     */
    document.addEventListener('DOMContentLoaded', (event): void => {

      if (document.readyState !== 'complete' && document.readyState !== 'interactive') return;
      this.logger('onready', [event, document.readyState]);

      new MutationObserver((_list, obs): void => {
        const target = document?.querySelector('div.header--aside');
        if (!target || target?.querySelectorAll('.header--aside__item')?.length <= 0) return;
        this.logger('target', [target, target.querySelectorAll('div')]);
        target.querySelectorAll('.header--aside__item').forEach(d => d.remove());
        obs.disconnect();
      }).observe(document.body, { childList: true, subtree: true });

      /**
       * Remove empty slot
       */
      // new MutationObserver((_list, obs) => {
      //   const target = document.querySelector('.sidebar-modules');
      //   if (target && target.querySelectorAll('*').length === 0) {
      //     document.querySelector('.results--sidebar').remove();
      //     obs.disconnect();
      //   }
      // }).observe(document.querySelector('#links_wrapper'), { childList: true, subtree: true });
    }, false);

    chrome.runtime.onMessage.addListener(async (
      msg: DOMMessage,
      sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: DOMMessageResponse) => void): Promise<void> => {
      this.logger(`(main) from ${msg.from}:`, [msg, sender]);
    });
  }
};
