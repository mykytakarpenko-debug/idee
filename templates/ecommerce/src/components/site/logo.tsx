import { cn } from "@/lib/utils";

/** Segno grafico del negozio (decorativo) + nome. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path d="M8 14h16a8 8 0 0 1-16 0z" fill="#fff" />
      <path
        d="M12.5 10.5c1-1.4 1-2.6 0-4M16 10.5c1-1.4 1-2.6 0-4M19.5 10.5c1-1.4 1-2.6 0-4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight text-fg">{name}</span>
    </span>
  );
}
