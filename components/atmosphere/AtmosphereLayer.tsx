import { GoldDustParticles } from "./GoldDustParticles";

/**
 * Living background atmosphere — above the static image, below UI content.
 * Gradient pulse, gold dust, vignette focus, film grain texture.
 */
export function AtmosphereLayer() {
  return (
    <div className="atmosphere-layer" aria-hidden>
      <div className="atmosphere-gradient" />
      <GoldDustParticles />
      <div className="atmosphere-vignette" />
      <div className="atmosphere-grain" />
    </div>
  );
}
