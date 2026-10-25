"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { toISODate } from "@/lib/domain/dates";
import { discountPercent, lowestPriceBefore } from "@/lib/domain/pricing";
import { productFormSchema, variantSchema, type ProductFormValues } from "@/lib/domain/schemas";
import type { ArtKind, Product, Variant } from "@/lib/domain/types";
import { centsToInput, formatCurrency, parseEurosToCents } from "@/lib/format";
import { createId } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const f = copy.productsPanel.form;
const ART_KINDS = Object.keys(f.artKinds) as ArtKind[];

interface VariantDraft {
  id: string;
  name: string;
  color: string;
  sku: string;
  stock: string;
}

function toValues(
  product: Product | undefined,
  categoryId: string,
  sellerId: string,
): ProductFormValues {
  return {
    name: product?.name ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? categoryId,
    sellerId: product?.sellerId ?? sellerId,
    price: product ? centsToInput(product.price) : "",
    salePrice: product?.sale ? centsToInput(product.sale.price) : "",
    saleFrom: product?.sale?.from ?? "",
    saleTo: product?.sale?.to ?? "",
    featured: product?.featured ?? false,
    active: product?.active ?? true,
  };
}

const toDraft = (v: Variant): VariantDraft => ({ ...v, stock: String(v.stock) });

