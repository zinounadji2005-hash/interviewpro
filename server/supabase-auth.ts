import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(userId: string, email: string, firstName?: string, lastName?: string): Promise<string> {
  try {
    // First check by ID
    const existingById = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existingById.length > 0) {
      await db.update(users).set({
        email,
        firstName: firstName || existingById[0].firstName,
        lastName: lastName || existingById[0].lastName,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));
      return userId;
    }
    
    // Check if email already exists (user might have signed up with different auth provider before)
    const existingByEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingByEmail.length > 0) {
      // Keep existing user ID to preserve foreign key relationships
      // Just update the profile info
      await db.update(users).set({
        firstName: firstName || existingByEmail[0].firstName,
        lastName: lastName || existingByEmail[0].lastName,
        updatedAt: new Date(),
      }).where(eq(users.email, email));
      return existingByEmail[0].id; // Return existing ID
    }
    
    // Create new user
    await db.insert(users).values({
      id: userId,
      email,
      firstName: firstName || email.split("@")[0],
      lastName: lastName || "",
    });
    return userId;
  } catch (error) {
    console.error("Failed to upsert user:", error);
    throw error;
  }
}

export async function setupSupabaseAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user && data.session) {
        const dbUserId = await upsertUser(data.user.id, email, firstName, lastName);
        (req.session as any).userId = dbUserId;
        (req.session as any).accessToken = data.session.access_token;
        (req.session as any).refreshToken = data.session.refresh_token;
        res.json({ user: data.user, session: data.session, requiresConfirmation: false });
      } else if (data.user && !data.session) {
        res.json({ user: data.user, session: null, requiresConfirmation: true });
      } else {
        res.status(400).json({ error: "Signup failed" });
      }
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to sign up" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      if (data.user) {
        const dbUserId = await upsertUser(data.user.id, email, data.user.user_metadata?.first_name, data.user.user_metadata?.last_name);
        (req.session as any).userId = dbUserId;
        (req.session as any).accessToken = data.session?.access_token;
        (req.session as any).refreshToken = data.session?.refresh_token;
      }

      res.json({ user: data.user, session: data.session });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (user.length === 0) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(user[0]);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).user = { claims: { sub: userId } };
  next();
};
