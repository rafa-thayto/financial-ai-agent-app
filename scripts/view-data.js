const Database = require("better-sqlite3");
const { join } = require("path");

// Create database connection
const dbPath = join(process.cwd(), "finances.db");
const db = new Database(dbPath);

try {
  console.log("=== TRANSACTIONS ===");
  const transactions = db
    .prepare("SELECT * FROM transactions ORDER BY date DESC")
    .all();
  console.log(`Found ${transactions.length} transactions:`);
  transactions.forEach((t) => {
    console.log(
      `${t.id}: ${t.date} - ${t.description} (${t.type}) $${t.amount} [${t.category}]`
    );
  });

  console.log("\n=== CHAT MESSAGES ===");
  const messages = db
    .prepare("SELECT * FROM chat_messages ORDER BY created_at ASC")
    .all();
  console.log(`Found ${messages.length} chat messages:`);
  messages.forEach((m) => {
    console.log(
      `${m.id}: [${m.type}] ${m.content.substring(0, 50)}${
        m.content.length > 50 ? "..." : ""
      }`
    );
  });

  console.log("\n=== SUMMARY ===");
  const income = db
    .prepare(
      "SELECT SUM(amount) as total FROM transactions WHERE type = 'income'"
    )
    .get();
  const expense = db
    .prepare(
      "SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'"
    )
    .get();
  console.log(`Total Income: $${income.total || 0}`);
  console.log(`Total Expense: $${expense.total || 0}`);
  console.log(`Balance: $${(income.total || 0) - (expense.total || 0)}`);
} catch (error) {
  console.error("Error viewing data:", error);
} finally {
  db.close();
}
