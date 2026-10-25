"use client";

import { CircleCheck, CircleDashed, FolderKanban, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { projectProgress } from "@/lib/domain/billing";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { formatDate } from "@/lib/format";
import { HealthBadge, ProjectStatusBadge } from "@/components/badges";
import { Meter } from "@/components/charts/meter";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";

const p = copy.projects;
const STATUS_ORDER = { active: 0, planning: 1, on_hold: 2, completed: 3 } as const;

export function ProjectsView() {
  const now = useNow();
  const { org } = useAuth();
  const { projects, users } = useData((state) => ({
    projects: state.projects,
    users: state.users,
  }));
  const own = useMemo(
    () =>
      projects
        .filter((project) => project.orgId === org?.id)
        .sort(
          (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.due.localeCompare(b.due),
        ),
    [projects, org?.id],
  );
  const today = now ? toISODate(now) : "";
  const date = (iso: string) => formatDate(parseISODate(iso), "short");

  return (
    <Page>
      <PageHeader title={p.title} description={p.description} />
      {own.length === 0 ? (
        <EmptyState icon={FolderKanban} title={p.empty} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {own.map((project) => {
            const progress = projectProgress(project.milestones);
            const manager = users.find((u) => u.id === project.managerId);
            return (
              <li key={project.id}>
                <Card className="h-full">
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-fg">{project.name}</h2>
                        <p className="mt-1 text-sm text-fg-muted">{project.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <ProjectStatusBadge value={project.status} />
                        {project.status !== "completed" ? (
                          <HealthBadge value={project.health} />
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-fg-muted">{p.progress}</span>
                        <span className="font-medium text-fg tabular-nums">
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                      <Meter
                        value={progress}
                        label={`${p.progress}: ${project.name}`}
                        valueText={copy.a11y.progress(Math.round(progress * 100))}
                        warnAbove={2}
                        className="mt-1.5"
                      />
                    </div>
                    <p className="text-[13px] text-fg-muted">
                      {p.period(date(project.start), date(project.due))}
                      {manager ? ` · ${p.manager}: ${manager.name}` : ""}
                    </p>
                    <div>
                      <h3 className="text-[13px] font-medium text-fg">{p.milestones}</h3>
                      <ol className="mt-2 space-y-2">
                        {project.milestones.map((m) => {
                          const late = !m.done && today !== "" && m.due < today;
                          const Icon = m.done ? CircleCheck : late ? TriangleAlert : CircleDashed;
                          return (
                            <li key={m.id} className="flex items-center gap-2.5 text-sm">
                              <Icon
                                aria-hidden
                                className={
                                  m.done
                                    ? "size-4 shrink-0 text-success"
                                    : late
                                      ? "size-4 shrink-0 text-danger"
                                      : "size-4 shrink-0 text-fg-subtle"
                                }
                              />
                              <span className="flex-1 text-fg">
                                {m.title}
                                <span className="sr-only">
                                  {" "}
                                  ({m.done ? p.done : late ? p.late : p.upcoming})
                                </span>
                              </span>
                              <span
                                className={
                                  late
                                    ? "text-[13px] font-medium text-danger"
                                    : "text-[13px] text-fg-muted"
                                }
                              >
                                {late ? `${p.late} · ` : ""}
                                {formatDate(parseISODate(m.due), "dayMonth")}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
