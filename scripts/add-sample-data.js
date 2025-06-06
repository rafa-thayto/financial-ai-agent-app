const Database = require("better-sqlite3");
const { join } = require("path");

// Create database connection
const dbPath = join(process.cwd(), "finances.db");
const db = new Database(dbPath);

// Sample transactions
const sampleTransactions = [
  {
    description: "Grocery shopping",
    amount: 85.5,
    category: "food",
    date: "2024-01-15",
    type: "expense",
  },
  {
    description: "Salary payment",
    amount: 3000.0,
    category: "salary",
    date: "2024-01-01",
    type: "income",
  },
  {
    description: "Gas station",
    amount: 45.0,
    category: "transport",
    date: "2024-01-10",
    type: "expense",
  },
  {
    description: "Coffee shop",
    amount: 12.5,
    category: "food",
    date: "2024-01-12",
    type: "expense",
  },
  {
    description: "Freelance work",
    amount: 500.0,
    category: "freelance",
    date: "2024-01-08",
    type: "income",
  },
  {
    description: "Electric bill",
    amount: 120.0,
    category: "utilities",
    date: "2024-01-05",
    type: "expense",
  },
  {
    description: "Movie tickets",
    amount: 25.0,
    category: "entertainment",
    date: "2024-01-14",
    type: "expense",
  },
];

// Sample chat messages
const sampleMessages = [
  {
    type: "user",
    content: "I spent $85.50 on groceries today",
  },
  {
    type: "assistant",
    content: "Transaction recorded: -$85.50 for groceries (food)",
  },
  {
    type: "user",
    content: "I received my salary of $3000",
  },
  {
    type: "assistant",
    content: "Transaction recorded: +$3000.00 for salary (salary)",
  },
  {
    type: "user",
    content: "Paid $45 for gas",
  },
  {
    type: "assistant",
    content: "Transaction recorded: -$45.00 for gas (transport)",
  },
];

try {
  console.log("Adding sample transactions...");

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (description, amount, category, date, type)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const transaction of sampleTransactions) {
    insertTransaction.run(
      transaction.description,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.type
    );
  }

  console.log("Adding sample chat messages...");

  const insertMessage = db.prepare(`
    INSERT INTO chat_messages (type, content)
    VALUES (?, ?)
  `);

  for (const message of sampleMessages) {
    insertMessage.run(message.type, message.content);
  }

  console.log("Sample data added successfully!");
  console.log(`Added ${sampleTransactions.length} transactions`);
  console.log(`Added ${sampleMessages.length} chat messages`);
} catch (error) {
  console.error("Error adding sample data:", error);
} finally {
  db.close();
}
