import { cn } from "@/lib/utils";

/** Segno grafico dell'operatore (decorativo) + nome. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <ellipse cx="16" cy="17" rx="9.5" ry="6.5" fill="none" stroke="#fff" strokeWidth="2" />
      <path
        d="M16 6.5v5M11 8l1.6 4M21 8l-1.6 4"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight text-fg">{name}</span>
    </span>
  );
}
