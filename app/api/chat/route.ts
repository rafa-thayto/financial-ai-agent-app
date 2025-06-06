import { NextRequest, NextResponse } from "next/server";
import { insertTransaction, insertChatMessage } from "@/lib/database";
import { financeAgent } from "@/lib/ai-agent";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Save user message to database
    insertChatMessage({
      type: "user",
      content: message,
    });

    // Process message with the agentic AI system
    const agentResponse = await financeAgent.processMessage(message);
    console.log("agentResponse", agentResponse);

    let responseMessage = agentResponse.message;
    let transactionResult = null;

    // Handle different response types
    switch (agentResponse.type) {
      case "transaction":
        if (agentResponse.transaction) {
          // Insert transaction into database
          const result = insertTransaction({
            description: agentResponse.transaction.description,
            amount: agentResponse.transaction.amount,
            category: agentResponse.transaction.category.toLowerCase(),
            date: agentResponse.transaction.date,
            type: agentResponse.transaction.type,
          });

          transactionResult = {
            id: result.lastInsertRowid,
            ...agentResponse.transaction,
          };

          // Add proactive insights if available
          const insights = await financeAgent.generateProactiveInsights();
          if (insights.length > 0) {
            responseMessage += "\n\n" + insights.slice(0, 2).join("\n");
          }
        }
        break;

      case "question":
        // Handle clarification questions
        if (
          agentResponse.requires_clarification &&
          agentResponse.clarification_question
        ) {
          responseMessage = agentResponse.clarification_question;
        }
        break;

      case "insight":
        // Provide spending insights
        const insights = await financeAgent.generateProactiveInsights();
        if (insights.length > 0) {
          responseMessage += "\n\n" + insights.join("\n");
        }
        break;

      case "budget_alert":
        // Handle budget alerts and suggestions
        const budgetSuggestions = await financeAgent.suggestBudgets();
        if (budgetSuggestions.length > 0) {
          responseMessage += "\n\nBudget suggestions:\n";
          budgetSuggestions.forEach(
            (suggestion: {
              category: string;
              amount: number;
              reasoning: string;
            }) => {
              responseMessage += `• ${suggestion.category}: $${suggestion.amount}/month - ${suggestion.reasoning}\n`;
            }
          );
        }
        break;

      case "suggestion":
        // Add suggestions to response
        if (agentResponse.suggestions && agentResponse.suggestions.length > 0) {
          responseMessage += "\n\nSuggestions:\n";
          agentResponse.suggestions.forEach((suggestion: string) => {
            responseMessage += `• ${suggestion}\n`;
          });
        }
        break;
    }

    // Save assistant response to database with context
    insertChatMessage({
      type: "assistant",
      content: responseMessage,
      context: agentResponse.context
        ? JSON.stringify(agentResponse.context)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      transaction: transactionResult,
      message: responseMessage,
      agentType: agentResponse.type,
      suggestions: agentResponse.suggestions,
      requiresClarification: agentResponse.requires_clarification,
      clarificationQuestion: agentResponse.clarification_question,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage =
      "I encountered an error processing your message. Could you please try rephrasing it?";
    const errorDetails =
      error instanceof Error ? error.message : "Unknown error";

    // Save error response to database
    insertChatMessage({
      type: "assistant",
      content: errorMessage,
    });

    return NextResponse.json(
      {
        error: "Failed to process message",
        details: errorDetails,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
