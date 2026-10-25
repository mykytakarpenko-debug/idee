/**
 * Identità del template. Cambia `accent` per usare uno degli accenti con
 * contrasti già verificati (definiti in src/app/globals.css).
 */
export type Accent = "viola" | "blu" | "verde" | "rosso";

export const brand = {
  name: "Vetrina",
  accent: "viola" as Accent,
  themeColor: { light: "#f8f6f2", dark: "#0f0d0b" },
} as const;
