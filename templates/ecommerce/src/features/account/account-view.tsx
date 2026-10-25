"use client";

import { Download, LogOut, PackageOpen, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCustomer } from "@/hooks/use-customer";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { downloadFile } from "@/lib/csv";
import { itemsCount, returnEligibility } from "@/lib/domain/orders";
import { profileSchema } from "@/lib/domain/schemas";
import type { Customer, Order } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { ProductArt } from "@/components/product/product-art";
import { OrderStatusBadge, ReturnStatusBadge } from "@/components/status-badges";
import { Container } from "@/components/site/section";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Checkbox, Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { ReturnDialog } from "./return-dialog";

const t = copy.account;

export function AccountView() {
  const router = useRouter();
  const { customer, customerId, hydrated } = useCustomer();
  const ready = useDataStore((state) => state.ready);
  const signOut = useSessionStore((state) => state.signOut);

  useEffect(() => {
    if (hydrated && !customerId) router.replace(routes.login);
  }, [hydrated, customerId, router]);

  if (!hydrated || !ready || !customer) {
    return <Container className="min-h-[60vh] py-14" aria-busy="true" />;
  }

  return (
    <Container className="animate-page-in py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-medium tracking-tight text-fg">
          {t.title(customer.name.split(" ")[0] ?? customer.name)}
        </h1>
        <Button
          variant="ghost"
          onClick={() => {
            signOut();
            router.push(routes.home);
          }}
        >
          <LogOut aria-hidden />
          {t.logout}
        </Button>
      </div>

      <Tabs defaultValue="ordini" className="mt-8">
        <TabsList aria-label={copy.a11y.accountNavigation}>
          <TabsTrigger value="ordini">{t.tabs.orders}</TabsTrigger>
          <TabsTrigger value="dati">{t.tabs.profile}</TabsTrigger>
          <TabsTrigger value="privacy">{t.tabs.privacy}</TabsTrigger>
        </TabsList>
        <TabsContent value="ordini" className="mt-6">
          <OrdersTab customer={customer} />
        </TabsContent>
        <TabsContent value="dati" className="mt-6">
          <ProfileTab customer={customer} />
        </TabsContent>
        <TabsContent value="privacy" className="mt-6">
          <PrivacyTab customer={customer} />
        </TabsContent>
      </Tabs>
    </Container>
  );
}

