import { copy } from "@/content/it";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { LogoMark } from "@/components/site/logo";
import { BookingWizard } from "@/features/site/booking-wizard";

export default function WidgetPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <LogoMark />
        <h1 className="text-lg font-semibold text-fg">
          {copy.widget.title} · {DEMO_SETTINGS.name}
        </h1>
      </header>
      <div className="mt-6">
        <BookingWizard source="widget" compact />
      </div>
      <p className="mt-8 text-center text-xs text-fg-muted">{copy.widget.poweredBy}</p>
    </div>
  );
}
