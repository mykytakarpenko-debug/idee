import type { ClubSettings } from "@/lib/domain/types";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** Dati strutturati schema.org/ExerciseGym per i risultati di ricerca. */
export function gymJsonLd(settings: ClubSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: settings.name,
    description: settings.description,
    url: siteUrl,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      postalCode: settings.postalCode,
      addressLocality: settings.city,
      addressCountry: "IT",
    },
    openingHoursSpecification: settings.hours
      .filter((day) => day.open)
      .map((day) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[day.day - 1]}`,
        opens: day.from,
        closes: day.to,
      })),
  };
}

/** Serializza JSON-LD in modo sicuro dentro un tag <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
