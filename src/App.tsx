import React, { type ReactElement } from 'react';
import './App.sass';

const logActive: boolean = true;

const App = (): ReactElement<HTMLElement> => {
  logActive && console.debug('popup init');

  React.useEffect((): void => {
    const source: HTMLBodyElement = document.querySelector('body');
    const main: HTMLDivElement = source?.querySelector('main>div');
    const textarea: HTMLTextAreaElement = source?.querySelector('textarea');
    const answers: NodeListOf<HTMLAnchorElement> = main?.querySelectorAll('a');
    const btn: HTMLButtonElement = document.querySelector('#btn');
    // const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    if (btn) {
      btn.onclick = async event => {
        logActive && console.debug('btn', [event]);
        chrome.runtime.sendMessage({ event, from: 'popup runtime' }, res => {
          logActive && console.debug('click', [res, answers]);
        });

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tabs[0].id, { event, from: 'popup tabs' }, res => {
          logActive && console.debug('click', [res, answers, tabs]);
        });
      };
    }

    if (textarea) {
      textarea.value = 'test';
    }
  });

  return (
    <div className="App">
      <header className="App-header">G Custom Extension Pack</header>
      <button id="btn">click me</button>
    </div>
  );
};

export default App;
