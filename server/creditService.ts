import { db } from "./db";
import { 
  users, 
  featureCosts, 
  creditTransactions, 
  creditPackages,
  TRANSACTION_TYPES,
  TRANSACTION_SOURCES,
  type FeatureCost,
  type CreditPackage,
  type CreditTransaction
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface CreditOperationResult {
  success: boolean;
  newBalance?: number;
  transactionId?: number;
  error?: string;
}

export interface GrantCreditsParams {
  userId: string;
  amount: number;
  source: string;
  transactionType?: string;
  packageId?: number;
  referenceId?: string;
  idempotencyKey?: string;
  metadata?: string;
}

export interface DeductCreditsParams {
  userId: string;
  featureKey: string;
  referenceId?: string;
  metadata?: string;
}

class CreditService {
  async getFeatureCost(featureKey: string): Promise<number | null> {
    const [feature] = await db
      .select()
      .from(featureCosts)
      .where(and(eq(featureCosts.featureKey, featureKey), eq(featureCosts.isActive, true)))
      .limit(1);
    
    return feature?.creditCost ?? null;
  }

  async getAllFeatureCosts(): Promise<FeatureCost[]> {
    return db
      .select()
      .from(featureCosts)
      .where(eq(featureCosts.isActive, true));
  }

  async getActivePackages(): Promise<CreditPackage[]> {
    return db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.sortOrder);
  }

  async getPackageById(packageId: number): Promise<CreditPackage | null> {
    const [pkg] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.id, packageId))
      .limit(1);
    
    return pkg ?? null;
  }

  async getUserBalance(userId: string): Promise<number> {
    const [user] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user?.credits ?? 0;
  }

  async hasEnoughCredits(userId: string, featureKey: string): Promise<boolean> {
    const cost = await this.getFeatureCost(featureKey);
    if (cost === null) {
      return false;
    }
    
    const balance = await this.getUserBalance(userId);
    return balance >= cost;
  }

  async checkIdempotencyKey(idempotencyKey: string): Promise<CreditTransaction | null> {
    if (!idempotencyKey) return null;
    
    const [existing] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    
    return existing ?? null;
  }

  async grantCredits(params: GrantCreditsParams): Promise<CreditOperationResult> {
    const { 
      userId, 
      amount, 
      source, 
      transactionType = TRANSACTION_TYPES.PURCHASE,
      packageId,
      referenceId,
      idempotencyKey,
      metadata 
    } = params;

    if (amount <= 0) {
      return { success: false, error: "Amount must be positive" };
    }

    if (idempotencyKey) {
      const existing = await this.checkIdempotencyKey(idempotencyKey);
      if (existing) {
        return { 
          success: true, 
          newBalance: existing.balanceAfter, 
          transactionId: existing.id,
          error: "Idempotent request - transaction already processed"
        };
      }
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ credits: users.credits })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          throw new Error("User not found");
        }

        const newBalance = user.credits + amount;

        await tx
          .update(users)
          .set({ 
            credits: newBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        const [transaction] = await tx
          .insert(creditTransactions)
          .values({
            userId,
            amount,
            balanceAfter: newBalance,
            transactionType,
            source,
            packageId,
            referenceId,
            idempotencyKey,
            metadata
          })
          .returning();

        return { newBalance, transactionId: transaction.id };
      });

      return { success: true, ...result };
    } catch (error: any) {
      if (error.message?.includes("unique_idempotency_key")) {
        const existing = await this.checkIdempotencyKey(idempotencyKey!);
        if (existing) {
          return { 
            success: true, 
            newBalance: existing.balanceAfter, 
            transactionId: existing.id,
            error: "Idempotent request - transaction already processed"
          };
        }
      }
      return { success: false, error: error.message || "Failed to grant credits" };
    }
  }

  async deductCredits(params: DeductCreditsParams): Promise<CreditOperationResult> {
    const { userId, featureKey, referenceId, metadata } = params;

    const cost = await this.getFeatureCost(featureKey);
    if (cost === null) {
      return { success: false, error: `Feature '${featureKey}' not found or inactive` };
    }

    if (cost === 0) {
      const balance = await this.getUserBalance(userId);
      return { success: true, newBalance: balance };
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ credits: users.credits })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          throw new Error("User not found");
        }

        if (user.credits < cost) {
          throw new Error(`Insufficient credits. Required: ${cost}, Available: ${user.credits}`);
        }

        const newBalance = user.credits - cost;

        await tx
          .update(users)
          .set({ 
            credits: newBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        const [transaction] = await tx
          .insert(creditTransactions)
          .values({
            userId,
            amount: -cost,
            balanceAfter: newBalance,
            transactionType: TRANSACTION_TYPES.USAGE,
            source: TRANSACTION_SOURCES.FEATURE_USE,
            featureKey,
            referenceId,
            metadata
          })
          .returning();

        return { newBalance, transactionId: transaction.id };
      });

      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to deduct credits" };
    }
  }

  async getUserTransactionHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);
  }

  async refundCredits(params: {
    userId: string;
    amount: number;
    referenceId?: string;
    metadata?: string;
  }): Promise<CreditOperationResult> {
    return this.grantCredits({
      ...params,
      source: TRANSACTION_SOURCES.REFUND,
      transactionType: TRANSACTION_TYPES.REFUND
    });
  }
}

export const creditService = new CreditService();
