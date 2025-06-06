import { NextRequest, NextResponse } from "next/server";
import { financeAgent } from "@/lib/ai-agent";

export async function GET(req: NextRequest) {
  try {
    // Generate proactive insights
    const insights = await financeAgent.generateProactiveInsights();

    // Generate budget suggestions
    const budgetSuggestions = await financeAgent.suggestBudgets();

    return NextResponse.json({
      success: true,
      insights,
      budgetSuggestions,
    });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
