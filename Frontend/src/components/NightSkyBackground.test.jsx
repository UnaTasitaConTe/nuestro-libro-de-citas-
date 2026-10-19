import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import NightSkyBackground from './NightSkyBackground';
import { ThemeProvider } from '../themes/ThemeProvider';

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

describe('NightSkyBackground: decoraciones de temporada', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.__mediaMatches = {};
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function renderAt(date) {
    return render(
      <ThemeProvider now={() => date}>
        <NightSkyBackground />
      </ThemeProvider>
    );
  }

  it('Halloween: murciélagos en lugar de dragones y calabazas estáticas', () => {
    const { container } = renderAt(new Date(2026, 9, 31));
    expect(container.querySelectorAll('.pumpkin')).toHaveLength(3);
    act(() => vi.advanceTimersByTime(6000));
    const flyers = container.querySelectorAll('.flying-dragon');
    expect(flyers).toHaveLength(2);
    expect(flyers[0]).toHaveAttribute('data-kind', 'murcielagos');
  });

  it('Navidad: nieve en el horizonte y nevada, sin vuelos programados', () => {
    const { container } = renderAt(new Date(2026, 11, 24));
    expect(container.querySelector('.skyline-snow')).not.toBeNull();
    expect(container.querySelector('.snowfall-layer')).not.toBeNull();
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);
  });

  it('Noche estrellada: sin decoraciones de temporada', () => {
    const { container } = renderAt(new Date(2026, 6, 15));
    expect(container.querySelector('.pumpkin, .skyline-snow, .snowfall')).toBeNull();
  });
});

describe('NightSkyBackground: fondo detenido por la persona', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.__mediaMatches = {};
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin voladores ni nevada cuando «Animar el fondo» está desactivado', () => {
    localStorage.setItem('nlc:animar-fondo', 'no');
    const { container } = render(
      <ThemeProvider now={() => new Date(2026, 11, 24)}>
        <NightSkyBackground />
      </ThemeProvider>
    );
    expect(container.querySelector('.snowfall')).toBeNull();
    expect(container.querySelector('.skyline-snow')).not.toBeNull(); // lo estático se mantiene
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(container.querySelectorAll('.flying-dragon')).toHaveLength(0);
  });
});
