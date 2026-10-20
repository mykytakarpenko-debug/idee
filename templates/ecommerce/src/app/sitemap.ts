import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { getCatalog } from "@/lib/catalog-server";

/** Pagine pubbliche da indicizzare: negozio, schede prodotto e laboratori. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const url = (path: string) => `${env.siteUrl}${path === "/" ? "" : path}`;
  return [
    { url: url(routes.home), changeFrequency: "daily", priority: 1 },
    { url: url(routes.shop), changeFrequency: "daily", priority: 0.9 },
    { url: url(routes.sellers), changeFrequency: "monthly", priority: 0.6 },
    ...catalog.products
      .filter((p) => p.active)
      .map((p) => ({
        url: url(routes.product(p.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...catalog.sellers.map((s) => ({
      url: url(routes.seller(s.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...[routes.shipping, routes.conditions, routes.withdrawal, routes.privacy].map((path) => ({
      url: url(path),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
