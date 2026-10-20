import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Marchio: un "nucleo" stilizzato. Sostituisci l'SVG con il logo del cliente. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <circle
        cx="16"
        cy="16"
        r="7.25"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        opacity="0.95"
      />
      <circle cx="16" cy="16" r="2.4" fill="white" />
    </svg>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-fg">{brand.name}</span>
        {subtitle ? <span className="truncate text-xs text-fg-muted">{subtitle}</span> : null}
      </span>
    </span>
  );
}
