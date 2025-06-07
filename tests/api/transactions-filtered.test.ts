import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/transactions/filtered/route";
import { NextRequest } from "next/server";

// Mock the database functions
vi.mock("@/lib/database", () => ({
  getTransactions: vi.fn(),
  getTransactionsByDateRange: vi.fn(),
  getTransactionsByCategory: vi.fn(),
}));

const mockGetTransactions = vi.mocked(
  (await import("@/lib/database")).getTransactions
);
const mockGetTransactionsByDateRange = vi.mocked(
  (await import("@/lib/database")).getTransactionsByDateRange
);
const mockGetTransactionsByCategory = vi.mocked(
  (await import("@/lib/database")).getTransactionsByCategory
);

describe("/api/transactions/filtered", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTransactions = [
    {
      id: 1,
      description: "Coffee",
      amount: 5.5,
      category: "food",
      type: "expense" as const,
      date: "2024-01-01",
      createdAt: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      description: "Salary",
      amount: 3000,
      category: "income",
      type: "income" as const,
      date: "2024-01-01",
      createdAt: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 3,
      description: "Lunch",
      amount: 12.0,
      category: "food",
      type: "expense" as const,
      date: "2024-01-02",
      createdAt: "2024-01-02T00:00:00Z",
      created_at: "2024-01-02T00:00:00Z",
    },
  ];

  it("should return all transactions with default parameters", async () => {
    mockGetTransactions.mockResolvedValue(mockTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toEqual(mockTransactions);
    expect(data.summary).toEqual({
      totalIncome: 3000,
      totalExpense: 17.5,
      balance: 2982.5,
      count: 3,
    });
    expect(data.filters).toEqual({
      startDate: null,
      endDate: null,
      category: null,
      type: null,
      minAmount: null,
      maxAmount: null,
    });

    expect(mockGetTransactions).toHaveBeenCalledWith(100);
  });

  it("should filter by date range", async () => {
    mockGetTransactionsByDateRange.mockReturnValue(
      mockTransactions.slice(0, 2)
    );

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?startDate=2024-01-01&endDate=2024-01-01"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toEqual(mockTransactions.slice(0, 2));
    expect(data.summary).toEqual({
      totalIncome: 3000,
      totalExpense: 5.5,
      balance: 2994.5,
      count: 2,
    });
    expect(data.filters.startDate).toBe("2024-01-01");
    expect(data.filters.endDate).toBe("2024-01-01");

    expect(mockGetTransactionsByDateRange).toHaveBeenCalledWith(
      "2024-01-01",
      "2024-01-01"
    );
  });

  it("should filter by category", async () => {
    const foodTransactions = mockTransactions.filter(
      (t) => t.category === "food"
    );
    mockGetTransactionsByCategory.mockReturnValue(foodTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?category=food"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toEqual(foodTransactions);
    expect(data.summary).toEqual({
      totalIncome: 0,
      totalExpense: 17.5,
      balance: -17.5,
      count: 2,
    });
    expect(data.filters.category).toBe("food");

    expect(mockGetTransactionsByCategory).toHaveBeenCalledWith("food");
  });

  it("should filter by transaction type", async () => {
    mockGetTransactions.mockReturnValue(mockTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?type=expense"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions.every((t) => t.type === "expense")).toBe(true);
    expect(data.summary).toEqual({
      totalIncome: 0,
      totalExpense: 17.5,
      balance: -17.5,
      count: 2,
    });
  });

  it("should filter by amount range", async () => {
    mockGetTransactions.mockReturnValue(mockTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?minAmount=10&maxAmount=100"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0].description).toBe("Lunch");
    expect(data.summary).toEqual({
      totalIncome: 0,
      totalExpense: 12.0,
      balance: -12.0,
      count: 1,
    });
  });

  it("should apply multiple filters", async () => {
    mockGetTransactions.mockReturnValue(mockTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?type=expense&category=food&minAmount=5"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(2);
    expect(
      data.transactions.every(
        (t) => t.type === "expense" && t.category === "food"
      )
    ).toBe(true);
    expect(data.summary).toEqual({
      totalIncome: 0,
      totalExpense: 17.5,
      balance: -17.5,
      count: 2,
    });
  });

  it("should respect limit parameter", async () => {
    mockGetTransactions.mockReturnValue(mockTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?limit=1"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(1);
    expect(data.summary.count).toBe(3); // Summary shows total count before limit
  });

  it("should handle category filter with case insensitive matching", async () => {
    mockGetTransactions.mockReturnValue(mockTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?category=FOOD"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(2);
    expect(
      data.transactions.every((t) => t.category.toLowerCase().includes("food"))
    ).toBe(true);
  });

  it("should handle database errors", async () => {
    mockGetTransactions.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to get filtered transactions");
    expect(data.details).toBe("Database connection failed");
  });

  it("should handle unknown errors", async () => {
    mockGetTransactions.mockImplementation(() => {
      throw "Unknown error";
    });

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to get filtered transactions");
    expect(data.details).toBe("Unknown error");
  });

  it("should handle empty results", async () => {
    mockGetTransactions.mockReturnValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?type=expense&minAmount=1000"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toEqual([]);
    expect(data.summary).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      count: 0,
    });
  });

  it("should handle date range with category filter", async () => {
    const filteredTransactions = [mockTransactions[0]];
    mockGetTransactionsByDateRange.mockReturnValue(filteredTransactions);

    const request = new NextRequest(
      "http://localhost:3000/api/transactions/filtered?startDate=2024-01-01&endDate=2024-01-01&category=food"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toEqual(filteredTransactions);
    expect(mockGetTransactionsByDateRange).toHaveBeenCalledWith(
      "2024-01-01",
      "2024-01-01"
    );
  });
});
