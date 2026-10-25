"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleCheck,
  Clock,
  LogOut,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { usePlayer } from "@/hooks/use-player";
import { useZodForm } from "@/hooks/use-zod-form";
import { formatOdds } from "@/lib/domain/betting";
import { depositRemaining, effectiveLimits, sessionSummary } from "@/lib/domain/responsible";
import { depositSchema, withdrawalSchema } from "@/lib/domain/schemas";
import type { Bet, BetStatus, KycStatus, Player } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { PlayBlockNotice } from "@/components/play/play-block-notice";
import { Container } from "@/components/site/section";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

const t = copy.account;
const PAGE_SIZE = 12;

const BET_TONE: Record<BetStatus, BadgeTone> = {
  open: "info",
  won: "success",
  lost: "neutral",
  void: "warning",
};
const KYC_TONE: Record<KycStatus, BadgeTone> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
};
const KYC_ICON = { pending: Clock, verified: CircleCheck, rejected: TriangleAlert } as const;

export function KycBadge({ status }: { status: KycStatus }) {
  const Icon = KYC_ICON[status];
  return (
    <Badge tone={KYC_TONE[status]}>
      <Icon aria-hidden />
      {copy.kyc[status]}
    </Badge>
  );
}

export function BetStatusBadge({ status }: { status: BetStatus }) {
  return <Badge tone={BET_TONE[status]}>{copy.betStatus[status]}</Badge>;
}

