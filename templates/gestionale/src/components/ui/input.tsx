import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Stile condiviso dei campi: bordo ≥ 3:1, focus evidente, stato di errore. */
export const controlClasses =
  "w-full rounded-md border border-line-strong bg-surface text-fg shadow-xs " +
  "placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-150 " +
  "hover:border-fg-muted focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-muted " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(controlClasses, "h-10 px-3 text-sm sm:h-9", className)}
      {...props}
    />
  );
}

export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(
        controlClasses,
        "min-h-20 resize-y px-3 py-2 text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

/** Select nativo: massima accessibilità e ottima resa su mobile. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlClasses,
          "h-10 cursor-pointer appearance-none py-0 pr-9 pl-3 text-sm sm:h-9",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}

export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded border-line-strong accent-accent",
        className,
      )}
      {...props}
    />
  );
}
