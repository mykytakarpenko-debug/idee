import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { brand } from "@/config/brand";
import { env } from "@/config/env";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${DEMO_SETTINGS.name} · Palestra e corsi a ${DEMO_SETTINGS.city}`,
    template: `%s · ${DEMO_SETTINGS.name}`,
  },
  description: DEMO_SETTINGS.description,
  applicationName: brand.name,
  robots: env.allowIndexing ? undefined : { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: DEMO_SETTINGS.name,
    title: DEMO_SETTINGS.name,
    description: DEMO_SETTINGS.tagline,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: brand.themeColor.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${archivo.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
