import { z } from "zod";

export const modelCallEventSchema = z.object({
  type: z.literal("modelCall"),
  purpose: z.string().optional(),
  model: z.string(),
  clusterId: z.string(),
  runId: z.string(),
  output: z.any(),
  input: z.any(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  temperature: z.number(),
  startedAt: z.number(),
  completedAt: z.number(),
});

export const runFeedbackEventSchema = z.object({
  type: z.literal("runFeedback"),
  runId: z.string(),
  clusterId: z.string(),
  score: z.number(),
  comment: z.string().optional(),
});

export const toolCallEventSchema = z.object({
  type: z.literal("toolCall"),
  toolName: z.string(),
  clusterId: z.string(),
  runId: z.string(),
  input: z.any(),
  output: z.any(),
  startedAt: z.number(),
  completedAt: z.number(),
  level: z.enum(["DEFAULT", "ERROR", "WARNING"]),
});
