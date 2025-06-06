"use client";

import { Table } from "@tanstack/react-table";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Transaction } from "./transaction-columns";

interface TableFiltersProps {
  table: Table<Transaction>;
  categories: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function TableFilters({
  table,
  categories,
  isCollapsed = false,
  onToggleCollapse,
}: TableFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  // Get current filter values
  const searchValue =
    (table.getColumn("description")?.getFilterValue() as string) ?? "";
  const typeValue =
    (table.getColumn("type")?.getFilterValue() as string) ?? "all";
  const categoryValue =
    (table.getColumn("category")?.getFilterValue() as string) ?? "all";

  // Update filters
  const updateSearch = (value: string) => {
    table.getColumn("description")?.setFilterValue(value);
  };

  const updateType = (value: string) => {
    table
      .getColumn("type")
      ?.setFilterValue(value === "all" ? undefined : value);
  };

  const updateCategory = (value: string) => {
    table
      .getColumn("category")
      ?.setFilterValue(value === "all" ? undefined : value);
  };

  const updateDateRange = () => {
    if (dateFrom || dateTo) {
      table.getColumn("date")?.setFilterValue([dateFrom, dateTo]);
    } else {
      table.getColumn("date")?.setFilterValue(undefined);
    }
  };

  const updateAmountRange = () => {
    const min = amountMin ? parseFloat(amountMin) : null;
    const max = amountMax ? parseFloat(amountMax) : null;

    if (min !== null || max !== null) {
      table.getColumn("amount")?.setFilterValue([min, max]);
    } else {
      table.getColumn("amount")?.setFilterValue(undefined);
    }
  };

  // Apply date filter when dates change
  React.useEffect(() => {
    updateDateRange();
  }, [dateFrom, dateTo]);

  // Apply amount filter when amounts change
  React.useEffect(() => {
    updateAmountRange();
  }, [amountMin, amountMax]);

  const resetFilters = () => {
    table.resetColumnFilters();
    setDateFrom(undefined);
    setDateTo(undefined);
    setAmountMin("");
    setAmountMax("");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchValue) count++;
    if (typeValue !== "all") count++;
    if (categoryValue !== "all") count++;
    if (dateFrom || dateTo) count++;
    if (amountMin || amountMax) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            {onToggleCollapse && (
              <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
                {isCollapsed ? "Show" : "Hide"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Descriptions</Label>
            <Input
              id="search"
              placeholder="Search transactions..."
              value={searchValue}
              onChange={(e) => updateSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeValue} onValueChange={updateType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryValue} onValueChange={updateCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      format(dateFrom, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount Min */}
            <div className="space-y-2">
              <Label htmlFor="amountMin">Min Amount</Label>
              <Input
                id="amountMin"
                type="number"
                placeholder="0.00"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
              />
            </div>

            {/* Amount Max */}
            <div className="space-y-2">
              <Label htmlFor="amountMax">Max Amount</Label>
              <Input
                id="amountMax"
                type="number"
                placeholder="1000.00"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {searchValue && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: {searchValue}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateSearch("")}
                    />
                  </Badge>
                )}
                {typeValue !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Type: {typeValue}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateType("all")}
                    />
                  </Badge>
                )}
                {categoryValue !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Category: {categoryValue}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateCategory("all")}
                    />
                  </Badge>
                )}
                {dateFrom && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    From: {format(dateFrom, "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setDateFrom(undefined)}
                    />
                  </Badge>
                )}
                {dateTo && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    To: {format(dateTo, "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setDateTo(undefined)}
                    />
                  </Badge>
                )}
                {amountMin && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Min: ${amountMin}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setAmountMin("")}
                    />
                  </Badge>
                )}
                {amountMax && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Max: ${amountMax}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setAmountMax("")}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
