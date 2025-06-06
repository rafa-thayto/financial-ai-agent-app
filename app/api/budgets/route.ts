import { NextRequest, NextResponse } from "next/server";
import { getBudgets, setBudget, getCurrentMonthSpending } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const budgets = getBudgets();

    // Add current spending information to each budget
    const budgetsWithSpending = budgets.map((budget) => {
      const currentSpending = getCurrentMonthSpending(budget.category);
      const percentage = (currentSpending / budget.amount) * 100;

      return {
        ...budget,
        currentSpending,
        percentage: Math.round(percentage * 100) / 100,
        remaining: budget.amount - currentSpending,
        status:
          percentage > 90
            ? "over_budget"
            : percentage > 75
            ? "warning"
            : "on_track",
      };
    });

    return NextResponse.json({
      success: true,
      budgets: budgetsWithSpending,
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json(
      {
        error: "Failed to get budgets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { category, amount, period } = await req.json();

    if (!category || !amount || !period) {
      return NextResponse.json(
        { error: "Category, amount, and period are required" },
        { status: 400 }
      );
    }

    if (!["monthly", "weekly", "yearly"].includes(period)) {
      return NextResponse.json(
        { error: "Period must be monthly, weekly, or yearly" },
        { status: 400 }
      );
    }

    const result = setBudget(category, amount, period);

    return NextResponse.json({
      success: true,
      budget: {
        id: result.lastInsertRowid,
        category,
        amount,
        period,
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Set budget error:", error);
    return NextResponse.json(
      {
        error: "Failed to set budget",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
