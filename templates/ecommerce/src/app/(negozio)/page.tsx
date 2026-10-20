import { env } from "@/config/env";
import { getCatalog } from "@/lib/catalog-server";
import { serializeJsonLd, storeJsonLd } from "@/lib/seo";
import { HomeView } from "@/features/shop/home-view";

export default async function HomePage() {
  const { settings } = await getCatalog();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(storeJsonLd(settings, env.siteUrl)) }}
      />
      <HomeView />
    </>
  );
}
