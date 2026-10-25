"use client";

import { Lock, SearchX } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { can, isStaff } from "@/lib/domain/rbac";
import { nextStatuses, slaDeadline, slaState, visibleMessages } from "@/lib/domain/tickets";
import type { TicketStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { PriorityBadge, SlaBadge, TicketStatusBadge } from "@/components/badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Select, Textarea } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";

const t = copy.tickets;

export function TicketDetailView({
  ticketId,
  area,
}: {
  ticketId: string;
  area: "portal" | "admin";
}) {
  const now = useNow();
  const { user } = useAuth();
  const { tickets, users, organizations, slaHours } = useData((state) => ({
    tickets: state.tickets,
    users: state.users,
    organizations: state.organizations,
    slaHours: state.settings.slaHours,
  }));
  const setStatus = useDataStore((state) => state.setTicketStatus);
  const assign = useDataStore((state) => state.assignTicket);
  const assignId = useId();
  const ticket = tickets.find((item) => item.id === ticketId);
  const back = { href: area === "admin" ? routes.adminTickets : routes.tickets, label: t.back };

  const staff = useMemo(
    () => users.filter((u) => u.orgId === null && u.status === "active"),
    [users],
  );

  if (!user) return null;
  // Il cliente vede solo i ticket della propria azienda (in produzione: filtro sul server).
  if (!ticket || (!isStaff(user.role) && ticket.orgId !== user.orgId)) {
    return (
      <Page>
        <PageHeader title={t.notFound} back={back} />
        <EmptyState icon={SearchX} title={t.notFound} />
      </Page>
    );
  }

  const name = (id: string | null) =>
    id ? (users.find((u) => u.id === id)?.name ?? "—") : t.unassigned;
  const messages = visibleMessages(ticket.messages, user.role);
  const statuses = nextStatuses(ticket.status, user.role);
  const manage = can(user.role, "tickets.manage");
  const canReply =
    ticket.status !== "closed" &&
    (manage || (can(user.role, "tickets.create") && ticket.orgId === user.orgId));
  const org = organizations.find((o) => o.id === ticket.orgId);

  const changeStatus = (status: TicketStatus) => {
    setStatus(user.id, ticket.id, status);
    toast.success(t.statusChanged(copy.ticketStatus[status]));
  };

  return (
    <Page>
      <PageHeader
        title={ticket.subject}
        back={back}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
            <span className="font-medium text-fg">{ticket.number}</span>
            <TicketStatusBadge value={ticket.status} />
            <PriorityBadge value={ticket.priority} />
            {manage && now ? <SlaBadge value={slaState(ticket, slaHours, now)} /> : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader title={t.conversation} />
            <ol className="mt-2 divide-y divide-line">
              {messages.map((message) => {
                const author = users.find((u) => u.id === message.authorId);
                const fromStaff = author ? isStaff(author.role) : false;
                return (
                  <li
                    key={message.id}
                    className={cn(
                      "flex gap-3 px-5 py-4 sm:px-6",
                      message.internal && "bg-warning-soft/60",
                    )}
                  >
                    <Avatar name={author?.name ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                        <span className="font-semibold text-fg">{author?.name ?? "—"}</span>
                        {fromStaff ? (
                          <span className="text-fg-muted">{copy.team.staff}</span>
                        ) : null}
                        <span className="text-fg-muted">{formatDate(message.at, "dateTime")}</span>
                        {message.internal ? (
                          <Badge tone="warning">
                            <Lock aria-hidden />
                            {t.internalBadge}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="mt-1.5 text-sm whitespace-pre-line text-fg">{message.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {canReply ? (
            <ReplyForm ticketId={ticket.id} allowInternal={can(user.role, "tickets.internal")} />
          ) : (
            <p className="rounded-lg border border-line bg-surface p-4 text-[13px] text-fg-muted">
              {ticket.status === "closed" ? t.closedNote : t.viewerNote}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="grid gap-4 pt-5">
            <dl className="grid gap-3 text-sm">
              {manage && org ? <Row label={t.columns.client} value={org.name} /> : null}
              <Row label={t.category} value={copy.ticketCategory[ticket.category]} />
              <Row
                label={t.columns.number}
                value={t.openedBy(name(ticket.createdBy), formatDate(ticket.createdAt, "dateTime"))}
              />
              {manage ? (
                <Row
                  label={t.columns.sla}
                  value={t.slaDeadline(formatDate(slaDeadline(ticket, slaHours), "dateTime"))}
                />
              ) : null}
              {!manage ? <Row label={t.assignLabel} value={name(ticket.assigneeId)} /> : null}
            </dl>

            {manage ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={assignId} className="text-[13px] font-medium text-fg">
                  {t.assignLabel}
                </label>
                <Select
                  id={assignId}
                  value={ticket.assigneeId ?? ""}
                  onChange={(e) => {
                    assign(user.id, ticket.id, e.target.value || null);
                    toast.success(t.assigned);
                  }}
                >
                  <option value="">{t.unassigned}</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {statuses.length > 0 ? (
              <div className="grid gap-2 border-t border-line pt-4">
                {!manage && ticket.status === "resolved" ? (
                  <p className="text-[13px] text-fg-muted">{t.resolvedNote}</p>
                ) : null}
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={status === "resolved" || status === "closed" ? "secondary" : "ghost"}
                    onClick={() => changeStatus(status)}
                  >
                    {t.changeStatus(copy.ticketStatus[status])}
                  </Button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}

function ReplyForm({ ticketId, allowInternal }: { ticketId: string; allowInternal: boolean }) {
  const { user } = useAuth();
  const reply = useDataStore((state) => state.replyTicket);
  const id = useId();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <form
        noValidate
        className="grid gap-3 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const value = body.trim();
          if (!value) {
            setError(copy.validation.required);
            return;
          }
          if (!user) return;
          reply(user.id, ticketId, value.slice(0, 4000), internal);
          setBody("");
          setInternal(false);
          toast.success(t.sent);
        }}
      >
        <h2 className="text-base font-semibold text-fg">{t.reply}</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-[13px] font-medium text-fg">
            {t.replyLabel}
          </label>
          <Textarea
            id={id}
            rows={4}
            maxLength={4000}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {allowInternal ? (
            <label className="flex min-h-11 items-center gap-2 text-sm text-fg">
              <Checkbox checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              {t.internal}
            </label>
          ) : (
            <span />
          )}
          <Button type="submit">{t.send}</Button>
        </div>
      </form>
    </Card>
  );
}
