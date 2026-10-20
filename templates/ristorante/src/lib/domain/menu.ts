import type { Allergen, Dish } from "./types";

/** Filtri del menu: diete, allergeni da escludere e ricerca testuale. */
export interface MenuFilters {
  query: string;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  excludeAllergens: Allergen[];
}

export const emptyFilters: MenuFilters = {
  query: "",
  vegetarian: false,
  vegan: false,
  glutenFree: false,
  excludeAllergens: [],
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesFilters(dish: Dish, filters: MenuFilters): boolean {
  if (filters.vegan && !dish.vegan) return false;
  if (filters.vegetarian && !dish.vegetarian && !dish.vegan) return false;
  if (filters.glutenFree && dish.allergens.includes("glutine")) return false;
  if (filters.excludeAllergens.some((a) => dish.allergens.includes(a))) return false;
  const q = normalize(filters.query.trim());
  if (q && !normalize(`${dish.name} ${dish.description}`).includes(q)) return false;
  return true;
}

export function activeFilterCount(filters: MenuFilters): number {
  return (
    Number(filters.vegetarian) +
    Number(filters.vegan) +
    Number(filters.glutenFree) +
    filters.excludeAllergens.length +
    Number(filters.query.trim() !== "")
  );
}
