"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { TableFilters } from "@/components/table-filters";
import {
  transactionColumns,
  Transaction,
} from "@/components/transaction-columns";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Create table instance
  const table = useReactTable({
    data: transactions,
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching transactions...");

      // Fetch transactions
      const transactionsResponse = await fetch("/api/transactions");
      const transactionsData = await transactionsResponse.json();

      console.log("Transactions response:", transactionsResponse.status);
      console.log("Transactions data:", transactionsData);

      if (!transactionsResponse.ok) {
        throw new Error(
          transactionsData.error || "Failed to fetch transactions"
        );
      }

      if (transactionsData.success && transactionsData.transactions) {
        setTransactions(transactionsData.transactions);

        // Use summary from API if available, otherwise calculate
        if (transactionsData.summary) {
          setStats({
            totalIncome: transactionsData.summary.totalIncome || 0,
            totalExpense: transactionsData.summary.totalExpense || 0,
            balance: transactionsData.summary.balance || 0,
            transactionCount: transactionsData.transactions.length,
          });
        } else {
          // Fallback calculation
          const income = transactionsData.transactions
            .filter((t: Transaction) => t.type === "income")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

          const expense = transactionsData.transactions
            .filter((t: Transaction) => t.type === "expense")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

          setStats({
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            transactionCount: transactionsData.transactions.length,
          });
        }

        // Process category data for simple chart
        const categoryMap = new Map<string, { total: number; count: number }>();
        transactionsData.transactions
          .filter((t: Transaction) => t.type === "expense")
          .forEach((t: Transaction) => {
            const existing = categoryMap.get(t.category) || {
              total: 0,
              count: 0,
            };
            categoryMap.set(t.category, {
              total: existing.total + t.amount,
              count: existing.count + 1,
            });
          });

        const categoryArray = Array.from(categoryMap.entries()).map(
          ([category, data]) => ({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            total: data.total,
            count: data.count,
          })
        );

        setCategoryData(categoryArray);
        console.log("Category data:", categoryArray);

        // Process monthly data for line chart
        const monthlyMap = new Map<
          string,
          { income: number; expense: number }
        >();
        transactionsData.transactions.forEach((t: Transaction) => {
          const month = new Date(t.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          });
          const existing = monthlyMap.get(month) || { income: 0, expense: 0 };

          if (t.type === "income") {
            existing.income += t.amount;
          } else {
            existing.expense += t.amount;
          }

          monthlyMap.set(month, existing);
        });

        const monthlyArray = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({
            month,
            income: data.income,
            expense: data.expense,
            balance: data.income - data.expense,
          }))
          .sort(
            (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
          );

        setMonthlyData(monthlyArray);
      } else {
        // No transactions found
        setTransactions([]);
        setCategoryData([]);
        setMonthlyData([]);
        setStats({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate filtered stats based on table's filtered data
  const filteredStats = useMemo(() => {
    const filteredRows = table.getFilteredRowModel().rows;
    const filteredTransactions = filteredRows.map((row) => row.original);

    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transactionCount: filteredTransactions.length,
    };
  }, [table.getFilteredRowModel().rows]);

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const categories = [...new Set(transactions.map((t) => t.category))];
    return categories.sort();
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isFiltered = table.getState().columnFilters.length > 0;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Error Loading Data
                </h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchData}>
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Transactions</h1>
            <p className="text-lg text-gray-600">
              View your financial data and analytics
            </p>
          </div>
          <Button onClick={fetchData} disabled={isLoading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income
                {isFiltered && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredStats.totalIncome)}
              </div>
              {isFiltered && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {formatCurrency(stats.totalIncome)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
                {isFiltered && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(filteredStats.totalExpense)}
              </div>
              {isFiltered && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {formatCurrency(stats.totalExpense)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Balance
                {isFiltered && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  filteredStats.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(filteredStats.balance)}
              </div>
              {isFiltered && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {formatCurrency(stats.balance)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions
                {isFiltered && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {filteredStats.transactionCount}
              </div>
              {isFiltered && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {stats.transactionCount}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <TableFilters
          table={table}
          categories={availableCategories}
          isCollapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        />

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                All Transactions
                {isFiltered && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({filteredStats.transactionCount} of{" "}
                    {stats.transactionCount})
                  </span>
                )}
              </span>
              {isFiltered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.resetColumnFilters()}
                >
                  Clear Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : (
              <DataTable
                columns={transactionColumns}
                data={transactions}
                searchKey="description"
                searchPlaceholder="Search transactions..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
