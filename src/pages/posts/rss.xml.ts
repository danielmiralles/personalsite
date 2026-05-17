import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  const entries = await getCollection("posts", ({ data }) => !data.draft);
  const sorted = entries.sort((a, b) => +b.data.date - +a.data.date);

  return rss({
    title: "Daniel Miralles — Posts",
    description:
      "Reflexiones cortas sobre arquitectura de software, sistemas distribuidos y lo que aprendí en producción. Menos de 5 minutos por lectura.",
    site: context.site!,
    items: sorted.map((entry) => ({
      title: entry.data.title,
      description: entry.data.excerpt,
      pubDate: entry.data.date,
      link: `/posts/${entry.id}/`,
      categories: entry.data.tags,
    })),
    customData: "<language>es-ES</language>",
  });
}
