import { 
  users, 
  cvs, 
  interviewSessions, 
  interviewQuestions,
  evaluations,
  weaknessPatterns,
  type User, 
  type CV,
  type InsertCV,
  type InterviewSession,
  type InsertInterviewSession,
  type InterviewQuestion,
  type InsertInterviewQuestion,
  type Evaluation,
  type InsertEvaluation,
  type WeaknessPattern,
  type InsertWeaknessPattern,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  
  getCvsByUserId(userId: string): Promise<CV[]>;
  getCv(id: number): Promise<CV | undefined>;
  createCv(cv: InsertCV): Promise<CV>;
  updateCv(id: number, data: Partial<InsertCV>): Promise<CV | undefined>;
  
  getInterviewsByUserId(userId: string): Promise<InterviewSession[]>;
  getInterviewSession(id: number): Promise<InterviewSession | undefined>;
  createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession>;
  updateInterviewSession(id: number, data: Partial<InterviewSession>): Promise<InterviewSession | undefined>;
  
  getQuestionsBySessionId(sessionId: number): Promise<InterviewQuestion[]>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  updateInterviewQuestion(id: number, data: Partial<InterviewQuestion>): Promise<InterviewQuestion | undefined>;
  
  getEvaluationBySessionId(sessionId: number): Promise<Evaluation | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  
  getWeaknessPatternsByUserId(userId: string): Promise<WeaknessPattern[]>;
  createOrUpdateWeaknessPattern(pattern: InsertWeaknessPattern): Promise<WeaknessPattern>;
  
  getSessionsWithEvaluations(userId: string): Promise<(InterviewSession & { evaluation: Evaluation | null })[]>;
  getLatestEvaluationByUserId(userId: string): Promise<Evaluation | null>;
  getComparisonData(userId: string): Promise<{ round1: Evaluation | null; round2: Evaluation | null } | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getCvsByUserId(userId: string): Promise<CV[]> {
    return db.select().from(cvs).where(eq(cvs.userId, userId)).orderBy(desc(cvs.createdAt));
  }

  async getCv(id: number): Promise<CV | undefined> {
    const [cv] = await db.select().from(cvs).where(eq(cvs.id, id));
    return cv || undefined;
  }

  async createCv(cv: InsertCV): Promise<CV> {
    const [newCv] = await db.insert(cvs).values(cv).returning();
    return newCv;
  }

  async updateCv(id: number, data: Partial<InsertCV>): Promise<CV | undefined> {
    const [updated] = await db.update(cvs).set({ ...data, updatedAt: new Date() }).where(eq(cvs.id, id)).returning();
    return updated || undefined;
  }

  async getInterviewsByUserId(userId: string): Promise<InterviewSession[]> {
    return db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId)).orderBy(desc(interviewSessions.createdAt));
  }

  async getInterviewSession(id: number): Promise<InterviewSession | undefined> {
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id));
    return session || undefined;
  }

  async createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession> {
    const existingSessions = await db.select().from(interviewSessions).where(eq(interviewSessions.userId, session.userId));
    const sessionNumber = existingSessions.length + 1;
    const [newSession] = await db.insert(interviewSessions).values({ ...session, sessionNumber }).returning();
    return newSession;
  }

  async updateInterviewSession(id: number, data: Partial<InterviewSession>): Promise<InterviewSession | undefined> {
    const [updated] = await db.update(interviewSessions).set(data).where(eq(interviewSessions.id, id)).returning();
    return updated || undefined;
  }

  async getQuestionsBySessionId(sessionId: number): Promise<InterviewQuestion[]> {
    return db.select().from(interviewQuestions).where(eq(interviewQuestions.sessionId, sessionId)).orderBy(interviewQuestions.questionNumber);
  }

  async createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const [newQuestion] = await db.insert(interviewQuestions).values(question).returning();
    return newQuestion;
  }

  async updateInterviewQuestion(id: number, data: Partial<InterviewQuestion>): Promise<InterviewQuestion | undefined> {
    const [updated] = await db.update(interviewQuestions).set(data).where(eq(interviewQuestions.id, id)).returning();
    return updated || undefined;
  }

  async getEvaluationBySessionId(sessionId: number): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.sessionId, sessionId));
    return evaluation || undefined;
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEval] = await db.insert(evaluations).values(evaluation).returning();
    return newEval;
  }

  async getWeaknessPatternsByUserId(userId: string): Promise<WeaknessPattern[]> {
    return db.select().from(weaknessPatterns).where(eq(weaknessPatterns.userId, userId)).orderBy(desc(weaknessPatterns.frequency));
  }

  async createOrUpdateWeaknessPattern(pattern: InsertWeaknessPattern): Promise<WeaknessPattern> {
    const existing = await db.select().from(weaknessPatterns)
      .where(and(eq(weaknessPatterns.userId, pattern.userId), eq(weaknessPatterns.patternType, pattern.patternType)));
    
    if (existing.length > 0) {
      const [updated] = await db.update(weaknessPatterns)
        .set({ frequency: existing[0].frequency + 1, updatedAt: new Date() })
        .where(eq(weaknessPatterns.id, existing[0].id))
        .returning();
      return updated;
    }

    const [newPattern] = await db.insert(weaknessPatterns).values(pattern).returning();
    return newPattern;
  }

  async getSessionsWithEvaluations(userId: string): Promise<(InterviewSession & { evaluation: Evaluation | null })[]> {
    const sessions = await this.getInterviewsByUserId(userId);
    const result = await Promise.all(sessions.map(async (session) => {
      const evaluation = await this.getEvaluationBySessionId(session.id);
      return { ...session, evaluation: evaluation || null };
    }));
    return result;
  }

  async getLatestEvaluationByUserId(userId: string): Promise<Evaluation | null> {
    const sessions = await db.select().from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed")))
      .orderBy(desc(interviewSessions.createdAt))
      .limit(1);
    
    if (sessions.length === 0) return null;
    
    const evaluation = await this.getEvaluationBySessionId(sessions[0].id);
    return evaluation || null;
  }

  async getComparisonData(userId: string): Promise<{ round1: Evaluation | null; round2: Evaluation | null } | null> {
    const completedSessions = await db.select().from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed")))
      .orderBy(interviewSessions.sessionNumber)
      .limit(2);
    
    if (completedSessions.length < 2) return null;

    const round1 = await this.getEvaluationBySessionId(completedSessions[0].id);
    const round2 = await this.getEvaluationBySessionId(completedSessions[1].id);

    return { round1: round1 || null, round2: round2 || null };
  }
}

export const storage = new DatabaseStorage();
