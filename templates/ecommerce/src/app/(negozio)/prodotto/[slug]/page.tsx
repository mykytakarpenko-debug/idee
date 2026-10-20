import type { Metadata } from "next";
import { Suspense } from "react";
import { env } from "@/config/env";
import { getCatalog } from "@/lib/catalog-server";
import { productJsonLd, serializeJsonLd } from "@/lib/seo";
import { Container } from "@/components/site/section";
import { ProductView } from "@/features/shop/product-view";

/** Schede prodotto prerenderizzate (HTML statico con prezzo e disponibilità). */
export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/prodotto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  // Prodotti creati dal pannello in demo: esistono solo nel browser.
  if (!product) return { robots: { index: false } };
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/prodotto/${product.slug}` },
    openGraph: { title: product.name, description: product.shortDescription, type: "website" },
  };
}

async function ProductPageContent({ params }: { params: PageProps<"/prodotto/[slug]">["params"] }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.products.find((p) => p.slug === slug);
  return (
    <>
      {product ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              productJsonLd({
                product,
                seller: catalog.sellers.find((s) => s.id === product.sellerId),
                reviews: catalog.reviews,
                settings: catalog.settings,
                siteUrl: env.siteUrl,
                today: catalog.today,
              }),
            ),
          }}
        />
      ) : null}
      <ProductView slug={slug} />
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/prodotto/[slug]">) {
  return (
    <Suspense fallback={<Container className="min-h-[70vh] py-10" aria-busy="true" />}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}
