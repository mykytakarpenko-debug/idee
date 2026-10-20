import { Flame, Leaf, Sprout } from "lucide-react";
import { copy } from "@/content/it";
import type { Dish } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";

/** Etichette di dieta del piatto (icona + testo). */
export function DietBadges({ dish }: { dish: Dish }) {
  return (
    <>
      {dish.vegan ? (
        <Badge tone="success">
          <Sprout aria-hidden />
          {copy.diet.vegan}
        </Badge>
      ) : dish.vegetarian ? (
        <Badge tone="success">
          <Leaf aria-hidden />
          {copy.diet.vegetarian}
        </Badge>
      ) : null}
      {dish.spicy ? (
        <Badge tone="danger">
          <Flame aria-hidden />
          {copy.diet.spicy}
        </Badge>
      ) : null}
    </>
  );
}

/** Elenco testuale degli allergeni ("Contiene: Glutine, Latte"). */
export function AllergenList({ dish }: { dish: Dish }) {
  if (dish.allergens.length === 0) return null;
  return (
    <p className="text-xs text-fg-muted">
      <span className="font-medium">{copy.menu.contains}:</span>{" "}
      {dish.allergens.map((allergen) => copy.allergens[allergen]).join(", ")}
    </p>
  );
}
