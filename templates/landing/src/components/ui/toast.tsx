"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { create } from "zustand";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";

/**
 * Notifiche temporanee (toast). Uso: `toast.success("Cliente aggiunto")`.
 * Annunciate agli screen reader, si mettono in pausa al passaggio del mouse,
 * su mobile si chiudono con uno swipe.
 */
type ToastTone = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastState {
  items: ToastItem[];
  push: (item: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

const useToastStore = create<ToastState>()((set) => ({
  items: [],
  push: (item) => {
    counter += 1;
    const next: ToastItem = { duration: item.action ? 7000 : 4000, ...item, id: counter };
    set((state) => ({ items: [...state.items.slice(-2), next] }));
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((t) => t.id !== id) })),
}));

type ToastOptions = Pick<ToastItem, "description" | "action"> & { duration?: number };

export const toast = {
  success: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ tone: "success", title, ...options }),
  error: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ tone: "error", title, ...options }),
  warning: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ tone: "warning", title, ...options }),
  info: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ tone: "info", title, ...options }),
};

const icons = {
  success: { Icon: CircleCheck, className: "text-success" },
  error: { Icon: CircleAlert, className: "text-danger" },
  warning: { Icon: TriangleAlert, className: "text-warning" },
  info: { Icon: Info, className: "text-info" },
};

export function Toaster() {
  const items = useToastStore((state) => state.items);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <ToastPrimitive.Provider swipeDirection="down" label={copy.a11y.notifications}>
      {items.map((item) => {
        const { Icon, className } = icons[item.tone];
        return (
          <ToastPrimitive.Root
            key={item.id}
            duration={item.duration}
            type={item.tone === "error" ? "foreground" : "background"}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3.5 pr-2 shadow-lg",
              "data-[state=closed]:animate-toast-out data-[state=open]:animate-toast-in",
              "data-[swipe=cancel]:translate-y-0 data-[swipe=cancel]:transition-transform data-[swipe=end]:animate-toast-out data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y)",
            )}
          >
            <Icon aria-hidden className={cn("mt-0.5 size-[18px] shrink-0", className)} />
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="text-sm font-medium text-fg">
                {item.title}
              </ToastPrimitive.Title>
              {item.description ? (
                <ToastPrimitive.Description className="mt-0.5 text-[13px] text-fg-muted">
                  {item.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            {item.action ? (
              <ToastPrimitive.Action
                altText={item.action.label}
                onClick={item.action.onClick}
                className="h-8 shrink-0 rounded-md px-2.5 text-[13px] font-medium text-accent-text hover:bg-accent-soft"
              >
                {item.action.label}
              </ToastPrimitive.Action>
            ) : null}
            <ToastPrimitive.Close
              aria-label={copy.common.close}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <X aria-hidden className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[60] flex w-full max-w-[420px] flex-col gap-2 p-4 outline-none max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))]" />
    </ToastPrimitive.Provider>
  );
}
