export const routes = {
  home: "/",
  features: "/funzionalita",
  pricing: "/prezzi",
  about: "/chi-siamo",
  blog: "/blog",
  post: (slug: string) => `/blog/${encodeURIComponent(slug)}`,
  contact: "/contatti",
  privacy: "/privacy",
  cookies: "/cookie",
  terms: "/termini",
} as const;

export const siteNavigation = [
  { href: routes.features, label: "Funzionalità" },
  { href: routes.pricing, label: "Prezzi" },
  { href: routes.about, label: "Chi siamo" },
  { href: routes.blog, label: "Blog" },
] as const;
