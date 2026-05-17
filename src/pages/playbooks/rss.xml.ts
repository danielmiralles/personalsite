import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  const entries = await getCollection("playbooks", ({ data }) => !data.draft);
  const sorted = entries.sort((a, b) => +b.data.date - +a.data.date);

  return rss({
    title: "Daniel Miralles — Playbooks",
    description:
      "Guías paso a paso para instalar, configurar o desplegar herramientas sin morir en el intento. Honestas, accionables y probadas en producción.",
    site: context.site!,
    items: sorted.map((entry) => ({
      title: entry.data.title,
      description: entry.data.excerpt,
      pubDate: entry.data.date,
      link: `/playbooks/${entry.id}/`,
      categories: entry.data.tags,
    })),
    customData: "<language>es-ES</language>",
  });
}
