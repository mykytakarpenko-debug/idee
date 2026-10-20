"use client";

import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { combineDateAndTime } from "@/lib/domain/hours";
import { cartTotals, fulfilmentSlots, isDeliverable } from "@/lib/domain/orders";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/domain/schemas";
import type { OrderType, PaymentMethod } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useDataStore } from "@/store/data-store";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Container, SectionHeading } from "@/components/site/section";

const c = copy.checkout;
const PAYMENTS: PaymentMethod[] = ["card_on_delivery", "cash", "online"];

export function CheckoutView() {
  const hydrated = useCartStore((state) => state.hydrated);
  const lines = useCartStore((state) => state.lines);
  const now = useNow();

  if (!hydrated || !now) return <Container className="min-h-[60vh] py-16" aria-busy="true" />;
  if (lines.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={ShoppingBag}
          title={copy.order.emptyCart}
          description={c.emptyRedirect}
          action={
            <Link href={routes.order} className={buttonClasses({})}>
              {c.back}
            </Link>
          }
        />
      </Container>
    );
  }
  return <Checkout now={now} />;
}

function Checkout({ now }: { now: Date }) {
  const router = useRouter();
  const { dishes, settings } = useSiteData();
  const lines = useCartStore((state) => state.lines);
  const cartType = useCartStore((state) => state.type);
  const setCartType = useCartStore((state) => state.setType);
  const clearCart = useCartStore((state) => state.clear);
  const placeOrder = useDataStore((state) => state.placeOrder);

  const form = useZodForm(checkoutFormSchema, {
    type: cartType,
    when: "asap",
    scheduledTime: "",
    street: "",
    postalCode: "",
    city: settings.city,
    addressNotes: "",
    name: "",
    phone: "",
    email: "",
    payment: "card_on_delivery",
    notes: "",
    privacy: false,
  } satisfies CheckoutFormValues);
  const { values, errors, text, setValue } = form;
  const type = values.type as OrderType;
  const totals = cartTotals(lines, dishes, type, settings);
  // Avviso immediato appena il CAP è completo, senza attendere l'invio.
  const postalCode = values.postalCode.trim();
  const outOfZone =
    type === "delivery" && /^\d{5}$/.test(postalCode) && !isDeliverable(postalCode, settings);
  const slots = fulfilmentSlots(type, settings, now);
  const firstSlot = slots[0];

  const setType = (next: OrderType) => {
    setValue("type", next);
    setCartType(next);
  };

  const onSubmit = form.handleSubmit((data) => {
    if (!firstSlot) {
      toast.error(copy.order.closed);
      return;
    }
    if (data.type === "delivery" && !isDeliverable(data.postalCode, settings)) {
      form.setErrors({ postalCode: c.outOfZone });
      return;
    }
    if (totals.missingForMinimum > 0) {
      toast.error(copy.order.minimum(formatCurrency(totals.missingForMinimum)));
      return;
    }
    const scheduledFor =
      data.when === "asap"
        ? firstSlot
        : combineDateAndTime(formatDate(now, "inputDate"), data.scheduledTime);
    const byId = new Map(dishes.map((d) => [d.id, d]));
    const order = placeOrder({
      type: data.type,
      items: lines.flatMap((line) => {
        const dish = byId.get(line.dishId);
        return dish
          ? [{ dishId: dish.id, name: dish.name, price: dish.price, quantity: line.quantity }]
          : [];
      }),
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      customer: { name: data.name, phone: data.phone, email: data.email },
      address:
        data.type === "delivery"
          ? {
              street: data.street,
              postalCode: data.postalCode,
              city: data.city,
              notes: data.addressNotes || undefined,
            }
          : null,
      scheduledFor: scheduledFor.toISOString(),
      payment: data.payment,
      notes: data.notes || undefined,
    });
    clearCart();
    router.push(routes.tracking(order.number));
  });

  const typeOptions: OrderType[] = [];
  if (settings.delivery.enabled) typeOptions.push("delivery");
  if (settings.delivery.takeawayEnabled) typeOptions.push("takeaway");

  return (
    <Container className="animate-page-in py-12 sm:py-16">
      <Link
        href={routes.order}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {c.back}
      </Link>
      <SectionHeading as="h1" title={c.title} className="mt-4" />

      <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          <fieldset>
            <legend className="text-sm font-semibold text-fg">{copy.order.mode}</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {typeOptions.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                    type === option
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-surface hover:bg-surface-2",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option}
                    checked={type === option}
                    onChange={() => setType(option)}
                    className="size-4 accent-accent"
                  />
                  <span className="text-sm font-medium text-fg">{copy.orderType[option]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-fg">{c.when}</legend>
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex items-center gap-3 text-sm text-fg">
                <input
                  type="radio"
                  name="when"
                  value="asap"
                  checked={values.when === "asap"}
                  onChange={() => setValue("when", "asap")}
                  className="size-4 accent-accent"
                  disabled={!firstSlot}
                />
                {firstSlot ? c.asap(formatDate(firstSlot, "time")) : copy.order.closed}
              </label>
              <label className="flex items-center gap-3 text-sm text-fg">
                <input
                  type="radio"
                  name="when"
                  value="scheduled"
                  checked={values.when === "scheduled"}
                  onChange={() => setValue("when", "scheduled")}
                  className="size-4 accent-accent"
                  disabled={slots.length === 0}
                />
                {c.scheduled}
              </label>
              {values.when === "scheduled" ? (
                <Field
                  label={c.scheduled}
                  name="scheduledTime"
                  error={errors.scheduledTime}
                  className="max-w-xs"
                >
                  {(props) => (
                    <Select {...props} {...text("scheduledTime")}>
                      <option value="">—</option>
                      {slots.map((slot) => (
                        <option key={slot.toISOString()} value={formatDate(slot, "time")}>
                          {formatDate(slot, "time")}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              ) : null}
            </div>
          </fieldset>

          {type === "delivery" ? (
            <fieldset className="grid gap-4 sm:grid-cols-6">
              <legend className="mb-1 text-sm font-semibold text-fg">{c.address}</legend>
              <Field label={c.street} name="street" error={errors.street} className="sm:col-span-6">
                {(props) => <Input {...props} {...text("street")} autoComplete="street-address" />}
              </Field>
              <Field
                label={c.postalCode}
                name="postalCode"
                error={errors.postalCode ?? (outOfZone ? c.outOfZone : undefined)}
                hint={c.postalCodeHint(settings.delivery.postalCodes.join(", "))}
                className="sm:col-span-3"
              >
                {(props) => (
                  <Input
                    {...props}
                    {...text("postalCode")}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                  />
                )}
              </Field>
              <Field label={c.city} name="city" error={errors.city} className="sm:col-span-3">
                {(props) => <Input {...props} {...text("city")} autoComplete="address-level2" />}
              </Field>
              <Field
                label={c.addressNotes}
                name="addressNotes"
                error={errors.addressNotes}
                optional
                className="sm:col-span-6"
              >
                {(props) => <Input {...props} {...text("addressNotes")} />}
              </Field>
            </fieldset>
          ) : null}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold text-fg">{c.contact}</legend>
            <Field label={c.name} name="name" error={errors.name} className="sm:col-span-2">
              {(props) => <Input {...props} {...text("name")} autoComplete="name" />}
            </Field>
            <Field label={c.phone} name="phone" error={errors.phone}>
              {(props) => (
                <Input
                  {...props}
                  {...text("phone")}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                />
              )}
            </Field>
            <Field label={c.email} name="email" error={errors.email}>
              {(props) => (
                <Input
                  {...props}
                  {...text("email")}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                />
              )}
            </Field>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-fg">{c.payment}</legend>
            <div className="mt-3 flex flex-col gap-3">
              {PAYMENTS.map((method) => (
                <label key={method} className="flex items-center gap-3 text-sm text-fg">
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={values.payment === method}
                    onChange={() => setValue("payment", method)}
                    className="size-4 accent-accent"
                  />
                  {copy.payment[method]}
                </label>
              ))}
              {values.payment === "online" ? (
                <p className="text-[13px] text-fg-muted">{c.onlineDemo}</p>
              ) : null}
            </div>
          </fieldset>

          <Field label={c.notes} name="notes" error={errors.notes} optional>
            {(props) => <Textarea {...props} {...text("notes")} rows={2} />}
          </Field>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-base font-semibold text-fg">{copy.order.cart}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {lines.map((line) => {
                const dish = dishes.find((d) => d.id === line.dishId);
                if (!dish) return null;
                return (
                  <li key={line.dishId} className="flex justify-between gap-3">
                    <span className="text-fg">
                      <span className="text-fg-muted tabular-nums">{line.quantity}×</span>{" "}
                      {dish.name}
                    </span>
                    <span className="text-fg tabular-nums">
                      {formatCurrency(dish.price * line.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">{copy.order.subtotal}</dt>
                <dd className="text-fg tabular-nums">{formatCurrency(totals.subtotal)}</dd>
              </div>
              {type === "delivery" ? (
                <div className="flex justify-between">
                  <dt className="text-fg-muted">{copy.order.deliveryFee}</dt>
                  <dd className="text-fg tabular-nums">
                    {totals.deliveryFee ? formatCurrency(totals.deliveryFee) : copy.order.free}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold">
                <dt className="text-fg">{copy.order.total}</dt>
                <dd className="text-fg tabular-nums">{formatCurrency(totals.total)}</dd>
              </div>
            </dl>
            {totals.missingForMinimum > 0 ? (
              <p className="mt-3 text-[13px] text-warning">
                {copy.order.minimum(formatCurrency(totals.missingForMinimum))}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <label className="flex items-start gap-3 text-[13px] text-fg">
                <Checkbox
                  name="privacy"
                  checked={values.privacy}
                  onChange={(event) => setValue("privacy", event.target.checked)}
                  aria-invalid={errors.privacy ? true : undefined}
                  aria-describedby={errors.privacy ? "checkout-privacy-error" : undefined}
                  className="mt-0.5"
                />
                <span>
                  {c.privacy}{" "}
                  <a href={routes.privacy} target="_blank" className="text-accent-text underline">
                    {copy.site.footer.privacy}
                  </a>
                </span>
              </label>
              {errors.privacy ? (
                <p id="checkout-privacy-error" className="text-[13px] text-danger">
                  {errors.privacy}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={!firstSlot}>
              {c.submit(formatCurrency(totals.total))}
            </Button>
            <p className="mt-3 text-xs text-fg-muted">{c.precontract}</p>
          </div>
        </aside>
      </form>
    </Container>
  );
}
