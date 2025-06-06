"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategorySummary } from "@/lib/database";
import { BarChart3, TrendingUp, TrendingDown, PieChart } from "lucide-react";

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface AnalyticsViewProps {
  refreshTrigger: number;
}

export function AnalyticsView({ refreshTrigger }: AnalyticsViewProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setCategoryData(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.total, 0);
  const averageSpending = totalSpent / (categoryData.length || 1);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-lg text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics & Insights
        </h1>
        <p className="text-lg text-gray-600">
          Deep dive into your spending patterns and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-blue-600">
                  {categoryData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Avg per Category</p>
                <p className="text-2xl font-bold text-green-600">
                  ${averageSpending.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Spending by Category</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No spending data available yet. Start adding transactions!
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.map((category, index) => {
                const percentage =
                  totalSpent > 0 ? (category.total / totalSpent) * 100 : 0;

                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `hsl(${
                              (index * 137.5) % 360
                            }, 70%, 60%)`,
                          }}
                        />
                        <span className="font-medium capitalize">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({category.count} transaction
                          {category.count !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${category.total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: `hsl(${
                            (index * 137.5) % 360
                          }, 70%, 60%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.slice(0, 5).map((category, index) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-400">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {category.category}
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.count} transactions
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-red-600">
                  ${category.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
