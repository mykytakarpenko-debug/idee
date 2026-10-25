"use client";

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { toISODate } from "@/lib/domain/dates";
import {
  couponFormSchema,
  shippingSchema,
  shopInfoSchema,
  type CouponFormValues,
} from "@/lib/domain/schemas";
import type { Coupon, ShopSettings } from "@/lib/domain/types";
import { centsToInput, formatCurrency, formatDate } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { useDataStore } from "@/store/data-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.settings;

export function SettingsView() {
  const ready = useDataReady();
  const settings = useData((state) => state.settings);
  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      {!ready ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="grid gap-6">
          <InfoSection settings={settings} />
          <ShippingSection settings={settings} />
          <CouponsSection coupons={settings.coupons} />
          <DataSection />
        </div>
      )}
    </Page>
  );
}

function Section({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>{children}</CardContent>
      {footer ? (
        <div className="flex justify-end border-t border-line px-5 py-4 sm:px-6">{footer}</div>
      ) : null}
    </Card>
  );
}

function InfoSection({ settings }: { settings: ShopSettings }) {
  const update = useDataStore((state) => state.updateSettings);
  const form = useZodForm(shopInfoSchema, {
    name: settings.name,
    tagline: settings.tagline,
    company: settings.legal.company,
    vatNumber: settings.legal.vatNumber,
    rea: settings.legal.rea,
    address: settings.legal.address,
    email: settings.legal.email,
    pec: settings.legal.pec,
    phone: settings.legal.phone,
  });
  const { errors, text } = form;
  const i = t.info;
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => {
        update({
          name: data.name,
          tagline: data.tagline,
          legal: {
            company: data.company,
            vatNumber: data.vatNumber,
            rea: data.rea,
            address: data.address,
            email: data.email,
            pec: data.pec,
            phone: data.phone,
          },
        });
        toast.success(i.saved);
      })}
    >
      <Section
        title={t.sections.info}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={i.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field label={i.tagline} name="tagline" error={errors.tagline}>
            {(props) => <Input {...props} {...text("tagline")} />}
          </Field>
          <Field label={i.company} name="company" error={errors.company}>
            {(props) => <Input {...props} {...text("company")} />}
          </Field>
          <Field label={i.vatNumber} name="vatNumber" error={errors.vatNumber}>
            {(props) => <Input {...props} {...text("vatNumber")} className="uppercase" />}
          </Field>
          <Field label={i.rea} name="rea" error={errors.rea}>
            {(props) => <Input {...props} {...text("rea")} />}
          </Field>
          <Field label={i.address} name="address" error={errors.address}>
            {(props) => <Input {...props} {...text("address")} />}
          </Field>
          <Field label={i.email} name="email" error={errors.email}>
            {(props) => <Input {...props} {...text("email")} type="email" />}
          </Field>
          <Field label={i.pec} name="pec" error={errors.pec}>
            {(props) => <Input {...props} {...text("pec")} type="email" />}
          </Field>
          <Field label={i.phone} name="phone" error={errors.phone}>
            {(props) => <Input {...props} {...text("phone")} type="tel" />}
          </Field>
        </div>
      </Section>
    </form>
  );
}

function ShippingSection({ settings }: { settings: ShopSettings }) {
  const update = useDataStore((state) => state.updateSettings);
  const form = useZodForm(shippingSchema, {
    standard: centsToInput(settings.shipping.standard),
    express: centsToInput(settings.shipping.express),
    freeThreshold: centsToInput(settings.shipping.freeThreshold),
    pickupEnabled: settings.shipping.pickupEnabled,
    pickupAddress: settings.shipping.pickupAddress,
    returnDays: String(settings.returnDays),
  });
  const { values, errors, text, setValue } = form;
  const s = t.shipping;
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => {
        update({
          returnDays: data.returnDays,
          shipping: {
            standard: data.standard,
            express: data.express,
            freeThreshold: data.freeThreshold,
            pickupEnabled: data.pickupEnabled,
            pickupAddress: data.pickupAddress,
          },
        });
        toast.success(s.saved);
      })}
    >
      <Section
        title={t.sections.shipping}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={s.standard} name="standard" error={errors.standard}>
            {(props) => <Input {...props} {...text("standard")} inputMode="decimal" />}
          </Field>
          <Field label={s.express} name="express" error={errors.express}>
            {(props) => <Input {...props} {...text("express")} inputMode="decimal" />}
          </Field>
          <Field label={s.freeThreshold} name="freeThreshold" error={errors.freeThreshold}>
            {(props) => <Input {...props} {...text("freeThreshold")} inputMode="decimal" />}
          </Field>
          <Field
            label={s.returnDays}
            name="returnDays"
            error={errors.returnDays}
            hint={s.returnDaysHint}
          >
            {(props) => <Input {...props} {...text("returnDays")} inputMode="numeric" />}
          </Field>
          <Field
            label={s.pickupAddress}
            name="pickupAddress"
            error={errors.pickupAddress}
            className="sm:col-span-2"
          >
            {(props) => <Input {...props} {...text("pickupAddress")} />}
          </Field>
        </div>
        <ToggleRow
          className="mt-5"
          label={s.pickupEnabled}
          control={({ labelId }) => (
            <Switch
              checked={values.pickupEnabled}
              onCheckedChange={(checked) => setValue("pickupEnabled", checked)}
              aria-labelledby={labelId}
            />
          )}
        />
      </Section>
    </form>
  );
}

