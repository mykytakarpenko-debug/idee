import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/**
 * Il sito è indicizzabile solo con NEXT_PUBLIC_ALLOW_INDEXING=true (in demo no).
 * Conto, accesso, registrazione e pannello operatore mai.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/operatore", "/conto", "/accedi", "/registrazione", "/minori"],
    },
  };
}
