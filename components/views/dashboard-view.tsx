"use client";

import { Chat } from "@/components/chat";
import { TransactionHistory } from "@/components/transaction-history";

interface DashboardViewProps {
  refreshTrigger: number;
  onTransactionAdded: () => void;
}

export function DashboardView({
  refreshTrigger,
  onTransactionAdded,
}: DashboardViewProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Your Finance Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Track your expenses and income using natural language
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Chat onTransactionAdded={onTransactionAdded} />
        </div>
        <div>
          <TransactionHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
