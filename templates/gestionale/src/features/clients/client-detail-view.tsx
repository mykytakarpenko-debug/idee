"use client";

import {
  Building2,
  CalendarPlus,
  Download,
  Ellipsis,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { computeClientStats, fullName } from "@/lib/domain/clients";
import { paymentDisplayStatus } from "@/lib/domain/payments";
import { downloadFile } from "@/lib/csv";
import { formatCurrency, formatDate, formatTimeRange } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import {
  AppointmentStatusBadge,
  ClientStatusBadge,
  PaymentStatusBadge,
} from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { AppointmentActionsMenu } from "@/features/appointments/appointment-actions";

const t = copy.clients.detail;

export function ClientDetailView({ id }: { id: string }) {
  const ready = useDataReady();
  const now = useNow();
  const client = useDataStore((state) => state.clients.find((c) => c.id === id));

  if (!ready || !now) return <ClientDetailSkeleton />;
  if (!client) {
    return (
      <Page>
        <EmptyState
          icon={UserX}
          title={t.notFound}
          description={t.notFoundHint}
          action={
            <Link href={routes.clients} className={buttonClasses({ variant: "secondary" })}>
              {t.back}
            </Link>
          }
        />
      </Page>
    );
  }
  return <ClientDetail clientId={client.id} now={now} />;
}

function ClientDetail({ clientId, now }: { clientId: string; now: Date }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteClient = useDataStore((state) => state.deleteClient);
  const { client, allAppointments, allPayments, services, staff } = useData((state) => ({
    client: state.clients.find((c) => c.id === clientId)!,
    allAppointments: state.appointments,
    allPayments: state.payments,
    services: state.services,
    staff: state.staff,
  }));

  const appointments = useMemo(
    () =>
      allAppointments
        .filter((a) => a.clientId === clientId)
        .sort((a, b) => b.start.localeCompare(a.start)),
    [allAppointments, clientId],
  );
  const payments = useMemo(
    () =>
      allPayments
        .filter((p) => p.clientId === clientId)
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [allPayments, clientId],
  );
  const stats = useMemo(
    () => computeClientStats(appointments, payments, now).get(clientId),
    [appointments, payments, now, clientId],
  );
  const paidAppointments = useMemo(
    () => new Set(payments.filter((p) => p.status !== "refunded").map((p) => p.appointmentId)),
    [payments],
  );
  const serviceName = (sid: string) =>
    services.find((s) => s.id === sid)?.name ?? copy.common.unknown;
  const staffName = (sid: string) => staff.find((m) => m.id === sid)?.name ?? copy.common.unknown;
  const name = fullName(client);

  const exportData = () => {
    const data = { client, appointments, payments, exportedAt: new Date().toISOString() };
    downloadFile(`cliente-${client.id}.json`, JSON.stringify(data, null, 2), "application/json");
    toast.success(copy.settings.data.exported);
  };

  return (
    <Page>
      <PageHeader
        back={{ href: routes.clients, label: t.back }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} size="lg" className="max-sm:size-11 max-sm:text-sm" />
            <span className="min-w-0">
              <span className="block truncate">{name}</span>
            </span>
          </span>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <ClientStatusBadge status={client.status} />
            {client.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            <span className="text-[13px] text-fg-muted">
              {t.clientSince} {formatDate(client.createdAt, "short")}
            </span>
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => openDialog({ type: "client", id: client.id })}
            >
              <Pencil aria-hidden />
              {copy.common.edit}
            </Button>
            <Button
              onClick={() => openDialog({ type: "appointment", defaults: { clientId: client.id } })}
            >
              <CalendarPlus aria-hidden />
              {t.bookAppointment}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label={copy.common.moreActions}>
                  <Ellipsis aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onSelect={exportData}>
                  <Download aria-hidden />
                  {t.exportData}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem tone="danger" onSelect={() => setConfirmOpen(true)}>
                  <Trash2 aria-hidden />
                  {copy.common.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <section aria-label={t.overview} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={t.totalSpent} value={formatCurrency(stats?.totalSpent ?? 0)} />
        <StatCard label={t.visits} value={stats?.completedVisits ?? 0} />
        <StatCard
          label={t.lastVisit}
          value={stats?.lastVisit ? formatDate(stats.lastVisit, "short") : copy.clients.never}
        />
        <StatCard
          label={t.nextAppointment}
          value={stats?.nextAppointment ? formatDate(stats.nextAppointment.start, "short") : t.none}
          hint={
            stats?.nextAppointment
              ? `${formatDate(stats.nextAppointment.start, "time")} · ${serviceName(stats.nextAppointment.serviceId)}`
              : undefined
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <Tabs defaultValue="appointments">
            <TabsList aria-label={t.overview} className="pt-2">
              <TabsTrigger value="appointments">
                {t.appointments}
                <Badge className="h-5">{appointments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="payments">
                {t.payments}
                <Badge className="h-5">{payments.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="appointments">
              {appointments.length === 0 ? (
                <EmptyState compact icon={CalendarPlus} title={t.noAppointments} />
              ) : (
                <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
                  {appointments.slice(0, 50).map((appointment) => (
                    <li key={appointment.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-xs text-fg-muted uppercase">
                          {formatDate(appointment.start, "monthShort")}
                        </p>
                        <p className="text-lg leading-tight font-semibold text-fg tabular-nums">
                          {formatDate(appointment.start, "inputDate").slice(8)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {serviceName(appointment.serviceId)}
                        </p>
                        <p className="truncate text-[13px] text-fg-muted">
                          {formatTimeRange(appointment.start, appointment.end)} ·{" "}
                          {staffName(appointment.staffId)}
                        </p>
                      </div>
                      <span className="hidden text-sm text-fg tabular-nums sm:block">
                        {formatCurrency(appointment.price)}
                      </span>
                      <span className="hidden sm:block">
                        <AppointmentStatusBadge status={appointment.status} />
                      </span>
                      <AppointmentActionsMenu
                        appointment={appointment}
                        hasPayment={paidAppointments.has(appointment.id)}
                        showClientLink={false}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="payments">
              {payments.length === 0 ? (
                <EmptyState compact icon={CalendarPlus} title={t.noPayments} />
              ) : (
                <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
                  {payments.slice(0, 50).map((payment) => (
                    <li key={payment.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {payment.description}
                        </p>
                        <p className="truncate text-[13px] text-fg-muted">
                          {payment.number} · {formatDate(payment.issuedAt, "short")} ·{" "}
                          {copy.paymentMethod[payment.method]}
                        </p>
                      </div>
                      <PaymentStatusBadge status={paymentDisplayStatus(payment, now)} />
                      <span className="w-20 text-right text-sm font-medium text-fg tabular-nums">
                        {formatCurrency(payment.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title={t.contact} />
            <CardContent className="flex flex-col gap-3 text-sm">
              {client.email ? (
                <ContactRow icon={<Mail />} label={t.email}>
                  <a href={`mailto:${client.email}`} className="text-accent-text hover:underline">
                    {client.email}
                  </a>
                </ContactRow>
              ) : null}
              <ContactRow icon={<Phone />} label={t.phone}>
                <a
                  href={`tel:${client.phone.replace(/\s/g, "")}`}
                  className="text-accent-text tabular-nums hover:underline"
                >
                  {client.phone}
                </a>
              </ContactRow>
              {client.company ? (
                <ContactRow icon={<Building2 />} label={t.company}>
                  {client.company}
                </ContactRow>
              ) : null}
              {client.city ? (
                <ContactRow icon={<MapPin />} label={t.city}>
                  {client.city}
                </ContactRow>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t.privacy} />
            <CardContent className="flex items-start gap-3 text-sm">
              {client.marketingConsent ? (
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <ShieldOff aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
              )}
              <p className="text-fg">{client.marketingConsent ? t.marketingYes : t.marketingNo}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={copy.common.notes} />
            <CardContent className="text-sm whitespace-pre-line text-fg">
              {client.notes ? (
                client.notes
              ) : (
                <span className="text-fg-muted">{copy.common.noNotes}</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={copy.clients.delete.title}
        description={copy.clients.delete.description(name)}
        confirmLabel={copy.clients.delete.confirm}
        onConfirm={() => {
          router.push(routes.clients);
          deleteClient(client.id);
          toast.success(copy.clients.delete.done);
        }}
      />
    </Page>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="mt-0.5 text-fg-muted [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted">{label}</p>
        <div className="truncate text-fg">{children}</div>
      </div>
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <Page aria-busy="true">
      <span className="sr-only">{copy.common.loading}</span>
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[360px] rounded-xl" />
    </Page>
  );
}
