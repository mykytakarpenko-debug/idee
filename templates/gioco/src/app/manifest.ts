import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { DEMO_SETTINGS } from "@/lib/demo/seed";

/** Manifest web app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: DEMO_SETTINGS.name,
    short_name: DEMO_SETTINGS.name,
    description: brand.description,
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
