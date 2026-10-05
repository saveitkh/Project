import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  companyName: z.string().optional(),
  market: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const preLiveAuditSchema = z.object({
  tiktokUsername: z.string().min(1, "TikTok username/account identifier is required."),
  liveTitle: z.string().min(1),
  product: z.string().min(1),
  productDescription: z.string().default(""),
  promotionalClaims: z.string().default(""),
  plannedScript: z.string().default(""),
  talkingPoints: z.string().default(""),
  targetAudience: z.string().default(""),
  market: z.string().min(1),
  plannedDurationMins: z.number().int().positive(),
});

export const practiceStatementSchema = z.object({
  statement: z.string().min(1, "Enter a statement to analyze."),
});

export const productReviewSchema = z.object({
  productName: z.string().min(1),
  category: z.string().min(1),
  manufacturer: z.string().min(1),
  description: z.string().default(""),
  claims: z.string().default(""),
  hasSupportingDocuments: z.boolean().default(false),
});

export const scriptVersionSchema = z.object({
  practiceSessionId: z.string().min(1),
  scriptText: z.string().min(1, "Script text is required."),
});

export const incidentSchema = z.object({
  type: z.enum(["WARNING", "RESTRICTION", "LIVE_INTERRUPTION", "ACCOUNT_SUSPENSION", "OTHER"]),
  description: z.string().min(1, "Description is required."),
  officialNotificationText: z.string().optional(),
  tiktokAccountId: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PreLiveAuditInput = z.infer<typeof preLiveAuditSchema>;
export type ProductReviewInputSchema = z.infer<typeof productReviewSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
