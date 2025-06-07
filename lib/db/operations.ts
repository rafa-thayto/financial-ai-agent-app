import { db } from "./index";
import {
  transactions,
  chatMessages,
  userPreferences,
  budgets,
  spendingPatterns,
  type Transaction,
  type NewTransaction,
  type ChatMessage,
  type NewChatMessage,
  type Budget,
  type NewBudget,
  type UserPreference,
  type NewUserPreference,
  type SpendingPattern,
  type NewSpendingPattern,
} from "./schema";
import { desc, asc, eq, and, gte, lte, sql, count } from "drizzle-orm";

// Transaction operations
export const insertTransaction = async (
  transaction: Omit<NewTransaction, "id" | "createdAt">
): Promise<Transaction> => {
  const [result] = await db
    .insert(transactions)
    .values(transaction)
    .returning();

  // Update spending patterns after inserting transaction
  await updateSpendingPattern(transaction.category);

  return result;
};

export const getTransactions = async (
  limit: number = 50
): Promise<Transaction[]> => {
  return await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit);
};

export const getTransactionsByCategory = async (
  category: string
): Promise<Transaction[]> => {
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.category, category))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
};

export const getTransactionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  return await db
    .select()
    .from(transactions)
    .where(
      and(gte(transactions.date, startDate), lte(transactions.date, endDate))
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
};

export const getTotalByType = async (
  type: "income" | "expense"
): Promise<number> => {
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.type, type));

  return result[0]?.total || 0;
};

export const getCurrentMonthSpending = async (): Promise<number> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startDate = startOfMonth.toISOString().split("T")[0];
  const endDate = endOfMonth.toISOString().split("T")[0];

  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "expense"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    );

  return result[0]?.total || 0;
};

export const getCurrentMonthSpendingByCategory = async (
  category: string
): Promise<number> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startDate = startOfMonth.toISOString().split("T")[0];
  const endDate = endOfMonth.toISOString().split("T")[0];

  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "expense"),
        eq(transactions.category, category),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    );

  return result[0]?.total || 0;
};

export const getCategorySummary = async (): Promise<
  {
    category: string;
    total: number;
    count: number;
  }[]
> => {
  const result = await db
    .select({
      category: transactions.category,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      count: count(),
    })
    .from(transactions)
    .where(eq(transactions.type, "expense"))
    .groupBy(transactions.category)
    .orderBy(desc(sql<number>`COALESCE(SUM(${transactions.amount}), 0)`));

  return result;
};

export const getMonthlySummary = async (): Promise<{
  income: number;
  expenses: number;
  transactionCount: number;
}> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startDate = startOfMonth.toISOString().split("T")[0];
  const endDate = endOfMonth.toISOString().split("T")[0];

  const [incomeResult, expenseResult, countResult] = await Promise.all([
    db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "income"),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      ),
    db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "expense"),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      ),
    db
      .select({ count: count() })
      .from(transactions)
      .where(
        and(gte(transactions.date, startDate), lte(transactions.date, endDate))
      ),
  ]);

  return {
    income: incomeResult[0]?.total || 0,
    expenses: expenseResult[0]?.total || 0,
    transactionCount: countResult[0]?.count || 0,
  };
};

// Chat message operations
export const insertChatMessage = async (
  message: Omit<NewChatMessage, "id" | "createdAt">
): Promise<ChatMessage> => {
  const [result] = await db.insert(chatMessages).values(message).returning();

  return result;
};

export const getChatMessages = async (
  limit: number = 100
): Promise<ChatMessage[]> => {
  return await db
    .select()
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
};

export const getUserMessages = async (
  limit: number = 50
): Promise<ChatMessage[]> => {
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.type, "user"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
};

export const getRecentChatContext = async (
  limit: number = 10
): Promise<ChatMessage[]> => {
  return await db
    .select()
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
};

