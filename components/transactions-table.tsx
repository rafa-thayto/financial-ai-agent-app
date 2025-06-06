"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Transaction } from "@/lib/database";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface FilteredData {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
  };
}

interface TransactionsTableProps {
  refreshTrigger?: number;
}

export function TransactionsTable({ refreshTrigger }: TransactionsTableProps) {
  const [data, setData] = useState<FilteredData>({
    transactions: [],
    summary: { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    type: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchFilteredTransactions = async (appliedFilters = filters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/transactions/filtered?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch filtered transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredTransactions();
  }, [refreshTrigger]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    fetchFilteredTransactions(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      startDate: "",
      endDate: "",
      category: "",
      type: "",
      minAmount: "",
      maxAmount: "",
    };
    setFilters(emptyFilters);
    fetchFilteredTransactions(emptyFilters);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const csvContent = [
      headers.join(","),
      ...data.transactions.map((t) =>
        [
          t.date,
          `"${t.description}"`,
          t.category,
          t.type,
          t.amount.toString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading transactions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-600">Income</p>
                <p className="text-lg font-bold text-green-600">
                  ${data.summary.totalIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-gray-600">Expenses</p>
                <p className="text-lg font-bold text-red-600">
                  ${data.summary.totalExpense.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-600">Balance</p>
                <p
                  className={`text-lg font-bold ${
                    data.summary.balance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${data.summary.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-600">Transactions</p>
                <p className="text-lg font-bold">{data.summary.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={data.transactions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Category
                  </label>
                  <Input
                    placeholder="Category"
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Type
                  </label>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Min Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) =>
                      handleFilterChange("minAmount", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Max Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="999999"
                    value={filters.maxAmount}
                    onChange={(e) =>
                      handleFilterChange("maxAmount", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button size="sm" onClick={applyFilters}>
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found with the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-sm">Date</th>
                    <th className="text-left py-2 font-medium text-sm">
                      Description
                    </th>
                    <th className="text-left py-2 font-medium text-sm">
                      Category
                    </th>
                    <th className="text-left py-2 font-medium text-sm">Type</th>
                    <th className="text-right py-2 font-medium text-sm">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>
                            {format(new Date(transaction.date), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm font-medium">
                        {transaction.description}
                      </td>
                      <td className="py-3 text-sm">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs capitalize">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-right font-semibold">
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {transaction.amount.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
