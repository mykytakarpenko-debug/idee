import type { SymbolId } from "@/lib/domain/slots";
import { cn } from "@/lib/utils";

/** Simboli delle slot disegnati in SVG (decorativi: il nome è sempre nel testo vicino). */
export function SlotSymbol({ id, className }: { id: SymbolId; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-12", className)}>
      {id === "ciliegia" ? (
        <>
          <path
            d="M24 8c-3 8-9 14-13 18M24 8c1 9 4 15 11 19"
            fill="none"
            stroke="#2f7d32"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M24 8c4-2 9-2 12 1-4 2-8 2-12-1z" fill="#3f9b43" />
          <circle cx="13" cy="32" r="8" fill="#d62f3a" />
          <circle cx="34" cy="33" r="8" fill="#c0262f" />
          <circle cx="10.5" cy="29.5" r="2" fill="#fff" opacity=".6" />
          <circle cx="31.5" cy="30.5" r="2" fill="#fff" opacity=".6" />
        </>
      ) : id === "limone" ? (
        <>
          <path d="M8 25c0-9 8-15 16-15s16 6 16 15-8 14-16 14S8 34 8 25z" fill="#f4c430" />
          <path d="M6 25l4-2v4zM42 25l-4-2v4z" fill="#e0ac14" />
          <path
            d="M16 20c3-3 7-4 10-4"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity=".55"
            fill="none"
          />
        </>
      ) : id === "prugna" ? (
        <>
          <circle cx="24" cy="27" r="14" fill="#6b3fa0" />
          <path
            d="M24 13c0-3 1-5 3-6"
            stroke="#5b3a1a"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M27 10c5-3 10-1 11 2-4 2-8 1-11-2z" fill="#3f9b43" />
          <circle cx="18" cy="22" r="3" fill="#fff" opacity=".4" />
        </>
      ) : id === "campana" ? (
        <>
          <path d="M24 7c-8 0-12 7-12 15v8l-4 5h32l-4-5v-8c0-8-4-15-12-15z" fill="#e6a817" />
          <circle cx="24" cy="39" r="4" fill="#b7790c" />
          <path
            d="M17 18c1-4 3-6 6-7"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity=".55"
            fill="none"
          />
        </>
      ) : id === "stella" ? (
        <path
          d="M24 5l5.6 11.9 13 1.6-9.6 9 2.5 12.9L24 34l-11.5 6.4 2.5-12.9-9.6-9 13-1.6z"
          fill="#2a78d6"
          stroke="#1b5fae"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      ) : (
        <text
          x="24"
          y="38"
          textAnchor="middle"
          fontSize="36"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
          fill="#d62f3a"
          stroke="#8f1a22"
          strokeWidth="1.2"
        >
          7
        </text>
      )}
    </svg>
  );
}