const emptyCoupon: CouponFormValues = {
  code: "",
  type: "percent",
  value: "",
  minSubtotal: "0",
  expiresAt: "",
};

function describe(coupon: Coupon): string {
  const d = t.coupons.describe;
  const value =
    coupon.type === "percent"
      ? d.percent(coupon.value)
      : coupon.type === "fixed"
        ? d.fixed(formatCurrency(coupon.value))
        : d.free_shipping();
  return coupon.minSubtotal > 0
    ? `${value} · ${t.coupons.minLabel(formatCurrency(coupon.minSubtotal, { round: true }))}`
    : value;
}

function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  const now = useNow();
  const today = now ? toISODate(now) : null;
  const addCoupon = useDataStore((state) => state.addCoupon);
  const toggleCoupon = useDataStore((state) => state.toggleCoupon);
  const [formKey, setFormKey] = useState(0);
  const c = t.coupons;
  return (
    <Section title={t.sections.coupons} description={c.intro}>
      <ul className="divide-y divide-line">
        {coupons.map((coupon) => {
          const expired = today !== null && coupon.expiresAt !== null && coupon.expiresAt < today;
          return (
            <li key={coupon.code} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold text-fg">{coupon.code}</p>
                <p className="text-[13px] text-fg-muted">
                  {describe(coupon)} ·{" "}
                  {coupon.expiresAt
                    ? formatDate(new Date(`${coupon.expiresAt}T12:00:00`), "short")
                    : c.noExpiry}
                </p>
              </div>
              {expired ? <Badge tone="neutral">{c.expired}</Badge> : null}
              <Switch
                checked={coupon.active}
                onCheckedChange={(checked) => toggleCoupon(coupon.code, checked)}
                aria-label={c.active(coupon.code)}
              />
            </li>
          );
        })}
      </ul>
      <CouponForm
        key={formKey}
        onCreate={(coupon) => {
          if (!addCoupon(coupon)) return false;
          toast.success(c.added, { description: coupon.code });
          setFormKey((k) => k + 1);
          return true;
        }}
      />
    </Section>
  );
}

function CouponForm({ onCreate }: { onCreate: (coupon: Coupon) => boolean }) {
  const form = useZodForm(couponFormSchema, emptyCoupon);
  const { values, errors, text, setErrors } = form;
  const c = t.coupons;
  return (
    <form
      noValidate
      className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-6"
      onSubmit={form.handleSubmit((coupon) => {
        if (!onCreate(coupon)) setErrors({ code: c.duplicate });
      })}
    >
      <Field label={c.code} name="code" error={errors.code} className="sm:col-span-2">
        {(props) => <Input {...props} {...text("code")} className="font-mono uppercase" />}
      </Field>
      <Field label={c.type} name="type" className="sm:col-span-2">
        {(props) => (
          <Select {...props} {...text("type")}>
            {(Object.keys(c.types) as Coupon["type"][]).map((type) => (
              <option key={type} value={type}>
                {c.types[type]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {values.type !== "free_shipping" ? (
        <Field
          label={c.value}
          name="value"
          error={errors.value}
          hint={c.valueHint}
          className="sm:col-span-2"
        >
          {(props) => <Input {...props} {...text("value")} inputMode="decimal" />}
        </Field>
      ) : null}
      <Field
        label={c.minSubtotal}
        name="minSubtotal"
        error={errors.minSubtotal}
        className="sm:col-span-2"
      >
        {(props) => <Input {...props} {...text("minSubtotal")} inputMode="decimal" />}
      </Field>
      <Field
        label={c.expiresAt}
        name="expiresAt"
        error={errors.expiresAt}
        optional
        className="sm:col-span-2"
      >
        {(props) => <Input {...props} {...text("expiresAt")} type="date" />}
      </Field>
      <div className="flex items-end sm:col-span-2">
        <Button type="submit" variant="secondary">
          {c.add}
        </Button>
      </div>
    </form>
  );
}

function DataSection() {
  const resetDemo = useDataStore((state) => state.resetDemo);
  const clearCart = useCartStore((state) => state.clear);
  const [open, setOpen] = useState(false);
  const d = t.data;
  return (
    <Section title={t.sections.data} description={d.intro}>
      <ToggleRow
        label={d.reset}
        description={d.resetHint}
        control={() => (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <RotateCcw aria-hidden />
            {d.reset}
          </Button>
        )}
      />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={d.resetTitle}
        description={d.resetText}
        confirmLabel={d.reset}
        onConfirm={() => {
          resetDemo();
          clearCart();
          toast.success(copy.demo.resetDone);
        }}
      />
    </Section>
  );
}
