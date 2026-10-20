import { CircleAlert } from "lucide-react";
import { useId, type ReactNode } from "react";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";

export interface ControlProps {
  id: string;
  name: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  required?: boolean;
}

interface FieldProps {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  error?: string;
  /** Mostra "(facoltativo)" accanto all'etichetta. */
  optional?: boolean;
  className?: string;
  /** Riceve id e attributi ARIA da applicare al controllo. */
  children: (props: ControlProps) => ReactNode;
}

/**
 * Campo di modulo accessibile: etichetta collegata, suggerimento e messaggio
 * di errore annunciati dagli screen reader tramite aria-describedby.
 */
export function Field({ label, name, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-fg">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-fg-muted">({copy.common.optional})</span>
        ) : null}
      </label>
      {children({
        id,
        name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        required: optional ? undefined : true,
      })}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-[13px] text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Riga con interruttore/checkbox ed etichetta descrittiva. */
export function ToggleRow({
  label,
  description,
  control,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  control: (ids: { labelId: string; descriptionId?: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-fg">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-[13px] text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {control({ labelId, descriptionId })}
    </div>
  );
}
