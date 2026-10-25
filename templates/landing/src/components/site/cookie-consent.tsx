"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { create } from "zustand";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import {
  acceptAll,
  CONSENT_STORAGE_KEY,
  makeConsent,
  parseConsent,
  rejectAll,
  type Consent,
  type ConsentCategory,
} from "@/lib/consent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.cookies;

interface ConsentState {
  /** undefined = non ancora letto dal browser; null = nessuna scelta valida. */
  consent: Consent | null | undefined;
  preferencesOpen: boolean;
  load: () => void;
  choose: (consent: Consent) => void;
  openPreferences: (open: boolean) => void;
}

/** Stato del consenso condiviso da banner, preferenze e caricamento degli script. */
export const useConsent = create<ConsentState>()((set) => ({
  consent: undefined,
  preferencesOpen: false,
  load: () => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      raw = null;
    }
    set({ consent: parseConsent(raw, new Date()) });
  },
  choose: (consent) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    } catch {
      // Senza archiviazione la scelta vale per questa visita.
    }
    set({ consent, preferencesOpen: false });
  },
  openPreferences: (open) => set({ preferencesOpen: open }),
}));

/**
 * Banner e preferenze dei cookie (Linee guida del Garante, giugno 2021):
 * accetta e rifiuta con pari evidenza, X = rifiuto, scelte per categoria,
 * nessuno strumento non tecnico prima della scelta.
 */
export function CookieConsent() {
  const { consent, preferencesOpen, load, choose, openPreferences } = useConsent();

  useEffect(() => {
    load();
  }, [load]);

  // Statistiche e marketing si attivano solo con il consenso (qui: un attributo
  // sull'html che i tuoi script possono leggere; vedi docs/personalizzazione.md).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.consentStatistics = consent?.statistics ? "granted" : "denied";
    root.dataset.consentMarketing = consent?.marketing ? "granted" : "denied";
  }, [consent]);

  const showBanner = consent === null && !preferencesOpen;

  return (
    <>
      {showBanner ? (
        <section
          aria-labelledby="cookie-title"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-xl sm:border sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="cookie-title" className="text-base font-semibold text-fg">
              {t.title}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t.closeReject}
              onClick={() => choose(rejectAll(new Date()))}
              className="-mt-1 -mr-1"
            >
              <X aria-hidden />
            </Button>
          </div>
          <p className="mt-2 text-sm text-fg-muted">
            {t.text}{" "}
            <Link
              href={routes.cookies}
              className="font-medium text-accent-text underline underline-offset-2"
            >
              {t.policy}
            </Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => choose(rejectAll(new Date()))}>
              {t.reject}
            </Button>
            <Button variant="secondary" onClick={() => choose(acceptAll(new Date()))}>
              {t.accept}
            </Button>
            <Button variant="ghost" className="col-span-2" onClick={() => openPreferences(true)}>
              {t.customize}
            </Button>
          </div>
        </section>
      ) : null}
      <Dialog open={preferencesOpen} onOpenChange={openPreferences}>
        {preferencesOpen ? <PreferencesDialog initial={consent ?? null} onSave={choose} /> : null}
      </Dialog>
    </>
  );
}

function PreferencesDialog({
  initial,
  onSave,
}: {
  initial: Consent | null;
  onSave: (consent: Consent) => void;
}) {
  const id = useId();
  const [choices, setChoices] = useState<Record<ConsentCategory, boolean>>({
    statistics: initial?.statistics ?? false,
    marketing: initial?.marketing ?? false,
  });
  const save = (consent: Consent) => {
    onSave(consent);
    toast.success(t.saved);
  };
  const rows: { key: "necessary" | ConsentCategory }[] = [
    { key: "necessary" },
    { key: "statistics" },
    { key: "marketing" },
  ];

  return (
    <DialogContent title={t.preferences} description={t.preferencesText}>
      <DialogBody className="grid gap-4">
        {rows.map(({ key }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 rounded-lg border border-line p-4"
          >
            <div>
              <p id={`${id}-${key}`} className="text-sm font-medium text-fg">
                {t.categories[key].title}
              </p>
              <p id={`${id}-${key}-text`} className="mt-0.5 text-[13px] text-fg-muted">
                {t.categories[key].text}
              </p>
            </div>
            {key === "necessary" ? (
              <span className="shrink-0 text-[13px] font-medium text-fg-muted">{t.alwaysOn}</span>
            ) : (
              <Switch
                checked={choices[key]}
                onCheckedChange={(checked) => setChoices((prev) => ({ ...prev, [key]: checked }))}
                aria-labelledby={`${id}-${key}`}
                aria-describedby={`${id}-${key}-text`}
              />
            )}
          </div>
        ))}
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={() => save(rejectAll(new Date()))}>
          {t.reject}
        </Button>
        <Button variant="secondary" onClick={() => save(acceptAll(new Date()))}>
          {t.accept}
        </Button>
        <Button onClick={() => save(makeConsent(choices, new Date()))}>{t.save}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/** Link nel piè di pagina per rivedere le scelte in qualsiasi momento. */
export function CookiePreferencesButton() {
  const openPreferences = useConsent((state) => state.openPreferences);
  return (
    <button
      type="button"
      onClick={() => openPreferences(true)}
      className="text-left text-fg-muted hover:text-fg"
    >
      {copy.footer.cookiePreferences}
    </button>
  );
}
