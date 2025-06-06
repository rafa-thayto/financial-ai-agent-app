const Database = require("better-sqlite3");
const { join } = require("path");

// Create database connection
const dbPath = join(process.cwd(), "finances.db");
const db = new Database(dbPath);

console.log("🤖 AI Agent Demo - Showcasing Agentic Capabilities\n");

try {
  // Demo 1: Show current financial context
  console.log("📊 DEMO 1: Current Financial Context");
  console.log("=====================================");

  const recentTransactions = db
    .prepare(
      `
    SELECT * FROM transactions 
    ORDER BY date DESC, created_at DESC 
    LIMIT 5
  `
    )
    .all();

  console.log("Recent Transactions:");
  recentTransactions.forEach((t) => {
    console.log(
      `  ${t.date}: ${t.type === "expense" ? "-" : "+"}$${t.amount} for ${
        t.description
      } (${t.category})`
    );
  });

  // Demo 2: Budget Analysis
  console.log("\n💰 DEMO 2: Budget Analysis & Alerts");
  console.log("===================================");

  const budgets = db.prepare("SELECT * FROM budgets WHERE is_active = 1").all();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

  console.log("Budget Status:");
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
    let status = "🟢 ON TRACK";
    let aiResponse = "You're doing well with this budget.";

    if (percentage > 90) {
      status = "🔴 OVER BUDGET";
      aiResponse = `⚠️ ALERT: You've exceeded your ${budget.category} budget! Consider reviewing your spending.`;
    } else if (percentage > 75) {
      status = "🟡 WARNING";
      aiResponse = `📊 WARNING: You're at ${percentage.toFixed(1)}% of your ${
        budget.category
      } budget. Monitor closely.`;
    }

    console.log(
      `  ${budget.category}: $${currentSpending.total}/$${
        budget.amount
      } (${percentage.toFixed(1)}%) ${status}`
    );
    console.log(`    🤖 AI: ${aiResponse}`);
  });

  // Demo 3: Spending Pattern Analysis
  console.log("\n📈 DEMO 3: Spending Pattern Analysis");
  console.log("====================================");

  const patterns = db
    .prepare("SELECT * FROM spending_patterns ORDER BY frequency DESC")
    .all();
  console.log("AI-Detected Spending Patterns:");
  patterns.forEach((pattern) => {
    console.log(
      `  ${pattern.category}: avg $${pattern.average_amount.toFixed(
        2
      )}, ${pattern.frequency.toFixed(2)} times/month`
    );

    // AI insights based on patterns
    if (pattern.frequency > 2) {
      console.log(
        `    🤖 AI: High frequency category - consider setting a budget of $${Math.ceil(
          pattern.average_amount * pattern.frequency * 1.2
        )}/month`
      );
    } else if (pattern.average_amount > 100) {
      console.log(
        `    🤖 AI: High-value transactions - monitor for unusual spending`
      );
    }
  });

  // Demo 4: Anomaly Detection
  console.log("\n🔍 DEMO 4: Anomaly Detection");
  console.log("============================");

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

  console.log("AI-Detected Anomalies:");
  if (unusualSpending.length > 0) {
    unusualSpending.forEach((item) => {
      const direction = item.deviation_percentage > 0 ? "higher" : "lower";
      const emoji = item.deviation_percentage > 0 ? "📈" : "📉";
      console.log(
        `  ${item.category}: ${emoji} ${Math.abs(
          item.deviation_percentage
        ).toFixed(1)}% ${direction} than usual`
      );

      if (item.deviation_percentage > 50) {
        console.log(
          `    🤖 AI: ALERT - Significant increase in ${item.category} spending. Review recent transactions.`
        );
      } else if (item.deviation_percentage < -50) {
        console.log(
          `    🤖 AI: INSIGHT - Lower ${item.category} spending this month. Good job staying under budget!`
        );
      }
    });
  } else {
    console.log("  No unusual spending patterns detected");
    console.log("  🤖 AI: Your spending patterns look normal and healthy! 🟢");
  }

  // Demo 5: Proactive Suggestions
  console.log("\n💡 DEMO 5: AI Proactive Suggestions");
  console.log("===================================");

  console.log("AI-Generated Budget Suggestions:");
  patterns.forEach((pattern) => {
    const existingBudget = budgets.find((b) => b.category === pattern.category);
    if (!existingBudget && pattern.frequency > 0.5) {
      const suggestedAmount = Math.ceil(
        pattern.average_amount * pattern.frequency * 1.2
      );
      console.log(`  ${pattern.category}: $${suggestedAmount}/month`);
      console.log(
        `    🤖 AI: Based on your avg $${pattern.average_amount.toFixed(
          2
        )} spending, ${pattern.frequency.toFixed(
          1
        )} times/month (20% buffer included)`
      );
    }
  });

  // Demo 6: Contextual Responses
  console.log("\n🗣️  DEMO 6: Sample AI Conversations");
  console.log("===================================");

  const sampleQueries = [
    {
      user: "How am I doing this month?",
      aiType: "insight",
      response:
        "Based on your spending patterns, you're doing well! You've spent $197.5 this month across 4 categories. Your food spending is 120% higher than usual, but you're still within budget limits.",
    },
    {
      user: "I spent $50 on groceries",
      aiType: "transaction",
      response:
        "Transaction recorded: -$50.00 for groceries (food)\n\n💡 Your food category averages $35.10 per transaction.\n📊 You're now at 31.9% of your food budget this month.",
    },
    {
      user: "Should I set a budget?",
      aiType: "suggestion",
      response:
        "Based on your spending patterns, I recommend these budgets:\n• transport: $54/month - Based on your average $45 spending, 1.0 times/month\n• entertainment: $30/month - Based on your average $25 spending, 1.0 times/month",
    },
    {
      user: "I bought something expensive",
      aiType: "question",
      response:
        "Could you provide more details? What did you buy, how much did it cost, and what category would it fall under? For example: 'I bought a laptop for $1200' or 'I spent $300 on clothes'.",
    },
  ];

  sampleQueries.forEach((query, index) => {
    console.log(`\nConversation ${index + 1}:`);
    console.log(`👤 User: "${query.user}"`);
    console.log(`🤖 AI (${query.aiType}): ${query.response}`);
  });

  // Demo 7: Learning Capabilities
  console.log("\n🧠 DEMO 7: AI Learning Capabilities");
  console.log("===================================");

  const userPrefs = db.prepare("SELECT * FROM user_preferences").all();
  console.log("AI-Learned User Preferences:");
  userPrefs.forEach((pref) => {
    console.log(`  ${pref.key}: ${pref.value}`);
  });

  const chatContext = db
    .prepare(
      `
    SELECT * FROM chat_messages 
    WHERE context IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 3
  `
    )
    .all();

  console.log("\nAI Conversation Context:");
  chatContext.forEach((msg) => {
    const context = JSON.parse(msg.context || "{}");
    console.log(
      `  ${msg.type}: ${context.type || "general"} - "${msg.content.substring(
        0,
        50
      )}..."`
    );
  });

  console.log("\n🎯 SUMMARY: Agentic AI Capabilities Demonstrated");
  console.log("================================================");
  console.log(
    "✅ Contextual Awareness - Knows your spending history and patterns"
  );
  console.log(
    "✅ Proactive Monitoring - Automatically detects budget alerts and anomalies"
  );
  console.log("✅ Pattern Learning - Analyzes spending frequency and amounts");
  console.log(
    "✅ Intelligent Suggestions - Recommends budgets based on actual behavior"
  );
  console.log(
    "✅ Multi-turn Conversations - Asks clarifying questions when needed"
  );
  console.log(
    "✅ Continuous Learning - Adapts to user preferences and behavior"
  );
  console.log(
    "✅ Goal-oriented Assistance - Helps achieve financial health goals"
  );

  console.log("\n🚀 Ready to interact with your AI Financial Assistant!");
  console.log("Visit: http://localhost:3000/ai-assistant");
} catch (error) {
  console.error("❌ Error running demo:", error);
} finally {
  db.close();
}
