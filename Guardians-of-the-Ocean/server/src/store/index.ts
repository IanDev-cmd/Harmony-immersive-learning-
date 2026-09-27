import type { Env } from "../env.js";
import { MemoryStore } from "./memory.js";
import type { Store } from "./types.js";

export type { Store } from "./types.js";
export * from "./types.js";

export async function createStore(env: Env): Promise<Store> {
  if (!env.dbEnabled) return new MemoryStore();
  const [{ PrismaStore }, { prisma }] = await Promise.all([import("./prisma.js"), import("../db.js")]);
  return new PrismaStore(prisma);
}
