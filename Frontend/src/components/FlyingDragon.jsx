// Siluetas de lo que cruza el cielo según el tema (viewBox 100×60). El color
// llega por CSS (--flyer-color) a través de currentColor.
const SHAPES = {
  dragones:
    'M50 30c-6-10-20-16-34-14 8 3 14 8 17 14-10 0-19 4-25 12 10-2 19-1 27 3-4 4-6 9-6 15 6-5 11-10 14-16 3 6 8 11 14 16 0-6-2-11-6-15 8-4 17-5 27-3-6-8-15-12-25-12 3-6 9-11 17-14-14-2-28 4-34 14z',
  murcielagos:
    'M50 24c-2-4-3-6-3-6l-2 5c-5-1-11 2-15 6-2-6-9-9-16-7 5 2 7 6 7 10-6-2-12 0-16 4 7 0 13 3 16 8 4-5 10-8 17-8 4 0 8 2 12 5 4-3 8-5 12-5 7 0 13 3 17 8 3-5 9-8 16-8-4-4-10-6-16-4 0-4 2-8 7-10-7-2-14 1-16 7-4-4-10-7-15-6l-2-5s-1 2-3 6z',
  corazones:
    'M50 54C31 41 20 32 20 21c0-8 6-14 14-14 7 0 12 4 16 10 4-6 9-10 16-10 8 0 14 6 14 14 0 11-11 20-30 33z',
  petalos:
    'M50 8c12 6 20 16 20 27 0 10-9 18-20 18S30 45 30 35c0-11 8-21 20-27zm0 9c-5 5-8 11-8 18',
};

export default function FlyingDragon({ kind = 'dragones', top, duration, delay = '0s', scale = 1, onAnimationEnd }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className="flying-dragon"
      data-kind={kind}
      style={{
        top,
        animationDuration: duration,
        animationDelay: delay,
        '--fly-scale': scale,
      }}
      onAnimationEnd={onAnimationEnd}
      aria-hidden="true"
    >
      <path d={SHAPES[kind] ?? SHAPES.dragones} fill="currentColor" />
    </svg>
  );
}
