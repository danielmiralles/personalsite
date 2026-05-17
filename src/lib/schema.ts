/**
 * Shared schema.org JSON-LD helpers for the site.
 *
 * Strategy: every page emits an @graph with a Person node identified
 * by `${siteOrigin}#person`. Article pages reference that Person by
 * @id as author and publisher, so Google sees a single consistent
 * entity across the site (which is what helps the Knowledge Graph
 * eventually connect Daniel as a real person).
 */

export const PERSON_ID_FRAGMENT = "#person";
export const WEBSITE_ID_FRAGMENT = "#website";

/**
 * sameAs links — every URL Google can use to verify this is the same
 * Daniel across the web. The more authoritative cross-links, the
 * stronger the entity-resolution signal.
 *
 * Add new profiles here as they appear (X, Bluesky, Mastodon, dev.to,
 * speaker pages, etc.).
 */
export const PERSON_SAME_AS: string[] = [
  "https://www.linkedin.com/in/danielmirallest",
  "https://github.com/danielmiralles",
  "https://x.com/danielmirallest",
];

export function personSchema(siteOrigin: string) {
  return {
    "@type": "Person",
    "@id": `${siteOrigin}/${PERSON_ID_FRAGMENT}`,
    name: "Daniel Miralles",
    givenName: "Daniel",
    familyName: "Miralles",
    jobTitle: "Solution Architect",
    description:
      "Solution Architect y Tech Lead con 14+ años diseñando sistemas distribuidos para banca, telco y healthcare. Escribe en español sobre arquitectura, backend y AI-augmented development.",
    url: siteOrigin,
    image: `${siteOrigin}/img/daniel.png`,
    email: "mailto:contact@danielmiralles.com",
    sameAs: PERSON_SAME_AS,
    worksFor: {
      "@type": "Organization",
      name: "VirtualCave",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Universidad de las Ciencias Informáticas (UCI)",
      address: {
        "@type": "PostalAddress",
        addressLocality: "La Habana",
        addressCountry: "CU",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Valencia",
      addressCountry: "ES",
    },
    knowsAbout: [
      "Software architecture",
      "Distributed systems",
      "Microservices",
      "Event-driven architecture",
      "Java",
      "Spring Boot",
      "Amazon Web Services",
      "Apache Kafka",
      "Kubernetes",
      "PostgreSQL",
      "API design",
      "AI-augmented software engineering",
    ],
    knowsLanguage: ["es", "en"],
  };
}

export function webSiteSchema(siteOrigin: string) {
  return {
    "@type": "WebSite",
    "@id": `${siteOrigin}/${WEBSITE_ID_FRAGMENT}`,
    url: siteOrigin,
    name: "Daniel Miralles",
    description:
      "Posts, playbooks y píldoras en español sobre arquitectura de software, sistemas distribuidos y lo que aprendí en producción.",
    inLanguage: "es-ES",
    publisher: { "@id": `${siteOrigin}/${PERSON_ID_FRAGMENT}` },
  };
}

export function personRef(siteOrigin: string) {
  return { "@id": `${siteOrigin}/${PERSON_ID_FRAGMENT}` };
}
