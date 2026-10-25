import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/** Sito pubblico indicizzabile; con NEXT_PUBLIC_ALLOW_INDEXING=false (ambienti di prova) si blocca tutto. */
export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
