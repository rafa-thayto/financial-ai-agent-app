import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/transactions/route";
import { NextRequest } from "next/server";

// Mock the database operations
vi.mock("@/lib/database", () => ({
  getTransactions: vi.fn(),
  getTotalByType: vi.fn(),
}));

import { getTransactions, getTotalByType } from "@/lib/database";

describe("/api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/transactions", () => {
    it("should return transactions with summary", async () => {
      const mockTransactions = [
        {
          id: 1,
          description: "Test transaction",
          amount: 100,
          category: "food",
          date: "2024-01-01",
          type: "expense" as const,
          created_at: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      const mockGetTransactions = vi.mocked(getTransactions);
      const mockGetTotalByType = vi.mocked(getTotalByType);

      mockGetTransactions.mockResolvedValue(mockTransactions);
      mockGetTotalByType.mockResolvedValueOnce(1000); // income
      mockGetTotalByType.mockResolvedValueOnce(500); // expense

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactions).toEqual(mockTransactions);
      expect(data.summary).toEqual({
        totalIncome: 1000,
        totalExpense: 500,
        balance: 500,
      });

      expect(mockGetTransactions).toHaveBeenCalledWith(50);
      expect(mockGetTotalByType).toHaveBeenCalledWith("income");
      expect(mockGetTotalByType).toHaveBeenCalledWith("expense");
    });

    it("should handle custom limit parameter", async () => {
      const mockGetTransactions = vi.mocked(getTransactions);
      const mockGetTotalByType = vi.mocked(getTotalByType);

      mockGetTransactions.mockResolvedValue([]);
      mockGetTotalByType.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=10"
      );
      await GET(request);

      expect(mockGetTransactions).toHaveBeenCalledWith(10);
    });

    it("should handle database errors", async () => {
      const mockGetTransactions = vi.mocked(getTransactions);
      mockGetTransactions.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to get transactions");
    });

    it("should handle invalid limit parameter gracefully", async () => {
      const mockTransactions = [
        {
          id: 1,
          description: "Test transaction",
          amount: 100,
          category: "test",
          type: "income" as const,
          date: "2024-01-01",
          createdAt: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockGetTransactions = vi.mocked(getTransactions);
      const mockGetTotalByType = vi.mocked(getTotalByType);

      mockGetTransactions.mockResolvedValue(mockTransactions);
      mockGetTotalByType.mockResolvedValueOnce(500).mockResolvedValueOnce(300);

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=invalid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactions).toEqual(mockTransactions);
      expect(data.summary).toEqual({
        totalIncome: 500,
        totalExpense: 300,
        balance: 200,
      });

      // Should use NaN which gets converted to 50 as default
      expect(mockGetTransactions).toHaveBeenCalledWith(NaN);
    });
  });
});
