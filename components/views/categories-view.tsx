"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Search, TrendingDown, Hash, Calendar } from "lucide-react";

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface CategoriesViewProps {
  refreshTrigger: number;
}

export function CategoriesView({ refreshTrigger }: CategoriesViewProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setCategoryData(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]);

  const filteredCategories = categoryData.filter((category) =>
    category.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.total, 0);
  const totalTransactions = categoryData.reduce(
    (sum, cat) => sum + cat.count,
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-lg text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Spending Categories
        </h1>
        <p className="text-lg text-gray-600">
          View and analyze your spending by category
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
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
              <Hash className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No categories found matching your search."
                : "No categories found. Start adding transactions!"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category, index) => {
                const percentage =
                  totalSpent > 0 ? (category.total / totalSpent) * 100 : 0;
                const avgPerTransaction =
                  category.count > 0 ? category.total / category.count : 0;

                return (
                  <Card
                    key={category.category}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: `hsl(${
                              (index * 137.5) % 360
                            }, 70%, 60%)`,
                          }}
                        />
                        <div>
                          <h3 className="font-semibold text-lg capitalize">
                            {category.category}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Hash className="h-3 w-3" />
                              <span>{category.count} transactions</span>
                            </span>
                            <span>Avg: ${avgPerTransaction.toFixed(2)}</span>
                            <span>{percentage.toFixed(1)}% of total</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          ${category.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
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
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
