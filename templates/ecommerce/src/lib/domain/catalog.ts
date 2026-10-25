import { productStock } from "./inventory";
import { priceInfo } from "./pricing";
import type { Category, Cents, ISODate, Product, Review, Seller } from "./types";

/** Ricerca, filtri, ordinamento e valutazioni del catalogo. Funzioni pure, testate. */

export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "rating";
export const SORT_KEYS: readonly SortKey[] = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
];

export interface CatalogFilters {
  q: string;
  category: string;
  seller: string;
  /** Prezzo massimo in centesimi (null = nessun limite). */
  maxPrice: Cents | null;
  inStock: boolean;
  onSale: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  q: "",
  category: "",
  seller: "",
  maxPrice: null,
  inStock: false,
  onSale: false,
  sort: "featured",
};

/** Minuscole e senza accenti: "Ciotola Onda" e "ciotola onda" coincidono. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export interface RatingSummary {
  average: number;
  count: number;
  /** Numero di recensioni per 1…5 stelle. */
  distribution: [number, number, number, number, number];
}

export function ratingSummary(reviews: readonly Review[], productId: string): RatingSummary {
  const own = reviews.filter((r) => r.productId === productId);
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  for (const review of own) distribution[review.rating - 1] += 1;
  const average = own.length ? own.reduce((acc, r) => acc + r.rating, 0) / own.length : 0;
  return { average: Math.round(average * 10) / 10, count: own.length, distribution };
}

export function filterProducts(
  products: readonly Product[],
  filters: CatalogFilters,
  context: {
    today: ISODate;
    reviews: readonly Review[];
    categories: readonly Category[];
    sellers: readonly Seller[];
  },
): Product[] {
  const terms = normalize(filters.q).split(/\s+/).filter(Boolean);
  const categoryName = new Map(context.categories.map((c) => [c.id, c.name]));
  const sellerName = new Map(context.sellers.map((s) => [s.id, s.name]));
  const ratings = new Map<string, number>();
  const rating = (id: string) => {
    if (!ratings.has(id)) ratings.set(id, ratingSummary(context.reviews, id).average);
    return ratings.get(id)!;
  };

  const result = products.filter((product) => {
    if (!product.active) return false;
    if (filters.category && product.categoryId !== filters.category) return false;
    if (filters.seller && product.sellerId !== filters.seller) return false;
    const info = priceInfo(product, context.today);
    if (filters.maxPrice !== null && info.price > filters.maxPrice) return false;
    if (filters.inStock && productStock(product) === 0) return false;
    if (filters.onSale && !info.onSale) return false;
    if (terms.length === 0) return true;
    const haystack = normalize(
      [
        product.name,
        product.shortDescription,
        categoryName.get(product.categoryId) ?? "",
        sellerName.get(product.sellerId) ?? "",
        ...product.variants.map((v) => v.name),
      ].join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });

  const price = (p: Product) => priceInfo(p, context.today).price;
  const sorted = [...result];
  switch (filters.sort) {
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "price_asc":
      sorted.sort((a, b) => price(a) - price(b));
      break;
    case "price_desc":
      sorted.sort((a, b) => price(b) - price(a));
      break;
    case "rating":
      sorted.sort((a, b) => rating(b.id) - rating(a.id));
      break;
    default:
      // In evidenza prima, poi disponibili, poi per nome.
      sorted.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(productStock(b) > 0) - Number(productStock(a) > 0) ||
          a.name.localeCompare(b.name, "it"),
      );
  }
  return sorted;
}

/** Stessa categoria o stesso venditore, disponibili per primi. */
export function relatedProducts(
  product: Product,
  products: readonly Product[],
  limit = 4,
): Product[] {
  return products
    .filter(
      (p) =>
        p.active &&
        p.id !== product.id &&
        (p.categoryId === product.categoryId || p.sellerId === product.sellerId),
    )
    .sort(
      (a, b) =>
        Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId) ||
        Number(productStock(b) > 0) - Number(productStock(a) > 0) ||
        a.name.localeCompare(b.name, "it"),
    )
    .slice(0, limit);
}

/** Filtri ↔ parametri dell'URL (link condivisibili, tasto indietro). */
export function parseFilters(params: URLSearchParams): CatalogFilters {
  const sort = params.get("ordina") as SortKey | null;
  const max = Number.parseInt(params.get("max") ?? "", 10);
  return {
    q: params.get("q") ?? "",
    category: params.get("categoria") ?? "",
    seller: params.get("venditore") ?? "",
    maxPrice: Number.isFinite(max) && max > 0 ? max * 100 : null,
    inStock: params.get("disponibili") === "1",
    onSale: params.get("offerte") === "1",
    sort: sort && SORT_KEYS.includes(sort) ? sort : "featured",
  };
}

export function filtersToQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("categoria", filters.category);
  if (filters.seller) params.set("venditore", filters.seller);
  if (filters.maxPrice !== null) params.set("max", String(Math.round(filters.maxPrice / 100)));
  if (filters.inStock) params.set("disponibili", "1");
  if (filters.onSale) params.set("offerte", "1");
  if (filters.sort !== "featured") params.set("ordina", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function activeFilterCount(filters: CatalogFilters): number {
  return [
    filters.category,
    filters.seller,
    filters.maxPrice !== null,
    filters.inStock,
    filters.onSale,
  ].filter(Boolean).length;
}
