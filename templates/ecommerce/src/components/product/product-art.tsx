import type { ReactNode } from "react";
import type { ArtKind } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * Illustrazioni dei prodotti in SVG: nessuna foto o immagine di terzi, peso
 * minimo e colore della variante. Sostituiscile con le foto reali (next/image)
 * quando colleghi il catalogo: vedi docs/personalizzazione.md.
 */

function mix(hex: string, target: number, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const c = (n >> shift) & 255;
    return Math.round(c + (target - c) * amount);
  };
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, "0")).join("")}`;
}
const darken = (hex: string, amount: number) => mix(hex, 0, amount);
const lighten = (hex: string, amount: number) => mix(hex, 255, amount);

const CLAY = "#e3d2b8";
const LINEN = "#efe8dc";
const FLAME = "#f2b134";
const FLAME_CORE = "#fbe7ad";

interface Palette {
  base: string;
  dark: string;
  deep: string;
  light: string;
}

type Drawing = (p: Palette) => ReactNode;

const mug: Drawing = (p) => (
  <g>
    <path d="M252 182h14a30 30 0 0 1 0 60h-14" fill="none" stroke={p.dark} strokeWidth="18" />
    <path d="M136 150h120v120a22 22 0 0 1-22 22h-76a22 22 0 0 1-22-22z" fill={p.base} />
    <path d="M136 262h120v8a22 22 0 0 1-22 22h-76a22 22 0 0 1-22-22z" fill={CLAY} />
    <ellipse cx="196" cy="150" rx="60" ry="11" fill={p.dark} />
    <ellipse cx="196" cy="151" rx="52" ry="7" fill={p.deep} />
    <path d="M150 170v80" stroke={p.light} strokeWidth="8" strokeLinecap="round" opacity=".55" />
  </g>
);

const cups: Drawing = (p) => (
  <g>
    <g transform="translate(-58 30) scale(.72)">{mug(p)}</g>
    <g transform="translate(118 46) scale(.72)">{mug(p)}</g>
  </g>
);

const plate: Drawing = (p) => (
  <g>
    <ellipse cx="200" cy="232" rx="150" ry="70" fill={p.dark} />
    <ellipse cx="200" cy="226" rx="150" ry="70" fill={p.base} />
    <ellipse cx="200" cy="230" rx="98" ry="44" fill={p.light} opacity=".6" />
    <ellipse
      cx="200"
      cy="232"
      rx="98"
      ry="44"
      fill="none"
      stroke={p.dark}
      strokeOpacity=".25"
      strokeWidth="3"
    />
  </g>
);

const bowl: Drawing = (p) => (
  <g>
    <rect x="168" y="270" width="64" height="16" rx="6" fill={CLAY} />
    <path d="M106 186h188c0 52-42 92-94 92s-94-40-94-92z" fill={p.base} />
    <ellipse cx="200" cy="186" rx="94" ry="20" fill={p.dark} />
    <ellipse cx="200" cy="188" rx="84" ry="14" fill={p.deep} />
    <path
      d="M128 206c14 34 40 52 72 54"
      fill="none"
      stroke={p.light}
      strokeWidth="7"
      strokeLinecap="round"
      opacity=".5"
    />
  </g>
);

const vase: Drawing = (p) => (
  <g>
    <path
      d="M180 104h40v34c0 20 62 42 62 104 0 50-34 74-82 74s-82-24-82-74c0-62 62-84 62-104z"
      fill={p.base}
    />
    <ellipse cx="200" cy="104" rx="26" ry="7" fill={p.dark} />
    <ellipse cx="200" cy="105" rx="18" ry="4" fill={p.deep} />
    <path
      d="M150 220c-6 36 6 64 30 78"
      fill="none"
      stroke={p.light}
      strokeWidth="9"
      strokeLinecap="round"
      opacity=".45"
    />
    <path
      d="M128 280c20 26 124 26 144 0"
      fill="none"
      stroke={p.dark}
      strokeWidth="4"
      opacity=".35"
    />
  </g>
);

const teapot: Drawing = (p) => (
  <g>
    <path
      d="M118 214c-26-6-40 10-52-14"
      fill="none"
      stroke={p.base}
      strokeWidth="16"
      strokeLinecap="round"
    />
    <path d="M276 196h10a30 30 0 0 1 0 64h-14" fill="none" stroke={p.dark} strokeWidth="16" />
    <ellipse cx="196" cy="232" rx="88" ry="68" fill={p.base} />
    <path d="M148 168a48 18 0 0 1 96 0z" fill={p.dark} />
    <circle cx="196" cy="146" r="10" fill={p.dark} />
    <path
      d="M136 220c0 26 14 44 34 54"
      fill="none"
      stroke={p.light}
      strokeWidth="9"
      strokeLinecap="round"
      opacity=".5"
    />
  </g>
);

const towel: Drawing = (p) => (
  <g>
    <path d="M188 92a12 12 0 0 1 24 0v18" fill="none" stroke={LINEN} strokeWidth="6" />
    <rect x="128" y="108" width="144" height="204" rx="6" fill={LINEN} />
    <rect
      x="128"
      y="108"
      width="144"
      height="204"
      rx="6"
      fill="none"
      stroke={darken(LINEN, 0.12)}
      strokeWidth="3"
    />
    {[132, 146, 252, 266, 280].map((y) => (
      <rect
        key={y}
        x="128"
        y={y}
        width="144"
        height={y === 146 || y === 266 ? 6 : 10}
        fill={p.base}
      />
    ))}
    <path d="M150 180v60" stroke={darken(LINEN, 0.08)} strokeWidth="5" strokeLinecap="round" />
  </g>
);

const napkins: Drawing = (p) => (
  <g>
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${i * 10 - 10} ${-i * 26})`}>
        <path
          d="M110 250l90-36 110 30-90 40z"
          fill={i === 2 ? p.base : darken(p.base, 0.12 - i * 0.04)}
        />
        <path d="M110 250l110 34v12l-110-34z" fill={darken(p.base, 0.25)} />
        <path d="M220 284l90-40v12l-90 40z" fill={darken(p.base, 0.32)} />
      </g>
    ))}
    <path d="M160 194l100 28" stroke={p.light} strokeWidth="3" opacity=".6" />
  </g>
);

