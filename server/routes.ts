import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { optimizeCV, generateInterviewQuestions, evaluateAnswer, generateSessionEvaluation, detectWeaknessPatterns } from "./ai";
import { setupSupabaseAuth, isAuthenticated } from "./supabase-auth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getUserId(req: Request): string | null {
  return (req.user as any)?.claims?.sub || (req.session as any)?.userId || null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupSupabaseAuth(app);

  app.get("/api/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const [cvs, sessions, latestEvaluation] = await Promise.all([
        storage.getCvsByUserId(userId),
        storage.getInterviewsByUserId(userId),
        storage.getLatestEvaluationByUserId(userId),
      ]);

      res.json({ cvs, sessions, latestEvaluation });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  app.get("/api/cvs", isAuthenticated, async (req: Request, res: Response) => {
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

  app.post("/api/cvs/upload", isAuthenticated, upload.single("cv"), async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      let textContent = "";
      
      if (file.mimetype === "application/pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(file.buffer);
        textContent = pdfData.text;
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value;
      } else {
        textContent = file.buffer.toString("utf-8");
      }

      const cv = await storage.createCv({
        userId,
        originalText: textContent,
        targetRole: req.body.targetRole || null,
        jobDescription: req.body.jobDescription || null,
      });

      res.status(201).json(cv);
    } catch (error) {
      console.error("CV upload error:", error);
      res.status(500).json({ error: "Failed to upload CV" });
    }
  });

  app.post("/api/cvs/:id/optimize", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const cvId = parseInt(req.params.id);
      const cv = await storage.getCv(cvId);
      if (!cv || cv.userId !== userId) {
        return res.status(404).json({ error: "CV not found" });
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

  app.get("/api/interviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sessions = await storage.getInterviewsByUserId(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get interviews error:", error);
      res.status(500).json({ error: "Failed to get interviews" });
    }
  });

  app.get("/api/interviews/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sessionsWithEvals = await storage.getSessionsWithEvaluations(userId);
      res.json(sessionsWithEvals);
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ error: "Failed to get history" });
    }
  });

  app.get("/api/interviews/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sessionId = parseInt(req.params.id);
      const session = await storage.getInterviewSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: "Interview not found" });
      }

      const questions = await storage.getQuestionsBySessionId(sessionId);
      res.json({ ...session, questions });
    } catch (error) {
      console.error("Get interview error:", error);
      res.status(500).json({ error: "Failed to get interview" });
    }
  });

  app.post("/api/interviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { interviewType, cvId } = req.body;
      
      const session = await storage.createInterviewSession({
        userId,
        cvId: cvId || null,
        interviewType: interviewType || "behavioral",
        status: "in_progress",
      });

      let cvText = "";
      let targetRole: string | undefined;
      if (cvId) {
        const cv = await storage.getCv(cvId);
        if (cv) {
          cvText = cv.improvedText || cv.originalText;
          targetRole = cv.targetRole || undefined;
        }
      }

      const generatedQuestions = await generateInterviewQuestions(
        cvText || "No CV provided",
        interviewType,
        targetRole,
        6
      );

      for (let i = 0; i < generatedQuestions.length; i++) {
        await storage.createInterviewQuestion({
          sessionId: session.id,
          questionNumber: i + 1,
          questionText: generatedQuestions[i].questionText,
          modelAnswer: generatedQuestions[i].modelAnswer,
          answerExplanation: generatedQuestions[i].answerExplanation,
        });
      }

      const questions = await storage.getQuestionsBySessionId(session.id);
      res.status(201).json({ ...session, questions });
    } catch (error) {
      console.error("Create interview error:", error);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });

  app.post("/api/interviews/:id/answer", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sessionId = parseInt(req.params.id);
      const session = await storage.getInterviewSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: "Interview not found" });
      }

      const { questionId, answer } = req.body;
      if (!questionId || typeof answer !== "string") {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const questions = await storage.getQuestionsBySessionId(sessionId);
      const question = questions.find(q => q.id === questionId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found or does not belong to this session" });
      }

      await storage.updateInterviewQuestion(questionId, { userAnswer: answer });
      res.json({ success: true });
    } catch (error) {
      console.error("Submit answer error:", error);
      res.status(500).json({ error: "Failed to submit answer" });
    }
  });

  app.post("/api/interviews/:id/finish", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sessionId = parseInt(req.params.id);
      const session = await storage.getInterviewSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: "Interview not found" });
      }

      const questions = await storage.getQuestionsBySessionId(sessionId);
      const answeredQuestions = questions.filter(q => q.userAnswer);

      if (answeredQuestions.length === 0) {
        return res.status(400).json({ error: "No questions answered. Please answer at least one question." });
      }

      const individualScores: { communication: number; confidence: number; relevance: number; structure: number }[] = [];

      for (const question of answeredQuestions) {
        const evalResult = await evaluateAnswer(
          question.questionText,
          question.userAnswer || "",
          question.modelAnswer || undefined
        );
        individualScores.push(evalResult.scores);
      }

      const sessionEval = await generateSessionEvaluation(
        answeredQuestions.map(q => ({ question: q.questionText, answer: q.userAnswer || "" })),
        individualScores
      );

      await storage.createEvaluation({
        sessionId,
        overallScore: sessionEval.overallScore,
        communicationScore: sessionEval.communicationScore,
        confidenceScore: sessionEval.confidenceScore,
        relevanceScore: sessionEval.relevanceScore,
        structureScore: sessionEval.structureScore,
        topMistakes: sessionEval.topMistakes,
        topImprovements: sessionEval.topImprovements,
        focusPoint: sessionEval.focusPoint,
        detailedFeedback: sessionEval.detailedFeedback,
      });

      await storage.updateInterviewSession(sessionId, { 
        status: "completed",
        completedAt: new Date(),
      });

      const allUserSessions = await storage.getSessionsWithEvaluations(userId);
      if (allUserSessions.length >= 2) {
        const allAnswers = [];
        for (const s of allUserSessions.filter(s => s.status === "completed")) {
          const sQuestions = await storage.getQuestionsBySessionId(s.id);
          for (const q of sQuestions) {
            if (q.userAnswer) {
              allAnswers.push({ question: q.questionText, answer: q.userAnswer });
            }
          }
        }

        if (allAnswers.length >= 6) {
          const patterns = await detectWeaknessPatterns(allAnswers);
          for (const pattern of patterns) {
            await storage.createOrUpdateWeaknessPattern({
              userId,
              patternType: pattern.patternType,
              description: pattern.description,
              suggestion: pattern.suggestion,
            });
          }
        }
      }

      res.json({ success: true, sessionId });
    } catch (error) {
      console.error("Finish interview error:", error);
      res.status(500).json({ error: "Failed to finish interview" });
    }
  });

  app.get("/api/evaluations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sessionId = parseInt(req.params.id);
      const session = await storage.getInterviewSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: "Session not found" });
      }

      const evaluation = await storage.getEvaluationBySessionId(sessionId);
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      const questions = await storage.getQuestionsBySessionId(sessionId);
      res.json({ session: { ...session, questions }, evaluation });
    } catch (error) {
      console.error("Get evaluation error:", error);
      res.status(500).json({ error: "Failed to get evaluation" });
    }
  });

  app.get("/api/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const [evaluationsWithSessions, patterns, comparison] = await Promise.all([
        storage.getSessionsWithEvaluations(userId),
        storage.getWeaknessPatternsByUserId(userId),
        storage.getComparisonData(userId),
      ]);

      const evaluations = evaluationsWithSessions
        .filter(s => s.evaluation)
        .map(s => ({ ...s.evaluation!, session: s }));

      res.json({ evaluations, patterns, comparison });
    } catch (error) {
      console.error("Get progress error:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  return httpServer;
}
