import { useEffect, useState } from 'react';
import FlyingDragon from './FlyingDragon';

// La pareja de dragones cruza el cielo de vez en cuando en lugar de volar en
// bucle: entre vuelos no hay ninguna animación de dragones en marcha.
const FIRST_FLIGHT_DELAY = 6000;
const MIN_GAP = 40000;
const MAX_GAP = 80000;
const FLIGHT_DURATION = '30s';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export default function NightSkyBackground() {
  const [flight, setFlight] = useState(0); // número del vuelo en curso; 0 = ninguno todavía
  const [flying, setFlying] = useState(false);

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
      if (reduce.matches || document.hidden) return;
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
  }, [flying, flight]);

  return (
    <div aria-hidden="true">
      <div className="sky-glow" />

      <div className="moon-glow" />

      {flying && (
        <div key={flight}>
          <FlyingDragon top="16%" duration={FLIGHT_DURATION} scale={1} />
          <FlyingDragon
            top="19%"
            duration={FLIGHT_DURATION}
            delay="1.2s"
            scale={0.8}
            onAnimationEnd={() => setFlying(false)}
          />
        </div>
      )}

      <div className="skyline skyline-back" />
      <div className="skyline skyline-front" />
    </div>
  );
}
