"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  DollarSign,
  BookOpen,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentType?:
    | "transaction"
    | "question"
    | "insight"
    | "budget_alert"
    | "suggestion"
    | "balance"
    | "help";
  suggestions?: string[];
  requiresClarification?: boolean;
  clarificationQuestion?: string;
}

interface ChatProps {
  onTransactionAdded?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showFullscreenToggle?: boolean;
}

export default function Chat({
  onTransactionAdded,
  isFullscreen = false,
  onToggleFullscreen,
  showFullscreenToggle = true,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen && onToggleFullscreen) {
        onToggleFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isFullscreen, onToggleFullscreen]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/chat/history?limit=10");
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          agentType: msg.context ? JSON.parse(msg.context).type : undefined,
          suggestions: msg.context
            ? JSON.parse(msg.context).suggestions
            : undefined,
        }));
        setMessages(formattedMessages);
      } else {
        // Show welcome message if no history
        setMessages([
          {
            id: "welcome",
            type: "assistant",
            content:
              '🤖 Hi! I\'m your intelligent financial assistant. I can help you track expenses, provide insights, check your balance, and suggest budgets.\n\n💡 **Need help?** Just ask "What can you do?" for a complete overview of my capabilities!\n\n🚀 **Quick examples:**\n• "What\'s my balance?" - Get financial overview\n• "I spent $15 on lunch" - Record transaction\n• "How am I doing this month?" - Get insights\n• "Help with budgets" - Budget assistance',
            timestamp: new Date(),
            agentType: "help",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Show welcome message on error
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content:
            '🤖 Hi! I\'m your intelligent financial assistant. I can help you track expenses, provide insights, check your balance, and suggest budgets.\n\n💡 **Need help?** Just ask "What can you do?" for a complete overview of my capabilities!\n\n🚀 **Quick examples:**\n• "What\'s my balance?" - Get financial overview\n• "I spent $15 on lunch" - Record transaction\n• "How am I doing this month?" - Get insights\n• "Help with budgets" - Budget assistance',
          timestamp: new Date(),
          agentType: "help",
        },
      ]);
    }
  };

  const getMessageIcon = (agentType?: string) => {
    switch (agentType) {
      case "insight":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "budget_alert":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "question":
        return <HelpCircle className="h-4 w-4 text-purple-500" />;
      case "balance":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "help":
        return <BookOpen className="h-4 w-4 text-indigo-500" />;
      default:
        return null;
    }
  };

  const getMessageBadge = (agentType?: string) => {
    switch (agentType) {
      case "transaction":
        return (
          <Badge variant="default" className="text-xs">
            Transaction
          </Badge>
        );
      case "insight":
        return (
          <Badge variant="secondary" className="text-xs">
            Insight
          </Badge>
        );
      case "budget_alert":
        return (
          <Badge variant="destructive" className="text-xs">
            Budget Alert
          </Badge>
        );
      case "suggestion":
        return (
          <Badge variant="outline" className="text-xs">
            Suggestion
          </Badge>
        );
      case "question":
        return (
          <Badge variant="secondary" className="text-xs">
            Question
          </Badge>
        );
      case "balance":
        return (
          <Badge variant="default" className="text-xs bg-green-600">
            Balance
          </Badge>
        );
      case "help":
        return (
          <Badge variant="default" className="text-xs bg-indigo-600">
            Help
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.message,
          timestamp: new Date(),
          agentType: data.agentType,
          suggestions: data.suggestions,
          requiresClarification: data.requiresClarification,
          clarificationQuestion: data.clarificationQuestion,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Call the callback if a transaction was added
        if (data.agentType === "transaction" && onTransactionAdded) {
          onTransactionAdded();
        }
      } else {
        // Handle error response
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content:
            data.message || "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div
      className={`flex flex-col h-full ${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : ""
      }`}
      data-chat-component
    >
      {/* Header with fullscreen toggle */}
      {(showFullscreenToggle || isFullscreen) && (
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">
                {isFullscreen
                  ? "AI Financial Assistant - Fullscreen"
                  : "AI Chat"}
              </h2>
            </div>
            {isFullscreen && (
              <Badge variant="secondary" className="text-xs">
                Press ESC to exit
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {showFullscreenToggle && onToggleFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullscreen}
                className="h-8 w-8 p-0"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            {isFullscreen && onToggleFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullscreen}
                className="h-8 w-8 p-0"
                title="Close fullscreen"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto space-y-2 sm:space-y-3 ${
          isFullscreen ? "p-4 sm:p-6" : "p-2 sm:p-3"
        }`}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex items-start space-x-2 max-w-[90%] sm:max-w-[85%]">
              {message.type === "assistant" && (
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message.agentType)}
                </div>
              )}
              <div
                className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : message.agentType === "balance"
                    ? "bg-green-50 border border-green-200"
                    : message.agentType === "help"
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-white border border-gray-200"
                }`}
              >
                {message.type === "assistant" && message.agentType && (
                  <div className="mb-1">
                    {getMessageBadge(message.agentType)}
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium opacity-75">
                      Suggestions:
                    </p>
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs p-1.5 sm:p-2 bg-white/50 hover:bg-white/80 rounded border transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 px-2 sm:px-3 py-2 bg-gray-100 rounded-lg">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs text-gray-600">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={`border-t bg-white ${
          isFullscreen ? "p-4 sm:p-6" : "p-2 sm:p-3"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances or record a transaction..."
            className={`flex-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isFullscreen
                ? "px-4 py-3 text-base"
                : "px-2 sm:px-3 py-2 text-xs sm:text-sm"
            }`}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size={isFullscreen ? "default" : "sm"}
            className={isFullscreen ? "px-4 py-3" : "px-2 sm:px-3"}
          >
            <Send className={isFullscreen ? "h-4 w-4" : "h-3 w-3"} />
          </Button>
        </form>

        <div
          className={`text-gray-600 mt-3 ${
            isFullscreen ? "text-sm" : "text-xs"
          }`}
        >
          <p className="font-medium">
            <strong>Try these enhanced commands:</strong>
          </p>
          <ul
            className={`list-disc list-inside space-y-1 mt-2 ${
              isFullscreen
                ? "text-sm grid grid-cols-1 md:grid-cols-2 gap-1"
                : "text-xs space-y-0.5"
            }`}
          >
            <li>
              "What can you do?" - Get comprehensive help and capabilities
            </li>
            <li>"What's my balance?" - Get comprehensive financial overview</li>
            <li className={isFullscreen ? "block" : "hidden sm:list-item"}>
              "How am I doing this month?" - Get insights
            </li>
            <li className={isFullscreen ? "block" : "hidden sm:list-item"}>
              "I spent $15 on lunch today" - Record transaction
            </li>
            <li className={isFullscreen ? "block" : "hidden sm:list-item"}>
              "Should I set a budget?" - Get suggestions
            </li>
            <li className={isFullscreen ? "block" : "hidden sm:list-item"}>
              "Help with transactions" - Get specific help topics
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
