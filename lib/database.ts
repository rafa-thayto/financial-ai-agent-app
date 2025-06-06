import Database from "better-sqlite3";
import { join } from "path";

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
  created_at: string;
}

export interface ChatMessage {
  id: number;
  type: "user" | "assistant";
  content: string;
  created_at: string;
  context?: string; // JSON string for conversation context
}

export interface UserPreference {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  category: string;
  amount: number;
  period: "monthly" | "weekly" | "yearly";
  created_at: string;
  is_active: boolean;
}

export interface SpendingPattern {
  id: number;
  category: string;
  average_amount: number;
  frequency: number; // transactions per month
  last_updated: string;
}

// Create database connection
const dbPath = join(process.cwd(), "finances.db");
const db = new Database(dbPath);

// Initialize database schema
const init = () => {
  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createChatMessagesTable = `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
      content TEXT NOT NULL,
      context TEXT, -- JSON string for conversation context
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createUserPreferencesTable = `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createBudgetsTable = `
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createSpendingPatternsTable = `
    CREATE TABLE IF NOT EXISTS spending_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT UNIQUE NOT NULL,
      average_amount REAL NOT NULL,
      frequency REAL NOT NULL,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes for better query performance
  const createDateIndex = `
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)
  `;

  const createCategoryIndex = `
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)
  `;

  const createTypeIndex = `
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)
  `;

  const createChatMessagesIndex = `
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)
  `;

  const createBudgetsCategoryIndex = `
    CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category)
  `;

  db.exec(createTransactionsTable);
  db.exec(createChatMessagesTable);
  db.exec(createUserPreferencesTable);
  db.exec(createBudgetsTable);
  db.exec(createSpendingPatternsTable);
  db.exec(createDateIndex);
  db.exec(createCategoryIndex);
  db.exec(createTypeIndex);
  db.exec(createChatMessagesIndex);
  db.exec(createBudgetsCategoryIndex);
};

// Initialize database
init();

// Database operations
export const insertTransaction = (
  transaction: Omit<Transaction, "id" | "created_at">
) => {
  const stmt = db.prepare(`
    INSERT INTO transactions (description, amount, category, date, type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    transaction.description,
    transaction.amount,
    transaction.category,
    transaction.date,
    transaction.type
  );

  // Update spending patterns after inserting transaction
  updateSpendingPattern(transaction.category);

  return result;
};

export const insertChatMessage = (
  message: Omit<ChatMessage, "id" | "created_at">
) => {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (type, content, context)
    VALUES (?, ?, ?)
  `);

  return stmt.run(message.type, message.content, message.context || null);
};

export const getChatMessages = (limit: number = 100): ChatMessage[] => {
  const stmt = db.prepare(`
    SELECT * FROM chat_messages 
    ORDER BY created_at ASC 
    LIMIT ?
  `);

  return stmt.all(limit) as ChatMessage[];
};

export const getUserMessages = (limit: number = 50): ChatMessage[] => {
  const stmt = db.prepare(`
    SELECT * FROM chat_messages 
    WHERE type = 'user'
    ORDER BY created_at DESC 
    LIMIT ?
  `);

  return stmt.all(limit) as ChatMessage[];
};

export const getRecentChatContext = (limit: number = 10): ChatMessage[] => {
  const stmt = db.prepare(`
    SELECT * FROM chat_messages 
    ORDER BY created_at DESC 
    LIMIT ?
  `);

  return stmt.all(limit) as ChatMessage[];
};

export const getTransactions = (limit: number = 50): Transaction[] => {
  const stmt = db.prepare(`
    SELECT * FROM transactions 
    ORDER BY date DESC, created_at DESC 
    LIMIT ?
  `);

  return stmt.all(limit) as Transaction[];
};

export const getTransactionsByCategory = (category: string): Transaction[] => {
  const stmt = db.prepare(`
    SELECT * FROM transactions 
    WHERE category = ? 
    ORDER BY date DESC, created_at DESC
  `);

  return stmt.all(category) as Transaction[];
};

export function getTotalByType(type: "income" | "expense"): number {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions 
    WHERE type = ?
  `);
  const result = stmt.get(type) as { total: number };
  return result.total;
}

export const getTransactionsByDateRange = (
  startDate: string,
  endDate: string
): Transaction[] => {
  const stmt = db.prepare(`
    SELECT * FROM transactions 
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC, created_at DESC
  `);

  return stmt.all(startDate, endDate) as Transaction[];
};

export const getTransactionsByMonth = (
  year: number,
  month: number
): Transaction[] => {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

  return getTransactionsByDateRange(startDate, endDate);
};

export function getMonthlySummary(
  year: number,
  month: number
): {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
} {
  const stmt = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as transactionCount
    FROM transactions 
    WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `);

  const result = stmt.get(
    year.toString(),
    month.toString().padStart(2, "0")
  ) as {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
  };

  return {
    totalIncome: result.totalIncome,
    totalExpense: result.totalExpense,
    balance: result.totalIncome - result.totalExpense,
    transactionCount: result.transactionCount,
  };
}

