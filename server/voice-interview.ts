import { speechToText, textToSpeech } from "./audio-groq";
import type { InterviewMemory } from "@shared/models/interview";

export interface VoiceInterviewPhase {
  name: "warmup" | "core" | "deepdive" | "closing";
  questionCount: number;
  maxQuestions: number;
}

export interface VoiceInterviewState {
  phase: VoiceInterviewPhase;
  questionNumber: number;
  totalQuestions: number;
  conversationHistory: Array<{ role: "interviewer" | "candidate"; content: string }>;
  memory: InterviewMemory;
  internalEvaluations: Array<{
    questionNumber: number;
    communication: number;
    confidence: number;
    relevance: number;
    structure: number;
    notes: string;
  }>;
  isComplete: boolean;
}

export function createInitialVoiceState(): VoiceInterviewState {
  return {
    phase: { name: "warmup", questionCount: 0, maxQuestions: 2 },
    questionNumber: 0,
    totalQuestions: 8,
    conversationHistory: [],
    memory: {
      topicsCovered: [],
      skillsDiscussed: [],
      questionIntents: [],
      difficultyLevel: 1,
      conversationHistory: [],
    },
    internalEvaluations: [],
    isComplete: false,
  };
}

const VOICE_INTERVIEWER_PROMPT = `You are a professional AI Voice Interviewer conducting a realistic job interview.
Your role is to simulate a high-quality, structured, and adaptive interview experience similar to real hiring processes.

You speak clearly, professionally, and calmly.
Your tone is supportive but objective, never judgmental.

Interview Objective:
- Evaluate the candidate's suitability for the target role
- Assess communication clarity, confidence, relevance, and structure
- Adapt follow-up questions dynamically based on previous answers
- Maintain realism and logical flow (no random or repetitive questions)

Voice Interview Rules:
- Ask one question at a time
- Do NOT repeat questions
- Do NOT jump between unrelated topics
- Keep questions concise and natural for voice conversation
- Avoid long monologues

Adaptive Question Logic:
You MUST generate each new question based on:
- The quality of the previous answer
- Missing details (examples, metrics, clarity)
- Detected weaknesses or strengths
- Logical continuation of the topic

Examples:
- If the answer is vague → ask for clarification or examples
- If the answer is strong → increase difficulty slightly
- If the candidate avoids specifics → probe deeper
- If confidence is low → ask structured, supportive follow-ups

Never ask generic or disconnected questions.

Output Format:
You output ONLY the spoken question, nothing else. No explanations, no labels, just the question itself.`;

function getPhaseInstructions(phase: VoiceInterviewPhase): string {
  switch (phase.name) {
    case "warmup":
      return "This is the warm-up phase (1-2 questions). Ask about short background and role motivation. Ease the candidate into speaking with friendly but professional questions.";
    case "core":
      return "This is the core evaluation phase (3-5 questions). Ask role-specific and competency-based questions. Generate follow-ups based on the candidate's answers.";
    case "deepdive":
      return "This is the deep dive phase (1-2 questions). Ask scenario-based or behavioral questions. Test clarity, decision-making, and reasoning.";
    case "closing":
      return "This is the closing phase. Ask one reflective or self-assessment question, then thank the candidate professionally and inform them that feedback will follow.";
  }
}

function advancePhase(state: VoiceInterviewState): void {
  state.phase.questionCount++;
  
  if (state.phase.name === "warmup" && state.phase.questionCount >= state.phase.maxQuestions) {
    state.phase = { name: "core", questionCount: 0, maxQuestions: 4 };
  } else if (state.phase.name === "core" && state.phase.questionCount >= state.phase.maxQuestions) {
    state.phase = { name: "deepdive", questionCount: 0, maxQuestions: 2 };
  } else if (state.phase.name === "deepdive" && state.phase.questionCount >= state.phase.maxQuestions) {
    state.phase = { name: "closing", questionCount: 0, maxQuestions: 1 };
  } else if (state.phase.name === "closing" && state.phase.questionCount >= state.phase.maxQuestions) {
    state.isComplete = true;
  }
}

export async function transcribeAudio(audioBuffer: Buffer, format: "wav" | "mp3" | "webm" = "webm"): Promise<string> {
  return await speechToText(audioBuffer, format);
}

export async function synthesizeSpeech(text: string, voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"): Promise<Buffer> {
  return await textToSpeech(text, voice, "mp3");
}

