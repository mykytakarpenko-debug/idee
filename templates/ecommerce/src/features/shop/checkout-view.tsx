"use client";

import { CreditCard, Landmark, Lock, ShoppingBag, Store, Truck, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCart } from "@/hooks/use-cart";
import { useCustomer } from "@/hooks/use-customer";
import { useZodForm } from "@/hooks/use-zod-form";
import { shippingCost } from "@/lib/domain/cart";
import { checkoutSchema, type CheckoutValues } from "@/lib/domain/schemas";
import type { Customer, PaymentMethod, ShippingMethod } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useDataStore } from "@/store/data-store";
import { ProductArt } from "@/components/product/product-art";
import { CartTotalsList, CouponForm } from "@/components/shop/cart-parts";
import { Container, SectionHeading } from "@/components/site/section";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.checkout;
const METHOD_ICONS: Record<ShippingMethod, typeof Truck> = {
  standard: Truck,
  express: Zap,
  pickup: Store,
};
const PAYMENT_ICONS: Record<PaymentMethod, typeof Truck> = {
  card: CreditCard,
  paypal: Wallet,
  bank_transfer: Landmark,
};

function initialValues(customer: Customer | null): CheckoutValues {
  const address = customer?.address;
  return {
    email: customer?.email ?? "",
    name: address?.name ?? customer?.name ?? "",
    street: address?.street ?? "",
    postalCode: address?.postalCode ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    phone: address?.phone ?? customer?.phone ?? "",
    notes: "",
    shippingMethod: "standard",
    payment: "card",
    terms: false,
    marketing: false,
  };
}

export function CheckoutView() {
  const cartHydrated = useCartStore((state) => state.hydrated);
  const { customer, hydrated } = useCustomer();
  const ready = useDataStore((state) => state.ready);
  if (!cartHydrated || !hydrated || !ready) {
    return <Container className="min-h-[70vh] py-14" aria-busy="true" />;
  }
  return <CheckoutForm key={customer?.id ?? "ospite"} customer={customer} />;
}

