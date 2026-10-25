"use client";

import { Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { ageOn } from "@/lib/domain/kyc";
import { toISODate } from "@/lib/domain/dates";
import {
  depositsIn,
  effectiveLimits,
  netLossSince,
  playBlock,
  riskSignals,
  type RiskSignal,
} from "@/lib/domain/responsible";
import type { Player } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { KycBadge } from "@/features/account/account-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const t = copy.panel.players;
const PAGE_SIZE = 15;
type Filter = keyof typeof t.filters;

/** Giocatori con identità, limiti, stato e segnali di gioco a rischio. */
export function PlayersView() {
  const params = useSearchParams();
  const now = useNow();
  const { players, transactions, sessions, rgEvents } = useData((state) => ({
    players: state.players,
    transactions: state.transactions,
    sessions: state.sessions,
    rgEvents: state.rgEvents,
  }));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(params.get("giocatore"));

  const rows = useMemo(() => {
    if (!now) return [];
    return players
      .map((player) => ({
        player,
        signals: riskSignals({ player, transactions, sessions, rgEvents, now }),
        block: playBlock(player, now),
      }))
      .filter(
        ({ player }) =>
          !query ||
          matchesQuery(
            `${player.firstName} ${player.lastName} ${player.email} ${player.fiscalCode}`,
            query,
          ),
      )
      .filter(({ player, signals, block }) =>
        filter === "kyc"
          ? player.kyc === "pending"
          : filter === "signals"
            ? signals.length > 0
            : filter === "blocked"
              ? block !== null
              : true,
      )
      .sort(
        (a, b) =>
          b.signals.length - a.signals.length ||
          a.player.lastName.localeCompare(b.player.lastName, "it"),
      );
  }, [players, transactions, sessions, rgEvents, now, query, filter]);

  const selected = players.find((p) => p.id === openId) ?? null;

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <Toolbar>
        <SegmentedControl
          ariaLabel={t.title}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          options={(Object.keys(t.filters) as Filter[]).map((value) => ({
            value,
            label: t.filters[value],
          }))}
          className="max-w-full overflow-x-auto"
        />
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
      </Toolbar>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title={t.empty} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>{t.columns.player}</TH>
                  <TH>{t.columns.kyc}</TH>
                  <TH align="right" className="hidden md:table-cell">
                    {t.columns.balance}
                  </TH>
                  <TH align="right" className="hidden lg:table-cell">
                    {t.columns.limits}
                  </TH>
                  <TH className="hidden sm:table-cell">{t.columns.state}</TH>
                  <TH className="hidden xl:table-cell">{t.columns.signals}</TH>
                </TR>
              </THead>
              <TBody>
                {rows
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map(({ player, signals, block }) => (
                    <TR key={player.id} className="hover:bg-surface-2">
                      <TD className="min-w-52">
                        <button
                          type="button"
                          onClick={() => setOpenId(player.id)}
                          className="text-left font-medium text-fg hover:underline"
                        >
                          {player.firstName} {player.lastName}
                        </button>
                        <p className="text-[13px] break-all text-fg-muted">{player.email}</p>
                      </TD>
                      <TD>
                        <KycBadge status={player.kyc} />
                      </TD>
                      <TD align="right" className="hidden md:table-cell">
                        {formatCurrency(player.balance)}
                      </TD>
                      <TD align="right" className="hidden text-fg-muted lg:table-cell">
                        {formatCurrency(effectiveLimits(player, now!).depositWeek)}
                      </TD>
                      <TD className="hidden sm:table-cell">
                        <StateBadge block={block?.reason ?? null} />
                      </TD>
                      <TD className="hidden xl:table-cell">
                        <Signals signals={signals} />
                      </TD>
                    </TR>
                  ))}
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
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        {selected && now ? <PlayerDialog player={selected} now={now} /> : null}
      </Dialog>
    </Page>
  );
}

function StateBadge({ block }: { block: "self_exclusion" | "pause" | "cooldown" | null }) {
  if (!block) return <Badge tone="success">{t.active}</Badge>;
  return (
    <Badge tone={block === "self_exclusion" ? "danger" : "warning"}>
      {copy.rgEvents[block === "cooldown" ? "session_limit" : block]}
    </Badge>
  );
}

