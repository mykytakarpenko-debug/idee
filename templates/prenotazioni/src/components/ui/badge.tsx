import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-surface-2 text-fg-muted",
  accent: "bg-accent-soft text-accent-soft-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
} as const;

export type BadgeTone = keyof typeof tones;

/** Etichetta di stato: abbinare sempre testo (e icona) al colore, mai solo colore. */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
