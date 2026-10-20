import { cn } from "@/lib/utils";

/** Segno grafico dello studio (decorativo) + nome. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path
        d="M16 8.5 24 23H8z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-fg">{name}</span>
    </span>
  );
}
