# AI-Powered Finance Tracker

A modern finance tracking application that uses AI to automatically categorize and record your expenses and income from natural language input.

## Features

- 🤖 **AI-Powered Transaction Processing**: Simply tell the app about your expenses or income in natural language
- 💰 **Real-time Balance Tracking**: Get comprehensive financial overview with current balance, income, and expenses
- 🆘 **Comprehensive Help System**: Ask "What can you do?" for complete guidance on all features
- 📊 **Intelligent Financial Insights**: AI-powered analysis of spending patterns and financial health
- 🎯 **Smart Budget Management**: Automated budget suggestions and spending alerts
- 💾 **SQLite Database**: Local storage for your financial data
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Built with shadcn/ui and TailwindCSS

## AI Agent Capabilities

### 🆘 Help System

- **"What can you do?"** - Complete overview of all capabilities
- **"Help with transactions"** - Transaction recording guidance
- **"Help with balance"** - Balance and financial overview help
- **"Help with budgets"** - Budget management assistance
- **"Help with insights"** - Financial analysis guidance

### 💰 Balance & Financial Overview

- **"What's my balance?"** - Comprehensive financial summary
- **"How much money do I have?"** - Current balance information
- **"Show my financial overview"** - Detailed income/expense breakdown
- **"Am I doing well financially?"** - Financial health analysis

### 📊 Transaction Management

- **Expenses**: "I spent $15 on lunch today", "Paid $120 for electricity bill"
- **Income**: "Received $2000 salary", "Got $50 cash gift from mom"
- **Smart categorization**: Automatically categorizes transactions
- **Date parsing**: Understands "today", "yesterday", specific dates

### 📈 Financial Insights & Analysis

- **"How am I doing this month?"** - Monthly performance analysis
- **"What are my spending patterns?"** - Pattern recognition
- **"Show unusual spending"** - Anomaly detection (20%+ above normal)
- **Proactive insights**: Budget alerts, spending warnings, financial advice

### 🎯 Budget Management

- **"Should I set a budget?"** - Personalized budget recommendations
- **"How are my budgets looking?"** - Budget status and alerts
- **"Am I overspending on [category]?"** - Category-specific analysis
- **Smart suggestions**: AI-powered budget optimization

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, TailwindCSS, Lucide React
- **AI**: Vercel AI SDK with Ollama
- **Database**: SQLite with better-sqlite3
- **Styling**: TailwindCSS v4

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v18 or later)
2. **pnpm** (recommended) or npm
3. **Ollama** installed and running locally

### Setting up Ollama

1. Install Ollama from [https://ollama.ai](https://ollama.ai)
2. Pull the required model:
   ```bash
   ollama pull llama3.2
   ```
3. Make sure Ollama is running (it should start automatically)

## Getting Started

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd finances-with-ai
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start the development server**:

   ```bash
   pnpm dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Getting Help

The AI assistant has a comprehensive help system. Simply ask:

- **"What can you do?"** - Get a complete overview of all capabilities
- **"Help with [topic]"** - Get specific help on transactions, balance, budgets, or insights
- **"How do I [task]?"** - Get guidance on specific tasks

### Adding Transactions

Simply type natural language descriptions of your financial transactions in the chat interface:

**Examples:**

- "I spent $15 on lunch today"
- "Paid $120 for electricity bill"
- "Received $2000 salary"
- "Bought groceries for $85 yesterday"
- "Got $50 cash gift from mom"

The AI will automatically:

- Extract the amount
- Determine if it's income or expense
- Categorize the transaction
- Set the date (defaults to today if not specified)

### Checking Your Balance

Ask about your financial status:

- **"What's my current balance?"** - Get comprehensive financial overview
- **"How much money do I have?"** - Current balance information
- **"How am I doing this month?"** - Monthly financial performance
- **"Show my financial summary"** - Detailed breakdown

### Budget Management

Get intelligent budget assistance:

- **"Should I set a budget?"** - Get personalized recommendations
- **"How are my budgets looking?"** - Check budget status
- **"Am I overspending?"** - Spending analysis and alerts

### Quick Actions

Use the quick action buttons for instant responses:

- **Check Balance** - Instant financial overview
- **Monthly Summary** - Current month performance
- **Budget Status** - Budget alerts and status
- **Get Help** - Comprehensive assistance

### Viewing Your Data

The dashboard shows:

- **Current Balance**: Total income minus expenses
- **Monthly Summary**: This month's income, expenses, and net savings
- **Recent Transactions**: List of your latest transactions with details
- **Proactive Insights**: AI-generated financial advice and alerts

## AI Intelligence Features

- **Natural Language Understanding**: Understands conversational input
- **Contextual Awareness**: Remembers your financial history and patterns
- **Proactive Insights**: Provides unsolicited helpful advice
- **Pattern Learning**: Learns from your spending habits
- **Anomaly Detection**: Alerts you to unusual spending (20%+ above normal)
- **Multi-turn Conversations**: Maintains context across interactions
- **Clarification Questions**: Asks for details when input is ambiguous

## Configuration

You can customize the Ollama configuration by modifying `lib/config.ts`:

```typescript
export const OLLAMA_CONFIG = {
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: process.env.OLLAMA_MODEL || "llama3.2:latest",
};
```

## Database

The application uses SQLite for local data storage. The database file (`finances.db`) will be created automatically in the project root when you first run the application.

### Database Schema

```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables for AI agent features
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  period TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spending_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL UNIQUE,
  frequency REAL NOT NULL,
  average_amount REAL NOT NULL,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/              # AI chat endpoint
│   │   ├── transactions/      # Transaction data endpoint
│   │   ├── insights/          # Financial insights endpoint
│   │   └── financial-overview/ # Balance and overview endpoint
│   ├── ai-assistant/          # AI Assistant page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx              # Main page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── chat.tsx              # Enhanced chat interface
│   └── transaction-history.tsx  # Transaction display
├── lib/
│   ├── ai-agent.ts           # Enhanced AI agent with help system
│   ├── config.ts             # App configuration
│   ├── database.ts           # Database operations
│   └── utils.ts              # Utility functions
├── scripts/
│   ├── demo-complete-agent.js # Complete feature demo
│   ├── test-help-functionality.js # Help system test
│   └── demo-balance-agent.js  # Balance functionality demo
└── public/                   # Static assets
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `node scripts/demo-complete-agent.js` - Run complete feature demo
- `node scripts/test-help-functionality.js` - Test help system

## Example Interactions

### Getting Help

```
User: "What can you do?"
AI: [Comprehensive capabilities overview with examples]

User: "Help with transactions"
AI: [Detailed transaction recording guide]
```

### Balance Queries

```
User: "What's my balance?"
AI: "Here's your financial overview:
💰 Current Balance: $5,824.00
📊 Overall Summary: ...
📅 This Month: ..."
```

### Transaction Recording

```
User: "I spent $12 on coffee"
AI: "Transaction recorded: -$12.00 for coffee (food)"
```

### Financial Insights

```
User: "How am I doing this month?"
AI: "📈 This month you've saved $1,862.50! Keep it up!
Your food spending is 15% higher than usual..."
```

## Deployment

This application can be deployed to any platform that supports Node.js applications. Popular options include:

- **Vercel** (recommended for Next.js apps)
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**

**Note**: When deploying, make sure your hosting platform supports:

- Node.js runtime
- File system access (for SQLite database)
- External HTTP requests (for Ollama API calls)

For production deployment, you may want to:

1. Use a hosted database instead of SQLite
2. Set up a remote Ollama instance or use a different AI provider
3. Configure environment variables for production settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [GNU GPLv3 License](LICENSE).