export async function generateNextQuestion(
  state: VoiceInterviewState,
  cvText: string,
  interviewType: string,
  targetRole?: string
): Promise<{ questionText: string; state: VoiceInterviewState }> {
  const phaseInstructions = getPhaseInstructions(state.phase);
  
  const conversationContext = state.conversationHistory
    .slice(-6)
    .map((h) => `${h.role === "interviewer" ? "Interviewer" : "Candidate"}: ${h.content}`)
    .join("\n");

  const systemPrompt = `${VOICE_INTERVIEWER_PROMPT}

Current Phase: ${state.phase.name} (Question ${state.phase.questionCount + 1} of ${state.phase.maxQuestions})
${phaseInstructions}

Interview Type: ${interviewType}
${targetRole ? `Target Role: ${targetRole}` : ""}

Topics already covered: ${state.memory.topicsCovered.join(", ") || "none yet"}
Skills already discussed: ${state.memory.skillsDiscussed.join(", ") || "none yet"}

Candidate CV Summary:
${cvText.substring(0, 2000)}`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
  ];

  if (conversationContext) {
    messages.push({ role: "user", content: `Previous conversation:\n${conversationContext}\n\nGenerate the next interview question.` });
  } else {
    messages.push({ role: "user", content: "Start the interview with an opening question." });
  }

  // Use Gemini for question generation
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    systemInstruction: systemPrompt
  });
  
  const userMessage = conversationContext 
    ? `Previous conversation:\n${conversationContext}\n\nGenerate the next interview question.`
    : "Start the interview with an opening question.";
  
  const result = await model.generateContent(userMessage);
  const response = await result.response;

  const questionText = response.text().trim() || "Could you tell me about your experience?";

  state.questionNumber++;
  state.conversationHistory.push({ role: "interviewer", content: questionText });
  advancePhase(state);

  return { questionText, state };
}

export async function processAnswer(
  state: VoiceInterviewState,
  answerText: string
): Promise<{ state: VoiceInterviewState; evaluation: { communication: number; confidence: number; relevance: number; structure: number; notes: string } }> {
  state.conversationHistory.push({ role: "candidate", content: answerText });

  const evaluationPrompt = `You are evaluating a candidate's interview answer. Rate each dimension 1-100.

Question: ${state.conversationHistory[state.conversationHistory.length - 2]?.content || ""}
Answer: ${answerText}

Evaluate silently (do not share with candidate):
- Communication clarity (1-100)
- Confidence level (1-100)
- Relevance to the question (1-100)
- Answer structure/organization (1-100)

Also extract:
- Main topic discussed
- Any skills mentioned

Return JSON:
{
  "communication": number,
  "confidence": number,
  "relevance": number,
  "structure": number,
  "notes": "brief observation",
  "mainTopic": "string",
  "skillsMentioned": ["array"]
}`;

  // Use Gemini for evaluation
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    systemInstruction: evaluationPrompt + "\n\nAlways respond with valid JSON only, no markdown formatting."
  });
  
  const result = await model.generateContent(`Evaluate this answer: "${answerText}"`);
  const response = await result.response;

  let evaluation = {
    communication: 70,
    confidence: 70,
    relevance: 70,
    structure: 70,
    notes: "",
  };
  let parsedMainTopic = "";
  let parsedSkills: string[] = [];

  try {
    const text = response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(text || "{}");
    evaluation = {
      communication: parsed.communication || 70,
      confidence: parsed.confidence || 70,
      relevance: parsed.relevance || 70,
      structure: parsed.structure || 70,
      notes: parsed.notes || "",
    };

    if (parsed.mainTopic) {
      parsedMainTopic = parsed.mainTopic;
      state.memory.topicsCovered.push(parsed.mainTopic);
    }
    if (parsed.skillsMentioned && Array.isArray(parsed.skillsMentioned)) {
      parsedSkills = parsed.skillsMentioned;
      state.memory.skillsDiscussed.push(...parsed.skillsMentioned);
    }
  } catch (e) {
    console.error("Failed to parse evaluation:", e);
  }

  state.internalEvaluations.push({
    questionNumber: state.questionNumber,
    ...evaluation,
  });

  state.memory.conversationHistory.push({
    question: state.conversationHistory[state.conversationHistory.length - 2]?.content || "",
    answer: answerText,
    analysis: {
      mainTopic: parsedMainTopic || "general",
      skillsMentioned: parsedSkills,
      detailLevel: "surface",
      hasConcreteExamples: false,
      reasoningDepth: "shallow",
      strategy: "clarify",
    },
  });

  return { state, evaluation };
}

export function generateClosingMessage(): string {
  return "Thank you so much for taking the time to speak with me today. I really appreciate your thoughtful responses. Your feedback and detailed analysis will be prepared shortly. Best of luck with your interview preparation!";
}

export function calculateFinalScores(state: VoiceInterviewState): {
  overall: number;
  communication: number;
  confidence: number;
  relevance: number;
  structure: number;
} {
  if (state.internalEvaluations.length === 0) {
    return { overall: 0, communication: 0, confidence: 0, relevance: 0, structure: 0 };
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const communication = Math.round(avg(state.internalEvaluations.map((e) => e.communication)));
  const confidence = Math.round(avg(state.internalEvaluations.map((e) => e.confidence)));
  const relevance = Math.round(avg(state.internalEvaluations.map((e) => e.relevance)));
  const structure = Math.round(avg(state.internalEvaluations.map((e) => e.structure)));
  const overall = Math.round((communication + confidence + relevance + structure) / 4);

  return { overall, communication, confidence, relevance, structure };
}
