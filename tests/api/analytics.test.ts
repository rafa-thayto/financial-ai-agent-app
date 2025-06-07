import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/analytics/route";
import { NextRequest } from "next/server";

// Mock the database functions
vi.mock("@/lib/database", () => ({
  getCategorySummary: vi.fn(),
}));

const mockGetCategorySummary = vi.mocked(
  (await import("@/lib/database")).getCategorySummary
);

describe("/api/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return category analytics successfully", async () => {
    const mockCategories = [
      { category: "Food", total: 500, count: 15 },
      { category: "Transport", total: 200, count: 8 },
      { category: "Entertainment", total: 150, count: 5 },
    ];

    mockGetCategorySummary.mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual(mockCategories);
    expect(data.summary).toEqual({
      totalCategories: 3,
      totalSpent: 850, // 500 + 200 + 150
      totalTransactions: 28, // 15 + 8 + 5
    });

    expect(mockGetCategorySummary).toHaveBeenCalledOnce();
  });

  it("should handle empty categories", async () => {
    mockGetCategorySummary.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual([]);
    expect(data.summary).toEqual({
      totalCategories: 0,
      totalSpent: 0,
      totalTransactions: 0,
    });
  });

  it("should handle single category", async () => {
    const mockCategories = [{ category: "Food", total: 300, count: 10 }];

    mockGetCategorySummary.mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual(mockCategories);
    expect(data.summary).toEqual({
      totalCategories: 1,
      totalSpent: 300,
      totalTransactions: 10,
    });
  });

  it("should handle database errors", async () => {
    mockGetCategorySummary.mockRejectedValue(
      new Error("Database connection failed")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to get analytics data");
    expect(data.details).toBe("Database connection failed");
  });

  it("should handle unknown errors", async () => {
    mockGetCategorySummary.mockRejectedValue("Unknown error");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to get analytics data");
    expect(data.details).toBe("Unknown error");
  });

  it("should handle categories with zero totals", async () => {
    const mockCategories = [
      { category: "Food", total: 0, count: 0 },
      { category: "Transport", total: 100, count: 2 },
    ];

    mockGetCategorySummary.mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual(mockCategories);
    expect(data.summary).toEqual({
      totalCategories: 2,
      totalSpent: 100,
      totalTransactions: 2,
    });
  });
});
