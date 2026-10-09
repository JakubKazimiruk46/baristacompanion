import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Test bazy (database.test.ts) działa w środowisku node: bez okna nie ma czego uzupełniać.
const dom = typeof window !== 'undefined';

// jsdom nie implementuje przewijania, a używa go <ScrollRestoration>.
if (dom) window.scrollTo = () => {};

// jsdom ma <dialog>, ale bez showModal() i close().
if (dom && !('showModal' in HTMLDialogElement.prototype)) {
  Object.defineProperties(HTMLDialogElement.prototype, {
    open: {
      get(this: HTMLDialogElement) {
        return this.hasAttribute('open');
      },
    },
    showModal: {
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    },
    close: {
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    },
  });
}

// Bez globals: true Testing Library nie sprząta sam po każdym teście.
afterEach(() => {
  if (dom) cleanup();
});
