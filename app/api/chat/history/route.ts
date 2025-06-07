import { NextRequest, NextResponse } from "next/server";
import { getChatMessages, getUserMessages } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");

    let messages;
    if (type === "user") {
      messages = await getUserMessages(limit);
    } else {
      messages = await getChatMessages(limit);
    }

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve chat history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
