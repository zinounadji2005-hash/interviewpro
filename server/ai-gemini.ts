import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InterviewMemory, AnswerAnalysis } from "@shared/models/interview";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const AI_MODEL = "gemini-2.0-flash-exp"; // Using latest Gemini model

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    systemInstruction: systemInstruction || "You are a helpful AI assistant."
  });
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function callGeminiJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    systemInstruction: systemInstruction || "You are a helpful AI assistant. Always respond with valid JSON only."
  });
  
  const result = await model.generateContent(`${prompt}\n\nRespond with valid JSON only, no markdown formatting.`);
  const response = await result.response;
  const text = response.text();
  
  // Remove markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("Failed to parse Gemini JSON response:", cleaned);
    throw new Error("Invalid JSON response from Gemini");
  }
}

export function createInitialMemory(): InterviewMemory {
  return {
    topicsCovered: [],
    skillsDiscussed: [],
    questionIntents: [],
    difficultyLevel: 1,
    conversationHistory: [],
  };
}

export async function analyzeAnswer(
  question: string,
  answer: string,
  memory: InterviewMemory
): Promise<AnswerAnalysis> {
  const systemPrompt = `You are an expert interview analyst. Analyze the candidate's answer to determine the next interview strategy.

Evaluate:
1. Main topic discussed
2. Skills or technologies mentioned
3. Level of detail: surface (vague), moderate (some specifics), specific (concrete details)
4. Whether concrete examples were provided
5. Reasoning depth: shallow (no reasoning), moderate (some reasoning), deep (clear decision-making process)

Based on this analysis, recommend a strategy:
- "clarify": If the answer is vague or unclear
- "deepen": If the answer is relevant but lacks depth
- "challenge": If the answer is strong and specific, push further
- "move_forward": If the topic has been sufficiently explored

Return a JSON object with:
- mainTopic: string
- skillsMentioned: string[]
- detailLevel: "surface" | "moderate" | "specific"
- hasConcreteExamples: boolean
- reasoningDepth: "shallow" | "moderate" | "deep"
- strategy: "clarify" | "deepen" | "challenge" | "move_forward"`;

  const context = memory.conversationHistory.length > 0 
    ? `Previous topics covered: ${memory.topicsCovered.join(", ")}\nSkills already discussed: ${memory.skillsDiscussed.join(", ")}`
    : "This is the first question.";

  const prompt = `${context}\n\nQuestion: ${question}\nAnswer: ${answer}`;

  try {
    return await callGeminiJSON<AnswerAnalysis>(prompt, systemPrompt);
  } catch (error) {
    console.error("Error analyzing answer:", error);
    return {
      mainTopic: "general",
      skillsMentioned: [],
      detailLevel: "surface",
      hasConcreteExamples: false,
      reasoningDepth: "shallow",
      strategy: "clarify",
    };
  }
}

export async function generateAdaptiveQuestion(
  cvText: string,
  interviewType: string,
  memory: InterviewMemory,
  lastAnalysis: AnswerAnalysis | null,
  targetRole?: string
): Promise<{ questionText: string; modelAnswer: string; answerExplanation: string; intent: string }> {
  const typeDescriptions: Record<string, string> = {
    behavioral: "behavioral questions focusing on past experiences, soft skills, teamwork, leadership, and problem-solving",
    technical: "technical questions relevant to the role, testing knowledge and practical abilities",
    hr: "HR/screening questions about career goals, company fit, and general background",
  };

  const strategyInstructions: Record<string, string> = {
    clarify: "The previous answer was vague. Ask a follow-up that requests a specific example or clarification.",
    deepen: "The previous answer was relevant but lacked depth. Ask a probing follow-up to explore further.",
    challenge: "The previous answer was strong. Challenge the candidate with a harder question on a related topic.",
    move_forward: "The previous topic was sufficiently explored. Move to a new competency area.",
  };

  const conversationContext = memory.conversationHistory
    .slice(-3)
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
    .join("\n\n");

  const systemPrompt = `You are an intelligent AI interviewer conducting a realistic ${typeDescriptions[interviewType] || "job"} interview.
${targetRole ? `Target role: ${targetRole}` : ""}

Core Principles:
- Never ask repetitive or redundant questions
- Every question must logically follow from the previous answer
- Questions should progressively increase in depth
- The interview must feel natural and attentive
- Ask ONE focused question only

Topics already covered: ${memory.topicsCovered.join(", ") || "none yet"}
Skills already discussed: ${memory.skillsDiscussed.join(", ") || "none yet"}
Current difficulty level: ${memory.difficultyLevel}/5
Question intents used: ${memory.questionIntents.join(", ") || "none yet"}

${lastAnalysis ? `Strategy for next question: ${strategyInstructions[lastAnalysis.strategy]}` : "This is the opening question. Start with a general experience question."}

Return a JSON object with:
- questionText: string (the interview question)
- modelAnswer: string (an excellent answer example)
- answerExplanation: string (why this answer works)
- intent: string (one of: "experience", "problem_solving", "decision_making", "communication", "technical")`;

  const userContent = conversationContext 
    ? `CV Summary:\n${cvText.slice(0, 1500)}\n\nRecent conversation:\n${conversationContext}\n\nGenerate the next question.`
    : `CV Summary:\n${cvText.slice(0, 1500)}\n\nGenerate the opening interview question.`;

  try {
    return await callGeminiJSON<{ questionText: string; modelAnswer: string; answerExplanation: string; intent: string }>(
      userContent,
      systemPrompt
    );
  } catch (error) {
    console.error("Error generating adaptive question:", error);
    return {
      questionText: "Tell me about yourself and your background.",
      modelAnswer: "A concise summary highlighting relevant experience and skills.",
      answerExplanation: "Opens the conversation naturally.",
      intent: "experience",
    };
  }
}

