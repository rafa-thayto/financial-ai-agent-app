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
import { ChatMessage } from "./chat-columns";

interface ChatTableFiltersProps {
  table: Table<ChatMessage>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatTableFilters({
  table,
  isCollapsed = false,
  onToggleCollapse,
}: ChatTableFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Get current filter values
  const searchValue =
    (table.getColumn("content")?.getFilterValue() as string) ?? "";
  const typeValue =
    (table.getColumn("type")?.getFilterValue() as string) ?? "all";

  // Update filters
  const updateSearch = (value: string) => {
    table.getColumn("content")?.setFilterValue(value);
  };

  const updateType = (value: string) => {
    table
      .getColumn("type")
      ?.setFilterValue(value === "all" ? undefined : value);
  };

  const updateDateRange = () => {
    if (dateFrom || dateTo) {
      table.getColumn("created_at")?.setFilterValue([dateFrom, dateTo]);
    } else {
      table.getColumn("created_at")?.setFilterValue(undefined);
    }
  };

  // Apply date filter when dates change
  React.useEffect(() => {
    updateDateRange();
  }, [dateFrom, dateTo]);

  const resetFilters = () => {
    table.resetColumnFilters();
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchValue) count++;
    if (typeValue !== "all") count++;
    if (dateFrom || dateTo) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Chat Filters</span>
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
            <Label htmlFor="search">Search Messages</Label>
            <Input
              id="search"
              placeholder="Search message content..."
              value={searchValue}
              onChange={(e) => updateSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={typeValue} onValueChange={updateType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="user">User Messages</SelectItem>
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
                    Type:{" "}
                    {typeValue === "user" ? "User Messages" : "AI Responses"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateType("all")}
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
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
