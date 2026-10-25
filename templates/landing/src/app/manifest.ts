import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    lang: "it",
    start_url: "/",
    display: "standalone",
    background_color: brand.themeColor.light,
    theme_color: brand.themeColor.light,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
