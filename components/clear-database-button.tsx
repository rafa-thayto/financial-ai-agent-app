"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ClearDatabaseButton() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearDatabase = async () => {
    // Multi-step confirmation to prevent accidental deletion
    const firstConfirm = window.confirm(
      "⚠️ DANGER ZONE ⚠️\n\n" +
        "This will permanently delete ALL data including:\n" +
        "• All transactions\n" +
        "• Chat history\n" +
        "• User preferences\n" +
        "• Budgets\n" +
        "• Spending patterns\n\n" +
        "This action cannot be undone!\n\n" +
        "Are you sure you want to continue?"
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "FINAL WARNING!\n\n" +
        "You are about to permanently delete ALL database data.\n\n" +
        "This action is IRREVERSIBLE.\n\n" +
        "Click OK only if you are absolutely certain you want to delete everything."
    );

    if (!secondConfirm) return;

    setIsClearing(true);
    try {
      const response = await fetch("/api/database/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "✅ Database cleared successfully!\n\nAll data has been permanently deleted."
        );
        // Refresh the page to reflect the empty state
        window.location.reload();
      } else {
        throw new Error(result.error || "Failed to clear database");
      }
    } catch (error) {
      console.error("Error clearing database:", error);
      alert("❌ Error: Failed to clear database. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      className="gap-2"
      onClick={handleClearDatabase}
      disabled={isClearing}
    >
      {isClearing ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Clearing...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Clear Database
        </>
      )}
    </Button>
  );
}
