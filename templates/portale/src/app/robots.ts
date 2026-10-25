import type { MetadataRoute } from "next";

/** Area riservata: nessuna pagina va indicizzata. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
