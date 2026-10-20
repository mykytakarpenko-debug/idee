"use client";

import { Download, FileCheck } from "lucide-react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useCurrentMember } from "@/hooks/use-member";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { parseISODate } from "@/lib/domain/dates";
import { certificateStatus } from "@/lib/domain/membership";
import { profileSchema } from "@/lib/domain/schemas";
import type { Member } from "@/lib/domain/types";
import { downloadFile } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { CertificateBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.member.profile;

export function ProfileView() {
  const member = useCurrentMember();
  const now = useNow();
  const settings = useData((state) => state.settings);
  const updateMember = useDataStore((state) => state.updateMember);

  if (!member || !now) return null;
  const cert = certificateStatus(member.medicalCertExpiry, now, settings.requireMedicalCert);

  const exportData = () => {
    const state = useDataStore.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      member,
      plan: state.plans.find((p) => p.id === member.planId),
      bookings: state.bookings.filter((b) => b.memberId === member.id),
      checkIns: state.checkIns.filter((c) => c.memberId === member.id),
      payments: state.payments.filter((p) => p.memberId === member.id),
    };
    downloadFile(`dati-${member.code}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  return (
    <div className="mx-auto flex max-w-3xl animate-page-in flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader title={t.title} />
      <PersonalForm key={`${member.email}|${member.phone}`} member={member} />

      <Card>
        <CardHeader title={t.consents} />
        <CardContent className="flex flex-col gap-5">
          <ToggleRow
            label={t.marketing}
            description={t.marketingHint}
            control={({ labelId, descriptionId }) => (
              <Switch
                checked={member.marketingConsent}
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                onCheckedChange={(value) => {
                  updateMember(member.id, { marketingConsent: value });
                  toast.success(t.consentSaved);
                }}
              />
            )}
          />
          <ToggleRow
            label={t.images}
            description={t.imagesHint}
            control={({ labelId, descriptionId }) => (
              <Switch
                checked={member.imageConsent}
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                onCheckedChange={(value) => {
                  updateMember(member.id, { imageConsent: value });
                  toast.success(t.consentSaved);
                }}
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t.certificate} action={<CertificateBadge status={cert} />} />
        <CardContent>
          <p className="flex items-center gap-2 text-sm font-medium text-fg">
            <FileCheck aria-hidden className="size-4 text-fg-muted" />
            {member.medicalCertExpiry
              ? t.certificateExpiry(formatDate(parseISODate(member.medicalCertExpiry), "long"))
              : t.certificateMissing}
          </p>
          <p className="mt-2 text-[13px] text-fg-muted">{t.certificateHint}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t.data} />
        <CardContent>
          <p className="text-sm text-fg-muted">{t.exportHint}</p>
          <Button variant="secondary" className="mt-4" onClick={exportData}>
            <Download aria-hidden />
            {t.export}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PersonalForm({ member }: { member: Member }) {
  const updateMember = useDataStore((state) => state.updateMember);
  const form = useZodForm(profileSchema, { email: member.email, phone: member.phone });
  const { errors, text } = form;
  const onSubmit = form.handleSubmit((data) => {
    updateMember(member.id, data);
    toast.success(t.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader title={t.personal} />
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-[13px] font-medium text-fg">{t.name}</p>
            <p className="mt-1 text-sm text-fg">
              {member.firstName} {member.lastName}
            </p>
          </div>
          <Field label={t.email} name="email" error={errors.email}>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
          </Field>
          <Field label={t.phone} name="phone" error={errors.phone}>
            {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
          </Field>
        </CardContent>
        <div className="flex justify-end border-t border-line px-5 py-4 sm:px-6">
          <Button type="submit">{copy.common.saveChanges}</Button>
        </div>
      </Card>
    </form>
  );
}
