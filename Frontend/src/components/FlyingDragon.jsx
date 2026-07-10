export default function FlyingDragon({ top, duration, delay, scale = 1 }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className="flying-dragon"
      style={{
        top,
        animationDuration: duration,
        animationDelay: delay,
        '--fly-scale': scale,
      }}
      aria-hidden="true"
    >
      <path
        d="M50 30c-6-10-20-16-34-14 8 3 14 8 17 14-10 0-19 4-25 12 10-2 19-1 27 3-4 4-6 9-6 15 6-5 11-10 14-16 3 6 8 11 14 16 0-6-2-11-6-15 8-4 17-5 27-3-6-8-15-12-25-12 3-6 9-11 17-14-14-2-28 4-34 14z"
        fill="#050814"
      />
    </svg>
  );
}
