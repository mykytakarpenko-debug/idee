"use client";

import { ArrowRight, Clock, Sprout } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useSiteData } from "@/hooks/use-site-data";
import { COURSE_CATEGORIES, type CourseCategory } from "@/lib/domain/types";
import { CategoryLabel, IntensityMeter } from "@/components/course-badges";
import { Container, SectionHeading } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";

const t = copy.courses;
type Filter = "all" | CourseCategory;

export function CoursesView() {
  const { courses, slots, instructors } = useSiteData();
  const [filter, setFilter] = useState<Filter>("all");
  const list = courses.filter((c) => filter === "all" || c.category === filter);

  return (
    <Container className="animate-page-in py-12 sm:py-16">
      <SectionHeading as="h1" title={t.title} description={t.description} />
      <SegmentedControl<Filter>
        className="mt-8"
        ariaLabel={copy.schedule.filter}
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t.allCategories },
          ...COURSE_CATEGORIES.map((c) => ({ value: c, label: copy.categories[c] })),
        ]}
      />
      <p className="mt-4 text-sm text-fg-muted" aria-live="polite">
        {copy.common.results(list.length)}
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((course) => {
          const courseSlots = slots.filter((s) => s.courseId === course.id);
          const teachers = [...new Set(courseSlots.map((s) => s.instructorId))]
            .map((id) => instructors.find((i) => i.id === id)?.name)
            .filter(Boolean);
          return (
            <li
              key={course.id}
              className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <CategoryLabel category={course.category} />
                {course.beginnerFriendly ? (
                  <Badge tone="success">
                    <Sprout aria-hidden />
                    {t.beginner}
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-fg">{course.name}</h2>
              <p className="mt-2 flex-1 text-sm text-fg-muted">{course.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <IntensityMeter value={course.intensity} />
                <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                  <Clock aria-hidden className="size-3.5" />
                  {t.duration(course.durationMin)}
                </span>
              </div>
              <p className="mt-3 text-xs text-fg-muted">
                {t.weekly(courseSlots.length)}
                {teachers.length ? ` · ${t.with} ${teachers.join(", ")}` : ""}
              </p>
              <Link
                href={routes.schedule}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
              >
                {t.seeSchedule}
                <span className="sr-only"> · {course.name}</span>
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
