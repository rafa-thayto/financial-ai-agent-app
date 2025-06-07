// Modern database operations using Drizzle ORM
// This file maintains the same API as the original better-sqlite3 implementation
// for backward compatibility while using Drizzle ORM under the hood

import {
  insertTransaction as drizzleInsertTransaction,
  getTransactions as drizzleGetTransactions,
  getTransactionsByCategory as drizzleGetTransactionsByCategory,
  getTransactionsByDateRange as drizzleGetTransactionsByDateRange,
  getTotalByType as drizzleGetTotalByType,
  getCurrentMonthSpending as drizzleGetCurrentMonthSpending,
  getCurrentMonthSpendingByCategory as drizzleGetCurrentMonthSpendingByCategory,
  getCategorySummary as drizzleGetCategorySummary,
  getMonthlySummary as drizzleGetMonthlySummary,
  insertChatMessage as drizzleInsertChatMessage,
  getChatMessages as drizzleGetChatMessages,
  getUserMessages as drizzleGetUserMessages,
  getRecentChatContext as drizzleGetRecentChatContext,
  setBudget as drizzleSetBudget,
  getBudgets as drizzleGetBudgets,
  getBudgetForCategory as drizzleGetBudgetForCategory,
  getUserPreference as drizzleGetUserPreference,
  setUserPreference as drizzleSetUserPreference,
  getSpendingPatterns as drizzleGetSpendingPatterns,
  getSpendingPatternForCategory as drizzleGetSpendingPatternForCategory,
  updateSpendingPattern as drizzleUpdateSpendingPattern,
  getUnusualSpending as drizzleGetUnusualSpending,
  clearDatabase as drizzleClearDatabase,
} from "./db/operations";

// Re-export types from Drizzle schema
export type {
  Transaction,
  ChatMessage,
  Budget,
  UserPreference,
  SpendingPattern,
} from "./db/schema";

// Legacy interfaces for backward compatibility (these match the Drizzle types)
export interface LegacyTransaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
  created_at: string;
}

export interface LegacyChatMessage {
  id: number;
  type: "user" | "assistant";
  content: string;
  created_at: string;
  context?: string; // JSON string for conversation context
}

// Helper function to convert Drizzle dates to legacy format
const convertToLegacyFormat = <T extends { createdAt: string }>(
  item: T
): T & { created_at: string } => ({
  ...item,
  created_at: item.createdAt,
});

// Helper function to convert array of items
const convertArrayToLegacyFormat = <T extends { createdAt: string }>(
  items: T[]
): (T & { created_at: string })[] => items.map(convertToLegacyFormat);

// Transaction operations
export const insertTransaction = async (
  transaction: Omit<
    Parameters<typeof drizzleInsertTransaction>[0],
    "id" | "createdAt"
  >
) => {
  const result = await drizzleInsertTransaction(transaction);
  return convertToLegacyFormat(result);
};

export const getTransactions = async (limit: number = 50) => {
  const results = await drizzleGetTransactions(limit);
  return convertArrayToLegacyFormat(results);
};

export const getTransactionsByCategory = async (category: string) => {
  const results = await drizzleGetTransactionsByCategory(category);
  return convertArrayToLegacyFormat(results);
};

export const getTransactionsByDateRange = async (
  startDate: string,
  endDate: string
) => {
  const results = await drizzleGetTransactionsByDateRange(startDate, endDate);
  return convertArrayToLegacyFormat(results);
};

export const getTotalByType = drizzleGetTotalByType;
export const getCurrentMonthSpending = drizzleGetCurrentMonthSpending;
export const getCurrentMonthSpendingByCategory =
  drizzleGetCurrentMonthSpendingByCategory;
export const getCategorySummary = drizzleGetCategorySummary;
export const getMonthlySummary = drizzleGetMonthlySummary;

// Chat message operations
export const insertChatMessage = async (
  message: Omit<
    Parameters<typeof drizzleInsertChatMessage>[0],
    "id" | "createdAt"
  >
) => {
  const result = await drizzleInsertChatMessage(message);
  return convertToLegacyFormat(result);
};

export const getChatMessages = async (limit: number = 100) => {
  const results = await drizzleGetChatMessages(limit);
  return convertArrayToLegacyFormat(results);
};

export const getUserMessages = async (limit: number = 50) => {
  const results = await drizzleGetUserMessages(limit);
  return convertArrayToLegacyFormat(results);
};

export const getRecentChatContext = async (limit: number = 10) => {
  const results = await drizzleGetRecentChatContext(limit);
  return convertArrayToLegacyFormat(results);
};

// Budget operations
export const setBudget = drizzleSetBudget;
export const getBudgets = drizzleGetBudgets;
export const getBudgetForCategory = drizzleGetBudgetForCategory;

// User preferences operations
export const getUserPreference = drizzleGetUserPreference;
export const setUserPreference = drizzleSetUserPreference;

// Spending patterns operations
export const getSpendingPatterns = drizzleGetSpendingPatterns;
export const getSpendingPatternForCategory =
  drizzleGetSpendingPatternForCategory;
export const updateSpendingPattern = drizzleUpdateSpendingPattern;
export const getUnusualSpending = async (threshold: number = 1.5) => {
  const results = await drizzleGetUnusualSpending(threshold);
  return convertArrayToLegacyFormat(results);
};

// Database management operations
export const clearDatabase = drizzleClearDatabase;

// Legacy initialization function (now a no-op since Drizzle handles initialization)
export const init = () => {
  console.log("Database initialization: Using Drizzle ORM with modern setup");
  // Drizzle handles database initialization automatically
};

// Initialize on import for backward compatibility
init();
