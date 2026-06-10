import { Router } from "express";
import multer from "multer";
import { storage } from "../storage";
import { optimizeCV } from "../ai";
import { validateCVName } from "../nameValidation";
import { creditService } from "../creditService";
import { FEATURE_KEYS } from "@shared/schema";
import { isAuthenticated, getUserId } from "../supabase-auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/cvs", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const cvs = await storage.getCvsByUserId(userId);
        res.json(cvs);
    } catch (error) {
        console.error("Get CVs error:", error);
        res.status(500).json({ error: "Failed to get CVs" });
    }
});

router.post("/cvs/upload", isAuthenticated, upload.single("cv"), async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const file = req.file;
        if (!file) return res.status(400).json({ error: "No file uploaded" });

        let textContent = "";

        if (file.mimetype === "application/pdf") {
            const { PDFParse } = await import("pdf-parse");
            const parser = new PDFParse({ data: file.buffer });
            const result = await parser.getText();
            textContent = result.text;
        } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const mammoth = await import("mammoth");
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            textContent = result.value;
        } else {
            textContent = file.buffer.toString("utf-8");
        }

        const user = await storage.getUser(userId);
        const nameValidation = await validateCVName(
            textContent,
            user?.firstName || null,
            user?.lastName || null
        );

        const cv = await storage.createCv({
            userId,
            originalText: textContent,
            targetRole: req.body.targetRole || null,
            jobDescription: req.body.jobDescription || null,
            cvNameExtracted: nameValidation.cvNameExtracted || null,
            nameMatchScore: nameValidation.matchScore,
            nameValidationStatus: nameValidation.status,
        });

        res.status(201).json({
            ...cv,
            nameValidation: {
                extractedName: nameValidation.cvNameExtracted,
                matchScore: nameValidation.matchScore,
                status: nameValidation.status,
                message: nameValidation.message,
            },
        });
    } catch (error) {
        console.error("CV upload error:", error);
        res.status(500).json({ error: "Failed to upload CV" });
    }
});

router.post("/cvs/:id/optimize", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const cvId = parseInt(req.params.id);
        const cv = await storage.getCv(cvId);
        if (!cv || cv.userId !== userId) {
            return res.status(404).json({ error: "CV not found" });
        }

        const deductResult = await creditService.deductCredits({
            userId,
            featureKey: FEATURE_KEYS.CV_OPTIMIZATION,
            referenceId: `cv-${cvId}`
        });
        if (!deductResult.success) {
            const cost = await creditService.getFeatureCost(FEATURE_KEYS.CV_OPTIMIZATION) || 0;
            return res.status(402).json({ error: deductResult.error || "Insufficient credits", required: cost });
        }

        const { targetRole, jobDescription } = req.body;
        const result = await optimizeCV(cv.originalText, targetRole || cv.targetRole || undefined, jobDescription || cv.jobDescription || undefined);

        const updatedCv = await storage.updateCv(cvId, {
            improvedText: result.improvedText,
            analysis: result.analysis,
            targetRole: targetRole || cv.targetRole,
            jobDescription: jobDescription || cv.jobDescription,
        });

        res.json(updatedCv);
    } catch (error) {
        console.error("CV optimize error:", error);
        res.status(500).json({ error: "Failed to optimize CV" });
    }
});

router.post("/cvs/:id/confirm", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const cvId = parseInt(req.params.id);
        const cv = await storage.getCv(cvId);
        if (!cv || cv.userId !== userId) {
            return res.status(404).json({ error: "CV not found" });
        }

        if (cv.nameMatchScore !== null && cv.nameMatchScore < 60) {
            return res.status(403).json({
                error: "Cannot confirm CV with low name match score. Please upload a CV that matches your account name."
            });
        }

        const updatedCv = await storage.updateCv(cvId, {
            nameValidationStatus: "verified",
        });

        res.json({ success: true, cv: updatedCv });
    } catch (error) {
        console.error("CV confirm error:", error);
        res.status(500).json({ error: "Failed to confirm CV ownership" });
    }
});

export const cvRouter = router;
