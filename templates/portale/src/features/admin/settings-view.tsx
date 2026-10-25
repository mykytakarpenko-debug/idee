"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { settingsSchema } from "@/lib/domain/schemas";
import type { PortalSettings, TicketPriority } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const s = copy.settings;
const PRIORITIES: TicketPriority[] = ["urgent", "high", "normal", "low"];

function initialValues(settings: PortalSettings) {
  return {
    providerName: settings.providerName,
    supportEmail: settings.supportEmail,
    urgent: String(settings.slaHours.urgent),
    high: String(settings.slaHours.high),
    normal: String(settings.slaHours.normal),
    low: String(settings.slaHours.low),
    sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes),
    auditRetentionDays: String(settings.auditRetentionDays),
    mfaRequired: settings.mfaRequired,
  };
}

export function SettingsView() {
  const router = useRouter();
  const { user } = useAuth();
  const settings = useData((state) => state.settings);
  const updateSettings = useDataStore((state) => state.updateSettings);
  const resetDemo = useDataStore((state) => state.resetDemo);
  const signOut = useSessionStore((state) => state.signOut);
  const [confirming, setConfirming] = useState(false);
  const form = useZodForm(settingsSchema, initialValues(settings));
  const { values, errors, text, setValue } = form;
  if (!user) return null;

  return (
    <Page>
      <PageHeader title={s.title} description={s.description} />
      <form
        noValidate
        className="grid max-w-3xl gap-4"
        onSubmit={form.handleSubmit((data) => {
          updateSettings(user.id, {
            providerName: data.providerName,
            supportEmail: data.supportEmail,
            slaHours: { urgent: data.urgent, high: data.high, normal: data.normal, low: data.low },
            mfaRequired: data.mfaRequired,
            sessionTimeoutMinutes: data.sessionTimeoutMinutes,
            auditRetentionDays: data.auditRetentionDays,
          });
          toast.success(s.saved);
        })}
      >
        <Card>
          <CardHeader title={s.provider} />
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <Field label={s.providerName} name="providerName" error={errors.providerName}>
              {(props) => <Input {...props} {...text("providerName")} />}
            </Field>
            <Field label={s.supportEmail} name="supportEmail" error={errors.supportEmail}>
              {(props) => <Input {...props} {...text("supportEmail")} type="email" />}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={s.sla} description={s.slaHint} />
          <CardContent className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
            {PRIORITIES.map((priority) => (
              <Field
                key={priority}
                label={copy.ticketPriority[priority]}
                name={priority}
                error={errors[priority]}
              >
                {(props) => <Input {...props} {...text(priority)} inputMode="numeric" />}
              </Field>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={s.security} />
          <CardContent className="grid gap-5 pt-4">
            <ToggleRow
              label={s.mfaRequired}
              description={s.mfaRequiredHint}
              control={({ labelId, descriptionId }) => (
                <Switch
                  checked={values.mfaRequired}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  onCheckedChange={(checked) => setValue("mfaRequired", checked)}
                />
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={s.sessionTimeout}
                name="sessionTimeoutMinutes"
                error={errors.sessionTimeoutMinutes}
              >
                {(props) => (
                  <Input {...props} {...text("sessionTimeoutMinutes")} inputMode="numeric" />
                )}
              </Field>
              <Field
                label={s.retention}
                name="auditRetentionDays"
                error={errors.auditRetentionDays}
              >
                {(props) => (
                  <Input {...props} {...text("auditRetentionDays")} inputMode="numeric" />
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">{copy.common.saveChanges}</Button>
        </div>
      </form>

      <Card className="max-w-3xl">
        <CardHeader title={s.data} description={s.dataText} />
        <CardContent className="pt-4">
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            <RotateCcw aria-hidden />
            {copy.demo.reset}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={s.resetTitle}
        description={s.resetText}
        confirmLabel={copy.demo.reset}
        onConfirm={() => {
          resetDemo();
          signOut();
          toast.success(copy.demo.resetDone);
          router.push(routes.login);
        }}
      />
    </Page>
  );
}
