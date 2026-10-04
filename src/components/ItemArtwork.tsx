import { Shield } from "lucide-react";
import type { Item } from "../types";
import { assetUrl } from "../game/assetUrl";
export function ItemArtwork({ item }: { item: Item }) {
  if (item.image && !item.imageSheet)
    return (
      <img
        className={`item-artwork ${item.category === "trainer" ? "trainer-portrait" : item.category ? "pokemon-item-portrait" : ""}`}
        src={assetUrl(item.image)}
        alt={item.name}
        loading="lazy"
      />
    );
  if (item.category) {
    const color =
      item.category === "mega-stone"
        ? "#9772c9"
        : item.category === "trainer"
          ? "#df9a42"
          : "#62a391";
    return (
      <svg
        className="item-artwork pokemon-item-art"
        viewBox="0 0 120 120"
        role="img"
        aria-label={item.name}
      >
        <circle
          cx="60"
          cy="60"
          r="53"
          fill="#fff5db"
          stroke={color}
          strokeWidth="3"
        />
        {item.category === "mega-stone" ? (
          <>
            <path
              d="M60 19 90 43 82 81 60 101 38 81 30 43Z"
              fill={color}
              stroke="#40354f"
              strokeWidth="3"
            />
            <path
              d="M60 19 49 49 30 43M49 49 60 101 72 49 90 43M49 49h23"
              fill="none"
              stroke="#dfcef3"
              strokeWidth="3"
            />
            <path
              d="m62 30-8 24 14-3-9 28"
              fill="none"
              stroke="white"
              strokeWidth="4"
            />
          </>
        ) : item.category === "trainer" ? (
          <>
            <rect
              x="30"
              y="20"
              width="60"
              height="81"
              rx="8"
              fill={color}
              stroke="#654d32"
              strokeWidth="3"
            />
            <circle cx="60" cy="45" r="13" fill="#fff5db" />
            <path d="M39 78q3-23 21-23t21 23" fill="#fff5db" />
            <text
              x="60"
              y="93"
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#3e332a"
            >
              {item.name.slice(0, 13)}
            </text>
          </>
        ) : (
          <>
            <path
              d="M37 34h46v53H37Z"
              fill={color}
              stroke="#325b50"
              strokeWidth="3"
            />
            <rect x="42" y="26" width="36" height="12" rx="4" fill="#d7c98b" />
            <circle cx="60" cy="61" r="16" fill="#fff5db" />
            <path d="M44 61h32" stroke={color} strokeWidth="3" />
            <circle
              cx="60"
              cy="61"
              r="5"
              fill="#fff5db"
              stroke={color}
              strokeWidth="3"
            />
          </>
        )}
      </svg>
    );
  }
  if (!item.image)
    return <Shield className="item-artwork" aria-label={item.name} />;
  if (!item.imageSheet)
    return (
      <img
        className="item-artwork"
        src={assetUrl(item.image)}
        alt={item.name}
      />
    );
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
