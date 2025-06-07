import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Create client based on environment
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./finances.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Export all schema tables and types for easy importing
export * from "./schema";
