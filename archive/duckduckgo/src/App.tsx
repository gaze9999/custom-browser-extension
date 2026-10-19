import { sendToTab } from './messages.ts';
import type { DOMMessage, DOMMessageResponse } from './messages.ts';
import './App.sass';

export default function App() {
  async function handleClick(): Promise<void> {
    try {
      const background = await chrome.runtime.sendMessage<DOMMessage, DOMMessageResponse>({
        type: 'PING', from: 'popup runtime',
      });
      console.debug('background', background);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id === undefined) throw new Error('No active tab');
      const response = await sendToTab(tab.id, { type: 'PING', from: 'popup tabs' });
      console.debug('tab', response);
    } catch (error) {
      console.error('Popup message failed', error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">G Custom Extension Pack</header>
      <button id="btn" onClick={() => { void handleClick(); }}>click me</button>
    </div>
  );
}
