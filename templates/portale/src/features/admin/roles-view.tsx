"use client";

import { Check, Minus } from "lucide-react";
import { copy } from "@/content/it";
import { can, isStaff, PERMISSIONS, ROLES } from "@/lib/domain/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const r = copy.rolesPage;

/** Matrice di sola lettura: la fonte è `lib/domain/rbac.ts`. */
export function RolesView() {
  return (
    <Page>
      <PageHeader title={r.title} description={r.description} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardContent className="pt-5">
              <p className="text-[13px] text-fg-muted">
                {isStaff(role) ? r.staffSide : r.clientSide}
              </p>
              <h2 className="mt-1 text-sm font-semibold text-fg">{copy.roles[role]}</h2>
              <p className="mt-1 text-[13px] text-fg-muted">{copy.roleDescriptions[role]}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <Table scrollLabel={r.title}>
          <caption className="sr-only">{r.title}</caption>
          <THead>
            <TR>
              <TH>{r.permission}</TH>
              {ROLES.map((role) => (
                <TH key={role} className="text-center">
                  {copy.roles[role]}
                </TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {PERMISSIONS.map((permission) => (
              <TR key={permission}>
                <TH
                  scope="row"
                  className="h-12 min-w-56 text-sm font-normal whitespace-normal text-fg"
                >
                  {copy.permissions[permission]}
                </TH>
                {ROLES.map((role) => {
                  const allowed = can(role, permission);
                  return (
                    <TD key={role} className="h-12 text-center">
                      {allowed ? (
                        <Check aria-hidden className="mx-auto size-4 text-success" />
                      ) : (
                        <Minus aria-hidden className="mx-auto size-4 text-fg-subtle" />
                      )}
                      <span className="sr-only">{allowed ? r.allowed : r.denied}</span>
                    </TD>
                  );
                })}
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </Page>
  );
}
