import { useState, useEffect } from 'react';
import { Receipt, Calendar, DollarSign, Package, Award } from 'lucide-react';
import { api } from '@/lib/api';
import type { Customer } from '@/types';

interface Transaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  total: number;
  paymentMethod: string;
  loyaltyPointsEarned: number;
  items: Array<{
    productName: string;
    quantity: number;
    total: number;
  }>;
}

interface CustomerHistoryProps {
  customer: Customer;
  className?: string;
}

export default function CustomerHistory({ customer, className = '' }: CustomerHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (customer && isExpanded) {
      fetchCustomerHistory();
    }
  }, [customer, isExpanded]);

  const fetchCustomerHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ data: Transaction[] }>(
        `/transactions?customerId=${customer.id}&limit=5`
      );
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch customer history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Receipt className="h-4 w-4" />
          <span>Purchase History</span>
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {/* Expanded history */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-gray-500">
              Loading history...
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {transaction.transactionNumber}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.transactionDate)}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    {transaction.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {item.productName} x{item.quantity}
                        </span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                    {transaction.items.length > 2 && (
                      <div className="text-gray-400">
                        +{transaction.items.length - 2} more items
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1 font-semibold text-gray-900">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(transaction.total)}
                    </span>
                    {transaction.loyaltyPointsEarned > 0 && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Award className="h-3 w-3" />
                        +{transaction.loyaltyPointsEarned} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              No recent purchases
            </div>
          )}
        </div>
      )}
    </div>
  );
}
