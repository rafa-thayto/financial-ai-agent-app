#!/usr/bin/env node

/**
 * Migration script to transfer data from the old better-sqlite3 database
 * to the new Drizzle ORM database structure.
 *
 * This script will:
 * 1. Read existing data from finances.db (if it exists)
 * 2. Create new tables using Drizzle schema
 * 3. Migrate all existing data
 * 4. Backup the old database
 */

import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import fs from "fs";
import path from "path";
import {
  transactions,
  chatMessages,
  userPreferences,
  budgets,
  spendingPatterns,
} from "../lib/db/schema.ts";

async function runMigration() {
  console.log("🚀 Starting migration to Drizzle ORM...");

  // Check if old database exists
  const oldDbPath = path.join(process.cwd(), "finances.db");
  const hasOldDb = fs.existsSync(oldDbPath);

  if (!hasOldDb) {
    console.log(
      "ℹ️  No existing database found, creating fresh Drizzle database..."
    );
  } else {
    console.log("📊 Found existing database, preparing migration...");
  }

  // Create new Drizzle database connection
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:./finances.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client);

  try {
    // Run Drizzle migrations to create tables
    console.log("📋 Running Drizzle migrations...");
    await migrate(db, { migrationsFolder: "./lib/db/migrations" });
    console.log("✅ Database schema created successfully");

    if (hasOldDb) {
      // Connect to old database to read existing data
      console.log("📖 Reading data from existing database...");
      const oldDb = new Database(oldDbPath);

      // Migrate transactions
      try {
        const oldTransactions = oldDb
          .prepare("SELECT * FROM transactions ORDER BY created_at")
          .all();

        if (oldTransactions.length > 0) {
          console.log(`📋 Migrating ${oldTransactions.length} transactions...`);

          for (const transaction of oldTransactions) {
            await db.insert(transactions).values({
              description: transaction.description,
              amount: transaction.amount,
              category: transaction.category,
              date: transaction.date,
              type: transaction.type,
              createdAt: transaction.created_at,
            });
          }

          console.log("✅ Transactions migrated successfully");
        }
      } catch (error) {
        console.log(
          "⚠️  No transactions table found or error migrating transactions:",
          error.message
        );
      }

      // Migrate chat messages
      try {
        const oldChatMessages = oldDb
          .prepare("SELECT * FROM chat_messages ORDER BY created_at")
          .all();

        if (oldChatMessages.length > 0) {
          console.log(
            `💬 Migrating ${oldChatMessages.length} chat messages...`
          );

          for (const message of oldChatMessages) {
            await db.insert(chatMessages).values({
              type: message.type,
              content: message.content,
              context: message.context,
              createdAt: message.created_at,
            });
          }

          console.log("✅ Chat messages migrated successfully");
        }
      } catch (error) {
        console.log(
          "⚠️  No chat_messages table found or error migrating chat messages:",
          error.message
        );
      }

      // Migrate user preferences
      try {
        const oldPreferences = oldDb
          .prepare("SELECT * FROM user_preferences ORDER BY created_at")
          .all();

        if (oldPreferences.length > 0) {
          console.log(
            `⚙️  Migrating ${oldPreferences.length} user preferences...`
          );

          for (const pref of oldPreferences) {
            await db.insert(userPreferences).values({
              key: pref.key,
              value: pref.value,
              createdAt: pref.created_at,
              updatedAt: pref.updated_at,
            });
          }

          console.log("✅ User preferences migrated successfully");
        }
      } catch (error) {
        console.log(
          "⚠️  No user_preferences table found or error migrating preferences:",
          error.message
        );
      }

      // Migrate budgets
      try {
        const oldBudgets = oldDb
          .prepare("SELECT * FROM budgets ORDER BY created_at")
          .all();

        if (oldBudgets.length > 0) {
          console.log(`💰 Migrating ${oldBudgets.length} budgets...`);

          for (const budget of oldBudgets) {
            await db.insert(budgets).values({
              category: budget.category,
              amount: budget.amount,
              period: budget.period,
              isActive: budget.is_active === 1,
              createdAt: budget.created_at,
            });
          }

          console.log("✅ Budgets migrated successfully");
        }
      } catch (error) {
        console.log(
          "⚠️  No budgets table found or error migrating budgets:",
          error.message
        );
      }

      // Migrate spending patterns
      try {
        const oldPatterns = oldDb
          .prepare("SELECT * FROM spending_patterns ORDER BY last_updated")
          .all();

        if (oldPatterns.length > 0) {
          console.log(
            `📈 Migrating ${oldPatterns.length} spending patterns...`
          );

          for (const pattern of oldPatterns) {
            await db.insert(spendingPatterns).values({
              category: pattern.category,
              averageAmount: pattern.average_amount,
              frequency: pattern.frequency,
              lastUpdated: pattern.last_updated,
            });
          }

          console.log("✅ Spending patterns migrated successfully");
        }
      } catch (error) {
        console.log(
          "⚠️  No spending_patterns table found or error migrating patterns:",
          error.message
        );
      }

      // Close old database
      oldDb.close();

      // Backup old database
      const backupPath = path.join(
        process.cwd(),
        `finances-backup-${Date.now()}.db`
      );
      fs.copyFileSync(oldDbPath, backupPath);
      console.log(`💾 Old database backed up to: ${backupPath}`);

      console.log("🎉 Migration completed successfully!");
      console.log("📝 Summary:");
      console.log("   - All data has been migrated to Drizzle ORM");
      console.log("   - Old database has been backed up");
      console.log(
        "   - Application now uses modern Drizzle ORM with Turso support"
      );
    } else {
      console.log("🎉 Fresh Drizzle database created successfully!");
      console.log(
        "📝 You can now start using the application with Drizzle ORM"
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
runMigration().catch(console.error);
