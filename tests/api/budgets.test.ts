import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/budgets/route";
import { NextRequest } from "next/server";

// Mock the database functions
vi.mock("@/lib/database", () => ({
  getBudgets: vi.fn(),
  setBudget: vi.fn(),
  getCurrentMonthSpendingByCategory: vi.fn(),
}));

const mockGetBudgets = vi.mocked((await import("@/lib/database")).getBudgets);
const mockSetBudget = vi.mocked((await import("@/lib/database")).setBudget);
const mockGetCurrentMonthSpendingByCategory = vi.mocked(
  (await import("@/lib/database")).getCurrentMonthSpendingByCategory
);

describe("/api/budgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return budgets with spending information", async () => {
      const mockBudgets = [
        {
          id: 1,
          category: "Food",
          amount: 500,
          period: "monthly" as const,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          category: "Transport",
          amount: 200,
          period: "monthly" as const,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockGetBudgets.mockResolvedValue(mockBudgets);
      mockGetCurrentMonthSpendingByCategory
        .mockResolvedValueOnce(300) // Food spending
        .mockResolvedValueOnce(150); // Transport spending

      const request = new NextRequest("http://localhost:3000/api/budgets");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.budgets).toHaveLength(2);

      // Check Food budget calculations
      expect(data.budgets[0]).toMatchObject({
        id: 1,
        category: "Food",
        amount: 500,
        currentSpending: 300,
        percentage: 60,
        remaining: 200,
        status: "on_track",
      });

      // Check Transport budget calculations
      expect(data.budgets[1]).toMatchObject({
        id: 2,
        category: "Transport",
        amount: 200,
        currentSpending: 150,
        percentage: 75,
        remaining: 50,
        status: "on_track",
      });
    });

    it("should handle warning status for budgets over 75%", async () => {
      const mockBudgets = [
        {
          id: 1,
          category: "Food",
          amount: 500,
          period: "monthly" as const,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockGetBudgets.mockResolvedValue(mockBudgets);
      mockGetCurrentMonthSpendingByCategory.mockResolvedValue(400); // 80% of budget

      const request = new NextRequest("http://localhost:3000/api/budgets");
      const response = await GET(request);
      const data = await response.json();

      expect(data.budgets[0].status).toBe("warning");
      expect(data.budgets[0].percentage).toBe(80);
    });

    it("should handle over_budget status for budgets over 90%", async () => {
      const mockBudgets = [
        {
          id: 1,
          category: "Food",
          amount: 500,
          period: "monthly" as const,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockGetBudgets.mockResolvedValue(mockBudgets);
      mockGetCurrentMonthSpendingByCategory.mockResolvedValue(475); // 95% of budget

      const request = new NextRequest("http://localhost:3000/api/budgets");
      const response = await GET(request);
      const data = await response.json();

      expect(data.budgets[0].status).toBe("over_budget");
      expect(data.budgets[0].percentage).toBe(95);
    });

    it("should handle database errors", async () => {
      mockGetBudgets.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/budgets");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to get budgets");
      expect(data.details).toBe("Database connection failed");
    });
  });

  describe("POST", () => {
    it("should create a new budget successfully", async () => {
      const mockBudget = {
        id: 1,
        category: "Food",
        amount: 500,
        period: "monthly" as const,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockSetBudget.mockResolvedValue(mockBudget);

      const request = new NextRequest("http://localhost:3000/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          category: "Food",
          amount: 500,
          period: "monthly",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.budget).toMatchObject({
        id: 1,
        category: "Food",
        amount: 500,
        period: "monthly",
        is_active: true,
      });

      expect(mockSetBudget).toHaveBeenCalledWith("Food", 500, "monthly");
    });

    it("should validate required fields", async () => {
      const request = new NextRequest("http://localhost:3000/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          category: "Food",
          // missing amount and period
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Category, amount, and period are required");
    });

    it("should validate period values", async () => {
      const request = new NextRequest("http://localhost:3000/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          category: "Food",
          amount: 500,
          period: "invalid_period",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Period must be monthly, weekly, or yearly");
    });

    it("should handle database errors during budget creation", async () => {
      mockSetBudget.mockRejectedValue(new Error("Database write failed"));

      const request = new NextRequest("http://localhost:3000/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          category: "Food",
          amount: 500,
          period: "monthly",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to set budget");
      expect(data.details).toBe("Database write failed");
    });

    it("should handle invalid JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/budgets", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to set budget");
    });
  });
});
