"use client";

import { Ban, KeyRound, MoreHorizontal, RotateCcw, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { assignableRoles, canManageUser, can, isStaff } from "@/lib/domain/rbac";
import { inviteSchema } from "@/lib/domain/schemas";
import type { Role, User } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useDataStore, type ActionResult } from "@/store/data-store";
import { UserStatusBadge } from "@/components/badges";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const t = copy.team;
const PAGE_SIZE = 15;
const STAFF_ORG = "__staff";
const ROLES = Object.keys(copy.roles) as Role[];
const CLIENT_ROLES = ROLES.filter((role) => !isStaff(role));

function feedback(result: ActionResult, success: string) {
  if (result.ok) toast.success(success);
  else if (result.reason === "last_admin") toast.error(t.lastAdmin);
  else if (result.reason === "duplicate") toast.error(copy.validation.duplicateEmail);
  else toast.error(copy.auth.forbiddenText);
}

/** Team dell'azienda (portale) o tutti gli utenti (area admin). */
export function UsersView({ area }: { area: "portal" | "admin" }) {
  const { user } = useAuth();
  const { users, organizations } = useData((state) => ({
    users: state.users,
    organizations: state.organizations,
  }));
  const setUserRole = useDataStore((state) => state.setUserRole);
  const setUserActive = useDataStore((state) => state.setUserActive);
  const resetMfa = useDataStore((state) => state.resetMfa);
  const [query, setQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [inviting, setInviting] = useState(false);
  const [disabling, setDisabling] = useState<User | null>(null);
  const admin = area === "admin";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => (admin ? true : u.orgId === user?.orgId))
      .filter(
        (u) => !orgFilter || (orgFilter === STAFF_ORG ? u.orgId === null : u.orgId === orgFilter),
      )
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "it"));
  }, [users, admin, user?.orgId, orgFilter, roleFilter, query]);

  if (!user) return null;
  const manageable = can(user.role, admin ? "users.manage" : "team.manage");
  const roles = assignableRoles(user);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const orgName = (id: string | null) =>
    id ? (organizations.find((o) => o.id === id)?.name ?? "—") : t.staff;

  return (
    <Page>
      <PageHeader
        title={admin ? copy.nav.admin.users : t.title}
        description={admin ? t.adminDescription : t.description}
        actions={
          manageable ? (
            <Button onClick={() => setInviting(true)}>
              <UserPlus aria-hidden />
              {t.invite}
            </Button>
          ) : null
        }
      />
      <Toolbar>
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        {admin ? (
          <Select
            aria-label={t.allOrgs}
            value={orgFilter}
            onChange={(e) => {
              setOrgFilter(e.target.value);
              setPage(1);
            }}
            className="sm:w-56"
          >
            <option value="">{t.allOrgs}</option>
            <option value={STAFF_ORG}>{t.staff}</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          aria-label={t.allRoles}
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | "");
            setPage(1);
          }}
          className="sm:w-48"
        >
          <option value="">{t.allRoles}</option>
          {(admin ? ROLES : CLIENT_ROLES).map((role) => (
            <option key={role} value={role}>
              {copy.roles[role]}
            </option>
          ))}
        </Select>
      </Toolbar>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title={t.empty} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>{t.columns.name}</TH>
                  {admin ? <TH className="hidden lg:table-cell">{t.columns.org}</TH> : null}
                  <TH>{t.columns.role}</TH>
                  <TH className="hidden sm:table-cell">{t.columns.status}</TH>
                  <TH className="hidden md:table-cell">{t.columns.mfa}</TH>
                  <TH className="hidden xl:table-cell">{t.columns.lastLogin}</TH>
                  {manageable ? (
                    <TH>
                      <span className="sr-only">{t.actions}</span>
                    </TH>
                  ) : null}
                </TR>
              </THead>
              <TBody>
                {pageRows.map((member) => {
                  const editable = manageable && canManageUser(user, member);
                  return (
                    <TR key={member.id}>
                      <TD className="min-w-56">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-fg">
                              {member.name}
                              {member.id === user.id ? (
                                <span className="font-normal text-fg-muted"> ({t.you})</span>
                              ) : null}
                            </p>
                            <p className="text-[13px] break-all text-fg-muted">{member.email}</p>
                          </div>
                        </div>
                      </TD>
                      {admin ? (
                        <TD className="hidden text-fg-muted lg:table-cell">
                          {orgName(member.orgId)}
                        </TD>
                      ) : null}
                      <TD>
                        {editable ? (
                          <Select
                            aria-label={t.changeRole(member.name)}
                            value={member.role}
                            onChange={(e) =>
                              feedback(
                                setUserRole(user.id, member.id, e.target.value as Role),
                                t.roleChanged,
                              )
                            }
                            className="h-9 w-auto min-w-40"
                          >
                            {roles
                              .filter((role) => isStaff(role) === isStaff(member.role))
                              .map((role) => (
                                <option key={role} value={role}>
                                  {copy.roles[role]}
                                </option>
                              ))}
                          </Select>
                        ) : (
                          <span className="text-fg">{copy.roles[member.role]}</span>
                        )}
                      </TD>
                      <TD className="hidden sm:table-cell">
                        <UserStatusBadge value={member.status} />
                      </TD>
                      <TD className="hidden text-fg-muted md:table-cell">
                        {member.mfaEnabled ? t.mfaOn : t.mfaOff}
                      </TD>
                      <TD className="hidden text-fg-muted xl:table-cell">
                        {member.lastLoginAt
                          ? formatDate(member.lastLoginAt, "dateTime")
                          : copy.common.never}
                      </TD>
                      {manageable ? (
                        <TD align="right">
                          {editable ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={buttonClasses({ variant: "ghost", size: "icon" })}
                                aria-label={t.actionsFor(member.name)}
                              >
                                <MoreHorizontal aria-hidden />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56">
                                <DropdownMenuItem
                                  disabled={!member.mfaEnabled}
                                  onSelect={() =>
                                    feedback(resetMfa(user.id, member.id), t.mfaReset)
                                  }
                                >
                                  <KeyRound aria-hidden />
                                  {t.resetMfa}
                                </DropdownMenuItem>
                                {member.status === "disabled" ? (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      feedback(setUserActive(user.id, member.id, true), t.enabled)
                                    }
                                  >
                                    <RotateCcw aria-hidden />
                                    {t.enable}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    tone="danger"
                                    onSelect={() => setDisabling(member)}
                                  >
                                    <Ban aria-hidden />
                                    {t.disable}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TD>
                      ) : null}
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Dialog open={inviting} onOpenChange={setInviting}>
        {inviting ? <InviteDialog admin={admin} onDone={() => setInviting(false)} /> : null}
      </Dialog>
      <ConfirmDialog
        open={disabling !== null}
        onOpenChange={(open) => !open && setDisabling(null)}
        title={disabling ? t.disableTitle(disabling.name) : ""}
        description={t.disableText}
        confirmLabel={t.disable}
        onConfirm={() => {
          if (disabling) feedback(setUserActive(user.id, disabling.id, false), t.disabled);
          setDisabling(null);
        }}
      />
    </Page>
  );
}

function InviteDialog({ admin, onDone }: { admin: boolean; onDone: () => void }) {
  const { user } = useAuth();
  const organizations = useData((state) => state.organizations);
  const inviteUser = useDataStore((state) => state.inviteUser);
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const form = useZodForm(inviteSchema, { name: "", email: "", title: "", role: "client_member" });
  const { values, errors, text, setErrors } = form;
  if (!user) return null;
  const roles = assignableRoles(user);
  const staffRole = isStaff(values.role);

  return (
    <DialogContent title={t.inviteTitle} description={t.inviteText}>
      <form
        noValidate
        onSubmit={form.handleSubmit((data) => {
          const result = inviteUser(user.id, { ...data, orgId: admin ? orgId : user.orgId });
          if (!result.ok && result.reason === "duplicate") {
            setErrors({ email: copy.validation.duplicateEmail });
            return;
          }
          feedback(result, t.invited(data.email));
          if (result.ok) onDone();
        })}
      >
        <DialogBody className="grid gap-4">
          <Field label={t.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} autoComplete="off" />}
          </Field>
          <Field label={t.email} name="email" error={errors.email}>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="off" />}
          </Field>
          <Field label={t.titleLabel} name="title" optional error={errors.title}>
            {(props) => <Input {...props} {...text("title")} />}
          </Field>
          <Field label={t.role} name="role" hint={copy.roleDescriptions[values.role]}>
            {(props) => (
              <Select {...props} {...text("role")}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {copy.roles[role]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {admin && !staffRole ? (
            <Field label={t.columns.org} name="orgId">
              {(props) => (
                <Select {...props} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{t.invite}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
