import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import NightSkyBackground from './NightSkyBackground';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// jsdom no define AnimationEvent y, en ese caso, React escucha la variante
// con prefijo. Se emiten ambas para no depender de ese detalle.
function endAnimation(element) {
  fireEvent.animationEnd(element);
  fireEvent(element, new Event('webkitAnimationEnd', { bubbles: true }));
}

function setHidden(hidden) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('NightSkyBackground', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.__mediaMatches = {};
  });

  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it('no tiene dragones en vuelo continuo: aparecen, cruzan y se retiran', () => {
    const { container } = render(<NightSkyBackground />);
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);

    act(() => vi.advanceTimersByTime(6000));
    const dragons = container.querySelectorAll('.flying-dragon');
    expect(dragons).toHaveLength(2);

    endAnimation(dragons[1]);
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);

    // El siguiente vuelo llega tras una pausa larga, no de inmediato.
    act(() => vi.advanceTimersByTime(39000));
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);
    act(() => vi.advanceTimersByTime(41000));
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(2);
  });

  it('con movimiento reducido no programa vuelos', () => {
    window.__mediaMatches = { [REDUCED_MOTION]: true };
    const { container } = render(<NightSkyBackground />);
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);
  });

  it('con la pestaña oculta pausa las animaciones y no programa vuelos', () => {
    const { container } = render(<NightSkyBackground />);
    act(() => setHidden(true));
    expect(document.documentElement).toHaveAttribute('data-sky-paused');

    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);

    act(() => setHidden(false));
    expect(document.documentElement).not.toHaveAttribute('data-sky-paused');
  });

  it('es decorativo para tecnologías de asistencia', () => {
    const { container } = render(<NightSkyBackground />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
