const Database = require("better-sqlite3");
const { join } = require("path");

// Create database connection
const dbPath = join(process.cwd(), "finances.db");
const db = new Database(dbPath);

console.log("Initializing agentic features...");

try {
  // Create new tables for agentic features
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

  // Add context column to chat_messages if it doesn't exist
  const addContextColumn = `
    ALTER TABLE chat_messages ADD COLUMN context TEXT
  `;

  // Create indexes
  const createBudgetsCategoryIndex = `
    CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category)
  `;

  // Execute table creation
  db.exec(createUserPreferencesTable);
  db.exec(createBudgetsTable);
  db.exec(createSpendingPatternsTable);
  db.exec(createBudgetsCategoryIndex);

  // Try to add context column (will fail if already exists, which is fine)
  try {
    db.exec(addContextColumn);
    console.log("Added context column to chat_messages table");
  } catch (error) {
    if (error.message.includes("duplicate column name")) {
      console.log("Context column already exists in chat_messages table");
    } else {
      console.error("Error adding context column:", error.message);
    }
  }

  // Add sample user preferences
  const insertPreference = db.prepare(`
    INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);

  const samplePreferences = [
    { key: "preferred_currency", value: "USD" },
    { key: "budget_alerts", value: "enabled" },
    { key: "spending_insights", value: "enabled" },
    {
      key: "default_categories",
      value: "food,transport,entertainment,utilities",
    },
  ];

  samplePreferences.forEach((pref) => {
    insertPreference.run(pref.key, pref.value);
  });

  // Add sample budgets
  const insertBudget = db.prepare(`
    INSERT OR REPLACE INTO budgets (category, amount, period, is_active)
    VALUES (?, ?, ?, 1)
  `);

  const sampleBudgets = [
    { category: "food", amount: 400, period: "monthly" },
    { category: "transport", amount: 200, period: "monthly" },
    { category: "entertainment", amount: 150, period: "monthly" },
    { category: "utilities", amount: 300, period: "monthly" },
  ];

  sampleBudgets.forEach((budget) => {
    insertBudget.run(budget.category, budget.amount, budget.period);
  });

  // Calculate and insert spending patterns based on existing transactions
  const calculateSpendingPatterns = () => {
    const categories = db
      .prepare(
        `
      SELECT DISTINCT category FROM transactions WHERE type = 'expense'
    `
      )
      .all();

    const insertPattern = db.prepare(`
      INSERT OR REPLACE INTO spending_patterns (category, average_amount, frequency, last_updated)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    categories.forEach(({ category }) => {
      const stats = db
        .prepare(
          `
        SELECT 
          AVG(amount) as avg_amount,
          COUNT(*) as total_count,
          MIN(date) as first_date,
          MAX(date) as last_date
        FROM transactions 
        WHERE category = ? AND type = 'expense'
      `
        )
        .get(category);

      if (stats && stats.total_count > 0) {
        // Calculate frequency (transactions per month)
        const firstDate = new Date(stats.first_date);
        const lastDate = new Date(stats.last_date);
        const monthsDiff = Math.max(
          1,
          (lastDate.getTime() - firstDate.getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        );
        const frequency = stats.total_count / monthsDiff;

        insertPattern.run(category, stats.avg_amount, frequency);
      }
    });
  };

  calculateSpendingPatterns();

  // Add some sample agentic chat messages
  const insertChatMessage = db.prepare(`
    INSERT INTO chat_messages (type, content, context)
    VALUES (?, ?, ?)
  `);

  const sampleAgenticMessages = [
    {
      type: "assistant",
      content:
        "I notice you've been spending more on food this month than usual. Your food expenses are 25% higher than your average. Consider reviewing your dining habits or adjusting your budget.",
      context: JSON.stringify({
        type: "insight",
        category: "food",
        deviation: 25,
      }),
    },
    {
      type: "assistant",
      content:
        "Based on your spending patterns, I suggest setting a monthly budget of $450 for food expenses. This gives you a 20% buffer above your average spending.",
      context: JSON.stringify({
        type: "suggestion",
        category: "food",
        suggested_amount: 450,
      }),
    },
  ];

  sampleAgenticMessages.forEach((msg) => {
    insertChatMessage.run(msg.type, msg.content, msg.context);
  });

  console.log("✅ Agentic features initialized successfully!");
  console.log(`📊 Added ${samplePreferences.length} user preferences`);
  console.log(`💰 Added ${sampleBudgets.length} sample budgets`);
  console.log(`📈 Calculated spending patterns for existing transactions`);
  console.log(`💬 Added sample agentic chat messages`);

  // Display current status
  const budgetCount = db
    .prepare("SELECT COUNT(*) as count FROM budgets WHERE is_active = 1")
    .get();
  const patternCount = db
    .prepare("SELECT COUNT(*) as count FROM spending_patterns")
    .get();
  const prefCount = db
    .prepare("SELECT COUNT(*) as count FROM user_preferences")
    .get();

  console.log("\n📋 Current Status:");
  console.log(`   Active budgets: ${budgetCount.count}`);
  console.log(`   Spending patterns: ${patternCount.count}`);
  console.log(`   User preferences: ${prefCount.count}`);
} catch (error) {
  console.error("❌ Error initializing agentic features:", error);
} finally {
  db.close();
}
