import { NextRequest, NextResponse } from "next/server";
import { clearDatabase } from "@/lib/database";

export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // For now, we'll make it accessible but log the action
    console.log("🚨 Database clear request received");

    await clearDatabase();

    return NextResponse.json({
      success: true,
      message: "Database cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
