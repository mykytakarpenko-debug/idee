"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

/** Suggerimento al passaggio del mouse e al focus da tastiera. */
export function Tooltip({
  content,
  side = "top",
  contentClassName,
  children,
}: {
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** Classi extra, es. "lg:hidden" per mostrarlo solo in certe viste. */
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 rounded-md bg-fg px-2 py-1 text-xs font-medium text-canvas shadow-md data-[state=closed]:animate-fade-out data-[state=delayed-open]:animate-fade-in",
            contentClassName,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
