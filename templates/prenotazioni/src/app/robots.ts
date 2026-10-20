import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/**
 * La pagina pubblica è indicizzabile solo con NEXT_PUBLIC_ALLOW_INDEXING=true
 * (in demo no). Pannello, widget e pagine delle singole prenotazioni mai.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/gestione", "/prenotazione", "/widget"] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
