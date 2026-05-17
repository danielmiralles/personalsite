import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const baseSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.coerce.date(),
  readTime: z.string(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: baseSchema,
});

const playbooks = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/playbooks" }),
  schema: baseSchema.extend({
    difficulty: z.enum(["principiante", "intermedio", "avanzado"]).optional(),
  }),
});

const pildoras = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pildoras" }),
  schema: baseSchema.extend({
    learned: z.string().optional(),
  }),
});

export const collections = { posts, playbooks, pildoras };
