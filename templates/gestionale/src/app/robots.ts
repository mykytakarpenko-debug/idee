import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/** Un gestionale privato non va indicizzato: abilita solo se serve (NEXT_PUBLIC_ALLOW_INDEXING). */
export default function robots(): MetadataRoute.Robots {
  return env.allowIndexing
    ? { rules: { userAgent: "*", allow: "/" } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
