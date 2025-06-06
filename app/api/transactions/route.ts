import { NextRequest, NextResponse } from "next/server";
import { getTransactions, getTotalByType } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const transactions = getTransactions(limit);
    const totalIncome = getTotalByType("income");
    const totalExpense = getTotalByType("expense");
    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
