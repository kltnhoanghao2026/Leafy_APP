import { z } from "zod";

export const ragChatRequestSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  threadId: z.string().optional(),
  language: z.string().optional().default("vi"),
});

export type RagChatRequest = z.infer<typeof ragChatRequestSchema>;

export const ragDocumentSchema = z.object({
  pageContent: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type RagDocument = z.infer<typeof ragDocumentSchema>;

export const planSourceSchema = z.enum(["websearch", "documents"]);

export const ragPlanSchema = z.object({
  diseaseName: z.string().optional(),
  severityLevel: z.string().optional(),
  urgency: z.string().optional(),
  source: planSourceSchema.optional(),
  plan: z.record(z.string(), z.any()).optional(), // Assuming unstructured plan for now
});

export type RagPlan = z.infer<typeof ragPlanSchema>;

export const ragWebSearchResultSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
});

export type RagWebSearchResult = z.infer<typeof ragWebSearchResultSchema>;

export const ragChatResponseSchema = z.object({
  answer: z.string(),
  threadId: z.string(),
  documents: z.array(ragDocumentSchema).optional(),
  plan: z.any().optional(), // Flexible for now
  plantId: z.string().optional(),
  webSearchResults: z.array(ragWebSearchResultSchema).optional(),
  savedPlanId: z.string().optional(),
});

export type RagChatResponse = z.infer<typeof ragChatResponseSchema>;