function Signals({ signals }: { signals: RiskSignal[] }) {
  if (signals.length === 0) return <span className="text-fg-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {signals.map((s) => (
        <Badge key={s} tone="warning">
          {copy.signals[s]}
        </Badge>
      ))}
    </div>
  );
}

function PlayerDialog({ player, now }: { player: Player; now: Date }) {
  const noteId = useId();
  const { transactions, sessions, rgEvents } = useData((state) => ({
    transactions: state.transactions,
    sessions: state.sessions,
    rgEvents: state.rgEvents,
  }));
  const setKyc = useDataStore((state) => state.setKyc);
  const setNote = useDataStore((state) => state.setOperatorNote);
  const [note, setNoteValue] = useState(player.operatorNote);
  const limits = effectiveLimits(player, now);
  const block = playBlock(player, now);
  const signals = riskSignals({ player, transactions, sessions, rgEvents, now });
  const history = rgEvents
    .filter((e) => e.playerId === player.id)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  const money = (v: number | null) => (v === null ? copy.common.noLimit : formatCurrency(v));

  return (
    <DialogContent
      title={t.details(`${player.firstName} ${player.lastName}`)}
      description={player.email}
      size="lg"
    >
      <DialogBody className="grid gap-5" tabIndex={0}>
        <div className="flex flex-wrap items-center gap-2">
          <KycBadge status={player.kyc} />
          <StateBadge block={block?.reason ?? null} />
          <Signals signals={signals} />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          {[
            [copy.register.fiscalCode, player.fiscalCode],
            [
              copy.register.birthDate,
              `${formatDate(`${player.birthDate}T12:00:00`, "short")} · ${t.age(ageOn(player.birthDate, toISODate(now)))}`,
            ],
            [
              copy.register.document,
              `${copy.documentTypes[player.document.type]} ${player.document.number}`,
            ],
            [copy.site.balance, formatCurrency(player.balance)],
            [
              copy.responsible.depositWeek,
              `${formatCurrency(depositsIn(transactions, player.id, "week", now))} / ${money(limits.depositWeek)}`,
            ],
            [
              copy.responsible.lossDay,
              `${formatCurrency(Math.max(0, netLossSince(transactions, player.id, now.getTime() - 86_400_000)))} / ${money(limits.lossDay)}`,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[12px] text-fg-muted">{label}</dt>
              <dd className="mt-0.5 break-all text-fg">{value}</dd>
            </div>
          ))}
        </dl>

        {player.kyc === "pending" ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setKyc(player.id, "verified");
                toast.success(t.approved);
              }}
            >
              {t.approve}
            </Button>
            <Button
              variant="danger-ghost"
              onClick={() => {
                setKyc(player.id, "rejected");
                toast.success(t.rejected);
              }}
            >
              {t.reject}
            </Button>
          </div>
        ) : null}

        <section aria-labelledby={`${noteId}-history`}>
          <h3 id={`${noteId}-history`} className="text-sm font-semibold text-fg">
            {t.history}
          </h3>
          <ul className="mt-2 grid gap-1.5 text-[13px]">
            {history.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-x-3">
                <span className="text-fg">
                  {copy.rgEvents[e.kind]} · {e.detail}
                </span>
                <span className="text-fg-muted">{formatDate(e.at, "dateTime")}</span>
              </li>
            ))}
          </ul>
          {block ? <p className="mt-2 text-[12px] text-fg-muted">{t.exclusionLocked}</p> : null}
        </section>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={noteId} className="text-[13px] font-medium text-fg">
            {t.note}
          </label>
          <Textarea
            id={noteId}
            value={note}
            onChange={(e) => setNoteValue(e.target.value)}
            rows={3}
            maxLength={1000}
            aria-describedby={`${noteId}-hint`}
          />
          <p id={`${noteId}-hint`} className="text-[12px] text-fg-muted">
            {t.noteHint}
          </p>
          <Button
            variant="secondary"
            className="justify-self-start"
            onClick={() => {
              setNote(player.id, note);
              toast.success(t.noteSaved);
            }}
          >
            {copy.common.save}
          </Button>
        </div>
      </DialogBody>
    </DialogContent>
  );
}
