import { env } from "@/config/env";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { restaurantJsonLd, serializeJsonLd } from "@/lib/seo";
import { HomeView } from "@/features/site/home-view";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(restaurantJsonLd(DEMO_SETTINGS, env.siteUrl)),
        }}
      />
      <HomeView />
    </>
  );
}
