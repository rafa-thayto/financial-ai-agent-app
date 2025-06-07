import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Transactions table
export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    category: text("category").notNull(),
    date: text("date").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    dateIdx: index("idx_transactions_date").on(table.date),
    categoryIdx: index("idx_transactions_category").on(table.category),
    typeIdx: index("idx_transactions_type").on(table.type),
  })
);

// Chat messages table
export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    context: text("context"), // JSON string for conversation context
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    createdAtIdx: index("idx_chat_messages_created_at").on(table.createdAt),
  })
);

// User preferences table
export const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Budgets table
export const budgets = sqliteTable(
  "budgets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category").notNull(),
    amount: real("amount").notNull(),
    period: text("period", { enum: ["monthly", "weekly", "yearly"] }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_budgets_category").on(table.category),
  })
);

// Spending patterns table
export const spendingPatterns = sqliteTable("spending_patterns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull().unique(),
  averageAmount: real("average_amount").notNull(),
  frequency: real("frequency").notNull(),
  lastUpdated: text("last_updated")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Type exports for TypeScript
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type SpendingPattern = typeof spendingPatterns.$inferSelect;
export type NewSpendingPattern = typeof spendingPatterns.$inferInsert;