function OrdersTab({ customer }: { customer: Customer }) {
  const now = useNow();
  const { allOrders, products, settings } = useData((state) => ({
    allOrders: state.orders,
    products: state.products,
    settings: state.settings,
  }));
  const orders = useMemo(
    () =>
      allOrders
        .filter((o) => o.customerId === customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allOrders, customer.id],
  );
  const [returning, setReturning] = useState<Order | null>(null);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title={t.noOrders}
        action={
          <Link href={routes.shop} className={buttonClasses({})}>
            {copy.site.cta}
          </Link>
        }
      />
    );
  }

  return (
    <section aria-labelledby="i-tuoi-ordini">
      <h2 id="i-tuoi-ordini" className="sr-only">
        {t.orders}
      </h2>
      <ul className="space-y-4">
        {orders.map((order) => {
          const eligibility = now ? returnEligibility(order, settings.returnDays, now) : null;
          return (
            <li key={order.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="text-[15px] font-semibold text-fg">{order.number}</h3>
                <OrderStatusBadge status={order.status} />
                {order.returnRequest ? (
                  <ReturnStatusBadge status={order.returnRequest.status} />
                ) : null}
                <p className="text-sm text-fg-muted sm:ml-auto">
                  {formatDate(order.createdAt, "short")} ·{" "}
                  {t.orderSummary(
                    copy.common.items(itemsCount(order)),
                    formatCurrency(order.total),
                  )}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                {order.lines.slice(0, 5).map((line, i) => {
                  const product = products.find((p) => p.id === line.productId);
                  const variant = product?.variants.find((v) => v.id === line.variantId);
                  return (
                    <div
                      key={`${line.variantId}-${i}`}
                      className="size-14 overflow-hidden rounded-lg bg-surface-2"
                    >
                      {product ? (
                        <ProductArt
                          kind={product.art}
                          color={variant?.color ?? "#ccc"}
                          label={`${line.name}, ${line.variantName}`}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={routes.order(order.number)}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  {order.status === "shipped" ? t.trackOrder : t.viewOrder}
                  <span className="sr-only"> {order.number}</span>
                </Link>
                {eligibility?.eligible ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setReturning(order)}>
                      <RotateCcw aria-hidden />
                      {t.returnCta}
                      <span className="sr-only"> {order.number}</span>
                    </Button>
                    <p className="text-[13px] text-fg-muted">
                      {t.returnUntil(formatDate(eligibility.until, "dayMonthLong"))}
                    </p>
                  </>
                ) : eligibility && !eligibility.eligible && eligibility.reason === "expired" ? (
                  <p className="text-[13px] text-fg-muted">{t.returnExpired}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <Dialog open={returning !== null} onOpenChange={(open) => !open && setReturning(null)}>
        {returning ? (
          <ReturnDialog key={returning.id} order={returning} onDone={() => setReturning(null)} />
        ) : null}
      </Dialog>
    </section>
  );
}

function ProfileTab({ customer }: { customer: Customer }) {
  const updateCustomer = useDataStore((state) => state.updateCustomer);
  const address = customer.address;
  const form = useZodForm(profileSchema, {
    email: customer.email,
    name: address?.name ?? customer.name,
    street: address?.street ?? "",
    postalCode: address?.postalCode ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    phone: address?.phone ?? customer.phone,
    marketing: customer.marketingConsent,
  });
  const { values, errors, text, setValue } = form;
  const f = copy.checkout;

  return (
    <form
      noValidate
      className="max-w-2xl rounded-2xl border border-line bg-surface p-6"
      onSubmit={form.handleSubmit((data) => {
        updateCustomer(customer.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          marketingConsent: data.marketing,
          address: {
            name: data.name,
            street: data.street,
            postalCode: data.postalCode,
            city: data.city,
            province: data.province,
            country: "IT",
            phone: data.phone,
          },
        });
        toast.success(t.profileSaved);
      })}
    >
      <h2 className="text-sm font-semibold text-fg">{t.tabs.profile}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-6">
        <Field label={f.name} name="name" error={errors.name} className="sm:col-span-3">
          {(props) => <Input {...props} {...text("name")} autoComplete="name" />}
        </Field>
        <Field label={f.email} name="email" error={errors.email} className="sm:col-span-3">
          {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
        </Field>
        <Field label={f.street} name="street" error={errors.street} className="sm:col-span-6">
          {(props) => <Input {...props} {...text("street")} autoComplete="street-address" />}
        </Field>
        <Field
          label={f.postalCode}
          name="postalCode"
          error={errors.postalCode}
          className="sm:col-span-2"
        >
          {(props) => (
            <Input
              {...props}
              {...text("postalCode")}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          )}
        </Field>
        <Field label={f.city} name="city" error={errors.city} className="sm:col-span-3">
          {(props) => <Input {...props} {...text("city")} autoComplete="address-level2" />}
        </Field>
        <Field label={f.province} name="province" error={errors.province} className="sm:col-span-1">
          {(props) => (
            <Input {...props} {...text("province")} maxLength={2} className="uppercase" />
          )}
        </Field>
        <Field label={f.phone} name="phone" error={errors.phone} className="sm:col-span-6">
          {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
        </Field>
      </div>
      <label className="mt-5 flex items-start gap-2.5 text-sm text-fg">
        <Checkbox
          checked={values.marketing}
          onChange={(e) => setValue("marketing", e.target.checked)}
          className="mt-0.5"
        />
        <span>{f.marketing}</span>
      </label>
      <div className="mt-6 flex justify-end">
        <Button type="submit">{copy.common.saveChanges}</Button>
      </div>
    </form>
  );
}

function PrivacyTab({ customer }: { customer: Customer }) {
  const router = useRouter();
  const orders = useData((state) => state.orders);
  const signOut = useSessionStore((state) => state.signOut);
  const [confirm, setConfirm] = useState(false);
  return (
    <section
      aria-labelledby="privacy-titolo"
      className="max-w-2xl rounded-2xl border border-line bg-surface p-6"
    >
      <h2 id="privacy-titolo" className="text-sm font-semibold text-fg">
        {t.privacyTitle}
      </h2>
      <p className="mt-2 text-sm text-fg-muted">{t.privacyText}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            const data = {
              cliente: customer,
              ordini: orders.filter((o) => o.customerId === customer.id),
              esportatoIl: new Date().toISOString(),
            };
            downloadFile(
              `dati-${customer.id}.json`,
              JSON.stringify(data, null, 2),
              "application/json;charset=utf-8",
            );
            toast.success(t.exported);
          }}
        >
          <Download aria-hidden />
          {t.export}
        </Button>
        <Button variant="danger-ghost" onClick={() => setConfirm(true)}>
          <Trash2 aria-hidden />
          {t.deleteRequest}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t.deleteTitle}
        description={t.deleteText}
        confirmLabel={t.deleteRequest}
        onConfirm={() => {
          toast.success(t.deleteDone);
          signOut();
          router.push(routes.home);
        }}
      />
    </section>
  );
}
