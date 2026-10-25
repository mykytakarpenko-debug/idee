import { ratingSummary } from "@/lib/domain/catalog";
import { productStock } from "@/lib/domain/inventory";
import { priceInfo } from "@/lib/domain/pricing";
import type { Product, Review, Seller, ShopSettings } from "@/lib/domain/types";

/** Dati strutturati schema.org per il negozio e le schede prodotto. */

export function storeJsonLd(settings: ShopSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": `${siteUrl}/#store`,
        name: settings.name,
        description: settings.description,
        url: siteUrl,
        email: settings.legal.email,
        legalName: settings.legal.company,
        vatID: settings.legal.vatNumber,
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.legal.address,
          addressCountry: "IT",
        },
      },
      {
        "@type": "WebSite",
        url: siteUrl,
        name: settings.name,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/catalogo?q={query}` },
          "query-input": "required name=query",
        },
      },
    ],
  };
}

export function productJsonLd(input: {
  product: Product;
  seller: Seller | undefined;
  reviews: readonly Review[];
  settings: ShopSettings;
  siteUrl: string;
  today: string;
}) {
  const { product, seller, reviews, settings, siteUrl, today } = input;
  const info = priceInfo(product, today);
  const rating = ratingSummary(reviews, product.id);
  const url = `${siteUrl}/prodotto/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.variants[0]?.sku,
    url,
    brand: seller ? { "@type": "Brand", name: seller.name } : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: (info.price / 100).toFixed(2),
      priceValidUntil: info.onSale && product.sale ? product.sale.to : undefined,
      availability:
        productStock(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: settings.name },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IT",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: settings.returnDays,
      },
    },
    aggregateRating:
      rating.count > 0
        ? { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count }
        : undefined,
  };
}

/** Serializza JSON-LD in modo sicuro dentro un tag <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
