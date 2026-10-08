import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom nie implementuje przewijania, a używa go <ScrollRestoration>.
window.scrollTo = () => {};

// jsdom ma <dialog>, ale bez showModal() i close().
if (!('showModal' in HTMLDialogElement.prototype)) {
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
  cleanup();
});
