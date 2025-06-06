"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Bot, Clock, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: number;
  type: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatHistoryProps {
  refreshTrigger?: number;
}

export function ChatHistory({ refreshTrigger }: ChatHistoryProps) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [userMessages, setUserMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "user">("all");

  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      // Fetch all messages
      const allResponse = await fetch("/api/chat/history");
      const allData = await allResponse.json();

      // Fetch user messages only
      const userResponse = await fetch("/api/chat/history?type=user");
      const userData = await userResponse.json();

      if (allData.success) {
        setAllMessages(allData.messages);
      }

      if (userData.success) {
        setUserMessages(userData.messages);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [refreshTrigger]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const MessageItem = ({ message }: { message: ChatMessage }) => (
    <div className="flex items-start space-x-3 p-3 border-b border-gray-100 last:border-b-0">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === "user"
            ? "bg-blue-100 text-blue-600"
            : "bg-green-100 text-green-600"
        }`}
      >
        {message.type === "user" ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span
            className={`text-sm font-medium ${
              message.type === "user" ? "text-blue-600" : "text-green-600"
            }`}
          >
            {message.type === "user" ? "You" : "Assistant"}
          </span>
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(message.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-700 break-words">{message.content}</p>
      </div>
    </div>
  );

  const currentMessages = activeView === "all" ? allMessages : userMessages;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Chat History</span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchChatHistory}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Button
            variant={activeView === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("all")}
          >
            All Messages ({allMessages.length})
          </Button>
          <Button
            variant={activeView === "user" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("user")}
          >
            Your Messages ({userMessages.length})
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading chat history...
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {activeView === "all"
                ? "No messages yet. Start a conversation!"
                : "You haven't sent any messages yet."}
            </div>
          ) : (
            <div>
              {currentMessages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
