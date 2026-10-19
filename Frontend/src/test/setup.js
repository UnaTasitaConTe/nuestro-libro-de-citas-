import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sin `globals: true` Testing Library no limpia el DOM solo entre pruebas.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom no implementa showModal/close de <dialog>: versión mínima que
// refleja el atributo `open`, enfoca el primer elemento enfocable (como hace
// el navegador al abrir un modal) y emite `close`.
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
    this.querySelector(FOCUSABLE)?.focus();
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// jsdom no implementa IntersectionObserver: se considera visible todo lo observado.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(target) {
      this.callback([{ isIntersecting: true, target }], this);
    }
    unobserve() {}
    disconnect() {}
  };
}

// jsdom no implementa matchMedia. Por defecto ninguna consulta coincide;
// las pruebas pueden cambiar `window.__mediaMatches` antes de renderizar.
if (!window.matchMedia) {
  window.__mediaMatches = {};
  window.matchMedia = (query) => ({
    matches: Boolean(window.__mediaMatches[query]),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}
