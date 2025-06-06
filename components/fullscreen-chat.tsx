"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import Chat from "./chat";

interface FullscreenChatProps {
  onTransactionAdded?: () => void;
  triggerButtonText?: string;
  triggerButtonVariant?: "default" | "outline" | "ghost" | "secondary";
  triggerButtonSize?: "sm" | "default" | "lg";
  showTriggerButton?: boolean;
}

export default function FullscreenChat({
  onTransactionAdded,
  triggerButtonText = "Open AI Chat",
  triggerButtonVariant = "outline",
  triggerButtonSize = "default",
  showTriggerButton = true,
}: FullscreenChatProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Trigger Button */}
      {showTriggerButton && (
        <Button
          variant={triggerButtonVariant}
          size={triggerButtonSize}
          onClick={toggleFullscreen}
          className="flex items-center space-x-2"
        >
          <Maximize2 className="h-4 w-4" />
          <span>{triggerButtonText}</span>
        </Button>
      )}

      {/* Fullscreen Chat */}
      {isFullscreen && (
        <Chat
          onTransactionAdded={onTransactionAdded}
          isFullscreen={true}
          onToggleFullscreen={toggleFullscreen}
          showFullscreenToggle={true}
        />
      )}
    </>
  );
}

// Export a hook for programmatic control
export function useFullscreenChat() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return {
    isFullscreen,
    openFullscreen,
    closeFullscreen,
    toggleFullscreen,
  };
}
