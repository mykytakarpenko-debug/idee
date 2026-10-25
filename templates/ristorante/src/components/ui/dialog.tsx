"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";

/**
 * Modale accessibile (Radix): focus intrappolato, chiusura con Esc,
 * sfondo inerte. Su mobile si apre come pannello dal basso.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const overlayClasses =
  "fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in";

interface DialogContentProps extends Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Nasconde l'intestazione visibile (titolo e chiusura restano accessibili). */
  hideHeader?: boolean;
}

const sizeClasses = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

export function DialogContent({
  title,
  description,
  size = "md",
  hideHeader = false,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClasses} />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-surface shadow-lg outline-none",
          // Un <form> che avvolge corpo e piè di pagina eredita il layout a colonna.
          "[&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col",
          // Mobile: pannello dal basso
          "right-0 bottom-0 left-0 max-h-[92dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
          "max-sm:data-[state=closed]:animate-sheet-up-out max-sm:data-[state=open]:animate-sheet-up-in",
          // Desktop: centrata
          "sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[min(88dvh,860px)] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:border-line sm:pb-0",
          "sm:data-[state=closed]:animate-dialog-out sm:data-[state=open]:animate-dialog-in",
          sizeClasses[size],
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        {hideHeader ? (
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        ) : (
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold text-fg">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-[13px] text-fg-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              className="-mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label={copy.common.close}
            >
              <X aria-hidden className="size-[18px]" />
            </DialogPrimitive.Close>
          </div>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Area scorrevole del contenuto della modale. */
export function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6", className)} {...props} />
  );
}

/** Piè di pagina con le azioni, sempre visibile. */
export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

/** Pannello laterale (menu mobile, dettagli). */
export function SheetContent({
  title,
  side = "left",
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: string;
  side?: "left" | "right";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClasses} />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(20rem,calc(100%-3rem))] flex-col bg-surface shadow-lg outline-none",
          side === "left"
            ? "left-0 border-r border-line data-[state=closed]:animate-sheet-left-out data-[state=open]:animate-sheet-left-in"
            : "right-0 border-l border-line data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
