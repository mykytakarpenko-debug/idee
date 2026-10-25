"use client";

import { AlertDialog } from "radix-ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { buttonClasses } from "@/components/ui/button";

const KEY = "arena:age";

function confirmed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Richiesta della maggiore età alla prima visita. È solo un primo filtro:
 * l'età viene verificata con codice fiscale e documento alla registrazione.
 */
export function AgeGate() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === routes.minors || confirmed()) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-6 shadow-lg outline-none data-[state=open]:animate-dialog-in">
          <p
            aria-hidden
            className="inline-flex rounded-md border-2 border-fg px-2 font-display text-lg font-bold text-fg"
          >
            18+
          </p>
          <AlertDialog.Title className="mt-4 font-display text-xl font-bold text-fg">
            {copy.ageGate.title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-fg-muted">
            {copy.ageGate.text}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              className={buttonClasses({ variant: "secondary" })}
              onClick={() => {
                setOpen(false);
                router.push(routes.minors);
              }}
            >
              {copy.ageGate.no}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonClasses({})}
              onClick={() => {
                try {
                  localStorage.setItem(KEY, "1");
                } catch {
                  // Senza archiviazione la domanda si ripresenta: va bene così.
                }
                setOpen(false);
              }}
            >
              {copy.ageGate.yes}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
