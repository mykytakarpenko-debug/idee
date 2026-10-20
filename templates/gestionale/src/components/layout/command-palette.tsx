"use client";

import { Command } from "cmdk";
import { CalendarPlus, Layers, Moon, Search, User, UserPlus, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { copy } from "@/content/it";
import { allNavItems, routes } from "@/config/navigation";
import { fullName } from "@/lib/domain/clients";
import { setThemePreference, useTheme } from "@/lib/theme";
import { useDataStore } from "@/store/data-store";
import { openDialog, useUiStore } from "@/store/ui-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

/**
 * Ricerca rapida (⌘K / Ctrl+K): pagine, azioni e clienti.
 * Con un backend reale e molti clienti, sostituisci il filtro locale con
 * una ricerca lato server (debounce + API).
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const clients = useDataStore((state) => state.clients);
  const { resolved } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useUiStore.getState().setCommandOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title={copy.command.label}
        hideHeader
        size="md"
        className="sm:top-[18%] sm:translate-y-0"
      >
        <Command label={copy.command.label} className="flex min-h-0 flex-1 flex-col" loop>
          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <Search aria-hidden className="size-[18px] shrink-0 text-fg-subtle" />
            <Command.Input
              placeholder={copy.command.placeholder}
              className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
            />
            <Kbd className="hidden sm:inline-flex">Esc</Kbd>
          </div>
          <Command.List className="max-h-[min(420px,60dvh)] overflow-y-auto overscroll-contain p-2">
            <Command.Empty className="px-3 py-10 text-center text-sm text-fg-muted">
              {copy.command.empty}
            </Command.Empty>

            <PaletteGroup heading={copy.command.actions}>
              <PaletteItem
                value="action-appointment"
                keywords={["nuovo", "appuntamento", "prenota"]}
                icon={<CalendarPlus />}
                onSelect={() => run(() => openDialog({ type: "appointment" }))}
              >
                {copy.topbar.newAppointment}
              </PaletteItem>
              <PaletteItem
                value="action-client"
                keywords={["nuovo", "cliente"]}
                icon={<UserPlus />}
                onSelect={() => run(() => openDialog({ type: "client" }))}
              >
                {copy.topbar.newClient}
              </PaletteItem>
              <PaletteItem
                value="action-payment"
                keywords={["pagamento", "incasso", "ricevuta"]}
                icon={<Wallet />}
                onSelect={() => run(() => openDialog({ type: "payment" }))}
              >
                {copy.topbar.newPayment}
              </PaletteItem>
              <PaletteItem
                value="action-service"
                keywords={["servizio", "listino"]}
                icon={<Layers />}
                onSelect={() => run(() => openDialog({ type: "service" }))}
              >
                {copy.topbar.newService}
              </PaletteItem>
              <PaletteItem
                value="action-theme"
                keywords={["tema", "scuro", "chiaro", "dark"]}
                icon={<Moon />}
                onSelect={() =>
                  run(() => setThemePreference(resolved === "dark" ? "light" : "dark"))
                }
              >
                {copy.command.toggleTheme}
              </PaletteItem>
            </PaletteGroup>

            <PaletteGroup heading={copy.command.pages}>
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <PaletteItem
                    key={item.href}
                    value={`page-${item.href}`}
                    keywords={[item.label]}
                    icon={<Icon />}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    {item.label}
                  </PaletteItem>
                );
              })}
            </PaletteGroup>

            <PaletteGroup heading={copy.command.clients}>
              {clients.map((client) => (
                <PaletteItem
                  key={client.id}
                  value={`client-${client.id}`}
                  keywords={[fullName(client), client.email, client.phone, client.company ?? ""]}
                  icon={<User />}
                  onSelect={() => run(() => router.push(routes.client(client.id)))}
                >
                  <span className="truncate">{fullName(client)}</span>
                  <span className="ml-auto hidden truncate text-xs text-fg-muted sm:block">
                    {client.email || client.phone}
                  </span>
                </PaletteItem>
              ))}
            </PaletteGroup>
          </Command.List>
          <p className="hidden border-t border-line px-4 py-2.5 text-xs text-fg-muted sm:block">
            {copy.command.hint}
          </p>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function PaletteGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-muted"
    >
      {children}
    </Command.Group>
  );
}

function PaletteItem({
  value,
  keywords,
  icon,
  onSelect,
  children,
}: {
  value: string;
  keywords: string[];
  icon: ReactNode;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex h-11 cursor-default items-center gap-3 rounded-lg px-3 text-sm text-fg select-none data-[selected=true]:bg-surface-2 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-fg-muted"
    >
      {icon}
      {children}
    </Command.Item>
  );
}
