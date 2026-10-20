import type { BusinessSettings } from "@/lib/domain/types";

/**
 * Dati strutturati schema.org/ProfessionalService con l'azione di prenotazione.
 * Cambia "@type" in base all'attività (es. BeautySalon, Dentist, LegalService).
 */
export function businessJsonLd(settings: BusinessSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
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
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/prenota` },
    },
  };
}

/** Serializza JSON-LD in modo sicuro dentro un tag <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
