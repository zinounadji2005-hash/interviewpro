import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  optimizeCV, 
  generateInterviewQuestions, 
  evaluateAnswer, 
  generateSessionEvaluation, 
  detectWeaknessPatterns,
  createInitialMemory,
  analyzeAnswer,
  generateAdaptiveQuestion,
  updateMemory,
  shouldEndInterview
} from "./ai";
import type { InterviewMemory, AnswerAnalysis } from "@shared/models/interview";
import { setupSupabaseAuth, isAuthenticated } from "./supabase-auth";
import {
  createInitialVoiceState,
  generateNextQuestion,
  processAnswer,
  transcribeAudio,
  synthesizeSpeech,
  generateClosingMessage,
  calculateFinalScores,
  type VoiceInterviewState,
} from "./voice-interview";

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

      const [cvs, sessions, latestEvaluation, credits, readinessScore] = await Promise.all([
        storage.getCvsByUserId(userId),
        storage.getInterviewsByUserId(userId),
        storage.getLatestEvaluationByUserId(userId),
        storage.getUserCredits(userId),
        storage.calculateReadinessScore(userId),
      ]);

      res.json({ cvs, sessions, latestEvaluation, credits, readinessScore });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  app.get("/api/credits", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const credits = await storage.getUserCredits(userId);
      res.json({ credits });
    } catch (error) {
      console.error("Get credits error:", error);
      res.status(500).json({ error: "Failed to get credits" });
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
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: file.buffer });
        await parser.load();
        const result = await parser.getText();
        textContent = result.text;
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

      const creditCost = 10;
      const hasCredits = await storage.deductCredits(userId, creditCost);
      if (!hasCredits) {
        return res.status(402).json({ error: "Insufficient credits", required: creditCost });
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

      const creditCost = 20;
      const hasCredits = await storage.deductCredits(userId, creditCost);
      if (!hasCredits) {
        return res.status(402).json({ error: "Insufficient credits", required: creditCost });
      }

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

  app.post("/api/interviews/adaptive", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const creditCost = 20;
      const hasCredits = await storage.deductCredits(userId, creditCost);
      if (!hasCredits) {
        return res.status(402).json({ error: "Insufficient credits", required: creditCost });
      }

      const { interviewType, cvId } = req.body;
      const initialMemory = createInitialMemory();
      
      const session = await storage.createInterviewSession({
        userId,
        cvId: cvId || null,
        interviewType: interviewType || "behavioral",
        status: "in_progress",
        interviewMemory: initialMemory,
        currentDifficulty: 1,
        competencyAreasCovered: 0,
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

      const firstQuestion = await generateAdaptiveQuestion(
        cvText || "No CV provided",
        interviewType || "behavioral",
        initialMemory,
        null,
        targetRole
      );

      const question = await storage.createInterviewQuestion({
        sessionId: session.id,
        questionNumber: 1,
        questionText: firstQuestion.questionText,
        modelAnswer: firstQuestion.modelAnswer,
        answerExplanation: firstQuestion.answerExplanation,
      });

      res.status(201).json({ 
        ...session, 
        currentQuestion: question,
        isAdaptive: true,
        canEnd: false,
        endReason: null,
      });
    } catch (error) {
      console.error("Create adaptive interview error:", error);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });

  app.post("/api/interviews/:id/adaptive-answer", isAuthenticated, async (req: Request, res: Response) => {
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
        return res.status(404).json({ error: "Question not found" });
      }

      await storage.updateInterviewQuestion(questionId, { userAnswer: answer });

      const memory = (session.interviewMemory as InterviewMemory) || createInitialMemory();
      
      const answerAnalysis = await analyzeAnswer(question.questionText, answer, memory);
      
      const questionIntent = questions.length === 1 ? "experience" : 
        answerAnalysis.strategy === "challenge" ? "problem_solving" : 
        answerAnalysis.strategy === "deepen" ? "decision_making" : "experience";
      
      const updatedMemory = updateMemory(
        memory,
        question.questionText,
        answer,
        answerAnalysis,
        questionIntent
      );

      const endCheck = shouldEndInterview(updatedMemory);
      
      await storage.updateInterviewSession(sessionId, {
        interviewMemory: updatedMemory,
        currentDifficulty: updatedMemory.difficultyLevel,
        competencyAreasCovered: updatedMemory.topicsCovered.length,
      });

      if (endCheck.shouldEnd) {
        return res.json({
          success: true,
          nextQuestion: null,
          shouldEnd: true,
          endReason: endCheck.reason,
          memory: {
            topicsCovered: updatedMemory.topicsCovered,
            skillsDiscussed: updatedMemory.skillsDiscussed,
            difficultyLevel: updatedMemory.difficultyLevel,
          },
        });
      }

      let cvText = "";
      let targetRole: string | undefined;
      if (session.cvId) {
        const cv = await storage.getCv(session.cvId);
        if (cv) {
          cvText = cv.improvedText || cv.originalText;
          targetRole = cv.targetRole || undefined;
        }
      }

      const nextQuestionData = await generateAdaptiveQuestion(
        cvText || "No CV provided",
        session.interviewType,
        updatedMemory,
        answerAnalysis,
        targetRole
      );

      const nextQuestion = await storage.createInterviewQuestion({
        sessionId: session.id,
        questionNumber: questions.length + 1,
        questionText: nextQuestionData.questionText,
        modelAnswer: nextQuestionData.modelAnswer,
        answerExplanation: nextQuestionData.answerExplanation,
      });

      res.json({
        success: true,
        nextQuestion,
        shouldEnd: false,
        endReason: null,
        strategy: answerAnalysis.strategy,
        memory: {
          topicsCovered: updatedMemory.topicsCovered,
          skillsDiscussed: updatedMemory.skillsDiscussed,
          difficultyLevel: updatedMemory.difficultyLevel,
        },
      });
    } catch (error) {
      console.error("Adaptive answer error:", error);
      res.status(500).json({ error: "Failed to process answer" });
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

      const creditCost = 15;
      const hasCredits = await storage.deductCredits(userId, creditCost);
      if (!hasCredits) {
        return res.status(402).json({ error: "Insufficient credits", required: creditCost });
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
      
      const previousEvaluation = await storage.getPreviousEvaluation(sessionId, userId, session.interviewType);
      
      let comparison = null;
      if (previousEvaluation) {
        comparison = {
          previousOverall: previousEvaluation.overallScore,
          previousCommunication: previousEvaluation.communicationScore,
          previousConfidence: previousEvaluation.confidenceScore,
          previousRelevance: previousEvaluation.relevanceScore,
          previousStructure: previousEvaluation.structureScore,
          overallChange: evaluation.overallScore - previousEvaluation.overallScore,
          communicationChange: evaluation.communicationScore - previousEvaluation.communicationScore,
          confidenceChange: evaluation.confidenceScore - previousEvaluation.confidenceScore,
          relevanceChange: evaluation.relevanceScore - previousEvaluation.relevanceScore,
          structureChange: evaluation.structureScore - previousEvaluation.structureScore,
        };
      }
      
      res.json({ session: { ...session, questions }, evaluation, comparison });
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

  const voiceInterviewSessions = new Map<string, { state: VoiceInterviewState; cvText: string; interviewType: string; targetRole?: string }>();

  app.post("/api/voice-interview/start", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { cvId, interviewType, targetRole } = req.body;
      if (!cvId || !interviewType) {
        return res.status(400).json({ error: "CV ID and interview type are required" });
      }

      const creditCost = 20;
      const currentCredits = await storage.getUserCredits(userId);
      if (currentCredits < creditCost) {
        return res.status(402).json({ 
          error: "Insufficient credits", 
          required: creditCost, 
          current: currentCredits 
        });
      }

      const cv = await storage.getCv(cvId);
      if (!cv || cv.userId !== userId) {
        return res.status(404).json({ error: "CV not found" });
      }

      await storage.deductCredits(userId, creditCost);

      const sessionKey = `${userId}-${Date.now()}`;
      const state = createInitialVoiceState();

      voiceInterviewSessions.set(sessionKey, {
        state,
        cvText: cv.originalText,
        interviewType,
        targetRole,
      });

      const { questionText, state: updatedState } = await generateNextQuestion(
        state,
        cv.originalText,
        interviewType,
        targetRole
      );

      voiceInterviewSessions.set(sessionKey, {
        ...voiceInterviewSessions.get(sessionKey)!,
        state: updatedState,
      });

      const audioBuffer = await synthesizeSpeech(questionText);
      const audioBase64 = audioBuffer.toString("base64");

      res.json({
        sessionKey,
        questionText,
        questionAudio: audioBase64,
        phase: updatedState.phase.name,
        questionNumber: updatedState.questionNumber,
        totalQuestions: updatedState.totalQuestions,
        isComplete: false,
      });
    } catch (error) {
      console.error("Voice interview start error:", error);
      res.status(500).json({ error: "Failed to start voice interview" });
    }
  });

  app.post("/api/voice-interview/answer", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { sessionKey, audio, audioFormat = "webm" } = req.body;
      if (!sessionKey || !audio) {
        return res.status(400).json({ error: "Session key and audio are required" });
      }

      const session = voiceInterviewSessions.get(sessionKey);
      if (!session) {
        return res.status(404).json({ error: "Voice interview session not found" });
      }

      const audioBuffer = Buffer.from(audio, "base64");
      const answerText = await transcribeAudio(audioBuffer, audioFormat);

      const { state: stateAfterAnswer } = await processAnswer(session.state, answerText);

      if (stateAfterAnswer.isComplete) {
        const closingMessage = generateClosingMessage();
        const closingAudio = await synthesizeSpeech(closingMessage);
        const scores = calculateFinalScores(stateAfterAnswer);

        voiceInterviewSessions.delete(sessionKey);

        return res.json({
          answerText,
          isComplete: true,
          closingMessage,
          closingAudio: closingAudio.toString("base64"),
          scores,
          conversationHistory: stateAfterAnswer.conversationHistory,
        });
      }

      const { questionText, state: updatedState } = await generateNextQuestion(
        stateAfterAnswer,
        session.cvText,
        session.interviewType,
        session.targetRole
      );

      voiceInterviewSessions.set(sessionKey, {
        ...session,
        state: updatedState,
      });

      const questionAudio = await synthesizeSpeech(questionText);

      res.json({
        answerText,
        questionText,
        questionAudio: questionAudio.toString("base64"),
        phase: updatedState.phase.name,
        questionNumber: updatedState.questionNumber,
        totalQuestions: updatedState.totalQuestions,
        isComplete: false,
      });
    } catch (error) {
      console.error("Voice interview answer error:", error);
      res.status(500).json({ error: "Failed to process answer" });
    }
  });

  app.post("/api/voice-interview/end", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { sessionKey } = req.body;
      if (!sessionKey) {
        return res.status(400).json({ error: "Session key is required" });
      }

      const session = voiceInterviewSessions.get(sessionKey);
      if (!session) {
        return res.status(404).json({ error: "Voice interview session not found" });
      }

      const scores = calculateFinalScores(session.state);
      const closingMessage = generateClosingMessage();
      const closingAudio = await synthesizeSpeech(closingMessage);

      voiceInterviewSessions.delete(sessionKey);

      res.json({
        isComplete: true,
        closingMessage,
        closingAudio: closingAudio.toString("base64"),
        scores,
        conversationHistory: session.state.conversationHistory,
      });
    } catch (error) {
      console.error("Voice interview end error:", error);
      res.status(500).json({ error: "Failed to end voice interview" });
    }
  });

  app.post("/api/text-to-speech", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { text, voice = "nova" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const audioBuffer = await synthesizeSpeech(text, voice);
      res.json({ audio: audioBuffer.toString("base64") });
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });

  return httpServer;
}
