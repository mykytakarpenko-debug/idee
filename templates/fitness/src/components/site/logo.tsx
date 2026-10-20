import { cn } from "@/lib/utils";

/** Marchio del club: segno grafico + nome. Il segno è decorativo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path
        d="M8 20.5 13 11l4.5 7.5L21 13l3 7.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight text-fg">{name}</span>
    </span>
  );
}
