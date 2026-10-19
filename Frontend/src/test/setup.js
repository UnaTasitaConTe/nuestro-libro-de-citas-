import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sin `globals: true` Testing Library no limpia el DOM solo entre pruebas.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
