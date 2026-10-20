import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

/** Manifest web app: installabile su smartphone e tablet. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} · Gestionale`,
    short_name: brand.name,
    description: brand.description,
    lang: "it",
    start_url: "/dashboard",
    display: "standalone",
    background_color: brand.themeColor.light,
    theme_color: brand.themeColor.light,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
