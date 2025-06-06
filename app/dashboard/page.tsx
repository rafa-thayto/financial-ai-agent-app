"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  Activity,
  Send,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  CreditCard,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { Transaction } from "@/lib/database";
import Link from "next/link";
import {
  TransactionFiltersComponent,
  TransactionFilters,
} from "@/components/filters";

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    type: "all",
    category: "",
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: "",
    amountMax: "",
  });

  const fetchDashboardData = async () => {
    try {
      const [transactionsRes, analyticsRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/analytics"),
      ]);

      const transactionsData = await transactionsRes.json();
      const analyticsData = await analyticsRes.json();

      if (transactionsRes.ok && transactionsData.success) {
        const { transactions, summary } = transactionsData;
        setRecentTransactions(transactions.slice(0, 5)); // Show only 5 recent

        // Calculate monthly stats (current month)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthlyTransactions = transactions.filter((t: Transaction) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate.getMonth() + 1 === currentMonth &&
            transactionDate.getFullYear() === currentYear
          );
        });

        const monthlyIncome = monthlyTransactions
          .filter((t: Transaction) => t.type === "income")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const monthlyExpense = monthlyTransactions
          .filter((t: Transaction) => t.type === "expense")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        setStats({
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          balance: summary.balance,
          transactionCount: transactions.length,
          monthlyIncome,
          monthlyExpense,
        });
      }

      if (analyticsRes.ok) {
        setCategories(analyticsData.categories.slice(0, 6)); // Top 6 categories
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/chat/history");
      const data = await response.json();

      if (data.success && data.messages.length > 0) {
        const formattedMessages: ChatMessage[] = data.messages
          .slice(-10) // Show last 10 messages
          .map((msg: any) => ({
            id: msg.id.toString(),
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
        setChatMessages(formattedMessages);
      } else {
        setChatMessages([
          {
            id: "welcome",
            type: "assistant",
            content:
              "Hi! Tell me about your expenses or income. For example: 'I spent $15 on lunch' or 'I earned $500 from freelancing'.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.message || "Transaction recorded successfully!",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        // Refresh dashboard data after successful transaction
        fetchDashboardData();
      } else {
        throw new Error(data.error || "Failed to process message");
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    loadChatHistory();
  }, []);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter((transaction) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Date range filter
      const transactionDate = new Date(transaction.date);
      if (filters.dateFrom && transactionDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && transactionDate > filters.dateTo) {
        return false;
      }

      // Amount range filter
      if (
        filters.amountMin &&
        transaction.amount < parseFloat(filters.amountMin)
      ) {
        return false;
      }
      if (
        filters.amountMax &&
        transaction.amount > parseFloat(filters.amountMax)
      ) {
        return false;
      }

      return true;
    });
  }, [recentTransactions, filters]);

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const categories = [...new Set(recentTransactions.map((t) => t.category))];
    return categories.sort();
  }, [recentTransactions]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-lg">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const balanceColor = stats.balance >= 0 ? "text-green-600" : "text-red-600";
  const balanceIcon = stats.balance >= 0 ? TrendingUp : TrendingDown;
  const BalanceIcon = balanceIcon;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Financial Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track your finances with AI-powered insights. Chat naturally about
          your expenses and income.
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Total Balance
                </p>
                <p className={`text-3xl font-bold ${balanceColor}`}>
                  ${Math.abs(stats.balance).toFixed(2)}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {stats.balance >= 0 ? "Positive" : "Negative"} balance
                </p>
              </div>
              <BalanceIcon
                className={`h-8 w-8 ${
                  stats.balance >= 0 ? "text-green-500" : "text-red-500"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Total Income
                </p>
                <p className="text-3xl font-bold text-green-700">
                  ${stats.totalIncome.toFixed(2)}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  This month: ${stats.monthlyIncome.toFixed(2)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">
                  Total Expenses
                </p>
                <p className="text-3xl font-bold text-red-700">
                  ${stats.totalExpense.toFixed(2)}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  This month: ${stats.monthlyExpense.toFixed(2)}
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Transactions
                </p>
                <p className="text-3xl font-bold text-purple-700">
                  {stats.transactionCount}
                </p>
                <p className="text-xs text-purple-500 mt-1">Total recorded</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        categories={availableCategories}
        isCollapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>
                  Recent Transactions
                  {filteredTransactions.length !==
                    recentTransactions.length && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({filteredTransactions.length} of{" "}
                      {recentTransactions.length})
                    </span>
                  )}
                </span>
              </CardTitle>
              <Link href="/transactions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {recentTransactions.length === 0
                      ? "No transactions yet"
                      : "No transactions match your filters"}
                  </p>
                  <p className="text-sm">
                    {recentTransactions.length === 0
                      ? "Start by adding some through the chat below!"
                      : "Try adjusting your filter criteria"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              transaction.type === "income"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            <h3 className="font-medium">
                              {transaction.description}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {transaction.category}
                              </Badge>
                              <span>•</span>
                              <span>
                                {format(new Date(transaction.date), "MMM dd")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Top Spending Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No expense categories yet
                </p>
              ) : (
                <div className="space-y-4">
                  {categories.map((category, index) => {
                    const percentage =
                      stats.totalExpense > 0
                        ? (category.total / stats.totalExpense) * 100
                        : 0;

                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">
                            {category.category}
                          </span>
                          <div className="text-right">
                            <span className="font-semibold">
                              ${category.total.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({category.count} transactions)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% of total expenses
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>AI Assistant</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  {showChat ? "Hide" : "Show"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showChat && (
                <>
                  <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.type === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tell me about an expense or income..."
                      disabled={isChatLoading}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              )}

              {!showChat && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">AI Assistant Ready</p>
                  <p className="text-sm">
                    Click "Show" to start chatting about your finances
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Try saying:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>"I spent $25 on groceries"</li>
                  <li>"I earned $1000 from freelancing"</li>
                  <li>"Paid $50 for gas today"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/transactions" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
              </Link>
              <Link href="/transactions" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <PieChart className="h-4 w-4 mr-2" />
                  Detailed Analytics
                </Button>
              </Link>
              <Link href="/chat-history" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Chat History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