function CheckoutForm({ customer }: { customer: Customer | null }) {
  const router = useRouter();
  const form = useZodForm(checkoutSchema, initialValues(customer));
  const { values, errors, text, setValue } = form;
  const method = values.shippingMethod as ShippingMethod;
  const cart = useCart(method);
  const placeOrder = useDataStore((state) => state.placeOrder);
  const clearCart = useCartStore((state) => state.clear);
  const merchandise = cart.totals.subtotal - cart.totals.discount;
  const methods: ShippingMethod[] = cart.settings.shipping.pickupEnabled
    ? ["standard", "express", "pickup"]
    : ["standard", "express"];

  if (cart.lines.length === 0) {
    return (
      <Container className="py-16">
        <h1 className="sr-only">{t.title}</h1>
        <EmptyState
          icon={ShoppingBag}
          title={copy.cart.empty}
          description={t.empty}
          action={
            <Link href={routes.shop} className={buttonClasses({})}>
              {copy.site.cta}
            </Link>
          }
        />
      </Container>
    );
  }

  const onSubmit = form.handleSubmit((data) => {
    const result = placeOrder({
      lines: cart.lines.map(({ productId, variantId, quantity }) => ({
        productId,
        variantId,
        quantity,
      })),
      couponCode: cart.coupon?.code ?? null,
      customerId: customer?.id ?? null,
      email: data.email,
      address: {
        name: data.name,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        country: "IT",
        phone: data.phone,
      },
      notes: data.notes,
      shippingMethod: data.shippingMethod,
      payment: data.payment,
      marketingConsent: data.marketing,
    });
    if (!result.ok) {
      toast.error(result.reason === "stock" ? t.stockChanged : t.empty);
      return;
    }
    clearCart();
    router.push(`${routes.order(result.order.number)}?conferma=1`);
  });

  return (
    <Container className="animate-page-in py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading as="h1" title={t.title} />
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <Lock aria-hidden className="size-4" />
          {t.secure}
        </p>
      </div>
      {customer ? (
        <p className="mt-3 text-sm text-fg-muted">{t.signedInAs(customer.email)}</p>
      ) : (
        <Link href={routes.login} className="mt-3 inline-block text-sm text-accent-text hover:underline">
          {t.signIn}
        </Link>
      )}

      <form noValidate onSubmit={onSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <FormSection title={t.contact}>
            <Field label={t.email} name="email" error={errors.email} hint={t.contactHint}>
              {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
            </Field>
          </FormSection>

          <FormSection title={t.address}>
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label={t.name} name="name" error={errors.name} className="sm:col-span-6">
                {(props) => <Input {...props} {...text("name")} autoComplete="shipping name" />}
              </Field>
              <Field label={t.street} name="street" error={errors.street} className="sm:col-span-6">
                {(props) => (
                  <Input {...props} {...text("street")} autoComplete="shipping street-address" />
                )}
              </Field>
              <Field
                label={t.postalCode}
                name="postalCode"
                error={errors.postalCode}
                className="sm:col-span-2"
              >
                {(props) => (
                  <Input
                    {...props}
                    {...text("postalCode")}
                    inputMode="numeric"
                    autoComplete="shipping postal-code"
                  />
                )}
              </Field>
              <Field label={t.city} name="city" error={errors.city} className="sm:col-span-3">
                {(props) => (
                  <Input {...props} {...text("city")} autoComplete="shipping address-level2" />
                )}
              </Field>
              <Field
                label={t.province}
                name="province"
                error={errors.province}
                className="sm:col-span-1"
              >
                {(props) => (
                  <Input
                    {...props}
                    {...text("province")}
                    maxLength={2}
                    autoComplete="shipping address-level1"
                    className="uppercase"
                  />
                )}
              </Field>
              <Field
                label={t.phone}
                name="phone"
                error={errors.phone}
                hint={t.phoneHint}
                className="sm:col-span-6"
              >
                {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
              </Field>
            </div>
            <p className="mt-3 text-[13px] text-fg-muted">{t.country}</p>
          </FormSection>

          <FormSection title={t.shippingMethod} asFieldset>
            <div className="grid gap-3">
              {methods.map((m) => {
                const cost = shippingCost(m, merchandise, cart.settings.shipping, cart.coupon);
                return (
                  <RadioCard
                    key={m}
                    name="shippingMethod"
                    checked={values.shippingMethod === m}
                    onChange={() => setValue("shippingMethod", m)}
                    icon={METHOD_ICONS[m]}
                    title={t.methods[m].label}
                    text={m === "pickup" ? cart.settings.shipping.pickupAddress : t.methods[m].text}
                    aside={cost === 0 ? copy.common.free : formatCurrency(cost)}
                  />
                );
              })}
            </div>
          </FormSection>

          <FormSection title={t.payment} asFieldset>
            <div className="grid gap-3">
              {(Object.keys(t.payments) as PaymentMethod[]).map((m) => (
                <RadioCard
                  key={m}
                  name="payment"
                  checked={values.payment === m}
                  onChange={() => setValue("payment", m)}
                  icon={PAYMENT_ICONS[m]}
                  title={t.payments[m].label}
                  text={t.payments[m].text}
                />
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-fg">{t.demoPayment}</p>
          </FormSection>

          <Field label={t.notes} name="notes" error={errors.notes} optional>
            {(props) => <Textarea {...props} {...text("notes")} rows={2} />}
          </Field>
        </div>

        <aside aria-label={t.summary} className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-xl font-medium text-fg">{t.summary}</h2>
            <ul className="space-y-3">
              {cart.lines.map((line) => (
                <li key={`${line.productId}-${line.variantId}`} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <ProductArt kind={line.product.art} color={line.variant.color} />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-fg">{line.product.name}</p>
                    <p className="text-[13px] text-fg-muted">
                      {line.variant.name} · {copy.common.quantity} {line.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-fg tabular-nums">{formatCurrency(line.total)}</p>
                </li>
              ))}
            </ul>
            <CouponForm
              subtotal={cart.totals.subtotal}
              coupons={cart.settings.coupons}
              today={cart.today}
              applied={cart.coupon}
            />
            <CartTotalsList totals={cart.totals} coupon={cart.coupon} />

            <div className="space-y-3 border-t border-line pt-5">
              <div>
                <label className="flex items-start gap-2.5 text-sm text-fg">
                  <Checkbox
                    checked={values.terms}
                    onChange={(e) => setValue("terms", e.target.checked)}
                    aria-invalid={errors.terms ? true : undefined}
                    aria-describedby={errors.terms ? "terms-error" : "terms-links"}
                    className="mt-0.5"
                  />
                  <span>{t.terms}</span>
                </label>
                <p id="terms-links" className="mt-1 ml-7 text-[13px]">
                  <Link href={routes.conditions} target="_blank" className="text-accent-text underline underline-offset-2">
                    {t.conditionsLink}
                    <span className="sr-only"> {copy.a11y.newTab}</span>
                  </Link>
                  {" · "}
                  <Link href={routes.withdrawal} target="_blank" className="text-accent-text underline underline-offset-2">
                    {t.withdrawalLink}
                    <span className="sr-only"> {copy.a11y.newTab}</span>
                  </Link>
                </p>
                {errors.terms ? (
                  <p id="terms-error" className="mt-1 ml-7 text-[13px] text-danger">
                    {errors.terms}
                  </p>
                ) : null}
              </div>
              <label className="flex items-start gap-2.5 text-sm text-fg">
                <Checkbox
                  checked={values.marketing}
                  onChange={(e) => setValue("marketing", e.target.checked)}
                  className="mt-0.5"
                />
                <span>{t.marketing}</span>
              </label>
              <p className="text-xs text-fg-muted">
                {t.privacyNote}{" "}
                <Link href={routes.privacy} className="text-accent-text underline underline-offset-2">
                  {copy.site.footer.privacy}
                </Link>
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full">
              {t.submit}
            </Button>
            <p className="text-xs text-fg-muted">{t.precontract(cart.settings.returnDays)}</p>
          </div>
        </aside>
      </form>
    </Container>
  );
}

function FormSection({
  title,
  asFieldset = false,
  children,
}: {
  title: string;
  asFieldset?: boolean;
  children: ReactNode;
}) {
  if (asFieldset) {
    return (
      <fieldset>
        <legend className="mb-4 font-display text-xl font-medium text-fg">{title}</legend>
        {children}
      </fieldset>
    );
  }
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-medium text-fg">{title}</h2>
      {children}
    </section>
  );
}

function RadioCard({
  name,
  checked,
  onChange,
  icon: Icon,
  title,
  text,
  aside,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  icon: typeof Truck;
  title: string;
  text: string;
  aside?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
        checked ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong/60",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
      />
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-muted" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{title}</span>
        <span className="block text-[13px] text-fg-muted">{text}</span>
      </span>
      {aside ? <span className="text-sm font-medium text-fg tabular-nums">{aside}</span> : null}
    </label>
  );
}
