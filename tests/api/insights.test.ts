import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/insights/route";
import { NextRequest } from "next/server";

// Mock the AI agent
vi.mock("@/lib/ai-agent", () => ({
  financeAgent: {
    generateProactiveInsights: vi.fn(),
    suggestBudgets: vi.fn(),
  },
}));

const mockFinanceAgent = vi.mocked(
  (await import("@/lib/ai-agent")).financeAgent
);

describe("/api/insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return insights and budget suggestions successfully", async () => {
    const mockInsights = [
      "You've spent 20% more on dining out this month compared to last month.",
      "Your grocery spending is within your typical range.",
    ];

    const mockBudgetSuggestions = [
      {
        category: "Food",
        amount: 400,
        reasoning: "Based on your average spending of $350/month",
      },
      {
        category: "Transport",
        amount: 150,
        reasoning: "Your transport costs have been consistent",
      },
    ];

    mockFinanceAgent.generateProactiveInsights.mockResolvedValue(mockInsights);
    mockFinanceAgent.suggestBudgets.mockResolvedValue(mockBudgetSuggestions);

    const request = new NextRequest("http://localhost:3000/api/insights");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.insights).toEqual(mockInsights);
    expect(data.budgetSuggestions).toEqual(mockBudgetSuggestions);

    expect(mockFinanceAgent.generateProactiveInsights).toHaveBeenCalledOnce();
    expect(mockFinanceAgent.suggestBudgets).toHaveBeenCalledOnce();
  });

  it("should handle errors from generateProactiveInsights", async () => {
    mockFinanceAgent.generateProactiveInsights.mockRejectedValue(
      new Error("AI service unavailable")
    );
    mockFinanceAgent.suggestBudgets.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/insights");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate insights");
    expect(data.details).toBe("AI service unavailable");
  });

  it("should handle errors from suggestBudgets", async () => {
    mockFinanceAgent.generateProactiveInsights.mockResolvedValue([]);
    mockFinanceAgent.suggestBudgets.mockRejectedValue(
      new Error("Budget analysis failed")
    );

    const request = new NextRequest("http://localhost:3000/api/insights");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate insights");
    expect(data.details).toBe("Budget analysis failed");
  });

  it("should handle unknown errors", async () => {
    mockFinanceAgent.generateProactiveInsights.mockRejectedValue(
      "Unknown error"
    );

    const request = new NextRequest("http://localhost:3000/api/insights");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate insights");
    expect(data.details).toBe("Unknown error");
  });

  it("should return empty arrays when AI returns empty results", async () => {
    mockFinanceAgent.generateProactiveInsights.mockResolvedValue([]);
    mockFinanceAgent.suggestBudgets.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/insights");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.insights).toEqual([]);
    expect(data.budgetSuggestions).toEqual([]);
  });
});
