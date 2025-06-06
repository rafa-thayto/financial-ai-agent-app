"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/data-table";
import { format } from "date-fns";
import { User, Bot, Clock, Copy, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ChatMessage = {
  id: number;
  type: "user" | "assistant";
  content: string;
  created_at: string;
};

export const chatColumns: ColumnDef<ChatMessage>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <SortableHeader column={column}>Type</SortableHeader>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <div className="flex items-center space-x-2">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              type === "user"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {type === "user" ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          <Badge
            variant={type === "user" ? "default" : "secondary"}
            className="capitalize"
          >
            {type === "user" ? "You" : "Assistant"}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "content",
    header: ({ column }) => (
      <SortableHeader column={column}>Message</SortableHeader>
    ),
    cell: ({ row }) => {
      const content = row.getValue("content") as string;
      const truncated =
        content.length > 100 ? content.substring(0, 100) + "..." : content;

      return (
        <div className="max-w-[400px]">
          <p className="text-sm text-gray-700 break-words leading-relaxed">
            {truncated}
          </p>
          {content.length > 100 && (
            <p className="text-xs text-gray-500 mt-1">
              Click to view full message
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <SortableHeader column={column}>Date</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{format(date, "MMM dd, yyyy")}</span>
          <span className="text-xs text-gray-500">{format(date, "HH:mm")}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowDate = new Date(row.getValue(id));
      const [startDate, endDate] = value || [null, null];

      if (!startDate && !endDate) return true;
      if (startDate && rowDate < startDate) return false;
      if (endDate && rowDate > endDate) return false;

      return true;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const message = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy message
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(message.id.toString())
              }
            >
              Copy message ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