// Budget operations
export const setBudget = async (
  category: string,
  amount: number,
  period: "monthly" | "weekly" | "yearly" = "monthly"
): Promise<Budget> => {
  // First, deactivate any existing budget for this category
  await db
    .update(budgets)
    .set({ isActive: false })
    .where(eq(budgets.category, category));

  // Insert new budget
  const [result] = await db
    .insert(budgets)
    .values({
      category,
      amount,
      period,
      isActive: true,
    })
    .returning();

  return result;
};

export const getBudgets = async (): Promise<Budget[]> => {
  return await db
    .select()
    .from(budgets)
    .where(eq(budgets.isActive, true))
    .orderBy(asc(budgets.category));
};

export const getBudgetForCategory = async (
  category: string
): Promise<Budget | null> => {
  const result = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.category, category), eq(budgets.isActive, true)))
    .limit(1);

  return result[0] || null;
};

// User preferences operations
export const getUserPreference = async (
  key: string
): Promise<string | null> => {
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.key, key))
    .limit(1);

  return result[0]?.value || null;
};

export const setUserPreference = async (
  key: string,
  value: string
): Promise<UserPreference> => {
  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.key, key))
    .limit(1);

  if (existing.length > 0) {
    const [result] = await db
      .update(userPreferences)
      .set({
        value,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(userPreferences.key, key))
      .returning();

    return result;
  } else {
    const [result] = await db
      .insert(userPreferences)
      .values({ key, value })
      .returning();

    return result;
  }
};

// Spending patterns operations
export const getSpendingPatterns = async (): Promise<SpendingPattern[]> => {
  return await db
    .select()
    .from(spendingPatterns)
    .orderBy(desc(spendingPatterns.frequency));
};

export const getSpendingPatternForCategory = async (
  category: string
): Promise<SpendingPattern | null> => {
  const result = await db
    .select()
    .from(spendingPatterns)
    .where(eq(spendingPatterns.category, category))
    .limit(1);

  return result[0] || null;
};

export const updateSpendingPattern = async (
  category: string
): Promise<void> => {
  // Get statistics for the category
  const stats = await db
    .select({
      avgAmount: sql<number>`AVG(${transactions.amount})`,
      totalCount: count(),
      minDate: sql<string>`MIN(${transactions.date})`,
      maxDate: sql<string>`MAX(${transactions.date})`,
    })
    .from(transactions)
    .where(
      and(eq(transactions.category, category), eq(transactions.type, "expense"))
    );

  const stat = stats[0];
  if (!stat || stat.totalCount === 0) return;

  // Calculate frequency (transactions per month)
  const firstDate = new Date(stat.minDate);
  const lastDate = new Date(stat.maxDate);
  const monthsDiff = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const frequency = stat.totalCount / monthsDiff;

  // Insert or update spending pattern
  const existing = await db
    .select()
    .from(spendingPatterns)
    .where(eq(spendingPatterns.category, category))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(spendingPatterns)
      .set({
        averageAmount: stat.avgAmount,
        frequency,
        lastUpdated: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(spendingPatterns.category, category));
  } else {
    await db.insert(spendingPatterns).values({
      category,
      averageAmount: stat.avgAmount,
      frequency,
    });
  }
};

export const getUnusualSpending = async (
  threshold: number = 1.5
): Promise<Transaction[]> => {
  // Get recent transactions that are significantly above average for their category
  const recentTransactions = await db
    .select({
      transaction: transactions,
      pattern: spendingPatterns,
    })
    .from(transactions)
    .leftJoin(
      spendingPatterns,
      eq(transactions.category, spendingPatterns.category)
    )
    .where(eq(transactions.type, "expense"))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return recentTransactions
    .filter(({ transaction, pattern }) => {
      if (!pattern) return false;
      return transaction.amount > pattern.averageAmount * threshold;
    })
    .map(({ transaction }) => transaction);
};

// Database management operations
export const clearDatabase = async (): Promise<void> => {
  // Delete all data from all tables in the correct order (to avoid foreign key constraints)
  await db.delete(spendingPatterns);
  await db.delete(budgets);
  await db.delete(userPreferences);
  await db.delete(chatMessages);
  await db.delete(transactions);

  console.log("🗑️ All database data has been cleared");
};
