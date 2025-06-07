import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/financial-overview/route";

// Mock the AI agent
vi.mock("@/lib/ai-agent", () => ({
  financeAgent: {
    getFinancialOverview: vi.fn(),
  },
}));

import { financeAgent } from "@/lib/ai-agent";

describe("/api/financial-overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/financial-overview", () => {
    it("should return financial overview successfully", async () => {
      const mockOverview = {
        totalIncome: 5000,
        totalExpenses: 3000,
        currentBalance: 2000,
        monthlyIncome: 1000,
        monthlyExpenses: 800,
        monthlyBalance: 200,
        transactionCount: 25,
      };

      const mockGetFinancialOverview = vi.mocked(
        financeAgent.getFinancialOverview
      );
      mockGetFinancialOverview.mockResolvedValue(mockOverview);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockOverview);
      expect(mockGetFinancialOverview).toHaveBeenCalledOnce();
    });

    it("should handle errors from finance agent", async () => {
      const mockGetFinancialOverview = vi.mocked(
        financeAgent.getFinancialOverview
      );
      mockGetFinancialOverview.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to get financial overview");
      expect(mockGetFinancialOverview).toHaveBeenCalledOnce();
    });

    it("should handle unknown errors", async () => {
      const mockGetFinancialOverview = vi.mocked(
        financeAgent.getFinancialOverview
      );
      mockGetFinancialOverview.mockRejectedValue("Unknown error");

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to get financial overview");
    });
  });
});
