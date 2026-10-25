import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/**
 * Il negozio è indicizzabile solo con NEXT_PUBLIC_ALLOW_INDEXING=true (in demo
 * no). Pannello, carrello, checkout, ordini e area personale mai.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/gestione", "/carrello", "/checkout", "/ordine", "/account", "/accedi"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
