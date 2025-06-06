"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import Chat from "./chat";

interface FloatingChatButtonProps {
  onTransactionAdded?: () => void;
}

export default function FloatingChatButton({
  onTransactionAdded,
}: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        size="default"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>

      {/* Fullscreen Chat Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <Chat
            onTransactionAdded={onTransactionAdded}
            isFullscreen={true}
            onToggleFullscreen={toggleChat}
            showFullscreenToggle={true}
          />
        </div>
      )}
    </>
  );
}
