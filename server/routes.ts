import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { setupSupabaseAuth } from "./supabase-auth";
import { seedFeatureCosts } from "./seedFeatureCosts";
import { userRouter } from "./routes/user";
import { cvRouter } from "./routes/cv";
import { interviewRouter } from "./routes/interview";
import { creditsRouter } from "./routes/credits";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  await setupSupabaseAuth(app);
  await seedFeatureCosts();

  app.use("/api", userRouter);
  app.use("/api", cvRouter);
  app.use("/api", interviewRouter);
  app.use("/api", creditsRouter);

  return httpServer;
}
