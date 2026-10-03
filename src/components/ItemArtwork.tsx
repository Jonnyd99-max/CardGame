import { Shield } from "lucide-react";
import type { Item } from "../types";
import { assetUrl } from "../game/assetUrl";
export function ItemArtwork({ item }: { item: Item }) {
  if (!item.image)
    return <Shield className="item-artwork" aria-label={item.name} />;
  if (!item.imageSheet)
    return <img className="item-artwork" src={assetUrl(item.image)} alt={item.name} />;
  const { columns, rows, index } = item.imageSheet;
  return (
    <span
      className="item-artwork item-sheet"
      role="img"
      aria-label={item.name}
      style={{
        backgroundImage: `url("${assetUrl(item.image)}")`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: `${columns === 1 ? 0 : ((index % columns) / (columns - 1)) * 100}% ${rows === 1 ? 0 : (Math.floor(index / columns) / (rows - 1)) * 100}%`,
      }}
    />
  );
}
