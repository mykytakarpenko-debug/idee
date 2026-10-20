/**
 * Identità del prodotto. Modifica qui nome, descrizione e metadati:
 * vengono usati da layout, metadata, manifest e schermata di accesso.
 * Il logo è in src/components/layout/logo.tsx.
 */
export const brand = {
  name: "Nucleo",
  tagline: "Il gestionale essenziale per attività di servizi",
  description:
    "Clienti, servizi, appuntamenti, calendario, pagamenti e report in un'unica app, chiara e veloce.",
  /** Colore della barra del browser su mobile (allineato al token --canvas). */
  themeColor: { light: "#f7f7f5", dark: "#0d0d0f" },
} as const;
