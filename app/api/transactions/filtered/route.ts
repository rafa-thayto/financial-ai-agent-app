import { NextRequest, NextResponse } from "next/server";
import {
  getTransactions,
  getTransactionsByDateRange,
  getTransactionsByCategory,
} from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const type = searchParams.get("type") as "income" | "expense" | null;
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const limit = parseInt(searchParams.get("limit") || "100");

    let transactions;

    // Apply date filter if provided
    if (startDate && endDate) {
      transactions = getTransactionsByDateRange(startDate, endDate);
    } else if (category) {
      transactions = getTransactionsByCategory(category);
    } else {
      transactions = getTransactions(limit);
    }

    // Apply additional filters
    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    if (category && !(startDate && endDate)) {
      transactions = transactions.filter((t) =>
        t.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (minAmount) {
      transactions = transactions.filter(
        (t) => t.amount >= parseFloat(minAmount)
      );
    }

    if (maxAmount) {
      transactions = transactions.filter(
        (t) => t.amount <= parseFloat(maxAmount)
      );
    }

    // Calculate summary for filtered data
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: transactions.slice(0, limit),
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        count: transactions.length,
      },
      filters: {
        startDate,
        endDate,
        category,
        type,
        minAmount,
        maxAmount,
      },
    });
  } catch (error) {
    console.error("Get filtered transactions error:", error);
    return NextResponse.json(
      {
        error: "Failed to get filtered transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
