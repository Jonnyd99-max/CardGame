import { assetUrl } from "../game/assetUrl";
export function HeroArtwork({
  look,
}: {
  look: { head: number; body: number; background: number };
}) {
  const style = (type: string, index: number) => ({
    backgroundImage: `url("${assetUrl(`/artwork/hero-${type}.png`)}")`,
    backgroundSize: "400% 200%",
    backgroundPosition: `${((index % 4) / 3) * 100}% ${Math.floor(index / 4) * 100}%`,
  });
  return (
    <div
      className="hero-composite character-image"
      role="img"
      aria-label="Your custom hero, interchangeable head and body"
    >
      <div
        className="hero-backdrop"
        style={style("backgrounds", look.background)}
      />
      <div className="hero-body" style={style("bodies", look.body)} />
      <div className="hero-head">
        <div
          style={{
            backgroundImage: `url("${assetUrl("/artwork/evolution-rangers.png")}")`,
            backgroundSize: "400% 400%",
            backgroundPosition: `${((look.head % 4) / 3) * 100}% ${(Math.floor(look.head / 4) / 3) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