/** Conto di gioco: saldo, ricarica e prelievo demo, movimenti, scommesse, sessioni. */
export function AccountView() {
  const router = useRouter();
  const now = useNow();
  const { player, loading } = usePlayer();
  const sessionId = useSessionStore((state) => state.sessionId);
  const [dialog, setDialog] = useState<"deposit" | "withdraw" | null>(null);
  // Uscita volontaria: si va alla home, non all'accesso.
  const leaving = useRef(false);

  useEffect(() => {
    if (!loading && !player && !leaving.current) router.replace(routes.login);
  }, [loading, player, router]);

  if (!player || !now) {
    return (
      <Container className="py-12" aria-busy="true">
        <Skeleton className="h-64" />
      </Container>
    );
  }

  return (
    <Container className="animate-page-in py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-fg-muted">{t.greeting(player.firstName)}</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-fg">{t.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <KycBadge status={player.kyc} />
            <Link
              href={routes.responsible}
              className="text-[13px] font-medium text-accent-text underline underline-offset-2"
            >
              {t.limitsLink}
            </Link>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            leaving.current = true;
            useDataStore.getState().endSession(sessionId);
            useSessionStore.getState().signOut();
            router.push(routes.home);
          }}
        >
          <LogOut aria-hidden />
          {t.logout}
        </Button>
      </div>

      <div className="mt-6">
        <PlayBlockNotice player={player} now={now} />
      </div>

      <section
        aria-labelledby="saldo"
        className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6"
      >
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-fg">
            <Wallet aria-hidden className="size-6" />
          </span>
          <div>
            <h2 id="saldo" className="text-[13px] text-fg-muted">
              {t.balance}
            </h2>
            <p className="font-display text-3xl font-bold text-fg tabular-nums">
              {formatCurrency(player.balance)}
            </p>
            <p className="text-[12px] text-fg-muted">{t.demoCredits}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog("deposit")}>
            <ArrowDownToLine aria-hidden />
            {t.deposit}
          </Button>
          <Button variant="secondary" onClick={() => setDialog("withdraw")}>
            <ArrowUpFromLine aria-hidden />
            {t.withdraw}
          </Button>
        </div>
      </section>

      <Tabs defaultValue="movements" className="mt-8">
        <TabsList>
          <TabsTrigger value="movements">{t.tabs.movements}</TabsTrigger>
          <TabsTrigger value="bets">{t.tabs.bets}</TabsTrigger>
          <TabsTrigger value="sessions">{t.tabs.sessions}</TabsTrigger>
        </TabsList>
        <TabsContent value="movements">
          <Movements player={player} />
        </TabsContent>
        <TabsContent value="bets">
          <Bets player={player} />
        </TabsContent>
        <TabsContent value="sessions">
          <Sessions player={player} now={now} />
        </TabsContent>
      </Tabs>

      <section
        aria-labelledby="profilo"
        className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="profilo" className="flex items-center gap-2 font-display text-lg font-bold text-fg">
          <ShieldCheck aria-hidden className="size-5 text-accent-text" />
          {t.profile}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {[
            [copy.register.firstName, `${player.firstName} ${player.lastName}`],
            [copy.register.email, player.email],
            [copy.register.fiscalCode, `${player.fiscalCode.slice(0, 6)}••••••••••`],
            [
              copy.register.document,
              `${copy.documentTypes[player.document.type]} · ${formatDate(`${player.document.expiresOn}T12:00:00`, "short")}`,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[12px] text-fg-muted">{label}</dt>
              <dd className="mt-0.5 break-all text-fg">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        {dialog === "deposit" ? (
          <DepositDialog player={player} now={now} onDone={() => setDialog(null)} />
        ) : null}
        {dialog === "withdraw" ? (
          <WithdrawDialog player={player} onDone={() => setDialog(null)} />
        ) : null}
      </Dialog>
    </Container>
  );
}

function Movements({ player }: { player: Player }) {
  const transactions = useData((state) => state.transactions);
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      transactions
        .filter((tx) => tx.playerId === player.id)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [transactions, player.id],
  );
  if (rows.length === 0) return <EmptyState className="mt-6" icon={Wallet} title={t.noMovements} />;
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface">
      <Table>
        <THead>
          <TR>
            <TH>{t.columns.at}</TH>
            <TH>{t.columns.kind}</TH>
            <TH className="hidden md:table-cell">{t.columns.ref}</TH>
            <TH align="right">{t.columns.amount}</TH>
            <TH align="right" className="hidden sm:table-cell">
              {t.columns.balance}
            </TH>
          </TR>
        </THead>
        <TBody>
          {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((tx) => (
            <TR key={tx.id}>
              <TD className="whitespace-nowrap text-fg-muted">{formatDate(tx.at, "dateTime")}</TD>
              <TD className="text-fg">{copy.transactionKinds[tx.kind]}</TD>
              <TD className="hidden text-fg-muted md:table-cell">{tx.ref}</TD>
              <TD align="right" className={tx.amount > 0 ? "font-medium text-success" : "text-fg"}>
                {tx.amount > 0 ? "+" : "−"}
                {formatCurrency(Math.abs(tx.amount))}
              </TD>
              <TD align="right" className="hidden text-fg-muted sm:table-cell">
                {formatCurrency(tx.balanceAfter)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
    </div>
  );
}

function Bets({ player }: { player: Player }) {
  const bets = useData((state) => state.bets);
  const own = useMemo(
    () =>
      bets
        .filter((b) => b.playerId === player.id)
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt)),
    [bets, player.id],
  );
  if (own.length === 0) return <EmptyState className="mt-6" icon={Wallet} title={t.noBets} />;
  return (
    <ul className="mt-4 grid gap-3">
      {own.map((bet) => (
        <li key={bet.id}>
          <BetCard bet={bet} />
        </li>
      ))}
    </ul>
  );
}

function BetCard({ bet }: { bet: Bet }) {
  const c = t.betColumns;
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="font-mono text-sm font-semibold text-fg">{bet.code}</h3>
        <BetStatusBadge status={bet.status} />
        <span className="text-[13px] text-fg-muted">{formatDate(bet.placedAt, "dateTime")}</span>
      </div>
      <ul className="mt-3 grid gap-1.5 text-[13px]">
        {bet.lines.map((line) => (
          <li key={line.selectionId} className="flex flex-wrap justify-between gap-x-3">
            <span className="text-fg">
              {line.event} · {copy.markets[line.market]}: <strong>{line.selection}</strong>
            </span>
            <span className="text-fg-muted tabular-nums">
              {formatOdds(line.odds)} · {copy.lineOutcome[line.outcome]}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-[13px]">
        <div className="flex gap-1.5">
          <dt className="text-fg-muted">{c.stake}</dt>
          <dd className="font-medium text-fg tabular-nums">{formatCurrency(bet.stake)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-fg-muted">{c.odds}</dt>
          <dd className="font-medium text-fg tabular-nums">{formatOdds(bet.odds)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-fg-muted">
            {bet.status === "open" ? copy.slip.potentialWin : c.win}
          </dt>
          <dd className="font-medium text-fg tabular-nums">
            {formatCurrency(bet.status === "open" ? bet.potentialWin : bet.payout)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function Sessions({ player, now }: { player: Player; now: Date }) {
  const { sessions, transactions } = useData((state) => ({
    sessions: state.sessions,
    transactions: state.transactions,
  }));
  const own = sessions
    .filter((s) => s.playerId === player.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 15);
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface">
      <Table>
        <THead>
          <TR>
            <TH>{t.sessionColumns.start}</TH>
            <TH>{t.sessionColumns.duration}</TH>
            <TH align="right">{t.sessionColumns.net}</TH>
          </TR>
        </THead>
        <TBody>
          {own.map((s, i) => {
            const end = s.endedAt ? new Date(s.endedAt) : now;
            const minutes = Math.max(
              0,
              Math.round((end.getTime() - new Date(s.startedAt).getTime()) / 60_000),
            );
            // Saldo della sessione: movimenti tra inizio e fine (o la sessione successiva).
            const next = own[i - 1]?.startedAt;
            const summary = sessionSummary(
              transactions.filter((tx) => !next || tx.at < next),
              player.id,
              s.startedAt,
            );
            return (
              <TR key={s.id}>
                <TD className="text-fg-muted">{formatDate(s.startedAt, "dateTime")}</TD>
                <TD className="text-fg">{copy.common.minutes(minutes)}</TD>
                <TD align="right" className="text-fg">
                  {formatCurrency(summary.net)}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}

function DepositDialog({ player, now, onDone }: { player: Player; now: Date; onDone: () => void }) {
  const transactions = useData((state) => state.transactions);
  const deposit = useDataStore((state) => state.deposit);
  const form = useZodForm(depositSchema, { amount: "20" });
  const { errors, text, setErrors } = form;
  const room = depositRemaining(player, transactions, now);
  const limits = effectiveLimits(player, now);

  return (
    <DialogContent title={t.depositTitle} description={t.depositText}>
      <form
        noValidate
        onSubmit={form.handleSubmit(({ amount }) => {
          const result = deposit(player.id, amount);
          if (!result.ok) {
            setErrors({
              amount:
                result.reason === "limit"
                  ? t.depositLimit(formatCurrency(result.remaining), t.windows[result.window])
                  : copy.slip.issues.blocked,
            });
            return;
          }
          toast.success(t.deposited(formatCurrency(amount)));
          onDone();
        })}
      >
        <DialogBody className="grid gap-4">
          <PlayBlockNotice player={player} now={now} />
          <Field
            label={t.depositAmount}
            name="amount"
            error={errors.amount}
            hint={
              room
                ? t.depositRoom(formatCurrency(room.remaining), t.windows[room.window])
                : undefined
            }
          >
            {(props) => <Input {...props} {...text("amount")} inputMode="decimal" />}
          </Field>
          <p className="text-[12px] text-fg-muted">
            {copy.responsible.depositWeek}: {formatCurrency(limits.depositWeek)}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{t.deposit}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function WithdrawDialog({ player, onDone }: { player: Player; onDone: () => void }) {
  const withdraw = useDataStore((state) => state.withdraw);
  const form = useZodForm(withdrawalSchema, { amount: "" });
  const { errors, text, setErrors } = form;
  return (
    <DialogContent title={t.withdrawTitle} description={t.withdrawText}>
      <form
        noValidate
        onSubmit={form.handleSubmit(({ amount }) => {
          const result = withdraw(player.id, amount);
          if (!result.ok) {
            setErrors({ amount: result.reason === "kyc" ? t.withdrawKyc : t.withdrawBalance });
            return;
          }
          toast.success(t.withdrawn(formatCurrency(amount)));
          onDone();
        })}
      >
        <DialogBody className="grid gap-4">
          {player.kyc !== "verified" ? (
            <p role="status" className="rounded-lg bg-warning-soft p-3 text-[13px] text-fg">
              {t.withdrawKyc}
            </p>
          ) : null}
          <Field label={t.depositAmount} name="amount" error={errors.amount}>
            {(props) => <Input {...props} {...text("amount")} inputMode="decimal" />}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{t.withdraw}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