export function updateMemory(
  memory: InterviewMemory,
  question: string,
  answer: string,
  analysis: AnswerAnalysis,
  intent: string
): InterviewMemory {
  const allTopics = [...memory.topicsCovered, analysis.mainTopic];
  const uniqueTopics = allTopics.filter((topic, idx) => allTopics.indexOf(topic) === idx);
  
  const allSkills = [...memory.skillsDiscussed, ...analysis.skillsMentioned];
  const uniqueSkills = allSkills.filter((skill, idx) => allSkills.indexOf(skill) === idx);

  const updatedMemory: InterviewMemory = {
    topicsCovered: uniqueTopics,
    skillsDiscussed: uniqueSkills,
    questionIntents: [...memory.questionIntents, intent as any],
    difficultyLevel: analysis.strategy === "challenge" 
      ? Math.min(memory.difficultyLevel + 1, 5)
      : memory.difficultyLevel,
    conversationHistory: [
      ...memory.conversationHistory,
      { question, answer, analysis }
    ],
  };
  return updatedMemory;
}

export function shouldEndInterview(memory: InterviewMemory): { shouldEnd: boolean; reason: string } {
  const uniqueTopics = new Set(memory.topicsCovered);
  const questionCount = memory.conversationHistory.length;
  
  if (uniqueTopics.size >= 5) {
    return { shouldEnd: true, reason: "5 competency areas have been explored" };
  }
  if (questionCount >= 8) {
    return { shouldEnd: true, reason: "Maximum question limit reached" };
  }
  if (memory.difficultyLevel >= 4 && uniqueTopics.size >= 3) {
    return { shouldEnd: true, reason: "Sufficient depth reached across multiple areas" };
  }
  return { shouldEnd: false, reason: "" };
}

export async function optimizeCV(originalText: string, targetRole?: string, jobDescription?: string): Promise<{
  improvedText: string;
  analysis: {
    improvements: string[];
    atsScore: number;
  };
}> {
  const systemPrompt = `You are an expert CV/resume optimization specialist. Your task is to:
1. Improve wording and language to be more professional and impactful
2. Strengthen achievement statements using quantifiable metrics where possible
3. Optimize for ATS (Applicant Tracking Systems)
4. Maintain truthfulness - only enhance presentation, never fabricate

${targetRole ? `Target role: ${targetRole}` : ""}
${jobDescription ? `Job description to optimize for:\n${jobDescription}` : ""}

Return a JSON object with:
- improvedText: The fully optimized CV text
- analysis: { improvements: string[] (list of key improvements made), atsScore: number (0-100 estimated ATS compatibility) }`;

  const prompt = `Please optimize this CV:\n\n${originalText}`;

  try {
    return await callGeminiJSON<{
      improvedText: string;
      analysis: { improvements: string[]; atsScore: number };
    }>(prompt, systemPrompt);
  } catch (error) {
    console.error("Error optimizing CV:", error);
    return { improvedText: originalText, analysis: { improvements: [], atsScore: 50 } };
  }
}

export async function generateInterviewQuestions(
  cvText: string,
  interviewType: string,
  targetRole?: string,
  count: number = 6
): Promise<{ questionText: string; modelAnswer: string; answerExplanation: string }[]> {
  const typeDescriptions: Record<string, string> = {
    behavioral: "behavioral questions focusing on past experiences, soft skills, teamwork, leadership, and problem-solving using the STAR method",
    technical: "technical questions relevant to the role, testing knowledge, skills, and practical problem-solving abilities",
    hr: "HR/screening questions about career goals, salary expectations, company fit, availability, and general background",
  };

  const systemPrompt = `You are an expert interviewer. Generate ${count} realistic ${typeDescriptions[interviewType] || "interview"} questions based on the candidate's CV.

${targetRole ? `The target role is: ${targetRole}` : ""}

For each question, provide:
1. The question text (realistic and probing)
2. A model answer that would be considered excellent
3. A brief explanation of why this answer works

Return a JSON object with an array called "questions", where each item has:
- questionText: string
- modelAnswer: string
- answerExplanation: string`;

  const prompt = `Generate interview questions based on this CV:\n\n${cvText}`;

  try {
    const result = await callGeminiJSON<{ questions: Array<{ questionText: string; modelAnswer: string; answerExplanation: string }> }>(
      prompt,
      systemPrompt
    );
    return result.questions || [];
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return [];
  }
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  modelAnswer?: string
): Promise<{
  scores: {
    communication: number;
    confidence: number;
    relevance: number;
    structure: number;
  };
  feedback: string;
}> {
  const systemPrompt = `You are an expert interview coach. Evaluate the candidate's answer based on:
1. Communication (0-100): Clarity, articulation, language quality
2. Confidence (0-100): Self-assurance conveyed through word choice
3. Relevance (0-100): How well the answer addresses the question
4. Structure (0-100): Organization, use of STAR method if applicable

Return a JSON object with:
- scores: { communication: number, confidence: number, relevance: number, structure: number }
- feedback: string (brief constructive feedback)`;

  const prompt = `Question: ${question}\n\nCandidate's Answer: ${answer}${modelAnswer ? `\n\nModel Answer for reference: ${modelAnswer}` : ""}`;

  try {
    return await callGeminiJSON<{
      scores: { communication: number; confidence: number; relevance: number; structure: number };
      feedback: string;
    }>(prompt, systemPrompt);
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return { scores: { communication: 50, confidence: 50, relevance: 50, structure: 50 }, feedback: "" };
  }
}

