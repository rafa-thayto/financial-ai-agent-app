"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Chat from "@/components/chat";
import FullscreenChat from "@/components/fullscreen-chat";
import {
  Brain,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  Target,
  Activity,
  MessageSquare,
  BookOpen,
} from "lucide-react";

interface Insight {
  type: string;
  message: string;
  category?: string;
  severity?: "info" | "warning" | "alert";
  priority: "high" | "medium" | "low";
}

interface BudgetSuggestion {
  category: string;
  amount: number;
  reasoning: string;
}

interface FinancialOverview {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  transactionCount: number;
}

export default function AIAssistantPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [budgetSuggestions, setBudgetSuggestions] = useState<
    BudgetSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [financialOverview, setFinancialOverview] = useState<any>(null);
  const [chatKey, setChatKey] = useState(0); // For forcing chat refresh

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load insights
      const insightsResponse = await fetch("/api/insights");
      const insightsData = await insightsResponse.json();
      if (insightsData.success) {
        setInsights(insightsData.insights || []);
        setBudgetSuggestions(insightsData.budgetSuggestions || []);
      }

      // Load financial overview
      const overviewResponse = await fetch("/api/financial-overview");
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setFinancialOverview(overviewData);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const quickActions = [
    {
      label: "Check Balance",
      action: "What's my current balance?",
      icon: <DollarSign className="h-3 w-3" />,
      color: "bg-green-500",
    },
    {
      label: "Monthly Summary",
      action: "How am I doing this month?",
      icon: <TrendingUp className="h-3 w-3" />,
      color: "bg-blue-500",
    },
    {
      label: "Budget Status",
      action: "How are my budgets looking?",
      icon: <Target className="h-3 w-3" />,
      color: "bg-purple-500",
    },
    {
      label: "Get Help",
      action: "What can you do?",
      icon: <BookOpen className="h-3 w-3" />,
      color: "bg-indigo-500",
    },
  ];

  const handleQuickAction = (action: string) => {
    // This will be handled by the Chat component
    const chatComponent = document.querySelector("[data-chat-component]");
    if (chatComponent) {
      const event = new CustomEvent("quickAction", { detail: action });
      chatComponent.dispatchEvent(event);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-4 max-w-6xl">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
            <Badge variant="secondary" className="text-xs">
              Enhanced
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Your intelligent financial companion with advanced AI capabilities
          </p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="chat" className="text-xs">
              Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              Insights
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Chat with AI</span>
                      </CardTitle>
                      <FullscreenChat
                        triggerButtonText="Fullscreen Chat"
                        triggerButtonVariant="outline"
                        triggerButtonSize="sm"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[400px] md:h-[450px] lg:h-[500px]">
                      <Chat />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Financial Overview */}
                {financialOverview && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Activity className="h-3 w-3" />
                        <span>Financial Overview</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          $
                          {financialOverview.currentBalance?.toFixed(2) ||
                            "0.00"}
                        </p>
                        <p className="text-xs text-gray-500">Current Balance</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="font-medium text-green-700">
                            $
                            {financialOverview.monthlyIncome?.toFixed(2) ||
                              "0.00"}
                          </p>
                          <p className="text-gray-600">Monthly Income</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <p className="font-medium text-red-700">
                            $
                            {financialOverview.monthlyExpenses?.toFixed(2) ||
                              "0.00"}
                          </p>
                          <p className="text-gray-600">Monthly Expenses</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-auto p-2 flex flex-col items-center space-y-1"
                          onClick={() => handleQuickAction(action.action)}
                        >
                          <div
                            className={`p-1.5 rounded-full ${action.color} text-white`}
                          >
                            {action.icon}
                          </div>
                          <span className="text-xs text-center leading-tight">
                            {action.label}
                          </span>
                        </Button>
                      ))}
                    </div>

                    {/* Compact Help Section */}
                    <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <BookOpen className="h-3 w-3 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-medium text-indigo-800">
                            Need Help?
                          </p>
                          <p className="text-indigo-700 leading-tight">
                            Ask "What can you do?" for guidance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Financial Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              {insight.title}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              {insight.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No insights available yet. Start by adding some
                    transactions!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <PiggyBank className="h-4 w-4" />
                  <span>AI Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Budget Optimization
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Consider setting a monthly budget for food expenses
                          based on your spending patterns.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Spending Alert
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Your entertainment spending is 20% higher than usual
                          this month.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
