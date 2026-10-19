import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { useSeasonTheme } from './themeContext';
import { APPLIED_KEY, PREFERENCE_KEY } from './storage';
import ThemeSelect from '../components/ThemeSelect';

function Probe() {
  const { preference, activeTheme, autoTheme } = useSeasonTheme();
  return <span data-testid="probe">{`${preference}|${activeTheme.id}|${autoTheme.id}`}</span>;
}

function renderWithClock(getNow) {
  return render(
    <ThemeProvider now={getNow}>
      <Probe />
      <ThemeSelect id="tema-prueba" />
    </ThemeProvider>
  );
}

const html = () => document.documentElement;

function setHidden(hidden) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    delete html().dataset.season;
    document.head.innerHTML = '<meta name="theme-color" content="#070b22">';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setHidden(false);
  });

  it('en automático aplica el tema de la fecha a <html> y a la barra del navegador', () => {
    renderWithClock(() => new Date(2026, 9, 31));
    expect(screen.getByTestId('probe')).toHaveTextContent('auto|halloween|halloween');
    expect(html().dataset.season).toBe('halloween');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#110a1d');
    expect(localStorage.getItem(APPLIED_KEY)).toBe('halloween');
  });

  it('sin temporada activa usa Noche estrellada', () => {
    renderWithClock(() => new Date(2026, 6, 15));
    expect(html().dataset.season).toBe('noche');
  });

  it('una elección manual prevalece sobre el calendario y se guarda', async () => {
    const user = userEvent.setup();
    renderWithClock(() => new Date(2026, 9, 31));

    await user.selectOptions(screen.getByLabelText('Tema'), 'navidad');

    expect(html().dataset.season).toBe('navidad');
    expect(localStorage.getItem(PREFERENCE_KEY)).toBe('navidad');
    expect(screen.getByText('Elegido por ti: no cambia con la fecha.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tema elegido: Navidad mágica.');
  });

  it('la preferencia guardada se conserva al volver a cargar', () => {
    localStorage.setItem(PREFERENCE_KEY, 'sanvalentin');
    renderWithClock(() => new Date(2026, 9, 31));
    expect(screen.getByTestId('probe')).toHaveTextContent('sanvalentin|sanvalentin|halloween');
    expect(screen.getByLabelText('Tema')).toHaveValue('sanvalentin');
  });

  it('un cambio de fecha actualiza el automático pero nunca una elección manual', () => {
    let now = new Date(2026, 9, 31);
    localStorage.setItem(PREFERENCE_KEY, 'primavera');
    renderWithClock(() => now);

    now = new Date(2026, 11, 24); // pasa a Navidad mientras la app está abierta
    act(() => setHidden(false));

    expect(screen.getByTestId('probe')).toHaveTextContent('primavera|primavera|navidad');
    expect(html().dataset.season).toBe('primavera');
    expect(localStorage.getItem(PREFERENCE_KEY)).toBe('primavera');
  });

  it('en automático, al volver a la pestaña se reevalúa la fecha', () => {
    let now = new Date(2026, 9, 31);
    renderWithClock(() => now);
    now = new Date(2026, 11, 24);
    act(() => setHidden(false));
    expect(html().dataset.season).toBe('navidad');
  });

  it('se puede volver a «Automático»', async () => {
    const user = userEvent.setup();
    localStorage.setItem(PREFERENCE_KEY, 'navidad');
    renderWithClock(() => new Date(2026, 9, 31));

    const select = screen.getByLabelText('Tema');
    expect(within(select).getByRole('option', { name: 'Automático (ahora: Halloween romántico)' })).toBeInTheDocument();
    await user.selectOptions(select, 'auto');

    expect(html().dataset.season).toBe('halloween');
    expect(localStorage.getItem(PREFERENCE_KEY)).toBe('auto');
  });

  it('un valor guardado desconocido se trata como automático sin borrarlo', () => {
    localStorage.setItem(PREFERENCE_KEY, 'tema-que-ya-no-existe');
    renderWithClock(() => new Date(2026, 9, 31));
    expect(html().dataset.season).toBe('halloween');
    expect(localStorage.getItem(PREFERENCE_KEY)).toBe('tema-que-ya-no-existe');
  });

  it('si el almacenamiento no está disponible, sigue funcionando en memoria', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    renderWithClock(() => new Date(2026, 9, 31));
    expect(html().dataset.season).toBe('halloween');

    await user.selectOptions(screen.getByLabelText('Tema'), 'navidad');
    expect(html().dataset.season).toBe('navidad');
  });

  it('se sincroniza si otra pestaña cambia la preferencia', () => {
    renderWithClock(() => new Date(2026, 9, 31));
    localStorage.setItem(PREFERENCE_KEY, 'primavera');
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: PREFERENCE_KEY, newValue: 'primavera' }));
    });
    expect(html().dataset.season).toBe('primavera');
  });
});