export async function generateSessionEvaluation(
  questions: { question: string; answer: string }[],
  individualScores: { communication: number; confidence: number; relevance: number; structure: number }[]
): Promise<{
  overallScore: number;
  communicationScore: number;
  confidenceScore: number;
  relevanceScore: number;
  structureScore: number;
  topMistakes: string[];
  topImprovements: string[];
  focusPoint: string;
  detailedFeedback: any;
}> {
  const avgScores = {
    communication: Math.round(individualScores.reduce((a, b) => a + b.communication, 0) / individualScores.length),
    confidence: Math.round(individualScores.reduce((a, b) => a + b.confidence, 0) / individualScores.length),
    relevance: Math.round(individualScores.reduce((a, b) => a + b.relevance, 0) / individualScores.length),
    structure: Math.round(individualScores.reduce((a, b) => a + b.structure, 0) / individualScores.length),
  };

  const overallScore = Math.round((avgScores.communication + avgScores.confidence + avgScores.relevance + avgScores.structure) / 4);

  const systemPrompt = `You are an expert interview coach. Based on the interview Q&A, provide:
1. Top 3 critical mistakes the candidate made
2. Top 3 strengths or things done well
3. One high-impact focus point for immediate improvement

Return a JSON object with:
- topMistakes: string[] (exactly 3 items)
- topImprovements: string[] (exactly 3 items)  
- focusPoint: string (one actionable piece of advice)
- detailedFeedback: object (any additional structured feedback)`;

  const qaContext = questions.map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`).join("\n\n");
  const prompt = `Interview Q&A:\n\n${qaContext}`;

  try {
    const result = await callGeminiJSON<{
      topMistakes: string[];
      topImprovements: string[];
      focusPoint: string;
      detailedFeedback: any;
    }>(prompt, systemPrompt);

    return {
      overallScore,
      communicationScore: avgScores.communication,
      confidenceScore: avgScores.confidence,
      relevanceScore: avgScores.relevance,
      structureScore: avgScores.structure,
      topMistakes: result.topMistakes || [],
      topImprovements: result.topImprovements || [],
      focusPoint: result.focusPoint || "",
      detailedFeedback: result.detailedFeedback || {},
    };
  } catch (error) {
    console.error("Error generating session evaluation:", error);
    return {
      overallScore,
      communicationScore: avgScores.communication,
      confidenceScore: avgScores.confidence,
      relevanceScore: avgScores.relevance,
      structureScore: avgScores.structure,
      topMistakes: [],
      topImprovements: [],
      focusPoint: "",
      detailedFeedback: {},
    };
  }
}

export async function detectWeaknessPatterns(
  allAnswers: { question: string; answer: string }[]
): Promise<{ patternType: string; description: string; suggestion: string }[]> {
  const systemPrompt = `You are an expert interview coach. Analyze the answers across multiple interview sessions to detect recurring weakness patterns.

Look for patterns like:
- Unfocused or rambling introductions
- Lack of concrete examples
- Missing quantifiable results
- Poor use of STAR method
- Vague or generic responses
- Overuse of filler words
- Lack of enthusiasm or engagement

Return a JSON object with an array called "patterns", where each item has:
- patternType: string (short identifier like "unfocused_intro")
- description: string (user-friendly description)
- suggestion: string (actionable advice to improve)

Return at most 3 patterns. If no clear patterns, return an empty array.`;

  const answersContext = allAnswers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join("\n\n");
  const prompt = `Analyze these interview answers for weakness patterns:\n\n${answersContext}`;

  try {
    const result = await callGeminiJSON<{ patterns: Array<{ patternType: string; description: string; suggestion: string }> }>(
      prompt,
      systemPrompt
    );
    return result.patterns || [];
  } catch (error) {
    console.error("Error detecting weakness patterns:", error);
    return [];
  }
}
