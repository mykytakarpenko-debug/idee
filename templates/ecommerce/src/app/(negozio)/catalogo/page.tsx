import type { Metadata } from "next";
import { Suspense } from "react";
import { copy } from "@/content/it";
import { CatalogView, CatalogWithParams } from "@/features/shop/catalog-view";

export const metadata: Metadata = {
  title: copy.catalog.title,
  description: copy.catalog.description,
  alternates: { canonical: "/catalogo" },
};

/**
 * I filtri sono nell'URL (link condivisibili) e si leggono nel browser;
 * l'HTML statico contiene già l'elenco completo dei prodotti.
 */
export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogView search="" />}>
      <CatalogWithParams />
    </Suspense>
  );
}
