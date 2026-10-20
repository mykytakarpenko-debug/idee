import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";

/** Pagine pubbliche da indicizzare. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    routes.home,
    routes.courses,
    routes.schedule,
    routes.pricing,
    routes.trial,
    routes.privacy,
  ];
  return pages.map((path) => ({
    url: `${env.siteUrl}${path === "/" ? "" : path}`,
    changeFrequency: path === routes.schedule ? "weekly" : "monthly",
    priority: path === routes.home ? 1 : 0.7,
  }));
}
