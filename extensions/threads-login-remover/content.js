(() => {
  'use strict';

  if (!['threads.com', 'www.threads.com'].includes(location.hostname)) return;

  const dialogSelector = '[role="dialog"][aria-modal="true"], dialog[open]';
  const hiddenAttribute = 'data-threads-login-remover';
  const contentSelector = 'main, article, [role="main"], a[href*="/post/"]';
  const headings = new Set([
    '透過 Threads 暢所欲言',
    'Say more with Threads',
  ]);
  const prompts = new Map();
  const changes = new Map();
  let scheduled = false;
  let stylesheet;

  function isLoginPrompt(dialog) {
    const hasHeading = [...dialog.querySelectorAll('span, h1, h2, h3, [role="heading"]')]
      .some(element => headings.has(element.textContent.trim()));
    return hasHeading && [...dialog.querySelectorAll('button, a, [role="button"]')]
      .some(button => button.querySelector('[aria-label="Instagram"]') &&
        (button.querySelector('svg[aria-label="登入"], svg[aria-label="Log in"]') ||
          /使用\s*Instagram\s*帳號繼續|Continue with Instagram/i.test(button.textContent)));
  }

  function getOverlay(dialog) {
    let overlay = dialog;
    while (overlay.parentElement && overlay.parentElement !== document.body) {
      const parent = overlay.parentElement;
      if (parent.querySelectorAll('[role="dialog"], dialog').length !== 1) break;
      const hasContent = [...parent.childNodes].some(node => {
        if (node === overlay) return false;
        if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent.trim());
        if (!(node instanceof Element)) return false;
        return Boolean(node.textContent.trim() ||
          node.matches('a, button, input, video, img, iframe, main, article') ||
          node.querySelector('a, button, input, video, img, iframe, main, article'));
      });
      if (hasContent || parent.matches('main, article, [role="main"]')) break;
      overlay = parent;
    }
    return overlay;
  }

  function setStyle(element, property, value) {
    if (element.style.getPropertyValue(property) === value &&
        element.style.getPropertyPriority(property) === 'important') return;
    let record = changes.get(element);
    if (!record) changes.set(element, record = { styles: new Map(), attributes: new Map() });
    const previous = record.styles.get(property);
    record.styles.set(property, {
      value: previous?.value ?? element.style.getPropertyValue(property),
      priority: previous?.priority ?? element.style.getPropertyPriority(property),
      applied: value,
    });
    element.style.setProperty(property, value, 'important');
  }

  function clearAttribute(element, name) {
    if (!element.hasAttribute(name)) return;
    let record = changes.get(element);
    if (!record) changes.set(element, record = { styles: new Map(), attributes: new Map() });
    if (!record.attributes.has(name)) record.attributes.set(name, element.getAttribute(name));
    element.removeAttribute(name);
  }

  function restoreChanges() {
    for (const [element, record] of changes) {
      for (const [property, previous] of record.styles) {
        if (element.style.getPropertyValue(property) !== previous.applied ||
            element.style.getPropertyPriority(property) !== 'important') continue;
        if (previous.value) element.style.setProperty(property, previous.value, previous.priority);
        else element.style.removeProperty(property);
      }
      for (const [name, value] of record.attributes) {
        if (!element.hasAttribute(name)) element.setAttribute(name, value);
      }
    }
    changes.clear();
  }

  function unlockScroll() {
    const roots = [document.documentElement, document.body].filter(Boolean);
    for (const element of roots) {
      const style = getComputedStyle(element);
      if (['hidden', 'clip'].includes(style.overflowY)) setStyle(element, 'overflow-y', 'auto');
      if (style.touchAction === 'none') setStyle(element, 'touch-action', 'auto');
      if (style.position === 'fixed') {
        const offset = Math.max(0, -parseFloat(style.top) || 0);
        setStyle(element, 'position', 'static');
        setStyle(element, 'top', 'auto');
        if (offset) window.scrollTo(0, offset);
      }
    }

    // Threads can freeze the feed itself instead of html/body on the second prompt.
    for (const element of document.querySelectorAll('[aria-hidden="true"], [inert]')) {
      if (!(element instanceof HTMLElement) || !element.querySelector(contentSelector) ||
          [...prompts.values()].some(overlay => overlay.contains(element))) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < innerWidth * 0.8 || rect.height < innerHeight * 0.8) continue;
      clearAttribute(element, 'aria-hidden');
      clearAttribute(element, 'inert');
      const style = getComputedStyle(element);
      if (style.position === 'fixed') {
        const offset = Math.max(element.scrollTop, -parseFloat(style.top) || 0);
        setStyle(element, 'position', 'relative');
        setStyle(element, 'top', 'auto');
        setStyle(element, 'height', 'auto');
        setStyle(element, 'max-height', 'none');
        if (offset) window.scrollTo(0, offset);
      }
      if (['hidden', 'clip'].includes(style.overflowY)) setStyle(element, 'overflow-y', 'auto');
      if (style.pointerEvents === 'none') setStyle(element, 'pointer-events', 'auto');
      if (style.touchAction === 'none') setStyle(element, 'touch-action', 'auto');
    }
  }

  function scan() {
    scheduled = false;
    const dialogs = [...document.querySelectorAll(dialogSelector)];
    const loginPage = /^\/(?:login|signup|accounts)(?:\/|$)/.test(location.pathname);
    const matches = loginPage ? [] : dialogs.filter(isLoginPrompt);

    for (const [dialog, overlay] of prompts) {
      if (!matches.includes(dialog) || overlay !== getOverlay(dialog)) {
        overlay.removeAttribute(hiddenAttribute);
        prompts.delete(dialog);
      }
    }
    for (const dialog of matches) {
      const overlay = getOverlay(dialog);
      prompts.set(dialog, overlay);
      overlay.setAttribute(hiddenAttribute, 'hidden');
      if (overlay.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    if (prompts.size && (!stylesheet?.isConnected)) {
      stylesheet = document.createElement('style');
      stylesheet.textContent = `[${hiddenAttribute}="hidden"] { display: none !important; }`;
      (document.head || document.documentElement).append(stylesheet);
    }
    const otherModal = dialogs.some(dialog => !prompts.has(dialog) &&
      dialog.getClientRects().length && getComputedStyle(dialog).visibility !== 'hidden');
    if (prompts.size && !otherModal) unlockScroll();
    else restoreChanges();
  }

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(scan, 50);
  }

  new MutationObserver(scheduleScan).observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['role', 'aria-modal', 'aria-label', 'aria-hidden', 'inert', 'style', 'class', 'open'],
  });
  window.addEventListener('popstate', scheduleScan);
  window.addEventListener('pageshow', scheduleScan);
  scheduleScan();
})();
