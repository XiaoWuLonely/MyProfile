import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    category: z.string(),
    period: z.string(),
    order: z.number(),
    cover: z.string(),
    coverNote: z.string(),
    stack: z.array(z.string()),
    url: z.url().optional(),
    github: z.url().optional(),
  }),
});
export const collections = { projects };
