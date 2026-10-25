/**
 * Variabili d'ambiente pubbliche, con valori predefiniti sicuri.
 * Le variabili NEXT_PUBLIC_* finiscono nel bundle del browser:
 * non usarle mai per segreti (chiavi API, password, token).
 */
function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const env = {
  siteUrl: siteUrl(),
  demoMode: bool(process.env.NEXT_PUBLIC_DEMO_MODE, true),
} as const;
