import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);
const SALT_ROUNDS = 10;

export interface AuthUser {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ONE_YEAR_MS / 1000)
    .sign(JWT_SECRET);

  return token;
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.userId as number,
      username: payload.username as string,
      name: payload.name as string | null,
      email: payload.email as string | null,
      role: payload.role as string | null,
    };
  } catch (error) {
    return null;
  }
}

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      const user = await db.getUserByUsername(username);
      if (!user || !user.password) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Update last signed in
      await db.updateUserLastSignedIn(user.id);

      const sessionToken = await createSessionToken({
        id: user.id,
        username: user.username!,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, name, email } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      // Check if username already exists
      const existingUser = await db.getUserByUsername(username);
      if (existingUser) {
        res.status(409).json({ error: "Username already exists" });
        return;
      }

      // Check if email already exists
      if (email) {
        const existingEmail = await db.getUserByEmail(email);
        if (existingEmail) {
          res.status(409).json({ error: "Email already exists" });
          return;
        }
      }

      const hashedPassword = await hashPassword(password);

      const userId = await db.createUserWithPassword({
        username,
        password: hashedPassword,
        name: name || null,
        email: email || null,
        role: "user",
        loginMethod: "local",
        lastSignedIn: new Date(),
      });

      if (!userId) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const user = await db.getUserById(userId);
      if (!user) {
        res.status(500).json({ error: "Failed to retrieve user" });
        return;
      }

      const sessionToken = await createSessionToken({
        id: user.id,
        username: user.username!,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const token = req.cookies[COOKIE_NAME];
      if (!token) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await verifySessionToken(token);
      if (!user) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error("[Auth] Get user failed", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}
