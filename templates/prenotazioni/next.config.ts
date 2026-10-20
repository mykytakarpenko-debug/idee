import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Le preview di Vercel includono la toolbar per i commenti di revisione:
// i suoi domini sono ammessi solo lì, mai in produzione.
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const vercelLive = isVercelPreview ? " https://vercel.live" : "";

/**
 * Origini che possono incorporare il widget di prenotazione (/widget) in un
 * iframe, separate da spazi. Esempio: "https://www.miosito.it https://blog.miosito.it".
 * Senza valore il widget è incorporabile solo dallo stesso dominio.
 */
const widgetAncestors = process.env.WIDGET_FRAME_ANCESTORS?.trim() || "'self'";

/**
 * Content Security Policy senza nonce: mantiene le pagine prerenderizzate
 * staticamente (più veloci ed economiche). Per una policy più restrittiva
 * con nonce vedi docs/sicurezza-privacy.md.
 */
const csp = (frameAncestors: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${vercelLive}`,
    `style-src 'self' 'unsafe-inline'${vercelLive}`,
    `img-src 'self' blob: data:${isVercelPreview ? " https://vercel.live https://vercel.com" : ""}`,
    `font-src 'self'${isVercelPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
    `connect-src 'self'${isVercelPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
    `frame-src ${isVercelPreview ? "https://vercel.live" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

const commonHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HSTS di 2 anni. Aggiungi "; preload" solo dopo aver verificato che tutti i
  // sottodomini del dominio personalizzato siano serviti in HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** Tutte le pagine: mai incorporabili in iframe di altri siti. */
const pageHeaders = [
  { key: "Content-Security-Policy", value: csp("'none'") },
  { key: "X-Frame-Options", value: "DENY" },
  ...commonHeaders,
];

/** Widget: incorporabile solo dalle origini dichiarate (X-Frame-Options non supporta elenchi). */
const widgetHeaders = [
  { key: "Content-Security-Policy", value: csp(widgetAncestors) },
  ...commonHeaders,
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/", headers: pageHeaders },
      { source: "/:path((?!widget).*)", headers: pageHeaders },
      { source: "/widget", headers: widgetHeaders },
      { source: "/widget/:path*", headers: widgetHeaders },
    ];
  },
};

export default nextConfig;
