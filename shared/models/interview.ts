import { pgTable, serial, integer, text, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";
import { users } from "./auth";

export const cvs = pgTable("cvs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  originalText: text("original_text").notNull(),
  improvedText: text("improved_text"),
  targetRole: text("target_role"),
  jobDescription: text("job_description"),
  analysis: jsonb("analysis"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cvId: integer("cv_id").references(() => cvs.id, { onDelete: "set null" }),
  sessionNumber: integer("session_number").notNull().default(1),
  interviewType: text("interview_type").notNull().default("behavioral"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  userAnswer: text("user_answer"),
  modelAnswer: text("model_answer"),
  answerExplanation: text("answer_explanation"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull().default(0),
  communicationScore: integer("communication_score").notNull().default(0),
  confidenceScore: integer("confidence_score").notNull().default(0),
  relevanceScore: integer("relevance_score").notNull().default(0),
  structureScore: integer("structure_score").notNull().default(0),
  topMistakes: jsonb("top_mistakes"),
  topImprovements: jsonb("top_improvements"),
  focusPoint: text("focus_point"),
  detailedFeedback: jsonb("detailed_feedback"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const weaknessPatterns = pgTable("weakness_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patternType: text("pattern_type").notNull(),
  description: text("description").notNull(),
  frequency: integer("frequency").notNull().default(1),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cvsRelations = relations(cvs, ({ one, many }) => ({
  user: one(users, { fields: [cvs.userId], references: [users.id] }),
  sessions: many(interviewSessions),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, { fields: [interviewSessions.userId], references: [users.id] }),
  cv: one(cvs, { fields: [interviewSessions.cvId], references: [cvs.id] }),
  questions: many(interviewQuestions),
  evaluation: one(evaluations),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one }) => ({
  session: one(interviewSessions, { fields: [interviewQuestions.sessionId], references: [interviewSessions.id] }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  session: one(interviewSessions, { fields: [evaluations.sessionId], references: [interviewSessions.id] }),
}));

export const weaknessPatternsRelations = relations(weaknessPatterns, ({ one }) => ({
  user: one(users, { fields: [weaknessPatterns.userId], references: [users.id] }),
}));

export const insertCvSchema = createInsertSchema(cvs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({ id: true, createdAt: true });
export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).omit({ id: true, createdAt: true });
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true, createdAt: true });
export const insertWeaknessPatternSchema = createInsertSchema(weaknessPatterns).omit({ id: true, createdAt: true, updatedAt: true });

export type CV = typeof cvs.$inferSelect;
export type InsertCV = z.infer<typeof insertCvSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type WeaknessPattern = typeof weaknessPatterns.$inferSelect;
export type InsertWeaknessPattern = z.infer<typeof insertWeaknessPatternSchema>;

export const JOB_ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Manager",
  "Sales Representative",
  "Financial Analyst",
  "Project Manager",
  "Human Resources",
  "Operations Manager",
  "Customer Success",
  "Business Analyst",
  "DevOps Engineer",
  "Quality Assurance",
  "Other",
] as const;

export const INTERVIEW_TYPES = [
  { value: "behavioral", label: "Behavioral Interview", description: "Focus on past experiences and soft skills" },
  { value: "technical", label: "Technical Interview", description: "Role-specific technical knowledge" },
  { value: "hr", label: "HR Interview", description: "Cultural fit and general questions" },
] as const;
