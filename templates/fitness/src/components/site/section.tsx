import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Contenitore di sezione del sito pubblico. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  className,
}: {
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? <p className="text-sm font-medium text-accent-text">{eyebrow}</p> : null}
      <Heading
        id={id}
        className={cn(
          "font-display font-bold tracking-tight text-balance text-fg",
          Heading === "h1" ? "mt-2 text-4xl sm:text-5xl" : "mt-1 text-3xl sm:text-4xl",
        )}
      >
        {title}
      </Heading>
      {description ? <p className="mt-3 text-base text-fg-muted">{description}</p> : null}
    </div>
  );
}
