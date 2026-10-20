"use client";

import { Check } from "lucide-react";
import { DropdownMenu as Menu } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;
export const DropdownMenuRadioGroup = Menu.RadioGroup;

export const popoverSurface =
  "z-50 min-w-48 overflow-hidden rounded-lg border border-line bg-surface p-1 text-fg shadow-md " +
  "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in origin-(--radix-popper-transform-origin)";

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={8}
        className={cn(popoverSurface, className)}
        {...props}
      />
    </Menu.Portal>
  );
}

const itemClasses =
  "relative flex h-9 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors " +
  "data-highlighted:bg-surface-2 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted";

export function DropdownMenuItem({
  className,
  tone = "default",
  ...props
}: ComponentProps<typeof Menu.Item> & { tone?: "default" | "danger" }) {
  return (
    <Menu.Item
      className={cn(
        itemClasses,
        tone === "danger" && "text-danger data-highlighted:bg-danger-soft [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem className={cn(itemClasses, "pr-8", className)} {...props}>
      {children}
      <Menu.ItemIndicator className="absolute right-2.5">
        <Check aria-hidden className="text-fg" />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn("px-2.5 pt-2 pb-1 text-xs font-medium text-fg-muted", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("-mx-1 my-1 h-px bg-line", className)} {...props} />;
}
