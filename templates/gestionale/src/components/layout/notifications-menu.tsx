"use client";

import { Bell, CalendarCheck, Info, Inbox, Wallet, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copy } from "@/content/it";
import { useNow } from "@/hooks/use-now";
import type { NotificationKind } from "@/lib/domain/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const kindIcon: Record<NotificationKind, LucideIcon> = {
  booking: CalendarCheck,
  payment: Wallet,
  reminder: Bell,
  system: Info,
};

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const now = useNow();
  const notifications = useDataStore((state) => state.notifications);
  const markRead = useDataStore((state) => state.markNotificationRead);
  const markAllRead = useDataStore((state) => state.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0
              ? `${copy.topbar.notifications}, ${copy.topbar.unread(unread)}`
              : copy.topbar.notifications
          }
        >
          <Bell aria-hidden />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-canvas"
            >
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-1rem))]">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-fg">{copy.topbar.notifications}</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded text-[13px] font-medium text-accent-text hover:underline"
            >
              {copy.topbar.markAllRead}
            </button>
          ) : null}
        </div>
        {sorted.length === 0 ? (
          <EmptyState
            compact
            icon={Inbox}
            title={copy.topbar.noNotifications}
            description={copy.topbar.noNotificationsHint}
          />
        ) : (
          <ul className="max-h-[min(420px,70dvh)] overflow-y-auto py-1">
            {sorted.map((notification) => {
              const Icon = kindIcon[notification.kind];
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(notification.id);
                      setOpen(false);
                      if (notification.href) router.push(notification.href);
                    }}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        notification.read
                          ? "bg-surface-2 text-fg-muted"
                          : "bg-accent-soft text-accent-soft-fg",
                      )}
                    >
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn("text-sm text-fg", !notification.read && "font-semibold")}
                        >
                          {notification.title}
                        </span>
                        {!notification.read ? (
                          <span className="size-2 shrink-0 rounded-full bg-accent">
                            <span className="sr-only">({copy.topbar.unread(1)})</span>
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-fg-muted">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-xs text-fg-subtle">
                        {copy.notificationKind[notification.kind]}
                        {now ? ` · ${formatRelative(notification.createdAt, now)}` : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
