import type { MetadataRoute } from "next";
import { posts } from "@/content/posts";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";

/** Pagine pubbliche e articoli del blog. */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${env.siteUrl}${path === "/" ? "" : path}`;
  return [
    { url: url(routes.home), changeFrequency: "weekly", priority: 1 },
    { url: url(routes.features), changeFrequency: "monthly", priority: 0.8 },
    { url: url(routes.pricing), changeFrequency: "monthly", priority: 0.9 },
    { url: url(routes.about), changeFrequency: "yearly", priority: 0.5 },
    { url: url(routes.blog), changeFrequency: "weekly", priority: 0.7 },
    { url: url(routes.contact), changeFrequency: "yearly", priority: 0.6 },
    ...posts.map((post) => ({
      url: url(routes.post(post.slug)),
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...[routes.privacy, routes.cookies, routes.terms].map((path) => ({
      url: url(path),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
