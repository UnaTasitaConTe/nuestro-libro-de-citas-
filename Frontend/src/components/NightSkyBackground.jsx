import { useEffect, useState } from 'react';
import FlyingDragon from './FlyingDragon';
import { useSeasonTheme } from '../themes/themeContext';

// Calabazas de Halloween: posición horizontal y escala (estáticas).
const PUMPKINS = [
  { left: '12%', scale: 1 },
  { left: '47%', scale: 0.75 },
  { left: '81%', scale: 0.9 },
];

function Pumpkin({ left, scale }) {
  return (
    <svg viewBox="0 0 34 30" className="pumpkin" style={{ left, scale }} aria-hidden="true">
      <path d="M17 5c-1-3 1-5 3-5-2 1-2 3-1 5z" fill="#4f7a3a" />
      <ellipse cx="11" cy="18" rx="9" ry="11" fill="currentColor" />
      <ellipse cx="23" cy="18" rx="9" ry="11" fill="currentColor" />
      <ellipse cx="17" cy="18" rx="8" ry="12" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

// La pareja de dragones cruza el cielo de vez en cuando en lugar de volar en
// bucle: entre vuelos no hay ninguna animación de dragones en marcha.
const FIRST_FLIGHT_DELAY = 6000;
const MIN_GAP = 40000;
const MAX_GAP = 80000;
const FLIGHT_DURATION = '30s';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export default function NightSkyBackground() {
  // Sin ThemeProvider, el contexto vale el tema predeterminado (themeContext.js).
  const { decor } = useSeasonTheme().activeTheme;
  const flyer = decor.volador;

  const [flight, setFlight] = useState(0); // número del vuelo en curso; 0 = ninguno todavía
  const [flying, setFlying] = useState(false);

  // Al cambiar de tema en pleno vuelo, el vuelo deja de pintarse y su
  // animationend no llegaría: se reinicia para que se programe el siguiente.
  useEffect(() => {
    setFlying(false);
  }, [flyer]);

  // Pestaña oculta → se pausan las animaciones CSS activas (estrellas, luna, dragones).
  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      if (document.hidden) root.dataset.skyPaused = '';
      else delete root.dataset.skyPaused;
    }
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      delete root.dataset.skyPaused;
    };
  }, []);

  // Programa el siguiente vuelo solo si hay movimiento permitido y la pestaña es visible.
  useEffect(() => {
    if (flying) return undefined;

    const reduce = window.matchMedia(REDUCED_MOTION);
    let timer;

    function arm() {
      clearTimeout(timer);
      // Temas sin volador (p. ej. Navidad): no se programa nada.
      if (!flyer || reduce.matches || document.hidden) return;
      const delay = flight === 0 ? FIRST_FLIGHT_DELAY : MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
      timer = setTimeout(() => {
        setFlight((n) => n + 1);
        setFlying(true);
      }, delay);
    }

    arm();
    document.addEventListener('visibilitychange', arm);
    reduce.addEventListener('change', arm);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', arm);
      reduce.removeEventListener('change', arm);
    };
  }, [flying, flight, flyer]);

  return (
    <div aria-hidden="true">
      <div className="sky-glow" />

      <div className="moon-glow" />

      {decor.nevada && (
        <div className="snowfall">
          <div className="snowfall-layer" />
        </div>
      )}

      {flying && flyer && (
        <div key={flight}>
          <FlyingDragon kind={flyer} top="16%" duration={FLIGHT_DURATION} scale={1} />
          <FlyingDragon
            kind={flyer}
            top="19%"
            duration={FLIGHT_DURATION}
            delay="1.2s"
            scale={0.8}
            onAnimationEnd={() => setFlying(false)}
          />
        </div>
      )}

      <div className="skyline skyline-back" />
      {decor.suelo === 'nieve' && <div className="skyline skyline-snow" />}
      <div className="skyline skyline-front" />
      {decor.suelo === 'calabazas' && PUMPKINS.map((p) => <Pumpkin key={p.left} {...p} />)}
    </div>
  );
}
