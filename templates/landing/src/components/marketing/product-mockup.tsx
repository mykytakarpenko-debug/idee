import { copy } from "@/content/it";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const PEOPLE: { name: string; shifts: (string | null)[]; hours: number }[] = [
  { name: "Anna", shifts: ["8–14", "8–14", null, "14–20", "14–20", "9–13"], hours: 34 },
  { name: "Luca", shifts: ["14–20", null, "8–14", "8–14", "8–14", "13–19"], hours: 36 },
  { name: "Sara", shifts: [null, "14–20", "14–20", null, "8–14", "9–13"], hours: 22 },
  { name: "Omar", shifts: ["8–14", "14–20", "8–14", "8–14", null, null], hours: 24 },
];

/** Anteprima illustrativa dell'app (HTML statico, nessuna immagine da caricare). */
export function ProductMockup() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
      <figcaption className="sr-only">{copy.home.mockupLabel}</figcaption>
      <div aria-hidden className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 text-[12px] font-medium text-fg-muted">
          Settimana 43 · Negozio centro
        </span>
      </div>
      <div aria-hidden className="overflow-hidden p-3 sm:p-4">
        <div className="grid grid-cols-[4.5rem_repeat(6,1fr)_2.5rem] gap-1 text-[11px] sm:text-[12px]">
          <span />
          {DAYS.map((d) => (
            <span key={d} className="pb-1 text-center font-medium text-fg-muted">
              {d}
            </span>
          ))}
          <span className="pb-1 text-right font-medium text-fg-muted">Ore</span>
          {PEOPLE.map((p) => (
            <Row key={p.name} {...p} />
          ))}
        </div>
      </div>
    </figure>
  );
}

function Row({ name, shifts, hours }: { name: string; shifts: (string | null)[]; hours: number }) {
  return (
    <>
      <span className="flex items-center truncate font-medium text-fg">{name}</span>
      {shifts.map((s, i) => (
        <span
          key={i}
          className={
            s
              ? s.startsWith("8")
                ? "rounded-md bg-accent-soft py-2 text-center font-medium text-accent-soft-fg tabular-nums"
                : "rounded-md bg-surface-2 py-2 text-center font-medium text-fg tabular-nums"
              : "rounded-md border border-dashed border-line py-2"
          }
        >
          {s ?? ""}
        </span>
      ))}
      <span className="flex items-center justify-end font-semibold text-fg tabular-nums">
        {hours}
      </span>
    </>
  );
}
