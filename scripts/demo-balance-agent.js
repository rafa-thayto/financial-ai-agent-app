// Demo script to showcase the enhanced AI agent with balance functionality
const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const dbPath = path.join(__dirname, "..", "finances.db");
const db = new Database(dbPath);

function addSampleTransaction(description, amount, category, type, date) {
  const stmt = db.prepare(`
    INSERT INTO transactions (description, amount, category, date, type)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(description, amount, category, date, type);
}

function getTotalByType(type) {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions 
    WHERE type = ?
  `);
  const result = stmt.get(type);
  return result.total;
}

function getMonthlySummary(year, month) {
  const stmt = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as transactionCount
    FROM transactions 
    WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `);

  const result = stmt.get(year.toString(), month.toString().padStart(2, "0"));

  return {
    totalIncome: result.totalIncome,
    totalExpense: result.totalExpense,
    balance: result.totalIncome - result.totalExpense,
    transactionCount: result.transactionCount,
  };
}

async function demoBalanceAgent() {
  console.log("🎯 Enhanced AI Agent Balance Demo\n");

  // Add some sample transactions if needed
  console.log("📝 Adding sample transactions...");
  const today = new Date().toISOString().split("T")[0];

  try {
    addSampleTransaction(
      "Freelance payment",
      800,
      "freelance",
      "income",
      today
    );
    addSampleTransaction("Coffee shop", 5.5, "food", "expense", today);
    addSampleTransaction("Gas station", 45, "transport", "expense", today);
    console.log("✅ Sample transactions added\n");
  } catch (error) {
    console.log("ℹ️ Transactions may already exist\n");
  }

  // Show current financial state
  console.log("💰 Current Financial Overview:");
  const totalIncome = getTotalByType("income");
  const totalExpenses = getTotalByType("expense");
  const currentBalance = totalIncome - totalExpenses;

  console.log(`Total Income: $${totalIncome.toFixed(2)}`);
  console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
  console.log(`Current Balance: $${currentBalance.toFixed(2)}\n`);

  // Show monthly summary
  console.log("📅 This Month Summary:");
  const now = new Date();
  const monthlySummary = getMonthlySummary(
    now.getFullYear(),
    now.getMonth() + 1
  );
  console.log(`Monthly Income: $${monthlySummary.totalIncome.toFixed(2)}`);
  console.log(`Monthly Expenses: $${monthlySummary.totalExpense.toFixed(2)}`);
  console.log(`Monthly Balance: $${monthlySummary.balance.toFixed(2)}`);
  console.log(`Transaction Count: ${monthlySummary.transactionCount}\n`);

  // Simulate balance queries
  console.log("🗣️ Simulated AI Balance Responses:");

  console.log("\n1. Query: 'What's my current balance?'");
  console.log("Response Type: balance");
  console.log(`Response: Here's your financial overview:

💰 **Current Balance: $${currentBalance.toFixed(2)}**

📊 **Overall Summary:**
• Total Income: $${totalIncome.toFixed(2)}
• Total Expenses: $${totalExpenses.toFixed(2)}

📅 **This Month:**
• Income: $${monthlySummary.totalIncome.toFixed(2)}
• Expenses: $${monthlySummary.totalExpense.toFixed(2)}
• Net: $${monthlySummary.balance.toFixed(2)}
• Transactions: ${monthlySummary.transactionCount}

${
  currentBalance > 0
    ? "🟢 You have a positive balance!"
    : "🔴 Your expenses exceed your income. Consider reviewing your spending."
}`);

  console.log("\n2. Query: 'How much money do I have?'");
  console.log("Response Type: balance");
  console.log(
    `Response: You currently have $${currentBalance.toFixed(
      2
    )} in your account.`
  );

  console.log("\n3. Query: 'Am I doing well financially?'");
  console.log("Response Type: insight");
  if (currentBalance > 1000) {
    console.log(
      "Response: 🟢 Great job! You have a healthy balance and are managing your finances well."
    );
  } else if (currentBalance > 0) {
    console.log(
      "Response: 📊 You have a positive balance, which is good. Consider building up your savings."
    );
  } else {
    console.log(
      "Response: 🔴 Your expenses exceed your income. Let's work on a budget to improve your financial health."
    );
  }

  console.log("\n🎯 Enhanced Features Demonstrated:");
  console.log("• Real-time balance calculations");
  console.log("• Monthly financial summaries");
  console.log("• Contextual balance responses");
  console.log("• Financial health insights");
  console.log("• Proactive balance monitoring");

  console.log("\n🚀 Try these commands in the app:");
  console.log("• 'What's my balance?'");
  console.log("• 'How much money do I have?'");
  console.log("• 'How am I doing this month?'");
  console.log("• 'Show me my financial overview'");

  // Close database connection
  db.close();

  console.log(
    "\n✅ Demo complete! Visit http://localhost:3000/ai-assistant to test live!"
  );
}

demoBalanceAgent().catch(console.error);
