import { NextResponse } from "next/server";
import { financeAgent } from "@/lib/ai-agent";

export async function GET() {
  try {
    const financialOverview = await financeAgent.getFinancialOverview();

    return NextResponse.json(financialOverview);
  } catch (error) {
    console.error("Financial overview error:", error);
    return NextResponse.json(
      { error: "Failed to get financial overview" },
      { status: 500 }
    );
  }
}
