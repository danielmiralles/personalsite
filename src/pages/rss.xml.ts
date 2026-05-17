import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

type AnyEntry =
  | CollectionEntry<"posts">
  | CollectionEntry<"playbooks">
  | CollectionEntry<"pildoras">;

export async function GET(context: APIContext) {
  const [posts, playbooks, pildoras] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("playbooks", ({ data }) => !data.draft),
    getCollection("pildoras", ({ data }) => !data.draft),
  ]);

  const all = [...posts, ...playbooks, ...pildoras] as AnyEntry[];
  const sorted = all.sort((a, b) => +b.data.date - +a.data.date);

  return rss({
    title: "Daniel Miralles",
    description:
      "Posts, playbooks y píldoras en español sobre arquitectura, backend, sistemas distribuidos y lo que aprendí en producción.",
    site: context.site!,
    items: sorted.map((entry) => ({
      title: entry.data.title,
      description: entry.data.excerpt,
      pubDate: entry.data.date,
      link: `/${entry.collection}/${entry.id}/`,
      categories: entry.data.tags,
    })),
    customData: "<language>es-ES</language>",
  });
}