const apron: Drawing = (p) => (
  <g>
    <path d="M168 96c0-10 64-10 64 0" fill="none" stroke={p.dark} strokeWidth="8" />
    <path d="M168 96v52c-20 0-48 0-48 0l12 168h136l12-168s-28 0-48 0V96z" fill={p.base} />
    <rect x="166" y="210" width="68" height="46" rx="6" fill={p.dark} opacity=".55" />
    <path
      d="M120 150c-30 8-44 28-52 50M280 150c30 8 44 28 52 50"
      fill="none"
      stroke={p.dark}
      strokeWidth="6"
      strokeLinecap="round"
    />
  </g>
);

const basket: Drawing = (p) => (
  <g>
    <path d="M118 160h164l-12 140H130z" fill={p.base} />
    {[180, 202, 224, 246, 268, 290].map((y) => (
      <path
        key={y}
        d={`M${122 + (y - 160) * 0.07} ${y}h${156 - (y - 160) * 0.14}`}
        stroke={p.dark}
        strokeWidth="3"
        opacity=".45"
      />
    ))}
    <ellipse cx="200" cy="160" rx="82" ry="14" fill={p.dark} />
    <path
      d="M128 178a16 16 0 0 0-24 0M272 178a16 16 0 0 1 24 0"
      fill="none"
      stroke={p.dark}
      strokeWidth="8"
      strokeLinecap="round"
    />
  </g>
);

const board: Drawing = (p) => (
  <g>
    <rect x="86" y="182" width="232" height="112" rx="18" fill={p.dark} />
    <rect x="86" y="172" width="232" height="112" rx="18" fill={p.base} />
    <path d="M318 206h28a20 20 0 0 1 0 40h-28z" fill={p.base} />
    <circle cx="340" cy="226" r="8" fill={p.deep} />
    {[198, 222, 248].map((y, i) => (
      <path
        key={y}
        d={`M104 ${y}c40 ${i % 2 ? -8 : 8} 120 ${i % 2 ? 10 : -10} 196 0`}
        fill="none"
        stroke={p.dark}
        strokeWidth="3"
        opacity=".35"
      />
    ))}
  </g>
);

const spoons: Drawing = (p) => (
  <g>
    {[-22, 0, 22].map((angle, i) => (
      <g key={angle} transform={`rotate(${angle} 200 300)`}>
        <rect x="193" y="150" width="14" height="150" rx="7" fill={i === 1 ? p.base : p.dark} />
        <ellipse
          cx="200"
          cy="126"
          rx={i === 2 ? 24 : 28}
          ry="38"
          fill={i === 1 ? p.base : p.dark}
        />
        <ellipse cx="200" cy="124" rx="16" ry="26" fill={p.deep} opacity={i === 0 ? 0 : 0.25} />
      </g>
    ))}
  </g>
);

const tray: Drawing = (p) => (
  <g>
    <path d="M70 238l130-62 140 62-130 70z" fill={p.dark} />
    <path d="M86 232l114-52 124 54-114 58z" fill={p.base} />
    <path d="M70 238v14l140 70v-14zM340 238v14l-130 70v-14z" fill={p.deep} />
    <path d="M128 214l22-10M268 262l22-10" stroke={p.deep} strokeWidth="8" strokeLinecap="round" />
  </g>
);

