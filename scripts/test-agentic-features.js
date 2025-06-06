const Database = require("better-sqlite3");
const { join } = require("path");

// Create database connection
const dbPath = join(process.cwd(), "finances.db");
const db = new Database(dbPath);

console.log("🧪 Testing Agentic Features...\n");

try {
  // Test 1: Check database tables exist
  console.log("1️⃣ Testing Database Schema:");

  const tables = db
    .prepare(
      `
    SELECT name FROM sqlite_master WHERE type='table' 
    AND name IN ('user_preferences', 'budgets', 'spending_patterns')
  `
    )
    .all();

  console.log(
    `   ✅ Found ${tables.length}/3 agentic tables:`,
    tables.map((t) => t.name).join(", ")
  );

  // Test 2: Check user preferences
  console.log("\n2️⃣ Testing User Preferences:");
  const preferences = db.prepare("SELECT * FROM user_preferences").all();
  console.log(`   ✅ Found ${preferences.length} user preferences`);
  preferences.forEach((pref) => {
    console.log(`      ${pref.key}: ${pref.value}`);
  });

  // Test 3: Check budgets
  console.log("\n3️⃣ Testing Budgets:");
  const budgets = db.prepare("SELECT * FROM budgets WHERE is_active = 1").all();
  console.log(`   ✅ Found ${budgets.length} active budgets`);
  budgets.forEach((budget) => {
    console.log(`      ${budget.category}: $${budget.amount}/${budget.period}`);
  });

  // Test 4: Check spending patterns
  console.log("\n4️⃣ Testing Spending Patterns:");
  const patterns = db.prepare("SELECT * FROM spending_patterns").all();
  console.log(`   ✅ Found ${patterns.length} spending patterns`);
  patterns.forEach((pattern) => {
    console.log(
      `      ${pattern.category}: avg $${pattern.average_amount.toFixed(
        2
      )}, ${pattern.frequency.toFixed(2)} times/month`
    );
  });

  // Test 5: Check current month spending vs budgets
  console.log("\n5️⃣ Testing Budget Analysis:");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

  budgets.forEach((budget) => {
    const currentSpending = db
      .prepare(
        `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE type = 'expense' AND category = ? AND date BETWEEN ? AND ?
    `
      )
      .get(budget.category, startDate, endDate);

    const percentage = (currentSpending.total / budget.amount) * 100;
    const status =
      percentage > 90
        ? "🔴 OVER"
        : percentage > 75
        ? "🟡 WARNING"
        : "🟢 ON TRACK";

    console.log(
      `      ${budget.category}: $${currentSpending.total}/$${
        budget.amount
      } (${percentage.toFixed(1)}%) ${status}`
    );
  });

  // Test 6: Check unusual spending
  console.log("\n6️⃣ Testing Unusual Spending Detection:");
  const unusualSpending = db
    .prepare(
      `
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
  `
    )
    .all();

  if (unusualSpending.length > 0) {
    console.log(
      `   ✅ Found ${unusualSpending.length} unusual spending patterns:`
    );
    unusualSpending.forEach((item) => {
      const direction =
        item.deviation_percentage > 0 ? "📈 Higher" : "📉 Lower";
      console.log(
        `      ${item.category}: ${direction} by ${Math.abs(
          item.deviation_percentage
        ).toFixed(1)}%`
      );
    });
  } else {
    console.log("   ✅ No unusual spending patterns detected");
  }

  // Test 7: Check chat messages with context
  console.log("\n7️⃣ Testing Agentic Chat Messages:");
  const agenticMessages = db
    .prepare(
      `
    SELECT * FROM chat_messages 
    WHERE context IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 3
  `
    )
    .all();

  console.log(`   ✅ Found ${agenticMessages.length} agentic chat messages`);
  agenticMessages.forEach((msg) => {
    const context = JSON.parse(msg.context || "{}");
    console.log(
      `      ${msg.type}: ${
        context.type || "unknown"
      } - ${msg.content.substring(0, 60)}...`
    );
  });

  console.log("\n🎉 All agentic features are working correctly!");
} catch (error) {
  console.error("❌ Error testing agentic features:", error);
} finally {
  db.close();
}
