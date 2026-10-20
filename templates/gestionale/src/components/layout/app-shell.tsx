"use client";

import { useEffect, type ReactNode } from "react";
import { copy } from "@/content/it";
import { onStorageError } from "@/store/persist-storage";
import { useDataStore } from "@/store/data-store";
import { usePrefsStore } from "@/store/prefs-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster, toast } from "@/components/ui/toast";
import { CommandPalette } from "./command-palette";
import { DemoBanner } from "./demo-banner";
import { GlobalDialogs } from "./global-dialogs";
import { MobileNavSheet, MobileTabBar } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** Carica dati e preferenze dal browser all'avvio. */
function useClientData() {
  useEffect(() => {
    void useDataStore.getState().init();
    void Promise.resolve(usePrefsStore.persist.rehydrate()).then(() =>
      usePrefsStore.setState({ hydrated: true }),
    );
    let warned = false;
    return onStorageError(() => {
      if (warned) return;
      warned = true;
      toast.warning(copy.errors.storage);
    });
  }, []);
}

/**
 * Struttura dell'area riservata: sidebar (desktop/tablet), barra superiore,
 * barra inferiore (mobile), modali globali, ricerca rapida e notifiche.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useClientData();

  return (
    <TooltipProvider delayDuration={300}>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-md transition-transform focus:translate-y-0"
      >
        {copy.a11y.skipToContent}
      </a>
      <Sidebar />
      <div className="flex min-h-dvh flex-col md:pl-[72px] lg:pl-64">
        <Topbar />
        <DemoBanner />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none md:pb-0"
        >
          {children}
        </main>
      </div>
      <MobileTabBar />
      <MobileNavSheet />
      <CommandPalette />
      <GlobalDialogs />
      <Toaster />
    </TooltipProvider>
  );
}
