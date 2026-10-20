import { AppShell } from "@/components/layout/app-shell";

/**
 * Area riservata. In produzione proteggi queste rotte con un provider di
 * autenticazione (vedi docs/architettura.md → "Autenticazione").
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
