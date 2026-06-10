import { db } from "./db";
import { 
  users, 
  featureCosts, 
  creditTransactions, 
  creditPackages,
  evaluations,
  TRANSACTION_TYPES,
  TRANSACTION_SOURCES,
  CREDIT_TYPES,
  FEATURE_KEYS,
  type FeatureCost,
  type CreditPackage,
  type CreditTransaction
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface CreditOperationResult {
  success: boolean;
  newFreeBalance?: number;
  newPaidBalance?: number;
  totalBalance?: number;
  transactionId?: number;
  error?: string;
}

export interface UserBalance {
  freeCredits: number;
  paidCredits: number;
  totalCredits: number;
}

export interface GrantCreditsParams {
  userId: string;
  amount: number;
  source: string;
  creditType?: string;
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
  requirePaidCredits?: boolean;
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

  async getUserBalance(userId: string): Promise<UserBalance> {
    const [user] = await db
      .select({ freeCredits: users.freeCredits, paidCredits: users.paidCredits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const freeCredits = user?.freeCredits ?? 0;
    const paidCredits = user?.paidCredits ?? 0;
    
    return {
      freeCredits,
      paidCredits,
      totalCredits: freeCredits + paidCredits
    };
  }

  async hasEnoughCredits(userId: string, featureKey: string, requirePaid: boolean = false): Promise<boolean> {
    const cost = await this.getFeatureCost(featureKey);
    if (cost === null) {
      return false;
    }
    
    const balance = await this.getUserBalance(userId);
    
    if (requirePaid) {
      return balance.paidCredits >= cost;
    }
    
    return balance.totalCredits >= cost;
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
      creditType = CREDIT_TYPES.PAID,
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
        const balance = await this.getUserBalance(userId);
        return { 
          success: true, 
          newFreeBalance: balance.freeCredits,
          newPaidBalance: balance.paidCredits,
          totalBalance: balance.totalCredits,
          transactionId: existing.id,
          error: "Idempotent request - transaction already processed"
        };
      }
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ freeCredits: users.freeCredits, paidCredits: users.paidCredits })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          throw new Error("User not found");
        }

        let newFreeBalance = user.freeCredits;
        let newPaidBalance = user.paidCredits;

        if (creditType === CREDIT_TYPES.FREE) {
          newFreeBalance += amount;
        } else {
          newPaidBalance += amount;
        }

        await tx
          .update(users)
          .set({ 
            freeCredits: newFreeBalance,
            paidCredits: newPaidBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        const [transaction] = await tx
          .insert(creditTransactions)
          .values({
            userId,
            amount,
            balanceAfter: newFreeBalance + newPaidBalance,
            transactionType,
            source,
            creditType,
            packageId,
            referenceId,
            idempotencyKey,
            metadata
          })
          .returning();

        return { 
          newFreeBalance, 
          newPaidBalance, 
          totalBalance: newFreeBalance + newPaidBalance,
          transactionId: transaction.id 
        };
      });

      return { success: true, ...result };
    } catch (error: any) {
      if (error.message?.includes("unique_idempotency_key")) {
        const existing = await this.checkIdempotencyKey(idempotencyKey!);
        if (existing) {
          const balance = await this.getUserBalance(userId);
          return { 
            success: true, 
            newFreeBalance: balance.freeCredits,
            newPaidBalance: balance.paidCredits,
            totalBalance: balance.totalCredits,
            transactionId: existing.id,
            error: "Idempotent request - transaction already processed"
          };
        }
      }
      return { success: false, error: error.message || "Failed to grant credits" };
    }
  }

  async deductCredits(params: DeductCreditsParams): Promise<CreditOperationResult> {
    const { userId, featureKey, referenceId, metadata, requirePaidCredits = false } = params;

    const cost = await this.getFeatureCost(featureKey);
    if (cost === null) {
      return { success: false, error: `Feature '${featureKey}' not found or inactive` };
    }

    if (cost === 0) {
      const balance = await this.getUserBalance(userId);
      return { 
        success: true, 
        newFreeBalance: balance.freeCredits,
        newPaidBalance: balance.paidCredits,
        totalBalance: balance.totalCredits
      };
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ freeCredits: users.freeCredits, paidCredits: users.paidCredits })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          throw new Error("User not found");
        }

        let newFreeBalance = user.freeCredits;
        let newPaidBalance = user.paidCredits;
        let creditTypeUsed: string = CREDIT_TYPES.FREE;
        let remaining = cost;

        if (requirePaidCredits) {
          if (user.paidCredits < cost) {
            throw new Error(`Insufficient paid credits. Required: ${cost}, Available: ${user.paidCredits}. Purchase more credits to unlock results.`);
          }
          newPaidBalance -= cost;
          creditTypeUsed = CREDIT_TYPES.PAID;
        } else {
          if (user.freeCredits + user.paidCredits < cost) {
            throw new Error(`Insufficient credits. Required: ${cost}, Available: ${user.freeCredits + user.paidCredits}`);
          }

          if (user.freeCredits >= remaining) {
            newFreeBalance -= remaining;
            creditTypeUsed = CREDIT_TYPES.FREE;
          } else {
            remaining -= user.freeCredits;
            newFreeBalance = 0;
            newPaidBalance -= remaining;
            creditTypeUsed = user.freeCredits > 0 ? "mixed" : CREDIT_TYPES.PAID;
          }
        }

        await tx
          .update(users)
          .set({ 
            freeCredits: newFreeBalance,
            paidCredits: newPaidBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        const [transaction] = await tx
          .insert(creditTransactions)
          .values({
            userId,
            amount: -cost,
            balanceAfter: newFreeBalance + newPaidBalance,
            transactionType: TRANSACTION_TYPES.USAGE,
            source: TRANSACTION_SOURCES.FEATURE_USE,
            creditType: creditTypeUsed,
            featureKey,
            referenceId,
            metadata
          })
          .returning();

        return { 
          newFreeBalance, 
          newPaidBalance, 
          totalBalance: newFreeBalance + newPaidBalance,
          transactionId: transaction.id 
        };
      });

      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to deduct credits" };
    }
  }

  async unlockResults(userId: string, evaluationId: number): Promise<CreditOperationResult & { unlocked?: boolean }> {
    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, evaluationId))
      .limit(1);

    if (!evaluation) {
      return { success: false, error: "Evaluation not found" };
    }

    if (evaluation.resultsUnlocked) {
      const balance = await this.getUserBalance(userId);
      return { 
        success: true, 
        unlocked: true, 
        newFreeBalance: balance.freeCredits,
        newPaidBalance: balance.paidCredits,
        totalBalance: balance.totalCredits,
        error: "Results already unlocked" 
      };
    }

    const unlockCost = await this.getFeatureCost(FEATURE_KEYS.UNLOCK_RESULTS) ?? 15;

    const balance = await this.getUserBalance(userId);
    if (balance.paidCredits < unlockCost) {
      return { 
        success: false, 
        error: `Insufficient paid credits. Required: ${unlockCost}, Available: ${balance.paidCredits}. Purchase more credits to unlock your interview results.` 
      };
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ freeCredits: users.freeCredits, paidCredits: users.paidCredits })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          throw new Error("User not found");
        }

        if (user.paidCredits < unlockCost) {
          throw new Error(`Insufficient paid credits. Required: ${unlockCost}, Available: ${user.paidCredits}`);
        }

        const newPaidBalance = user.paidCredits - unlockCost;
        const newFreeBalance = user.freeCredits;

        await tx
          .update(users)
          .set({ 
            paidCredits: newPaidBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        await tx
          .update(evaluations)
          .set({ resultsUnlocked: true })
          .where(eq(evaluations.id, evaluationId));

        const [transaction] = await tx
          .insert(creditTransactions)
          .values({
            userId,
            amount: -unlockCost,
            balanceAfter: newFreeBalance + newPaidBalance,
            transactionType: TRANSACTION_TYPES.USAGE,
            source: TRANSACTION_SOURCES.FEATURE_USE,
            creditType: CREDIT_TYPES.PAID,
            featureKey: FEATURE_KEYS.UNLOCK_RESULTS,
            referenceId: `evaluation:${evaluationId}`,
            metadata: JSON.stringify({ evaluationId })
          })
          .returning();

        return { 
          newFreeBalance, 
          newPaidBalance, 
          totalBalance: newFreeBalance + newPaidBalance,
          transactionId: transaction.id,
          unlocked: true
        };
      });

      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to unlock results" };
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
      creditType: CREDIT_TYPES.PAID,
      source: TRANSACTION_SOURCES.REFUND,
      transactionType: TRANSACTION_TYPES.REFUND
    });
  }

  async grantSignupBonus(userId: string): Promise<CreditOperationResult> {
    return this.grantCredits({
      userId,
      amount: 30,
      source: TRANSACTION_SOURCES.SIGNUP_BONUS,
      creditType: CREDIT_TYPES.FREE,
      transactionType: TRANSACTION_TYPES.BONUS,
      idempotencyKey: `signup_bonus:${userId}`
    });
  }
}

export const creditService = new CreditService();
