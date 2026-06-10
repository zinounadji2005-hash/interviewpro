import { Router } from "express";
import { storage } from "../storage";
import { creditService } from "../creditService";
import { isAuthenticated, getUserId } from "../supabase-auth";
import {
    generateInterviewQuestions,
    evaluateAnswer,
    generateSessionEvaluation,
    detectWeaknessPatterns,
    createInitialMemory,
    analyzeAnswer,
    generateAdaptiveQuestion,
    updateMemory,
    shouldEndInterview
} from "../ai";
import {
    createInitialVoiceState,
    generateNextQuestion,
    processAnswer,
    transcribeAudio,
    synthesizeSpeech,
    generateClosingMessage,
    calculateFinalScores,
    type VoiceInterviewState,
} from "../voice-interview";
import { FEATURE_KEYS } from "@shared/schema";
import type { InterviewMemory } from "@shared/models/interview";

const router = Router();
const voiceInterviewSessions = new Map<string, { state: VoiceInterviewState; cvText: string; interviewType: string; targetRole?: string; dbSessionId: number }>();

router.get("/interviews", isAuthenticated, async (req, res) => {
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

router.get("/interviews/history", isAuthenticated, async (req, res) => {
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

router.get("/interviews/:id", isAuthenticated, async (req, res) => {
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

router.post("/interviews", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const deductResult = await creditService.deductCredits({
            userId,
            featureKey: FEATURE_KEYS.START_INTERVIEW
        });
        if (!deductResult.success) {
            const cost = await creditService.getFeatureCost(FEATURE_KEYS.START_INTERVIEW) || 0;
            return res.status(402).json({ error: deductResult.error || "Insufficient credits", required: cost });
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

router.post("/interviews/adaptive", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const deductResult = await creditService.deductCredits({
            userId,
            featureKey: FEATURE_KEYS.START_INTERVIEW
        });
        if (!deductResult.success) {
            const cost = await creditService.getFeatureCost(FEATURE_KEYS.START_INTERVIEW) || 0;
            return res.status(402).json({ error: deductResult.error || "Insufficient credits", required: cost });
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

router.post("/interviews/:id/adaptive-answer", isAuthenticated, async (req, res) => {
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

router.post("/interviews/:id/answer", isAuthenticated, async (req, res) => {
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

router.post("/interviews/:id/finish", isAuthenticated, async (req, res) => {
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

        const deductResult = await creditService.deductCredits({
            userId,
            featureKey: FEATURE_KEYS.INTERVIEW_EVALUATION,
            referenceId: `session-${sessionId}`
        });
        if (!deductResult.success) {
            const cost = await creditService.getFeatureCost(FEATURE_KEYS.INTERVIEW_EVALUATION) || 0;
            return res.status(402).json({ error: deductResult.error || "Insufficient credits", required: cost });
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

// Voice Interview Routes

router.post("/voice-interview/start", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { cvId, interviewType, targetRole } = req.body;
        if (!cvId || !interviewType) {
            return res.status(400).json({ error: "CV ID and interview type are required" });
        }

        const cvIdNum = typeof cvId === "string" ? Number(cvId) : cvId;
        if (isNaN(cvIdNum)) {
            return res.status(400).json({ error: "Invalid CV ID" });
        }

        const cv = await storage.getCv(cvIdNum);
        if (!cv || cv.userId !== userId) {
            return res.status(404).json({ error: "CV not found" });
        }

        const deductResult = await creditService.deductCredits({
            userId,
            featureKey: FEATURE_KEYS.VOICE_INTERVIEW,
            referenceId: `voice-cv-${cvIdNum}`
        });
        if (!deductResult.success) {
            const cost = await creditService.getFeatureCost(FEATURE_KEYS.VOICE_INTERVIEW) || 0;
            const currentCredits = await storage.getUserCredits(userId);
            return res.status(402).json({
                error: deductResult.error || "Insufficient credits",
                required: cost,
                current: currentCredits
            });
        }

        const dbSession = await storage.createInterviewSession({
            userId,
            cvId: cvIdNum,
            interviewType: `voice_${interviewType}`,
            status: "in_progress",
        });

        const sessionKey = `${userId}-${Date.now()}`;
        const state = createInitialVoiceState();

        voiceInterviewSessions.set(sessionKey, {
            state,
            cvText: cv.originalText,
            interviewType,
            targetRole,
            dbSessionId: dbSession.id,
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

        await storage.createInterviewQuestion({
            sessionId: dbSession.id,
            questionNumber: 1,
            questionText,
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

router.post("/voice-interview/answer", isAuthenticated, async (req, res) => {
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

        const currentQuestionNumber = session.state.questionNumber;
        const dbQuestions = await storage.getQuestionsBySessionId(session.dbSessionId);
        const currentDbQuestion = dbQuestions.find(q => q.questionNumber === currentQuestionNumber);
        if (currentDbQuestion) {
            await storage.updateInterviewQuestion(currentDbQuestion.id, { userAnswer: answerText });
        }

        const { state: stateAfterAnswer, evaluation } = await processAnswer(session.state, answerText);

        if (stateAfterAnswer.isComplete) {
            const closingMessage = generateClosingMessage();
            const closingAudio = await synthesizeSpeech(closingMessage);
            const scores = calculateFinalScores(stateAfterAnswer);

            const qaHistoryRaw = stateAfterAnswer.conversationHistory
                .reduce((acc: { question: string; answer: string }[], entry, idx) => {
                    if (entry.role === "interviewer") {
                        acc.push({ question: entry.content, answer: "" });
                    } else if (entry.role === "candidate" && acc.length > 0) {
                        acc[acc.length - 1].answer = entry.content;
                    }
                    return acc;
                }, []);

            const qaHistory = qaHistoryRaw.filter(qa => qa.answer.trim() !== "");

            const individualScores = stateAfterAnswer.internalEvaluations
                .slice(0, qaHistory.length)
                .map(e => ({
                    communication: e.communication,
                    confidence: e.confidence,
                    relevance: e.relevance,
                    structure: e.structure,
                }));

            if (qaHistory.length > 0 && individualScores.length > 0) {
                const evalResult = await generateSessionEvaluation(qaHistory, individualScores);

                await storage.createEvaluation({
                    sessionId: session.dbSessionId,
                    overallScore: evalResult.overallScore,
                    communicationScore: evalResult.communicationScore,
                    confidenceScore: evalResult.confidenceScore,
                    relevanceScore: evalResult.relevanceScore,
                    structureScore: evalResult.structureScore,
                    topMistakes: evalResult.topMistakes,
                    topImprovements: evalResult.topImprovements,
                    focusPoint: evalResult.focusPoint,
                    detailedFeedback: evalResult.detailedFeedback,
                });
            }

            await storage.updateInterviewSession(session.dbSessionId, {
                status: "completed",
                completedAt: new Date(),
            });

            voiceInterviewSessions.delete(sessionKey);

            return res.json({
                answerText,
                isComplete: true,
                closingMessage,
                closingAudio: closingAudio.toString("base64"),
                scores,
                conversationHistory: stateAfterAnswer.conversationHistory,
                sessionId: session.dbSessionId,
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

        await storage.createInterviewQuestion({
            sessionId: session.dbSessionId,
            questionNumber: updatedState.questionNumber,
            questionText,
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

router.post("/voice-interview/end", isAuthenticated, async (req, res) => {
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

        if (session.state.conversationHistory.length > 0) {
            const qaHistoryRaw = session.state.conversationHistory
                .reduce((acc: { question: string; answer: string }[], entry, idx) => {
                    if (entry.role === "interviewer") {
                        acc.push({ question: entry.content, answer: "" });
                    } else if (entry.role === "candidate" && acc.length > 0) {
                        acc[acc.length - 1].answer = entry.content;
                    }
                    return acc;
                }, []);

            const qaHistory = qaHistoryRaw.filter(qa => qa.answer.trim() !== "");

            const individualScores = session.state.internalEvaluations
                .slice(0, qaHistory.length)
                .map(e => ({
                    communication: e.communication,
                    confidence: e.confidence,
                    relevance: e.relevance,
                    structure: e.structure,
                }));

            if (qaHistory.length > 0 && individualScores.length > 0) {
                const evalResult = await generateSessionEvaluation(qaHistory, individualScores);

                await storage.createEvaluation({
                    sessionId: session.dbSessionId,
                    overallScore: evalResult.overallScore,
                    communicationScore: evalResult.communicationScore,
                    confidenceScore: evalResult.confidenceScore,
                    relevanceScore: evalResult.relevanceScore,
                    structureScore: evalResult.structureScore,
                    topMistakes: evalResult.topMistakes,
                    topImprovements: evalResult.topImprovements,
                    focusPoint: evalResult.focusPoint,
                    detailedFeedback: evalResult.detailedFeedback,
                });
            }

            await storage.updateInterviewSession(session.dbSessionId, {
                status: "completed",
                completedAt: new Date(),
            });
        }

        voiceInterviewSessions.delete(sessionKey);

        res.json({
            isComplete: true,
            closingMessage,
            closingAudio: closingAudio.toString("base64"),
            scores,
            conversationHistory: session.state.conversationHistory,
            sessionId: session.dbSessionId,
        });
    } catch (error) {
        console.error("Voice interview end error:", error);
        res.status(500).json({ error: "Failed to end voice interview" });
    }
});

// Get evaluation for a session
router.get("/evaluations/:id", isAuthenticated, async (req, res) => {
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

        if (!evaluation.resultsUnlocked) {
            const unlockCost = await creditService.getFeatureCost(FEATURE_KEYS.UNLOCK_RESULTS) ?? 15;

            const questionsWithoutAnswers = questions.map(q => ({
                ...q,
                modelAnswer: null,
                answerExplanation: null
            }));

            return res.json({
                session: { ...session, questions: questionsWithoutAnswers },
                evaluation: {
                    id: evaluation.id,
                    sessionId: evaluation.sessionId,
                    overallScore: null,
                    communicationScore: null,
                    confidenceScore: null,
                    relevanceScore: null,
                    structureScore: null,
                    topMistakes: null,
                    topImprovements: null,
                    focusPoint: null,
                    detailedFeedback: null,
                    resultsUnlocked: false,
                    createdAt: evaluation.createdAt
                },
                comparison: null,
                paywall: {
                    locked: true,
                    message: "Your interview analysis is ready. Unlock your results by purchasing credits.",
                    unlockCost,
                    requiresPaidCredits: true
                }
            });
        }

        const previousEvaluation = await storage.getPreviousEvaluation(sessionId, userId, session.interviewType);

        let comparison = null;
        if (previousEvaluation && previousEvaluation.resultsUnlocked) {
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

        res.json({ session: { ...session, questions }, evaluation, comparison, paywall: null });
    } catch (error) {
        console.error("Get evaluation error:", error);
        res.status(500).json({ error: "Failed to get evaluation" });
    }
});

// Text to speech standalone endpoint
router.post("/text-to-speech", isAuthenticated, async (req, res) => {
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

// Evaluation access
router.post("/evaluations/:id/unlock", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const evaluationId = parseInt(req.params.id);
        if (isNaN(evaluationId)) {
            return res.status(400).json({ error: "Invalid evaluation ID" });
        }

        const result = await creditService.unlockResults(userId, evaluationId);

        if (!result.success) {
            const statusCode = result.error?.includes("Insufficient") ? 402 : 400;
            return res.status(statusCode).json({
                error: result.error,
                requiresPaidCredits: true
            });
        }

        res.json({
            success: true,
            unlocked: result.unlocked,
            newFreeBalance: result.newFreeBalance,
            newPaidBalance: result.newPaidBalance,
            totalBalance: result.totalBalance
        });
    } catch (error) {
        console.error("Unlock results error:", error);
        res.status(500).json({ error: "Failed to unlock results" });
    }
});

export const interviewRouter = router;
