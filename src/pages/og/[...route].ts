import { OGImageRoute } from "astro-og-canvas";
import { getCollection, type CollectionEntry } from "astro:content";

type AnyEntry =
  | CollectionEntry<"posts">
  | CollectionEntry<"playbooks">
  | CollectionEntry<"pildoras">;

const collections = ["posts", "playbooks", "pildoras"] as const;

const allEntries: { route: string; entry: AnyEntry }[] = [];
for (const name of collections) {
  const entries = await getCollection(name, ({ data }) => !data.draft);
  for (const entry of entries) {
    allEntries.push({ route: `${name}/${entry.id}`, entry });
  }
}

const pages: Record<string, AnyEntry> = Object.fromEntries(
  allEntries.map(({ route, entry }) => [route, entry]),
);

const collectionLabel: Record<string, string> = {
  posts: "POST",
  playbooks: "PLAYBOOK",
  pildoras: "PÍLDORA",
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: "route",
  pages,
  getImageOptions: (_path, entry) => {
    const label = collectionLabel[entry.collection] ?? "";
    const tagsLine =
      entry.data.tags && entry.data.tags.length > 0
        ? entry.data.tags.slice(0, 3).map((t: string) => `#${t}`).join("  ")
        : "";

    return {
      title: entry.data.title,
      description: `${label}  ·  ${entry.data.readTime}${tagsLine ? "    " + tagsLine : ""}`,
      bgGradient: [
        [12, 11, 10],
        [22, 20, 15],
      ],
      border: { color: [245, 165, 36], width: 10, side: "block-start" },
      padding: 80,
      font: {
        title: {
          size: 64,
          families: ["Geist"],
          weight: "Bold",
          color: [236, 232, 225],
          lineHeight: 1.15,
        },
        description: {
          size: 30,
          families: ["Geist Mono"],
          weight: "Normal",
          color: [245, 165, 36],
          lineHeight: 1.5,
        },
      },
      fonts: [
        "./node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
        "./node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
      ],
    };
  },
});