export const getCategorySummary = (): Array<{
  category: string;
  total: number;
  count: number;
}> => {
  const stmt = db.prepare(`
    SELECT 
      category,
      SUM(amount) as total,
      COUNT(*) as count
    FROM transactions 
    WHERE type = 'expense'
    GROUP BY category 
    ORDER BY total DESC
  `);

  return stmt.all() as Array<{
    category: string;
    total: number;
    count: number;
  }>;
};

// New agentic functions

export const setUserPreference = (key: string, value: string) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);

  return stmt.run(key, value);
};

export const getUserPreference = (key: string): string | null => {
  const stmt = db.prepare(`
    SELECT value FROM user_preferences WHERE key = ?
  `);

  const result = stmt.get(key) as { value: string } | undefined;
  return result?.value || null;
};

export const setBudget = (
  category: string,
  amount: number,
  period: "monthly" | "weekly" | "yearly"
) => {
  // Deactivate existing budgets for this category
  const deactivateStmt = db.prepare(`
    UPDATE budgets SET is_active = 0 WHERE category = ?
  `);
  deactivateStmt.run(category);

  // Insert new budget
  const insertStmt = db.prepare(`
    INSERT INTO budgets (category, amount, period, is_active)
    VALUES (?, ?, ?, 1)
  `);

  return insertStmt.run(category, amount, period);
};

export const getBudgets = (): Budget[] => {
  const stmt = db.prepare(`
    SELECT * FROM budgets WHERE is_active = 1
  `);

  return stmt.all() as Budget[];
};

export const getBudgetForCategory = (category: string): Budget | null => {
  const stmt = db.prepare(`
    SELECT * FROM budgets WHERE category = ? AND is_active = 1
  `);

  return stmt.get(category) as Budget | null;
};

export const updateSpendingPattern = (category: string) => {
  // Calculate average amount and frequency for the category
  const stmt = db.prepare(`
    SELECT 
      AVG(amount) as avg_amount,
      COUNT(*) as total_count,
      MIN(date) as first_date,
      MAX(date) as last_date
    FROM transactions 
    WHERE category = ? AND type = 'expense'
  `);

  const result = stmt.get(category) as
    | {
        avg_amount: number;
        total_count: number;
        first_date: string;
        last_date: string;
      }
    | undefined;

  if (result && result.total_count > 0) {
    // Calculate frequency (transactions per month)
    const firstDate = new Date(result.first_date);
    const lastDate = new Date(result.last_date);
    const monthsDiff = Math.max(
      1,
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const frequency = result.total_count / monthsDiff;

    const updateStmt = db.prepare(`
      INSERT OR REPLACE INTO spending_patterns (category, average_amount, frequency, last_updated)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    updateStmt.run(category, result.avg_amount, frequency);
  }
};

export const getSpendingPatterns = (): SpendingPattern[] => {
  const stmt = db.prepare(`
    SELECT * FROM spending_patterns ORDER BY frequency DESC
  `);

  return stmt.all() as SpendingPattern[];
};

export const getSpendingPatternForCategory = (
  category: string
): SpendingPattern | null => {
  const stmt = db.prepare(`
    SELECT * FROM spending_patterns WHERE category = ?
  `);

  return stmt.get(category) as SpendingPattern | null;
};

export const getCurrentMonthSpending = (category?: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

  let query = `
    SELECT SUM(amount) as total
    FROM transactions 
    WHERE type = 'expense' AND date BETWEEN ? AND ?
  `;

  const params = [startDate, endDate];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params) as { total: number | null };

  return result?.total || 0;
};

export const getUnusualSpending = (): Array<{
  category: string;
  current_amount: number;
  average_amount: number;
  deviation_percentage: number;
}> => {
  const stmt = db.prepare(`
    SELECT 
      sp.category,
      COALESCE(current.current_amount, 0) as current_amount,
      sp.average_amount,
      CASE 
        WHEN sp.average_amount > 0 
        THEN ((COALESCE(current.current_amount, 0) - sp.average_amount) / sp.average_amount) * 100
        ELSE 0
      END as deviation_percentage
    FROM spending_patterns sp
    LEFT JOIN (
      SELECT 
        category,
        SUM(amount) as current_amount
      FROM transactions 
      WHERE type = 'expense' 
        AND date >= date('now', 'start of month')
      GROUP BY category
    ) current ON sp.category = current.category
    WHERE ABS(deviation_percentage) > 20
    ORDER BY ABS(deviation_percentage) DESC
  `);

  return stmt.all() as Array<{
    category: string;
    current_amount: number;
    average_amount: number;
    deviation_percentage: number;
  }>;
};

export default db;
