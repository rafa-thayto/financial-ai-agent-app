import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { NextRequest } from "next/server";

// Mock the database operations and AI agent
vi.mock("@/lib/database", () => ({
  insertChatMessage: vi.fn(),
  insertTransaction: vi.fn(),
}));

vi.mock("@/lib/ai-agent", () => ({
  financeAgent: {
    processMessage: vi.fn(),
    generateProactiveInsights: vi.fn(),
    suggestBudgets: vi.fn(),
  },
}));

const { insertChatMessage, insertTransaction } = await import("@/lib/database");
const { financeAgent } = await import("@/lib/ai-agent");

describe("/api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate required message field", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Message is required");
  });

  it("should process a chat message successfully", async () => {
    const mockAgentResponse = {
      type: "balance",
      message: "Your current balance is $100.00",
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(insertChatMessage).mockResolvedValue({
      id: 1,
      type: "user",
      content: "What's my balance?",
      context: null,
      createdAt: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "What's my balance?" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Your current balance is $100.00");
    expect(data.agentType).toBe("balance");

    expect(vi.mocked(insertChatMessage)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(financeAgent.processMessage)).toHaveBeenCalledWith(
      "What's my balance?"
    );
  });

  it("should handle AI agent errors", async () => {
    vi.mocked(financeAgent.processMessage).mockRejectedValue(
      new Error("AI processing error")
    );
    vi.mocked(insertChatMessage).mockResolvedValue({
      id: 1,
      type: "assistant",
      content: "Error message",
      context: null,
      createdAt: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Test message" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to process message");
    expect(data.details).toBe("AI processing error");
  });

  it("should handle transaction responses", async () => {
    const mockAgentResponse = {
      type: "transaction",
      transaction: {
        description: "Coffee",
        amount: 5.5,
        category: "food",
        type: "expense",
        date: "2024-01-01",
      },
      message: "Transaction recorded: -$5.50 for Coffee (food)",
      requires_clarification: false,
    };

    const mockInsights = ["You've spent 20% more on food this month"];

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(financeAgent.generateProactiveInsights).mockResolvedValue(
      mockInsights
    );
    vi.mocked(insertTransaction).mockResolvedValue({
      id: 1,
      description: "Coffee",
      amount: 5.5,
      category: "food",
      type: "expense",
      date: "2024-01-01",
      createdAt: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I spent $5.50 on coffee" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transaction).toMatchObject({
      id: 1,
      description: "Coffee",
      amount: 5.5,
      category: "food",
      type: "expense",
      date: "2024-01-01",
    });

    expect(vi.mocked(insertTransaction)).toHaveBeenCalledWith({
      description: "Coffee",
      amount: 5.5,
      category: "food",
      date: "2024-01-01",
      type: "expense",
    });
  });

  it("should handle invalid JSON with proper error response", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to process message");
  });

  it("should handle question type responses with clarification", async () => {
    const mockAgentResponse = {
      type: "question",
      message: "Could you clarify the amount?",
      requires_clarification: true,
      clarification_question: "What was the exact amount you spent?",
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I bought something" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("What was the exact amount you spent?");
    expect(data.requiresClarification).toBe(true);
    expect(data.clarificationQuestion).toBe(
      "What was the exact amount you spent?"
    );
  });

  it("should handle insight type responses", async () => {
    const mockAgentResponse = {
      type: "insight",
      message: "Here are your spending insights",
      requires_clarification: false,
    };

    const mockInsights = [
      "You've spent 20% more on dining out this month",
      "Your grocery spending is within normal range",
    ];

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(financeAgent.generateProactiveInsights).mockResolvedValue(
      mockInsights
    );

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Show me my spending insights" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Here are your spending insights");
    expect(data.message).toContain(
      "You've spent 20% more on dining out this month"
    );
  });

  it("should handle budget_alert type responses", async () => {
    const mockAgentResponse = {
      type: "budget_alert",
      message: "Budget alert: You're over your food budget",
      requires_clarification: false,
    };

    const mockBudgetSuggestions = [
      {
        category: "Food",
        amount: 400,
        reasoning: "Based on your spending patterns",
      },
    ];

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(financeAgent.suggestBudgets).mockResolvedValue(
      mockBudgetSuggestions
    );

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Check my budget status" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain(
      "Budget alert: You're over your food budget"
    );
    expect(data.message).toContain("Budget suggestions:");
    expect(data.message).toContain("Food: $400/month");
  });

  it("should handle suggestion type responses", async () => {
    const mockAgentResponse = {
      type: "suggestion",
      message: "Here are some suggestions for you",
      suggestions: [
        "Consider setting a budget for dining out",
        "Track your grocery expenses more carefully",
      ],
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Give me some financial advice" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Here are some suggestions for you");
    expect(data.message).toContain("Consider setting a budget for dining out");
    expect(data.suggestions).toEqual([
      "Consider setting a budget for dining out",
      "Track your grocery expenses more carefully",
    ]);
  });

  it("should handle transaction responses without insights", async () => {
    const mockAgentResponse = {
      type: "transaction",
      transaction: {
        description: "Lunch",
        amount: 12.0,
        category: "food",
        type: "expense",
        date: "2024-01-01",
      },
      message: "Transaction recorded",
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(financeAgent.generateProactiveInsights).mockResolvedValue([]);
    vi.mocked(insertTransaction).mockResolvedValue({
      id: 2,
      description: "Lunch",
      amount: 12.0,
      category: "food",
      type: "expense",
      date: "2024-01-01",
      createdAt: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I spent $12 on lunch" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Transaction recorded");
  });

  it("should handle transaction responses without transaction object", async () => {
    const mockAgentResponse = {
      type: "transaction",
      transaction: null,
      message: "Could not process transaction",
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I spent money" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Could not process transaction");
    expect(data.transaction).toBeNull();
  });

  it("should handle question type without clarification", async () => {
    const mockAgentResponse = {
      type: "question",
      message: "I need more information",
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Help me" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("I need more information");
    expect(data.requiresClarification).toBe(false);
  });

  it("should handle insight type without insights", async () => {
    const mockAgentResponse = {
      type: "insight",
      message: "No insights available",
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(financeAgent.generateProactiveInsights).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Show insights" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("No insights available");
  });

  it("should handle budget_alert type without suggestions", async () => {
    const mockAgentResponse = {
      type: "budget_alert",
      message: "Budget alert",
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);
    vi.mocked(financeAgent.suggestBudgets).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Budget check" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Budget alert");
  });

  it("should handle suggestion type without suggestions", async () => {
    const mockAgentResponse = {
      type: "suggestion",
      message: "No suggestions available",
      suggestions: [],
      requires_clarification: false,
    };

    vi.mocked(financeAgent.processMessage).mockResolvedValue(mockAgentResponse);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Give suggestions" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("No suggestions available");
    expect(data.suggestions).toEqual([]);
  });
});
