import { z } from "zod";

/** Kept in sync with LIMITS in server/plagiarism.js. */
export const TEXT_LIMITS = {
  min: 100,
  max: 120_000,
};

/** Upload constraints, shared so the client can validate before sending. */
export const UPLOAD_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  extensions: [".pdf", ".docx", ".doc", ".rtf", ".txt", ".md"],
  accept: ".pdf,.docx,.doc,.rtf,.txt,.md",
};

export const checkTextSchema = z.object({
  text: z
    .string()
    .min(TEXT_LIMITS.min, `Text must be at least ${TEXT_LIMITS.min} characters long`)
    .max(
      TEXT_LIMITS.max,
      `Text must not exceed ${TEXT_LIMITS.max.toLocaleString()} characters`
    ),
  excludeCitations: z.boolean().optional().default(false),
});

export const sourceSchema = z.object({
  url: z.string(),
  similarity: z.number(),
  metrics: z
    .object({
      containment: z.number(),
      cosine: z.number(),
      fingerprint: z.number(),
      longestRun: z.number(),
    })
    .nullable()
    .optional(),
});

export const sentenceResultSchema = z.object({
  sentence: z.string(),
  similarity: z.number(),
  sources: z.array(sourceSchema),
  metrics: sourceSchema.shape.metrics,
  isPlagiarized: z.boolean(),
});

export const checkResultSchema = z.object({
  overallScore: z.number(),
  plagiarismPercentage: z.number(),
  totalSentences: z.number(),
  plagiarizedSentences: z.number(),
  analyzedChunks: z.number().optional(),
  totalChunks: z.number().optional(),
  sampled: z.boolean().optional(),
  excludeCitations: z.boolean().optional(),
  results: z.array(sentenceResultSchema),
});

export const extractResultSchema = z.object({
  text: z.string(),
  format: z.string(),
  filename: z.string(),
  characters: z.number(),
  words: z.number(),
  truncated: z.boolean(),
  meta: z.record(z.any()).optional(),
});
