import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifySessionToken } from "../auth";
import { COOKIE_NAME } from "@shared/const";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Try custom authentication first
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const authUser = await verifySessionToken(token);
      if (authUser) {
        const dbUser = await getUserById(authUser.id);
        if (dbUser) {
          user = dbUser;
        }
      }
    }
    
    // Fallback to Manus OAuth if custom auth fails
    if (!user) {
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch (error) {
        // Authentication is optional for public procedures.
        user = null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
