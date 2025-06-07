#!/usr/bin/env node

/**
 * Simple script to initialize Drizzle database tables
 */

const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

async function initDrizzle() {
  console.log("🚀 Initializing Drizzle database...");

  // Create database client
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:./finances.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Read and execute the migration SQL
    const migrationPath = path.join(
      process.cwd(),
      "lib/db/migrations/0000_flowery_prima.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split SQL statements and execute them
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    console.log(`📋 Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement) {
        await client.execute(statement);
      }
    }

    console.log("✅ Database tables created successfully!");
    console.log("📝 You can now use the application with Drizzle ORM");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run initialization
initDrizzle().catch(console.error);
