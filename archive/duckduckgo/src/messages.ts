export interface DOMMessage {
  type: 'PING';
  from: 'popup runtime' | 'popup tabs';
}

export interface DOMMessageResponse {
  from: 'background' | 'ddg-search';
  title: string;
}

export function isDOMMessage(value: unknown): value is DOMMessage {
  return typeof value === 'object' && value !== null &&
    'type' in value && value.type === 'PING' &&
    'from' in value && (value.from === 'popup runtime' || value.from === 'popup tabs');
}

export function isPopupSender(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && sender.url === chrome.runtime.getURL('index.html');
}

export async function sendToTab(id: number, message: DOMMessage): Promise<DOMMessageResponse> {
  if (!Number.isInteger(id) || id < 0) throw new Error('Invalid tab ID');
  return chrome.tabs.sendMessage<DOMMessage, DOMMessageResponse>(id, message);
}
