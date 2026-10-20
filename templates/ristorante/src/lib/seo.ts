import type { RestaurantSettings } from "@/lib/domain/types";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/**
 * Dati strutturati schema.org/Restaurant per i risultati di ricerca.
 * Aggiorna `servesCuisine` e `priceRange` in base al locale.
 */
export function restaurantJsonLd(settings: RestaurantSettings, siteUrl: string) {
  const openingHoursSpecification = settings.hours.flatMap((day) =>
    (["lunch", "dinner"] as const)
      .filter((service) => day[service].open)
      .map((service) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[day.day - 1]}`,
        opens: day[service].from,
        closes: day[service].to,
      })),
  );
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.name,
    description: settings.description,
    url: siteUrl,
    telephone: settings.phone,
    email: settings.email,
    servesCuisine: "Italiana",
    priceRange: "€€",
    acceptsReservations: settings.booking.enabled,
    hasMenu: `${siteUrl}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      postalCode: settings.postalCode,
      addressLocality: settings.city,
      addressCountry: "IT",
    },
    openingHoursSpecification,
  };
}

/** Serializza JSON-LD in modo sicuro dentro un tag <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
