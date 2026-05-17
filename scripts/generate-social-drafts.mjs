#!/usr/bin/env node
/**
 * Generate social media drafts (LinkedIn + X) for new MDX content using Claude.
 *
 * Triggered by .github/workflows/social-drafts.yml on push to main with
 * changes under src/content/**, or manually via workflow_dispatch.
 *
 * Env:
 *   ANTHROPIC_API_KEY   required, Claude API key
 *   GH_TOKEN            required, GitHub token for issue creation (set by Actions)
 *   SITE_URL            optional, defaults to https://daniel.sinapsys.work
 *   REGENERATE_ALL      optional, "true" ignores processed state (testing)
 */
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const SITE_URL = process.env.SITE_URL || "https://daniel.sinapsys.work";
const REGENERATE_ALL = process.env.REGENERATE_ALL === "true";
const STATE_FILE = "social/.processed.json";
const RULES_FILE = "social/prompt-rules.md";
const MODEL = "claude-haiku-4-5-20251001";

const CONTENT_DIRS = [
  "src/content/posts",
  "src/content/playbooks",
  "src/content/pildoras",
];

const collectionLabel = {
  posts: "post",
  playbooks: "playbook",
  pildoras: "píldora",
};

// ─── State ──────────────────────────────────────────────────────────
async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return new Set(parsed.processed || []);
  } catch {
    return new Set();
  }
}

async function writeState(processed) {
  const data = {
    processed: Array.from(processed).sort(),
    last_run: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(data, null, 2) + "\n");
}

// ─── Discovery ──────────────────────────────────────────────────────
async function listAllContent() {
  const all = [];
  for (const dir of CONTENT_DIRS) {
    const collection = path.basename(dir);
    let files;
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const slug = file.replace(/\.(mdx?|md)$/, "");
      all.push({
        collection,
        slug,
        key: `${collection}/${slug}`,
        fullPath: path.join(dir, file),
      });
    }
  }
  return all;
}

async function readMDX(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  if (data.draft) return null;
  return { frontmatter: data, body: content };
}

// ─── LLM call ───────────────────────────────────────────────────────
async function generateDrafts(client, rules, item, mdx) {
  const url = `${SITE_URL}/${item.collection}/${item.slug}`;
  const typeName = collectionLabel[item.collection];

  const system = `${rules}

---

Contexto de esta publicación específica:
- Tipo de contenido: **${typeName}**
- URL pública final: ${url}
- Audiencia: ingenieros de software hispanohablantes, mid-senior, interesados en backend/arquitectura

Devolvé JSON exacto con la estructura indicada. Sin markdown wrapper. Sin explicaciones.`;

  const user = `Título: ${mdx.frontmatter.title}
Excerpt: ${mdx.frontmatter.excerpt}
Tags: ${(mdx.frontmatter.tags || []).join(", ")}
Tiempo de lectura: ${mdx.frontmatter.readTime || "n/a"}

---

Contenido completo:

${mdx.body.trim()}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");

  // Be permissive with possible code-fence wrapping just in case
  const stripped = text
    .replace(/^```(?:json)?\s*\n/m, "")
    .replace(/\n```\s*$/m, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch (err) {
    throw new Error(
      `Model returned invalid JSON. Raw:\n${text}\n\nParse error: ${err.message}`,
    );
  }
}

// ─── Issue body ─────────────────────────────────────────────────────
function buildIssueBody(item, mdx, drafts) {
  const url = `${SITE_URL}/${item.collection}/${item.slug}`;
  const tweetsBlock = drafts.x
    .map(
      (t, i) =>
        `**Tweet ${i + 1}** — ${t.length} caracteres\n\n\`\`\`\n${t}\n\`\`\``,
    )
    .join("\n\n");

  const tagLine = (mdx.frontmatter.tags || [])
    .map((t) => `\`#${t}\``)
    .join(" ");

  return `## 📝 Listo para revisar y publicar

**Post:** [${mdx.frontmatter.title}](${url})
**Tipo:** ${collectionLabel[item.collection]}
**Tags:** ${tagLine || "_(sin tags)_"}

---

## 🐦 X / Twitter (${drafts.x.length} tweet${drafts.x.length > 1 ? "s" : ""})

${tweetsBlock}

---

## 💼 LinkedIn (${drafts.linkedin.length} caracteres)

\`\`\`
${drafts.linkedin}
\`\`\`

---

## 🔗 Link al post

${url}

---

## ✅ Checklist

- [ ] Posteado en X
- [ ] Posteado en LinkedIn
- [ ] Cerrar este issue cuando ambos estén publicados

---

<sub>Generado automáticamente por \`${MODEL}\` desde \`${item.fullPath}\`. Si el draft no te convence, editalo a gusto antes de copiar. Si querés regenerar: borrá la entrada de \`social/.processed.json\` y empujá un commit.</sub>
`;
}

// ─── GitHub issue creation via gh CLI ──────────────────────────────
async function createIssue(title, body) {
  const tmpFile = `/tmp/social-issue-${Date.now()}.md`;
  await fs.writeFile(tmpFile, body);
  try {
    execSync(
      `gh issue create --title ${JSON.stringify(title)} --body-file ${JSON.stringify(tmpFile)}`,
      { stdio: "inherit" },
    );
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ERROR: ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const rules = await fs.readFile(RULES_FILE, "utf8");

  const state = await readState();
  const all = await listAllContent();

  const candidates = REGENERATE_ALL
    ? all
    : all.filter((item) => !state.has(item.key));

  console.log(
    `Content found: ${all.length} | already processed: ${state.size} | to process now: ${candidates.length}` +
      (REGENERATE_ALL ? " (REGENERATE_ALL=true)" : ""),
  );

  if (candidates.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of candidates) {
    console.log(`\n→ ${item.key}`);
    try {
      const mdx = await readMDX(item.fullPath);
      if (!mdx) {
        console.log("  draft frontmatter, skipping");
        state.add(item.key);
        continue;
      }

      const drafts = await generateDrafts(client, rules, item, mdx);

      if (!drafts.linkedin || !Array.isArray(drafts.x)) {
        throw new Error(
          "Invalid schema: expected { linkedin: string, x: string[] }",
        );
      }

      const title = `📢 Drafts sociales: ${mdx.frontmatter.title}`;
      const body = buildIssueBody(item, mdx, drafts);
      await createIssue(title, body);

      state.add(item.key);
      succeeded++;
      console.log("  ✓ issue created");
    } catch (err) {
      failed++;
      console.error(`  ✗ failed: ${err.message}`);
      // Do NOT add to state on failure — will retry next run
    }
  }

  await writeState(state);
  console.log(
    `\nDone. ${succeeded} succeeded, ${failed} failed. State file updated.`,
  );

  if (failed > 0 && succeeded === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
