"use client";

import { TransactionsTable } from "@/components/transactions-table";

interface TransactionsViewProps {
  refreshTrigger: number;
}

export function TransactionsView({ refreshTrigger }: TransactionsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          All Transactions
        </h1>
        <p className="text-lg text-gray-600">
          View, filter, and analyze all your financial transactions
        </p>
      </div>

      <TransactionsTable refreshTrigger={refreshTrigger} />
    </div>
  );
}
