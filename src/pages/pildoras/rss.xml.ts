import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  const entries = await getCollection("pildoras", ({ data }) => !data.draft);
  const sorted = entries.sort((a, b) => +b.data.date - +a.data.date);

  return rss({
    title: "Daniel Miralles — Píldoras",
    description:
      "Lecciones cortas de errores en producción y lo que aprendí. Un bug, una causa raíz, una lección — para que tú no tengas que pasarlo.",
    site: context.site!,
    items: sorted.map((entry) => ({
      title: entry.data.title,
      description: entry.data.excerpt,
      pubDate: entry.data.date,
      link: `/pildoras/${entry.id}/`,
      categories: entry.data.tags,
    })),
    customData: "<language>es-ES</language>",
  });
}
