"use client";

import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { isoWeekday } from "@/lib/domain/dates";
import { slotsByWeekday } from "@/lib/domain/schedule";
import {
  COURSE_CATEGORIES,
  type Course,
  type CourseCategory,
  type Instructor,
  type WeeklySlot,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { categoryColor, CategoryLabel } from "@/components/course-badges";
import { Container, SectionHeading } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";
import Link from "next/link";

const t = copy.schedule;
type Filter = "all" | CourseCategory;

export function ScheduleView() {
  const { slots, courses, instructors } = useSiteData();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("all");
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const day = pickedDay ?? (now ? isoWeekday(now) : 1);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const visible = slots.filter(
    (s) => filter === "all" || courseById.get(s.courseId)?.category === filter,
  );
  const byDay = slotsByWeekday(visible);

  return (
    <Container className="animate-page-in py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading as="h1" title={t.title} description={t.description} />
        <Link href={routes.login} className={buttonClasses({ variant: "secondary" })}>
          {t.book}
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={t.filter}>
        {(["all", ...COURSE_CATEGORIES] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              filter === value
                ? "border-accent bg-accent-soft text-accent-soft-fg"
                : "border-line bg-surface text-fg hover:bg-surface-2",
            )}
          >
            {value !== "all" ? (
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: categoryColor(value) }}
              />
            ) : null}
            {value === "all" ? copy.courses.allCategories : copy.categories[value]}
          </button>
        ))}
      </div>

      {/* Mobile: un giorno alla volta */}
      <div className="mt-6 lg:hidden">
        <div
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1"
          role="radiogroup"
          aria-label={t.day}
        >
          {copy.weekdaysShort.map((label, i) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={day === i + 1}
              aria-label={copy.weekdays[i]}
              onClick={() => setPickedDay(i + 1)}
              className={cn(
                "h-10 min-w-12 shrink-0 rounded-full border px-3 text-sm font-medium",
                day === i + 1
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-surface text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <DayColumn
          title={copy.weekdays[day - 1] ?? ""}
          slots={byDay.get(day) ?? []}
          courses={courseById}
          instructors={instructors}
          className="mt-4"
        />
      </div>

      {/* Desktop: settimana intera */}
      <div className="mt-8 hidden gap-3 lg:grid lg:grid-cols-7">
        {copy.weekdays.map((label, i) => (
          <DayColumn
            key={label}
            title={label}
            slots={byDay.get(i + 1) ?? []}
            courses={courseById}
            instructors={instructors}
            today={now !== null && isoWeekday(now) === i + 1}
            compact
          />
        ))}
      </div>
    </Container>
  );
}

function DayColumn({
  title,
  slots,
  courses,
  instructors,
  today = false,
  compact = false,
  className,
}: {
  title: string;
  slots: WeeklySlot[];
  courses: Map<string, Course>;
  instructors: Instructor[];
  today?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("min-w-0", className)}>
      <h2
        className={cn(
          "mb-2 rounded-lg px-2 py-1.5 text-sm font-semibold",
          today ? "bg-accent-soft text-accent-soft-fg" : "text-fg",
        )}
      >
        {title}
        {today ? <span className="font-normal"> · {copy.common.today}</span> : null}
      </h2>
      {slots.length === 0 ? (
        <p className="px-2 text-[13px] text-fg-muted">{t.noClasses}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => {
            const course = courses.get(slot.courseId);
            if (!course) return null;
            const instructor = instructors.find((i) => i.id === slot.instructorId);
            return (
              <li
                key={slot.id}
                className="rounded-xl border border-line bg-surface p-3 shadow-xs"
                style={{ borderLeftColor: categoryColor(course.category), borderLeftWidth: 3 }}
              >
                <p className="text-sm font-bold text-fg tabular-nums">{slot.time}</p>
                <p
                  className={cn(
                    "font-medium text-fg",
                    compact ? "text-[13px] leading-snug" : "text-[15px]",
                  )}
                >
                  {course.name}
                </p>
                {compact ? null : <CategoryLabel category={course.category} className="mt-1" />}
                <p className="mt-1 text-xs text-fg-muted">
                  {instructor?.name ?? ""} · {copy.rooms[slot.room]}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
