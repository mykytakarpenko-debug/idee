"use client";

import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { dishFormSchema, type DishFormValues } from "@/lib/domain/schemas";
import { ALLERGENS, type Allergen, type Dish } from "@/lib/domain/types";
import { centsToInput } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const f = copy.menuAdmin.form;

function toValues(dish: Dish | undefined, categoryId: string): DishFormValues {
  return {
    name: dish?.name ?? "",
    description: dish?.description ?? "",
    categoryId: dish?.categoryId ?? categoryId,
    price: dish ? centsToInput(dish.price) : "",
    allergens: dish?.allergens ?? [],
    vegetarian: dish?.vegetarian ?? false,
    vegan: dish?.vegan ?? false,
    spicy: dish?.spicy ?? false,
    orderable: dish?.orderable ?? true,
    featured: dish?.featured ?? false,
  };
}

export function DishFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const { dish, categories } = useData((state) => ({
    dish: id ? state.dishes.find((d) => d.id === id) : undefined,
    categories: state.categories,
  }));
  const createDish = useDataStore((state) => state.createDish);
  const updateDish = useDataStore((state) => state.updateDish);
  const form = useZodForm(dishFormSchema, toValues(dish, categories[0]?.id ?? ""));
  const { values, errors, text, setValue } = form;

  const toggleAllergen = (allergen: Allergen) =>
    setValue(
      "allergens",
      values.allergens.includes(allergen)
        ? values.allergens.filter((a) => a !== allergen)
        : [...values.allergens, allergen],
    );

  const onSubmit = form.handleSubmit((data) => {
    const input = { ...data, vegetarian: data.vegetarian || data.vegan };
    if (dish) {
      updateDish(dish.id, input);
      toast.success(f.updated);
    } else {
      createDish(input);
      toast.success(f.created);
    }
    onDone();
  });

  const flags = [
    ["vegetarian", copy.diet.vegetarian],
    ["vegan", copy.diet.vegan],
    ["spicy", copy.diet.spicy],
    ["orderable", f.orderable],
    ["featured", f.featured],
  ] as const;

  return (
    <DialogContent title={dish ? f.editTitle : f.createTitle} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-6">
          <Field label={f.name} name="name" error={errors.name} className="sm:col-span-6">
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field
            label={f.description}
            name="description"
            error={errors.description}
            optional
            className="sm:col-span-6"
          >
            {(props) => <Textarea {...props} {...text("description")} rows={2} />}
          </Field>
          <Field
            label={f.category}
            name="categoryId"
            error={errors.categoryId}
            className="sm:col-span-3"
          >
            {(props) => (
              <Select {...props} {...text("categoryId")}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.price} name="price" error={errors.price} className="sm:col-span-3">
            {(props) => (
              <Input {...props} {...text("price")} inputMode="decimal" placeholder="0,00" />
            )}
          </Field>
          <fieldset className="sm:col-span-6">
            <legend className="text-[13px] font-medium text-fg">{f.allergens}</legend>
            <p className="mt-0.5 mb-3 text-[13px] text-fg-muted">{f.allergensHint}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {ALLERGENS.map((allergen) => (
                <label key={allergen} className="flex items-center gap-2 text-sm text-fg">
                  <Checkbox
                    checked={values.allergens.includes(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                  />
                  {copy.allergens[allergen]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="sm:col-span-6">
            <legend className="mb-3 text-[13px] font-medium text-fg">{f.flags}</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {flags.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-fg">
                  <Checkbox
                    checked={values[key]}
                    onChange={(event) => setValue(key, event.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{dish ? copy.common.saveChanges : f.createTitle}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
