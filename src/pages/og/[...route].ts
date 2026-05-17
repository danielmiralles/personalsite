import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs/promises";
import path from "node:path";

type CollectionName = "posts" | "playbooks" | "pildoras";
type AnyEntry =
  | CollectionEntry<"posts">
  | CollectionEntry<"playbooks">
  | CollectionEntry<"pildoras">;

const collections = ["posts", "playbooks", "pildoras"] as const;

const collectionLabel: Record<CollectionName, string> = {
  posts: "POST",
  playbooks: "PLAYBOOK",
  pildoras: "PÍLDORA",
};

// ─── Font loading (cached across requests) ──────────────────────────
const FONTS_BASE = path.join(process.cwd(), "node_modules", "@fontsource");

interface FontEntry {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: "normal";
}
let _fontsCache: FontEntry[] | null = null;

async function loadFonts(): Promise<FontEntry[]> {
  if (_fontsCache) return _fontsCache;
  const [sansReg, sansBold, mono] = await Promise.all([
    fs.readFile(
      path.join(FONTS_BASE, "geist-sans/files/geist-sans-latin-400-normal.woff"),
    ),
    fs.readFile(
      path.join(FONTS_BASE, "geist-sans/files/geist-sans-latin-700-normal.woff"),
    ),
    fs.readFile(
      path.join(FONTS_BASE, "geist-mono/files/geist-mono-latin-400-normal.woff"),
    ),
  ]);
  _fontsCache = [
    { name: "Geist", data: sansReg, weight: 400, style: "normal" },
    { name: "Geist", data: sansBold, weight: 700, style: "normal" },
    { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
  ];
  return _fontsCache;
}

// ─── Static paths ──────────────────────────────────────────────────
export async function getStaticPaths() {
  const all: { params: { route: string }; props: { entry: AnyEntry } }[] = [];
  for (const name of collections) {
    const entries = await getCollection(name, ({ data }) => !data.draft);
    for (const entry of entries) {
      all.push({
        params: { route: `${name}/${entry.id}.png` },
        props: { entry: entry as AnyEntry },
      });
    }
  }
  return all;
}

// ─── Endpoint ──────────────────────────────────────────────────────
export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: AnyEntry };
  const fonts = await loadFonts();

  const label = collectionLabel[entry.collection as CollectionName];

  const dateFmt = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedDate = dateFmt.format(entry.data.date);

  const tagsText = entry.data.tags
    .slice(0, 3)
    .map((t) => `#${t}`)
    .join("   ");

  const prompt = `$ cat ~/${entry.collection}/${entry.id}.mdx`;

  const markup = html(`
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0c0b0a;font-family:'Geist';color:#ece8e1;position:relative;">

      <div style="display:flex;position:absolute;top:0;left:0;right:0;height:10px;background:#f5a524;"></div>

      <div style="display:flex;flex-direction:column;padding:90px 80px 0 80px;flex:1;">

        <div style="display:flex;font-family:'Geist Mono';font-size:22px;color:#8a847a;margin-bottom:36px;">
          <span style="color:#5a544a;margin-right:14px;">$</span>
          <span>${escapeHtml(prompt.replace(/^\$ /, ""))}</span>
        </div>

        <div style="display:flex;font-size:74px;font-weight:700;line-height:1.05;letter-spacing:-1px;color:#ece8e1;margin-bottom:32px;">
          ${escapeHtml(entry.data.title)}
        </div>

        <div style="display:flex;width:88px;height:3px;background:#f5a524;margin-bottom:32px;"></div>

        <div style="display:flex;font-family:'Geist Mono';font-size:26px;color:#f5a524;margin-bottom:16px;align-items:center;">
          <span style="margin-right:18px;letter-spacing:0.06em;">${escapeHtml(label)}</span>
          <span style="color:#5a544a;margin-right:18px;">·</span>
          <span style="margin-right:18px;">${escapeHtml(entry.data.readTime)} de lectura</span>
          <span style="color:#5a544a;margin-right:18px;">·</span>
          <span>${escapeHtml(formattedDate)}</span>
        </div>

        <div style="display:flex;font-family:'Geist Mono';font-size:22px;color:#8a847a;">
          <span>${escapeHtml(tagsText)}</span>
        </div>

      </div>

      <div style="display:flex;align-items:center;padding:26px 80px 34px 80px;border-top:1px solid #26221b;font-family:'Geist Mono';font-size:22px;">
        <span style="color:#ece8e1;font-weight:700;margin-right:18px;">Daniel Miralles</span>
        <span style="color:#5a544a;margin-right:18px;">·</span>
        <span style="color:#f5a524;">daniel.sinapsys.work</span>
      </div>

    </div>
  `);

  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, { background: "#0c0b0a" });
  const png = resvg.render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
