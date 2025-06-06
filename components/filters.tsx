"use client";

import { useState } from "react";
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

export interface TransactionFilters {
  search: string;
  type: "all" | "income" | "expense";
  category: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  amountMin: string;
  amountMax: string;
}

export interface ChatFilters {
  search: string;
  type: "all" | "user" | "assistant";
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  categories: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface ChatFiltersProps {
  filters: ChatFilters;
  onFiltersChange: (filters: ChatFilters) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function TransactionFiltersComponent({
  filters,
  onFiltersChange,
  categories,
  isCollapsed = false,
  onToggleCollapse,
}: TransactionFiltersProps) {
  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      type: "all",
      category: "",
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: "",
      amountMax: "",
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type !== "all") count++;
    if (filters.category) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.amountMin) count++;
    if (filters.amountMax) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
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
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => updateFilter("type", value)}
              >
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
              <Select
                value={filters.category || "all"}
                onValueChange={(value) =>
                  updateFilter("category", value === "all" ? "" : value)
                }
              >
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
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
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
                    {filters.dateTo ? (
                      format(filters.dateTo, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
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
                value={filters.amountMin}
                onChange={(e) => updateFilter("amountMin", e.target.value)}
              />
            </div>

            {/* Amount Max */}
            <div className="space-y-2">
              <Label htmlFor="amountMax">Max Amount</Label>
              <Input
                id="amountMax"
                type="number"
                placeholder="1000.00"
                value={filters.amountMax}
                onChange={(e) => updateFilter("amountMax", e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("search", "")}
                    />
                  </Badge>
                )}
                {filters.type !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Type: {filters.type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("type", "all")}
                    />
                  </Badge>
                )}
                {filters.category && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Category: {filters.category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("category", "")}
                    />
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    From: {format(filters.dateFrom, "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("dateFrom", undefined)}
                    />
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    To: {format(filters.dateTo, "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("dateTo", undefined)}
                    />
                  </Badge>
                )}
                {filters.amountMin && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Min: ${filters.amountMin}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("amountMin", "")}
                    />
                  </Badge>
                )}
                {filters.amountMax && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Max: ${filters.amountMax}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("amountMax", "")}
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

export function ChatFiltersComponent({
  filters,
  onFiltersChange,
  isCollapsed = false,
  onToggleCollapse,
}: ChatFiltersProps) {
  const updateFilter = (key: keyof ChatFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      type: "all",
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type !== "all") count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
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
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search messages..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => updateFilter("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All messages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="user">Your Messages</SelectItem>
                  <SelectItem value="assistant">AI Responses</SelectItem>
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
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
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
                    {filters.dateTo ? (
                      format(filters.dateTo, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("search", "")}
                    />
                  </Badge>
                )}
                {filters.type !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Type: {filters.type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("type", "all")}
                    />
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    From: {format(filters.dateFrom, "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("dateFrom", undefined)}
                    />
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    To: {format(filters.dateTo, "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter("dateTo", undefined)}
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
