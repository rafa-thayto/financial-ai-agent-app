"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { Transaction } from "@/lib/database";
import Link from "next/link";
import Chat from "@/components/chat";
import FullscreenChat from "@/components/fullscreen-chat";

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

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const balance = totalIncome - totalExpenses;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setTransactions(data.transactions || []);

      // Calculate totals
      const income =
        data.transactions
          ?.filter((t: Transaction) => t.type === "income")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0) || 0;

      const expenses =
        data.transactions
          ?.filter((t: Transaction) => t.type === "expense")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0) || 0;

      setTotalIncome(income);
      setTotalExpenses(expenses);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    fetchTransactions();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-4 max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Finance Tracker
          </h1>
          <p className="text-sm text-gray-600">
            AI-powered expense tracking and financial insights
          </p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Balance</p>
                  <p
                    className={`text-lg font-bold ${
                      balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${balance.toFixed(2)}
                  </p>
                </div>
                <DollarSign
                  className={`h-6 w-6 ${
                    balance >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Income
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    ${totalIncome.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Expenses
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    ${totalExpenses.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Chat Interface */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>AI Assistant</span>
                    <Badge variant="secondary" className="text-xs">
                      Smart
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Record transactions and get insights using natural language
                  </CardDescription>
                </div>
                <FullscreenChat
                  onTransactionAdded={handleTransactionAdded}
                  triggerButtonText="Fullscreen"
                  triggerButtonVariant="outline"
                  triggerButtonSize="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px]">
                <Chat onTransactionAdded={handleTransactionAdded} />
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Recent Transactions</span>
                <Badge variant="outline" className="text-xs">
                  {transactions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-y-auto p-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm font-medium">No transactions yet</p>
                    <p className="text-xs">
                      Start by adding transactions using the AI assistant!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 20).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                transaction.type === "income"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <h3 className="font-medium text-xs sm:text-sm truncate">
                              {transaction.description}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              {transaction.category}
                            </Badge>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-xs sm:text-sm font-semibold ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}$
                            {transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {transaction.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        {transactions.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-600">
                    {transactions.length}
                  </p>
                  <p className="text-xs text-gray-600">Total Transactions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {transactions.filter((t) => t.type === "income").length}
                  </p>
                  <p className="text-xs text-gray-600">Income Entries</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">
                    {transactions.filter((t) => t.type === "expense").length}
                  </p>
                  <p className="text-xs text-gray-600">Expense Entries</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600">
                    {new Set(transactions.map((t) => t.category)).size}
                  </p>
                  <p className="text-xs text-gray-600">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
