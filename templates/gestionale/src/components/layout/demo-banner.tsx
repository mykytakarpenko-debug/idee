"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { useDataStore } from "@/store/data-store";
import { usePrefsStore } from "@/store/prefs-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";

/** Avviso della modalità demo, con ripristino rapido dei dati. */
export function DemoBanner() {
  const hydrated = usePrefsStore((state) => state.hydrated);
  const dismissed = usePrefsStore((state) => state.demoBannerDismissed);
  const setDismissed = usePrefsStore((state) => state.setDemoBannerDismissed);
  const resetDemo = useDataStore((state) => state.resetDemo);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!env.demoMode || !hydrated || dismissed) return null;

  return (
    <div className="no-print border-b border-line bg-info-soft">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2 text-[13px] text-fg sm:px-6 lg:px-8">
        <Info aria-hidden className="size-4 shrink-0 text-info" />
        <p className="min-w-0 flex-1">
          <span className="sm:hidden">{copy.demo.bannerShort}</span>
          <span className="hidden sm:inline">{copy.demo.banner}</span>
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="shrink-0 rounded font-medium text-info underline-offset-2 hover:underline"
        >
          <span className="sm:hidden">{copy.common.resetShort}</span>
          <span className="hidden sm:inline">{copy.demo.reset}</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={copy.demo.dismiss}
          className="-mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface/60 hover:text-fg"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={copy.settings.data.resetConfirmTitle}
        description={copy.settings.data.resetConfirmDescription}
        confirmLabel={copy.demo.reset}
        tone="default"
        onConfirm={() => {
          resetDemo();
          toast.success(copy.demo.resetDone);
        }}
      />
    </div>
  );
}
