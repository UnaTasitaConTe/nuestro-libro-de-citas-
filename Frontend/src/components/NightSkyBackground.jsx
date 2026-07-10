import FlyingDragon from './FlyingDragon';

export default function NightSkyBackground() {
  return (
    <div aria-hidden="true">
      <div className="aurora aurora-teal" />
      <div className="aurora aurora-violet" />
      <div className="aurora aurora-gold" />

      <div className="moon-glow" />

      <FlyingDragon top="16%" duration="42s" delay="0s" scale={1} />
      <FlyingDragon top="26%" duration="55s" delay="14s" scale={0.7} />
      <FlyingDragon top="9%" duration="65s" delay="30s" scale={0.5} />

      <div className="skyline skyline-back" />
      <div className="skyline skyline-front" />
    </div>
  );
}
