import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const base =
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants = {
  primary: "bg-accent text-accent-fg shadow-xs hover:bg-accent-hover",
  secondary:
    "border border-line bg-surface text-fg shadow-xs hover:border-line-strong/40 hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger-solid text-white shadow-xs hover:brightness-95",
  "danger-ghost": "text-danger hover:bg-danger-soft",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px] [&_svg]:size-4",
  md: "h-10 px-4 text-sm sm:h-9 [&_svg]:size-4",
  lg: "h-11 px-5 text-[15px] [&_svg]:size-[18px]",
  icon: "size-10 sm:size-9 [&_svg]:size-[18px]",
  "icon-sm": "size-8 [&_svg]:size-4",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra uno spinner e disattiva il pulsante. */
  loading?: boolean;
  /** Renderizza il figlio (es. <Link>) con lo stile del pulsante. */
  asChild?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  asChild = false,
  className,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={buttonClasses({ variant, size, className })} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type ?? "button"}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
