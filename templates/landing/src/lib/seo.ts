import { faq, plans, site } from "@/content/site";
import type { Post } from "@/content/posts";
import { pricePerPerson } from "./pricing";

/** Dati strutturati schema.org. Funzioni pure, testate. */

export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: site.name,
        legalName: site.company,
        url: siteUrl,
        email: site.email,
        vatID: site.vatNumber,
        logo: `${siteUrl}/icon.svg`,
        address: { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "IT" },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: site.name,
        inLanguage: "it-IT",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}

/** Il software con le offerte a prezzo pubblico (IVA esclusa, prezzo mensile per persona). */
export function softwareJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    description: site.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    url: siteUrl,
    offers: plans
      .filter((plan) => plan.monthly !== null)
      .map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: ((pricePerPerson(plan, "monthly") ?? 0) / 100).toFixed(2),
        priceCurrency: "EUR",
        valueAddedTaxIncluded: false,
        url: `${siteUrl}/prezzi`,
      })),
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function articleJsonLd(post: Post, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
    },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    inLanguage: "it-IT",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

/** Serializza per <script type="application/ld+json"> neutralizzando "<" (niente chiusure di tag). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
