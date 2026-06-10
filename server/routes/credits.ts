import { Router } from "express";
import { storage } from "../storage";
import { creditService } from "../creditService";
import { isAuthenticated } from "../supabase-auth";

const router = Router();

// Get user credits
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user?.claims?.sub || (req.session as any)?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const creditBalance = await storage.getUserCredits(userId);
        res.json(creditBalance);
    } catch (error) {
        console.error("Get credits error:", error);
        res.status(500).json({ error: "Failed to get credits" });
    }
});

// Get credit packages
router.get("/packages", async (req, res) => {
    try {
        const packages = await creditService.getActivePackages();
        res.json(packages);
    } catch (error) {
        console.error("Get packages error:", error);
        res.status(500).json({ error: "Failed to get credit packages" });
    }
});

// Get feature costs
router.get("/feature-costs", async (req, res) => {
    try {
        const costs = await creditService.getAllFeatureCosts();
        res.json(costs);
    } catch (error) {
        console.error("Get feature costs error:", error);
        res.status(500).json({ error: "Failed to get feature costs" });
    }
});

// Get credit history
router.get("/history", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user?.claims?.sub || (req.session as any)?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const limit = parseInt(req.query.limit as string) || 50;
        const transactions = await creditService.getUserTransactionHistory(userId, Math.min(limit, 100));
        res.json(transactions);
    } catch (error) {
        console.error("Get credit history error:", error);
        res.status(500).json({ error: "Failed to get credit history" });
    }
});

// Grant credits (Admin/Webhook)
router.post("/grant", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user?.claims?.sub || (req.session as any)?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { amount, source, transactionType, packageId, referenceId, idempotencyKey, metadata } = req.body;

        if (!amount || !source) {
            return res.status(400).json({ error: "Missing required fields: amount, source" });
        }

        const result = await creditService.grantCredits({
            userId,
            amount,
            source,
            transactionType,
            packageId,
            referenceId,
            idempotencyKey,
            metadata
        });

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            success: true,
            newFreeBalance: result.newFreeBalance,
            newPaidBalance: result.newPaidBalance,
            totalBalance: result.totalBalance,
            transactionId: result.transactionId
        });
    } catch (error) {
        console.error("Grant credits error:", error);
        res.status(500).json({ error: "Failed to grant credits" });
    }
});

export const creditsRouter = router;
