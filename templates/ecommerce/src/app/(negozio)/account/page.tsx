import type { Metadata } from "next";
import { copy } from "@/content/it";
import { AccountView } from "@/features/account/account-view";

/**
 * Area personale. In produzione proteggi la rotta lato server (proxy.ts) e
 * leggi i dati dalla sessione autenticata: vedi docs/architettura.md.
 */
export const metadata: Metadata = {
  title: copy.site.account,
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountView />;
}