export function ProductFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const formId = useId();
  const now = useNow();
  const { product, categories, sellers } = useData((state) => ({
    product: id ? state.products.find((p) => p.id === id) : undefined,
    categories: state.categories,
    sellers: state.sellers,
  }));
  const createProduct = useDataStore((state) => state.createProduct);
  const updateProduct = useDataStore((state) => state.updateProduct);
  const form = useZodForm(
    productFormSchema,
    toValues(product, categories[0]?.id ?? "", sellers[0]?.id ?? ""),
  );
  const { values, errors, text, setValue } = form;
  const [art, setArt] = useState<ArtKind>(product?.art ?? "mug");
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.map(toDraft) ?? [{ id: "", name: "", color: "#c99a62", sku: "", stock: "0" }],
  );
  const [variantError, setVariantError] = useState<string | null>(null);

  // Anteprima Omnibus: prezzo più basso dei 30 giorni prima dell'inizio dell'offerta.
  const salePrice = values.salePrice ? parseEurosToCents(values.salePrice) : Number.NaN;
  const listPrice = parseEurosToCents(values.price);
  const saleStart = values.saleFrom || (now ? toISODate(now) : "");
  const reference =
    !Number.isNaN(salePrice) && !Number.isNaN(listPrice) && saleStart
      ? (lowestPriceBefore(product?.priceHistory ?? [], saleStart) ?? listPrice)
      : null;
  const percent = reference !== null ? discountPercent(reference, salePrice) : 0;

  const onSubmit = form.handleSubmit((data) => {
    const parsed = variants.map((v) => variantSchema.safeParse({ name: v.name, stock: v.stock }));
    if (variants.length === 0 || parsed.some((r) => !r.success)) {
      setVariantError(f.variantsError);
      return;
    }
    const base = data.name.slice(0, 3).toUpperCase();
    const nextVariants: Variant[] = variants.map((v, i) => ({
      id: v.id || createId("v"),
      name: v.name.trim(),
      color: v.color,
      sku: v.sku || `${base}-${String(i + 1).padStart(2, "0")}`,
      stock: Number.parseInt(v.stock, 10),
    }));
    const input = {
      name: data.name,
      shortDescription: data.shortDescription,
      description: data.description,
      categoryId: data.categoryId,
      sellerId: data.sellerId,
      art,
      price: data.price,
      sale: data.sale,
      featured: data.featured,
      active: data.active,
      variants: nextVariants,
      details: product?.details ?? [],
      weight: product?.weight ?? 500,
    };
    if (product) {
      updateProduct(product.id, input);
      toast.success(f.updated);
    } else {
      createProduct(input);
      toast.success(f.created);
    }
    onDone();
  });

  return (
    <DialogContent title={product ? f.editTitle : f.createTitle} className="sm:max-w-2xl">
      <form noValidate onSubmit={onSubmit}>
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={f.name} name="name" error={errors.name} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field
            label={f.shortDescription}
            name="shortDescription"
            error={errors.shortDescription}
            className="sm:col-span-2"
          >
            {(props) => <Input {...props} {...text("shortDescription")} />}
          </Field>
          <Field
            label={f.description}
            name="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("description")} rows={3} />}
          </Field>
          <Field label={f.category} name="categoryId" error={errors.categoryId}>
            {(props) => (
              <Select {...props} {...text("categoryId")}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.seller} name="sellerId" error={errors.sellerId}>
            {(props) => (
              <Select {...props} {...text("sellerId")}>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.art} name="art" hint={f.artHint} className="sm:col-span-2">
            {(props) => (
              <Select {...props} value={art} onChange={(e) => setArt(e.target.value as ArtKind)}>
                {ART_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {f.artKinds[kind]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.price} name="price" error={errors.price}>
            {(props) => <Input {...props} {...text("price")} inputMode="decimal" />}
          </Field>
          <Field
            label={f.salePrice}
            name="salePrice"
            error={errors.salePrice}
            hint={f.salePriceHint}
            optional
          >
            {(props) => <Input {...props} {...text("salePrice")} inputMode="decimal" />}
          </Field>
          {values.salePrice ? (
            <>
              <Field label={f.saleFrom} name="saleFrom" error={errors.saleFrom}>
                {(props) => <Input {...props} {...text("saleFrom")} type="date" />}
              </Field>
              <Field label={f.saleTo} name="saleTo" error={errors.saleTo}>
                {(props) => <Input {...props} {...text("saleTo")} type="date" />}
              </Field>
              {reference !== null ? (
                <p
                  className="rounded-lg bg-surface-2 p-3 text-[13px] text-fg sm:col-span-2"
                  aria-live="polite"
                >
                  {percent > 0
                    ? f.omnibusPreview(formatCurrency(reference), percent)
                    : f.omnibusNoDiscount(formatCurrency(reference))}
                </p>
              ) : null}
            </>
          ) : null}

          <fieldset
            className="sm:col-span-2"
            aria-describedby={variantError ? `${formId}-variants-error` : undefined}
          >
            <legend className="text-[13px] font-medium text-fg">{f.variants}</legend>
            <ul className="mt-2 space-y-2">
              {variants.map((variant, index) => (
                <li key={variant.id || `nuova-${index}`} className="flex items-end gap-2">
                  <label className="flex flex-col gap-1 text-[12px] text-fg-muted">
                    {f.variantColor}
                    <input
                      type="color"
                      value={variant.color}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((v, i) => (i === index ? { ...v, color: e.target.value } : v)),
                        )
                      }
                      className="h-10 w-12 cursor-pointer rounded-md border border-line-strong bg-surface p-1"
                    />
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-fg-muted">
                    {f.variantName}
                    <Input
                      value={variant.name}
                      onChange={(e) => {
                        setVariantError(null);
                        setVariants((prev) =>
                          prev.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)),
                        );
                      }}
                    />
                  </label>
                  <label className="flex w-24 flex-col gap-1 text-[12px] text-fg-muted">
                    {f.variantStock}
                    <Input
                      value={variant.stock}
                      inputMode="numeric"
                      onChange={(e) => {
                        setVariantError(null);
                        setVariants((prev) =>
                          prev.map((v, i) => (i === index ? { ...v, stock: e.target.value } : v)),
                        );
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={variants.length === 1}
                    aria-label={f.removeVariant(variant.name)}
                    onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2"
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  { id: "", name: "", color: "#c99a62", sku: "", stock: "0" },
                ])
              }
            >
              <Plus aria-hidden />
              {f.addVariant}
            </Button>
            {variantError ? (
              <p
                id={`${formId}-variants-error`}
                role="alert"
                className="mt-1 text-[13px] text-danger"
              >
                {variantError}
              </p>
            ) : null}
          </fieldset>

          <label className="flex items-center gap-2 text-sm text-fg">
            <Checkbox
              checked={values.active}
              onChange={(e) => setValue("active", e.target.checked)}
            />
            {f.active}
          </label>
          <label className="flex items-center gap-2 text-sm text-fg">
            <Checkbox
              checked={values.featured}
              onChange={(e) => setValue("featured", e.target.checked)}
            />
            {f.featured}
          </label>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{product ? copy.common.saveChanges : f.createTitle}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
