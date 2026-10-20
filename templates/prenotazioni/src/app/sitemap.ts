import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";

/** Pagine pubbliche da indicizzare. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [routes.home, routes.book, routes.privacy];
  return pages.map((path) => ({
    url: `${env.siteUrl}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === routes.home ? 1 : 0.7,
  }));
}
