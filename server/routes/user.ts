import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, syncUsersFromSupabase } from "../supabase-auth";

const router = Router();

// Public endpoint - no authentication required
router.get("/user-count", async (req, res) => {
    try {
        const count = await storage.getUserCount();
        res.json({ count });
    } catch (error) {
        console.error("Get user count error:", error);
        res.status(500).json({ error: "Failed to get user count" });
    }
});

// Admin endpoint to sync users from Supabase Auth to local database
router.post("/admin/sync-users", async (req, res) => {
    try {
        const result = await syncUsersFromSupabase();
        res.json({
            success: true,
            message: `Synced ${result.synced} users from Supabase`,
            synced: result.synced,
            errors: result.errors
        });
    } catch (error: any) {
        console.error("User sync error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to sync users"
        });
    }
});

// Dashboard data
router.get("/dashboard", isAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as any)?.claims?.sub || (req.session as any)?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const [cvs, sessions, latestEvaluation, creditBalance, readinessScore] = await Promise.all([
            storage.getCvsByUserId(userId),
            storage.getInterviewsByUserId(userId),
            storage.getLatestEvaluationByUserId(userId),
            storage.getUserCredits(userId),
            storage.calculateReadinessScore(userId),
        ]);

        res.json({
            cvs,
            sessions,
            latestEvaluation,
            freeCredits: creditBalance.freeCredits,
            paidCredits: creditBalance.paidCredits,
            totalCredits: creditBalance.totalCredits,
            readinessScore
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: "Failed to load dashboard" });
    }
});

export const userRouter = router;
