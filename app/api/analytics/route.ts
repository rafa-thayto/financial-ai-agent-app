import { NextResponse } from "next/server";
import { getCategorySummary } from "@/lib/database";

export async function GET() {
  try {
    const categories = await getCategorySummary();

    return NextResponse.json({
      categories,
      summary: {
        totalCategories: categories.length,
        totalSpent: categories.reduce((sum, cat) => sum + cat.total, 0),
        totalTransactions: categories.reduce((sum, cat) => sum + cat.count, 0),
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      {
        error: "Failed to get analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
