import { pgTable, serial, integer, text, timestamp, varchar, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";
import { users } from "./auth";

export const featureCosts = pgTable("feature_costs", {
  id: serial("id").primaryKey(),
  featureKey: varchar("feature_key", { length: 100 }).notNull().unique(),
  featureName: varchar("feature_name", { length: 255 }).notNull(),
  creditCost: integer("credit_cost").notNull().default(0),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  packageKey: varchar("package_key", { length: 100 }).notNull().unique(),
  packageName: varchar("package_name", { length: 255 }).notNull(),
  creditsAmount: integer("credits_amount").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  creditType: varchar("credit_type", { length: 20 }).notNull().default("paid"),
  featureKey: varchar("feature_key", { length: 100 }),
  packageId: integer("package_id").references(() => creditPackages.id, { onDelete: "set null" }),
  referenceId: varchar("reference_id", { length: 255 }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  unique("unique_idempotency_key").on(table.idempotencyKey)
]);

export const featureCostsRelations = relations(featureCosts, () => ({}));

export const creditPackagesRelations = relations(creditPackages, ({ many }) => ({
  transactions: many(creditTransactions),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
  package: one(creditPackages, { fields: [creditTransactions.packageId], references: [creditPackages.id] }),
}));

export const insertFeatureCostSchema = createInsertSchema(featureCosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({ id: true, createdAt: true });

export type FeatureCost = typeof featureCosts.$inferSelect;
export type InsertFeatureCost = z.infer<typeof insertFeatureCostSchema>;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

export const TRANSACTION_TYPES = {
  PURCHASE: "purchase",
  USAGE: "usage",
  BONUS: "bonus",
  REFUND: "refund",
  ADJUSTMENT: "adjustment",
} as const;

export const TRANSACTION_SOURCES = {
  PAYMENT: "payment",
  SIGNUP_BONUS: "signup_bonus",
  REFERRAL: "referral",
  PROMO_CODE: "promo_code",
  ADMIN_GRANT: "admin_grant",
  FEATURE_USE: "feature_use",
  REFUND: "refund",
} as const;

export const FEATURE_KEYS = {
  CV_OPTIMIZATION: "cv_optimization",
  START_INTERVIEW: "start_interview",
  VOICE_INTERVIEW: "voice_interview",
  INTERVIEW_EVALUATION: "interview_evaluation",
  UNLOCK_RESULTS: "unlock_results",
} as const;

export const CREDIT_TYPES = {
  FREE: "free",
  PAID: "paid",
} as const;
