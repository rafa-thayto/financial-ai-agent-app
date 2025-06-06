import { ollama } from "ollama-ai-provider";
import { generateText } from "ai";
import { z } from "zod";
import { OLLAMA_CONFIG } from "@/lib/config";
import {
  getRecentChatContext,
  getTransactions,
  getBudgets,
  getSpendingPatterns,
  getCurrentMonthSpending,
  getUnusualSpending,
  getBudgetForCategory,
  getSpendingPatternForCategory,
  getUserPreference,
  setUserPreference,
  setBudget,
  getTotalByType,
  getMonthlySummary,
} from "@/lib/database";

// Enhanced schemas for agentic responses
const TransactionSchema = z.object({
  description: z.string().describe("The description of the transaction"),
  amount: z.number().describe("The amount of money (positive number)"),
  category: z.string().describe("The category of the transaction"),
  type: z
    .enum(["income", "expense"])
    .describe("Whether this is income or an expense"),
  date: z.string().describe("The date of the transaction in YYYY-MM-DD format"),
});

const AgentResponseSchema = z.object({
  type: z.enum([
    "transaction",
    "question",
    "insight",
    "budget_alert",
    "suggestion",
    "balance",
    "help",
  ]),
  transaction: TransactionSchema.optional(),
  message: z.string(),
  suggestions: z.array(z.string()).optional(),
  requires_clarification: z.boolean().default(false),
  clarification_question: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  transactionCount: number;
}

export interface AgentContext {
  recentTransactions: any[];
  chatHistory: any[];
  spendingPatterns: any[];
  budgets: any[];
  unusualSpending: any[];
  currentMonthSpending: number;
  userPreferences: Record<string, string>;
  financialSummary: FinancialSummary;
}

export class FinanceAIAgent {
  private async getFinancialSummary(): Promise<FinancialSummary> {
    const totalIncome = getTotalByType("income");
    const totalExpenses = getTotalByType("expense");
    const currentBalance = totalIncome - totalExpenses;

    // Get current month summary
    const now = new Date();
    const monthlySummary = getMonthlySummary(
      now.getFullYear(),
      now.getMonth() + 1
    );

    return {
      totalIncome,
      totalExpenses,
      currentBalance,
      monthlyIncome: monthlySummary.totalIncome,
      monthlyExpenses: monthlySummary.totalExpense,
      monthlyBalance: monthlySummary.balance,
      transactionCount: monthlySummary.transactionCount,
    };
  }

  private async getContext(): Promise<AgentContext> {
    const recentTransactions = getTransactions(10);
    const chatHistory = getRecentChatContext(10);
    const spendingPatterns = getSpendingPatterns();
    const budgets = getBudgets();
    const unusualSpending = getUnusualSpending();
    const currentMonthSpending = getCurrentMonthSpending();
    const financialSummary = await this.getFinancialSummary();

    // Get user preferences
    const userPreferences: Record<string, string> = {};
    const prefKeys = [
      "preferred_currency",
      "budget_alerts",
      "spending_insights",
      "default_categories",
    ];
    for (const key of prefKeys) {
      const value = getUserPreference(key);
      if (value) userPreferences[key] = value;
    }

    return {
      recentTransactions,
      chatHistory,
      spendingPatterns,
      budgets,
      unusualSpending,
      currentMonthSpending,
      userPreferences,
      financialSummary,
    };
  }

  private generateContextualPrompt(
    message: string,
    context: AgentContext
  ): string {
    const contextSummary = `
Recent Transactions: ${context.recentTransactions.length} transactions
Current Balance: $${context.financialSummary.currentBalance.toFixed(2)}
Monthly Income: $${context.financialSummary.monthlyIncome.toFixed(2)}
Monthly Expenses: $${context.financialSummary.monthlyExpenses.toFixed(2)}
Active Budgets: ${context.budgets.length}
Spending Patterns: ${context.spendingPatterns.length} categories tracked
Unusual Spending: ${context.unusualSpending.length} anomalies detected`;

    return `You are an intelligent financial assistant agent with the following capabilities:
1. Process financial transactions from natural language
2. Provide comprehensive financial analysis including balance information
3. Monitor budgets and spending patterns
4. Ask clarifying questions when needed
5. Learn from user preferences and behavior
6. Provide detailed financial summaries and insights
7. Offer comprehensive help and guidance on all features

Context:
${contextSummary}

User message: "${message}"

IMPORTANT RULES:
1. If the user is asking about balance, money, or financial overview, respond with type "balance"
2. If the user is clearly recording a transaction (spent, paid, received, bought, etc.), respond with type "transaction"
3. If the user asks for help or capabilities, respond with type "help"
4. If the user asks about spending patterns or insights, respond with type "insight"
5. Only extract transactions when the user is clearly stating they made a purchase or received money

RESPONSE FORMAT - Respond with ONLY a valid JSON object:
{
  "type": "transaction" | "question" | "insight" | "budget_alert" | "suggestion" | "balance" | "help",
  "transaction": {
    "description": "string",
    "amount": number,
    "category": "string",
    "type": "income" | "expense",
    "date": "YYYY-MM-DD"
  } (only if type is "transaction"),
  "message": "Your response message to the user",
  "suggestions": ["array of helpful suggestions"] (optional),
  "requires_clarification": boolean,
  "clarification_question": "string" (if requires_clarification is true),
  "context": {} (optional metadata)
}

EXAMPLES:
- "What's my balance?" → type: "balance"
- "I spent $50 on groceries" → type: "transaction" with transaction data
- "How am I doing this month?" → type: "insight"
- "What can you do?" → type: "help"

Valid categories: food, transport, entertainment, utilities, shopping, health, salary, freelance, rent, insurance, gas, clothing, education, gifts, medical, bills, groceries, dining, travel, hobbies, other`;
  }

  async processMessage(message: string): Promise<any> {
    const context = await this.getContext();

    // Pre-process message to determine intent
    const lowerMessage = message.toLowerCase();

    // Handle balance queries directly
    if (
      lowerMessage.includes("balance") ||
      lowerMessage.includes("how much money") ||
      lowerMessage.includes("financial overview") ||
      lowerMessage.includes("how much do i have") ||
      lowerMessage.includes("what do i have")
    ) {
      return {
        type: "balance",
        message: `Here's your financial overview:

💰 **Current Balance: $${context.financialSummary.currentBalance.toFixed(2)}**

📊 **Overall Summary:**
• Total Income: $${context.financialSummary.totalIncome.toFixed(2)}
• Total Expenses: $${context.financialSummary.totalExpenses.toFixed(2)}

📅 **This Month:**
• Income: $${context.financialSummary.monthlyIncome.toFixed(2)}
• Expenses: $${context.financialSummary.monthlyExpenses.toFixed(2)}
• Net: $${context.financialSummary.monthlyBalance.toFixed(2)}
• Transactions: ${context.financialSummary.transactionCount}

${
  context.financialSummary.currentBalance > 0
    ? "🟢 You have a positive balance!"
    : "🔴 Your expenses exceed your income. Consider reviewing your spending."
}`,
        requires_clarification: false,
        context: {
          type: "balance",
          balance: context.financialSummary.currentBalance,
        },
      };
    }

    // Handle help queries directly
    if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("what can you do") ||
      lowerMessage.includes("capabilities") ||
      lowerMessage.includes("commands")
    ) {
      return this.getHelpResponse(message);
    }

    // Handle transaction queries
    if (
      lowerMessage.includes("spent") ||
      lowerMessage.includes("paid") ||
      lowerMessage.includes("bought") ||
      lowerMessage.includes("received") ||
      lowerMessage.includes("earned") ||
      lowerMessage.includes("got") ||
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("income") ||
      lowerMessage.includes("salary") ||
      /\$\d+/.test(message) // Contains dollar amount
    ) {
      return await this.fallbackTransactionExtraction(message);
    }

    // Handle insights queries
    if (
      lowerMessage.includes("how am i doing") ||
      lowerMessage.includes("spending patterns") ||
      lowerMessage.includes("insights") ||
      lowerMessage.includes("analysis")
    ) {
      const insights = await this.generateProactiveInsights();
      return {
        type: "insight",
        message:
          insights.length > 0
            ? insights.join("\n\n")
            : "No specific insights available at the moment. Keep tracking your expenses for better analysis!",
        suggestions: [
          "Try asking 'What's my balance?' for financial overview",
          "Record more transactions for better insights",
          "Ask 'Should I set a budget?' for budget recommendations",
        ],
        requires_clarification: false,
        context: { type: "insight" },
      };
    }

    // Use AI for complex queries
    const prompt = this.generateContextualPrompt(message, context);

    try {
      const { text } = await generateText({
        model: ollama(OLLAMA_CONFIG.model),
        prompt,
      });

      // Extract JSON from response
      let jsonStr = text.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const response = JSON.parse(jsonStr);

      // Validate response
      const validatedResponse = AgentResponseSchema.parse(response);

      // Handle different response types
      await this.handleAgentResponse(validatedResponse, context);

      return validatedResponse;
    } catch (error) {
      console.error("Agent processing error:", error);

      // Final fallback
      return {
        type: "question",
        message:
          "I'm not sure I understand. Could you please rephrase your question? You can ask about your balance, record a transaction, or ask for help.",
        suggestions: [
          "Try: 'What's my balance?'",
          "Try: 'I spent $X on [item]'",
          "Try: 'What can you do?'",
        ],
        requires_clarification: true,
        clarification_question:
          "What would you like to know about your finances?",
      };
    }
  }

  private async handleAgentResponse(response: any, context: AgentContext) {
    // Auto-set budgets if user mentions them
    if (
      response.type === "suggestion" &&
      response.message.toLowerCase().includes("budget")
    ) {
      // Extract budget information if mentioned
      const budgetMatch = response.message.match(
        /budget.*?\$(\d+).*?(monthly|weekly|yearly)/i
      );
      if (budgetMatch) {
        // This could be enhanced to automatically set budgets based on suggestions
      }
    }

    // Update user preferences based on interactions
    if (response.context) {
      for (const [key, value] of Object.entries(response.context)) {
        if (typeof value === "string") {
          setUserPreference(key, value);
        }
      }
    }
  }

  private getHelpResponse(query: string): any {
    const lowerQuery = query.toLowerCase();

    // Comprehensive help responses based on query type
    if (
      lowerQuery.includes("help") ||
      lowerQuery.includes("what can you do") ||
      lowerQuery.includes("capabilities") ||
      lowerQuery.includes("commands")
    ) {
      return {
        type: "help",
        message: `🤖 **AI Financial Assistant Capabilities**

I'm your intelligent financial companion with advanced capabilities:

**💰 Balance & Financial Overview:**
• "What's my balance?" - Get comprehensive financial overview
• "How much money do I have?" - Current balance information
• "Show my financial summary" - Detailed income/expense breakdown

**📊 Transaction Management:**
• "I spent $25 on groceries" - Record expenses with smart categorization
• "Received $2000 salary" - Log income transactions
• "Paid $120 for electricity bill" - Track bill payments
• "Got $50 cash gift" - Record various income sources

**📈 Financial Insights & Analysis:**
• "How am I doing this month?" - Monthly financial performance
• "What are my spending patterns?" - Analyze spending habits
• "Show unusual spending" - Detect spending anomalies
• "Am I overspending?" - Budget and spending analysis

**🎯 Budget Management:**
• "Should I set a budget?" - Get personalized budget recommendations
• "How are my budgets?" - Check budget status and alerts
• "Set a budget for groceries" - Create category budgets
• "Budget suggestions" - AI-powered budget optimization

**🔍 Smart Questions & Clarifications:**
• I can ask follow-up questions for unclear transactions
• Provide context-aware suggestions based on your history
• Learn from your spending patterns and preferences

**🚀 Quick Actions Available:**
• Use the quick action buttons for instant responses
• Ask about specific categories: "How much did I spend on food?"
• Get proactive alerts about budget overruns
• Receive personalized financial advice

**💡 Example Commands:**
Try saying things like:
• "What's my current balance?"
• "I bought coffee for $4.50"
• "How much did I spend this week?"
• "Should I be worried about my spending?"
• "Help me create a budget"
• "What are my biggest expenses?"

I understand natural language, so feel free to ask in your own words!`,
        suggestions: [
          "Try asking 'What's my balance?' to see your financial overview",
          "Say 'I spent $X on [item]' to record a transaction",
          "Ask 'How am I doing this month?' for insights",
          "Request 'Budget suggestions' for personalized recommendations",
        ],
        requires_clarification: false,
        context: { type: "help", category: "general" },
      };
    }

    // Specific help topics
    if (
      lowerQuery.includes("transaction") ||
      lowerQuery.includes("record") ||
      lowerQuery.includes("add")
    ) {
      return {
        type: "help",
        message: `📝 **Recording Transactions**

I can help you record both income and expenses using natural language:

**Expense Examples:**
• "I spent $15 on lunch today"
• "Paid $120 for electricity bill"
• "Bought groceries for $85 yesterday"
• "Gas station $45"
• "Coffee $4.50"

**Income Examples:**
• "Received $2000 salary"
• "Got $50 cash gift from mom"
• "Freelance payment $800"
• "Sold item for $25"

**What I automatically detect:**
• Amount (required)
• Category (auto-categorized)
• Date (defaults to today if not specified)
• Type (income vs expense)
• Description

**Categories I understand:**
Food, Transport, Entertainment, Utilities, Shopping, Health, Salary, Freelance, Rent, Insurance, Gas, Clothing, Education, Gifts, Medical, Bills, Groceries, Dining, Travel, Hobbies, and more!`,
        suggestions: [
          "Try: 'I spent $12 on lunch'",
          "Try: 'Received $1500 salary today'",
          "Try: 'Paid $80 for phone bill yesterday'",
        ],
        context: { type: "help", category: "transactions" },
      };
    }

    if (
      lowerQuery.includes("balance") ||
      lowerQuery.includes("money") ||
      lowerQuery.includes("financial overview")
    ) {
      return {
        type: "help",
        message: `💰 **Balance & Financial Overview**

I provide comprehensive financial information:

**Balance Queries:**
• "What's my current balance?"
• "How much money do I have?"
• "Show my financial overview"
• "What's my total income/expenses?"

**What I show you:**
• Current balance (Total Income - Total Expenses)
• Total income and expenses (all time)
• Monthly income and expenses
• Monthly net savings/deficit
• Transaction count for the month

**Monthly Analysis:**
• "How am I doing this month?"
• "What's my monthly summary?"
• "Am I saving money this month?"

**Financial Health Insights:**
• Positive balance congratulations
• Negative balance warnings with advice
• Monthly spending vs earning analysis
• Savings rate calculations`,
        suggestions: [
          "Ask: 'What's my current balance?'",
          "Try: 'How am I doing financially?'",
          "Say: 'Show my monthly summary'",
        ],
        context: { type: "help", category: "balance" },
      };
    }

    if (
      lowerQuery.includes("budget") ||
      lowerQuery.includes("spending") ||
      lowerQuery.includes("limit")
    ) {
      return {
        type: "help",
        message: `🎯 **Budget Management & Spending Analysis**

I help you manage budgets and analyze spending:

**Budget Features:**
• Automatic budget suggestions based on spending patterns
• Budget alerts when approaching limits
• Category-wise budget tracking
• Monthly budget performance analysis

**Budget Queries:**
• "Should I set a budget?"
• "How are my budgets looking?"
• "Am I overspending on [category]?"
• "Budget suggestions for me"

**Spending Analysis:**
• Unusual spending pattern detection
• Category spending breakdowns
• Spending frequency analysis
• Month-over-month comparisons

**Proactive Alerts:**
• 75% budget usage warnings
• 90%+ budget usage alerts
• Unusual spending notifications
• Budget optimization suggestions

**Smart Recommendations:**
• Personalized budget amounts
• Category-specific advice
• Spending reduction tips
• Financial goal suggestions`,
        suggestions: [
          "Ask: 'Should I set a budget?'",
          "Try: 'How are my budgets?'",
          "Say: 'What are my spending patterns?'",
        ],
        context: { type: "help", category: "budgets" },
      };
    }

    if (
      lowerQuery.includes("insight") ||
      lowerQuery.includes("analysis") ||
      lowerQuery.includes("pattern")
    ) {
      return {
        type: "help",
        message: `📈 **Financial Insights & Analysis**

I provide intelligent analysis of your financial data:

**Spending Pattern Analysis:**
• Most frequent expense categories
• Average spending per category
• Spending frequency tracking
• Seasonal spending trends

**Anomaly Detection:**
• Spending 20%+ above normal patterns
• Unusual transaction amounts
• Category spending spikes
• Budget deviation alerts

**Proactive Insights:**
• Monthly financial health summaries
• Budget performance analysis
• Savings rate calculations
• Financial goal progress

**Contextual Intelligence:**
• Learn from your transaction history
• Adapt recommendations to your patterns
• Provide personalized financial advice
• Remember your preferences

**Analysis Queries:**
• "What are my spending patterns?"
• "Show me unusual spending"
• "How do I compare to last month?"
• "What insights do you have for me?"`,
        suggestions: [
          "Ask: 'What are my spending patterns?'",
          "Try: 'Show me financial insights'",
          "Say: 'Any unusual spending this month?'",
        ],
        context: { type: "help", category: "insights" },
      };
    }

    // Default help for unrecognized help queries
    return {
      type: "help",
      message: `❓ **Need More Specific Help?**

I can help you with:
• **Transactions** - Recording income and expenses
• **Balance** - Checking your financial overview
• **Budgets** - Managing and tracking budgets
• **Insights** - Financial analysis and patterns

Try asking:
• "Help with transactions"
• "Help with balance"
• "Help with budgets"
• "Help with insights"

Or just ask "What can you do?" for a complete overview!`,
      suggestions: [
        "Ask: 'What can you do?' for full capabilities",
        "Try: 'Help with transactions'",
        "Say: 'Help with budgets'",
      ],
      context: { type: "help", category: "general" },
    };
  }

  private async fallbackTransactionExtraction(message: string): Promise<any> {
    const today = new Date().toISOString().split("T")[0];

    // Simple pattern matching for common transaction formats
    const lowerMessage = message.toLowerCase();

    // Extract amount using regex
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    if (!amountMatch) {
      return {
        type: "question",
        message:
          "I couldn't find an amount in your message. Could you please specify how much you spent or received?",
        requires_clarification: true,
        clarification_question: "How much was the transaction for?",
      };
    }

    const amount = parseFloat(amountMatch[1]);

    // Determine transaction type
    let transactionType: "income" | "expense" = "expense";
    if (
      lowerMessage.includes("received") ||
      lowerMessage.includes("earned") ||
      lowerMessage.includes("got") ||
      lowerMessage.includes("income") ||
      lowerMessage.includes("salary") ||
      lowerMessage.includes("paid me") ||
      lowerMessage.includes("refund")
    ) {
      transactionType = "income";
    }

    // Determine category based on keywords
    let category = "other";
    if (
      lowerMessage.includes("food") ||
      lowerMessage.includes("lunch") ||
      lowerMessage.includes("dinner") ||
      lowerMessage.includes("breakfast") ||
      lowerMessage.includes("restaurant")
    ) {
      category = "food";
    } else if (
      lowerMessage.includes("groceries") ||
      lowerMessage.includes("grocery")
    ) {
      category = "groceries";
    } else if (
      lowerMessage.includes("gas") ||
      lowerMessage.includes("fuel") ||
      lowerMessage.includes("petrol")
    ) {
      category = "gas";
    } else if (
      lowerMessage.includes("rent") ||
      lowerMessage.includes("housing")
    ) {
      category = "rent";
    } else if (
      lowerMessage.includes("transport") ||
      lowerMessage.includes("bus") ||
      lowerMessage.includes("train") ||
      lowerMessage.includes("uber") ||
      lowerMessage.includes("taxi")
    ) {
      category = "transport";
    } else if (
      lowerMessage.includes("entertainment") ||
      lowerMessage.includes("movie") ||
      lowerMessage.includes("game")
    ) {
      category = "entertainment";
    } else if (
      lowerMessage.includes("utilities") ||
      lowerMessage.includes("electricity") ||
      lowerMessage.includes("water") ||
      lowerMessage.includes("internet")
    ) {
      category = "utilities";
    } else if (
      lowerMessage.includes("shopping") ||
      lowerMessage.includes("clothes") ||
      lowerMessage.includes("clothing")
    ) {
      category = "shopping";
    } else if (
      lowerMessage.includes("health") ||
      lowerMessage.includes("medical") ||
      lowerMessage.includes("doctor")
    ) {
      category = "health";
    } else if (
      lowerMessage.includes("salary") ||
      lowerMessage.includes("paycheck")
    ) {
      category = "salary";
    } else if (
      lowerMessage.includes("freelance") ||
      lowerMessage.includes("contract")
    ) {
      category = "freelance";
    }

    // Create description
    let description = message.trim();
    if (description.length > 100) {
      description = description.substring(0, 97) + "...";
    }

    // Clean up description
    description = description.replace(/^\$?\d+(?:\.\d{2})?\s*/, "").trim();
    if (!description) {
      description = `${
        transactionType === "income" ? "Income" : "Expense"
      } - $${amount}`;
    }

    return {
      type: "transaction",
      transaction: {
        description,
        amount,
        category,
        type: transactionType,
        date: today,
      },
      message: `✅ Transaction recorded: ${
        transactionType === "income" ? "+" : "-"
      }$${amount.toFixed(2)} for ${description} (${category})`,
      requires_clarification: false,
      context: {
        type: "transaction",
        amount,
        category,
        transactionType,
      },
    };
  }

  async generateProactiveInsights(): Promise<string[]> {
    const context = await this.getContext();
    const insights: string[] = [];

    // Balance insights
    if (context.financialSummary.currentBalance < 0) {
      insights.push(
        `🔴 Your current balance is negative ($${context.financialSummary.currentBalance.toFixed(
          2
        )}). Consider reducing expenses or increasing income.`
      );
    } else if (context.financialSummary.currentBalance > 1000) {
      insights.push(
        `🟢 Great job! You have a healthy balance of $${context.financialSummary.currentBalance.toFixed(
          2
        )}.`
      );
    }

    // Monthly balance insights
    if (context.financialSummary.monthlyBalance < 0) {
      insights.push(
        `📉 This month you've spent $${Math.abs(
          context.financialSummary.monthlyBalance
        ).toFixed(2)} more than you've earned.`
      );
    } else if (context.financialSummary.monthlyBalance > 0) {
      insights.push(
        `📈 This month you've saved $${context.financialSummary.monthlyBalance.toFixed(
          2
        )}! Keep it up!`
      );
    }

    // Budget alerts
    for (const budget of context.budgets) {
      const spent = getCurrentMonthSpending(budget.category);
      const percentage = (spent / budget.amount) * 100;

      if (percentage > 90) {
        insights.push(
          `⚠️ You've spent ${percentage.toFixed(1)}% of your ${
            budget.category
          } budget this month!`
        );
      } else if (percentage > 75) {
        insights.push(
          `📊 You're at ${percentage.toFixed(1)}% of your ${
            budget.category
          } budget. Consider monitoring closely.`
        );
      }
    }

    // Unusual spending alerts
    for (const unusual of context.unusualSpending.slice(0, 2)) {
      if (unusual.deviation_percentage > 50) {
        insights.push(
          `📈 Your ${
            unusual.category
          } spending is ${unusual.deviation_percentage.toFixed(
            1
          )}% higher than usual this month.`
        );
      }
    }

    // Spending pattern insights
    if (context.spendingPatterns.length > 0) {
      const topCategory = context.spendingPatterns[0];
      insights.push(
        `💡 Your most frequent expense category is ${
          topCategory.category
        } (avg $${topCategory.average_amount.toFixed(2)} per transaction).`
      );
    }

    return insights;
  }

  async suggestBudgets(): Promise<
    Array<{ category: string; amount: number; reasoning: string }>
  > {
    const context = await this.getContext();
    const suggestions: Array<{
      category: string;
      amount: number;
      reasoning: string;
    }> = [];

    // Suggest budgets for categories without them
    for (const pattern of context.spendingPatterns) {
      const existingBudget = getBudgetForCategory(pattern.category);
      if (!existingBudget && pattern.frequency > 0.5) {
        // More than 0.5 transactions per month
        const suggestedAmount = Math.ceil(
          pattern.average_amount * pattern.frequency * 1.2
        ); // 20% buffer
        suggestions.push({
          category: pattern.category,
          amount: suggestedAmount,
          reasoning: `Based on your average spending of $${pattern.average_amount.toFixed(
            2
          )} per transaction, ${pattern.frequency.toFixed(1)} times per month.`,
        });
      }
    }

    return suggestions.slice(0, 3); // Top 3 suggestions
  }

  async getFinancialOverview(): Promise<FinancialSummary> {
    return await this.getFinancialSummary();
  }
}

export const financeAgent = new FinanceAIAgent();
