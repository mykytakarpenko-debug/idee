"use client";

import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ToggleRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
import { Switch } from "@/components/ui/switch";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const t = copy.security;

/** Sicurezza dell'account personale: MFA e accessi recenti (portale e area admin). */
export function SecurityView() {
  const { user } = useAuth();
  const { audit, settings } = useData((state) => ({
    audit: state.audit,
    settings: state.settings,
  }));
  const setOwnMfa = useDataStore((state) => state.setOwnMfa);
  const accesses = useMemo(
    () =>
      audit
        .filter((e) => e.actorId === user?.id && e.action.startsWith("auth."))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 10),
    [audit, user?.id],
  );
  if (!user) return null;
  const locked = settings.mfaRequired && user.mfaEnabled;

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <Card className="max-w-3xl">
        <CardContent className="pt-5">
          <ToggleRow
            label={t.mfa}
            description={settings.mfaRequired ? `${t.mfaText} ${t.mfaRequired}` : t.mfaText}
            control={({ labelId, descriptionId }) => (
              <Switch
                checked={user.mfaEnabled}
                disabled={locked}
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                onCheckedChange={(checked) => {
                  setOwnMfa(user.id, checked);
                  toast.success(checked ? t.mfaEnabled : t.mfaDisabled);
                }}
              />
            )}
          />
        </CardContent>
      </Card>
      <Card className="max-w-3xl">
        <CardHeader title={t.accesses} description={t.accessesText} />
        {accesses.length === 0 ? (
          <EmptyState compact icon={ShieldCheck} title={copy.audit.empty} />
        ) : (
          <Table className="mt-2">
            <THead>
              <TR>
                <TH>{t.when}</TH>
                <TH>{t.event}</TH>
                <TH align="right">{t.ip}</TH>
              </TR>
            </THead>
            <TBody>
              {accesses.map((event) => (
                <TR key={event.id}>
                  <TD className="text-fg-muted">{formatDate(event.at, "dateTime")}</TD>
                  <TD className="text-fg">{copy.auditActions[event.action]}</TD>
                  <TD align="right" className="font-mono text-[13px] text-fg-muted">
                    {event.ip}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <p className="text-[13px] text-fg-muted">{t.session(settings.sessionTimeoutMinutes)}</p>
    </Page>
  );
}
