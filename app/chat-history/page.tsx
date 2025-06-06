"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, User, Bot, Clock, RefreshCw } from "lucide-react";
import { ChatFiltersComponent, ChatFilters } from "@/components/filters";

interface ChatMessage {
  id: number;
  type: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function ChatHistoryPage() {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [userMessages, setUserMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [filters, setFilters] = useState<ChatFilters>({
    search: "",
    type: "all",
    dateFrom: undefined,
    dateTo: undefined,
  });

  const fetchChatHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all messages
      const allResponse = await fetch("/api/chat/history");
      const allData = await allResponse.json();

      // Fetch user messages only
      const userResponse = await fetch("/api/chat/history?type=user");
      const userData = await userResponse.json();

      console.log("All messages data:", allData);
      console.log("User messages data:", userData);

      if (!allResponse.ok) {
        throw new Error(allData.error || "Failed to fetch chat history");
      }

      if (allData.success) {
        setAllMessages(allData.messages || []);
      } else {
        setAllMessages([]);
      }

      if (userData.success) {
        setUserMessages(userData.messages || []);
      } else {
        setUserMessages([]);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load chat history"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Filter messages based on current filters
  const filteredMessages = useMemo(() => {
    return allMessages.filter((message) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = message.content
          .toLowerCase()
          .includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type !== "all" && message.type !== filters.type) {
        return false;
      }

      // Date range filter
      const messageDate = new Date(message.created_at);
      if (filters.dateFrom && messageDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && messageDate > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [allMessages, filters]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const userCount = filteredMessages.filter((m) => m.type === "user").length;
    const assistantCount = filteredMessages.filter(
      (m) => m.type === "assistant"
    ).length;

    return {
      total: filteredMessages.length,
      user: userCount,
      assistant: assistantCount,
    };
  }, [filteredMessages]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const MessageItem = ({ message }: { message: ChatMessage }) => (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          message.type === "user"
            ? "bg-blue-100 text-blue-600"
            : "bg-green-100 text-green-600"
        }`}
      >
        {message.type === "user" ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2">
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
        <p className="text-sm text-gray-700 break-words leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Error Loading Chat History
                </h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchChatHistory}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Chat History</h1>
            <p className="text-lg text-gray-600">
              View all your conversations with the AI assistant
            </p>
          </div>
          <Button onClick={fetchChatHistory} disabled={isLoading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <ChatFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          isCollapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Messages
                {filteredMessages.length !== allMessages.length && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredStats.total}
              </div>
              {filteredMessages.length !== allMessages.length && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {allMessages.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Your Messages
                {filteredMessages.length !== allMessages.length && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredStats.user}
              </div>
              {filteredMessages.length !== allMessages.length && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {userMessages.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Responses
                {filteredMessages.length !== allMessages.length && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <Bot className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {filteredStats.assistant}
              </div>
              {filteredMessages.length !== allMessages.length && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {allMessages.length - userMessages.length}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>
                  Message History
                  {filteredMessages.length !== allMessages.length && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({filteredMessages.length} of {allMessages.length})
                    </span>
                  )}
                </span>
              </div>
              {filteredMessages.length !== allMessages.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      search: "",
                      type: "all",
                      dateFrom: undefined,
                      dateTo: undefined,
                    })
                  }
                >
                  Clear Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allMessages.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Messages Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start a conversation on the dashboard to see your chat history
                  here.
                </p>
                <Button onClick={() => (window.location.href = "/")}>
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto border rounded-lg bg-white">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading chat history...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No messages match your filters.</p>
                    <p className="text-sm mt-2">
                      Try adjusting your filter criteria.
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredMessages.map((message) => (
                      <MessageItem key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