const notebook: Drawing = (p) => (
  <g>
    <rect x="132" y="98" width="148" height="206" rx="8" fill={darken(LINEN, 0.04)} />
    <rect x="124" y="92" width="148" height="206" rx="8" fill={p.base} />
    <rect x="124" y="92" width="18" height="206" rx="4" fill={p.dark} />
    <rect x="164" y="132" width="78" height="34" rx="4" fill={LINEN} opacity=".9" />
    <rect x="248" y="92" width="7" height="206" fill={p.deep} opacity=".7" />
  </g>
);

const cards: Drawing = (p) => (
  <g>
    <g transform="rotate(-8 200 220)">
      <rect x="96" y="160" width="190" height="124" rx="4" fill={LINEN} />
      <path d="M96 160l95 62 95-62" fill="none" stroke={darken(LINEN, 0.15)} strokeWidth="3" />
    </g>
    <g transform="rotate(6 220 200)">
      <rect x="160" y="132" width="132" height="168" rx="4" fill={p.base} />
      <circle cx="226" cy="200" r="26" fill={p.light} opacity=".6" />
      <path d="M190 252h72" stroke={p.dark} strokeWidth="4" strokeLinecap="round" opacity=".6" />
    </g>
  </g>
);

const flame = (x: number, y: number, scale = 1) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0-34c10 14 14 22 14 30a14 14 0 0 1-28 0c0-8 4-16 14-30z" fill={FLAME} />
    <path d="M0-16c5 6 6 10 6 13a6 6 0 0 1-12 0c0-3 1-7 6-13z" fill={FLAME_CORE} />
  </g>
);

const candle: Drawing = (p) => (
  <g>
    <rect
      x="134"
      y="146"
      width="132"
      height="152"
      rx="18"
      fill="#ffffff"
      fillOpacity=".35"
      stroke="#ffffff"
      strokeOpacity=".7"
      strokeWidth="3"
    />
    <rect x="140" y="196" width="120" height="96" rx="14" fill={p.base} />
    <ellipse cx="200" cy="196" rx="60" ry="9" fill={p.light} />
    <path d="M200 196v-16" stroke="#3a2f25" strokeWidth="3" strokeLinecap="round" />
    {flame(200, 180, 0.9)}
    <rect x="160" y="226" width="80" height="40" rx="3" fill={LINEN} />
  </g>
);

const tapers: Drawing = (p) => (
  <g>
    {[168, 232].map((x) => (
      <g key={x}>
        <rect x={x - 11} y="118" width="22" height="168" rx="6" fill={p.base} />
        <path d={`M${x} 118v-12`} stroke="#3a2f25" strokeWidth="3" strokeLinecap="round" />
        {flame(x, 106, 0.8)}
        <ellipse cx={x} cy="292" rx="34" ry="9" fill="#b08a4a" />
        <rect x={x - 16} y="276" width="32" height="16" rx="5" fill="#c9a25e" />
      </g>
    ))}
  </g>
);

const DRAWINGS: Record<ArtKind, Drawing> = {
  mug,
  cups,
  plate,
  bowl,
  vase,
  teapot,
  towel,
  napkins,
  apron,
  basket,
  board,
  spoons,
  tray,
  notebook,
  cards,
  candle,
  tapers,
};

export const ART_VIEWS = 3;

export function ProductArt({
  kind,
  color,
  view = 0,
  label,
  className,
}: {
  kind: ArtKind;
  color: string;
  /** 0 = intero, 1 = dettaglio, 2 = ambientato. */
  view?: number;
  /** Testo alternativo; senza, l'immagine è decorativa (es. nella scheda con il nome accanto). */
  label?: string;
  className?: string;
}) {
  const palette: Palette = {
    base: color,
    dark: darken(color, 0.18),
    deep: darken(color, 0.38),
    light: lighten(color, 0.45),
  };
  const drawing = DRAWINGS[kind](palette);
  const background = `color-mix(in oklab, ${color} 14%, var(--art-base))`;

  return (
    <svg
      viewBox="0 0 400 400"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block size-full", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="400" style={{ fill: background }} />
      {view === 2 ? (
        <>
          <rect
            y="300"
            width="400"
            height="100"
            style={{ fill: `color-mix(in oklab, ${color} 22%, #b9ab95)` }}
          />
          <path d="M0 300h400" stroke="#ffffff" strokeOpacity=".4" strokeWidth="2" />
          <ellipse cx="200" cy="306" rx="120" ry="12" fill="#000" opacity=".08" />
          <g transform="translate(200 300) scale(.78) translate(-200 -300)">{drawing}</g>
          <path
            d="M318 300c-4-30 6-52 26-66M318 300c10-22 30-30 48-30"
            fill="none"
            stroke="#6f7f5a"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".7"
          />
        </>
      ) : view === 1 ? (
        <g transform="translate(200 210) scale(1.65) translate(-200 -200)">{drawing}</g>
      ) : (
        <>
          <ellipse cx="200" cy="312" rx="130" ry="14" fill="#000" opacity=".07" />
          {drawing}
        </>
      )}
    </svg>
  );
}
