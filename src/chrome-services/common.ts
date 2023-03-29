import { DOMMessage } from 'src/types';

/**
 * Common functions & variables
 * 
 * - logger: basic console logger bind with global controller
 * 
 * - sendToTab: chorme.tabs.sendMessage with error handling
 * 
 */
export default class Common {

  public logActive: boolean = true;

  constructor() {
  }

  public logger(message?: any, ...optionalParams: any[]): void {
    this.logActive && console.debug(
      `%c [${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}.${new Date().getMilliseconds()}]`,
      `color: #fa6`,
      message,
      ...optionalParams
    );
  }

  public async sendToTab(id: number, event: DOMMessage): Promise<any> {
    try {
      return await chrome.tabs.sendMessage(id, event);
    } catch (e) {
      const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
      console.error(
        `%c [${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}.${new Date().getMilliseconds()}]`,
        `color: #fa6`,
        `send failed (${id})`,
        [currentTab,
          e,
          event]
      );
      await chrome.tabs.sendMessage(currentTab[0]?.id, { ...event, from: 'send_error', error: e });
      throw new Error(await e as any);
    }
    // .finally(() => console.trace('f'));
  }
}
