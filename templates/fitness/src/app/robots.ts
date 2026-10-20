import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/**
 * Il sito pubblico è indicizzabile solo con NEXT_PUBLIC_ALLOW_INDEXING=true
 * (in demo no). Area socio, accesso e pannello non lo sono mai.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/gestione", "/area-socio", "/accedi"] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
