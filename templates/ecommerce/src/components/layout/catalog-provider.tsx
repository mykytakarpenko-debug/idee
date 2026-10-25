"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StaticCatalog } from "@/lib/catalog-server";

const CatalogContext = createContext<StaticCatalog | null>(null);

/** Rende disponibile ai componenti client il catalogo prerenderizzato. */
export function CatalogProvider({
  value,
  children,
}: {
  value: StaticCatalog;
  children: ReactNode;
}) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useStaticCatalog(): StaticCatalog | null {
  return useContext(CatalogContext);
}
