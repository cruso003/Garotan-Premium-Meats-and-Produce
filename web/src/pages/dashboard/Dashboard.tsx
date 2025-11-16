import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { DashboardKPIs } from '@/types';

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get<DashboardKPIs>('/reports/dashboard');
      setKpis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Failed to load dashboard data'}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Today's KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(kpis.today.revenue)}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Transactions"
          value={kpis.today.transactions.toString()}
          icon={ShoppingCart}
          color="blue"
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(kpis.today.averageOrderValue)}
          icon={TrendingUp}
          color="purple"
        />
        <KPICard
          title="Low Stock Items"
          value={kpis.today.lowStockCount.toString()}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* This Month Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revenue This Month</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(kpis.thisMonth.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Growth</span>
              <div className="flex items-center">
                {kpis.thisMonth.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                )}
                <span
                  className={`text-lg font-semibold ${
                    kpis.thisMonth.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {kpis.thisMonth.revenueGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-xl font-semibold text-gray-900">
                  {kpis.thisMonth.newCustomers}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(kpis.thisMonth.outstandingReceivables)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            <AlertItem
              icon={Package}
              color="orange"
              title="Low Stock"
              description={`${kpis.alerts.lowStock} items below minimum level`}
            />
            <AlertItem
              icon={Clock}
              color="yellow"
              title="Near Expiry"
              description={`${kpis.alerts.nearExpiry} products expiring soon`}
            />
            <AlertItem
              icon={AlertTriangle}
              color="red"
              title="Failed Deliveries"
              description={`${kpis.alerts.failedDeliveries} deliveries need attention`}
            />
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products Today</h3>
        {kpis.today.topSellingProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">Product</th>
                  <th className="table-header text-right">Quantity Sold</th>
                  <th className="table-header text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kpis.today.topSellingProducts.map((product) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                      {product.quantitySold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No sales data available yet</p>
        )}
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'red';
}

function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface AlertItemProps {
  icon: React.ElementType;
  color: 'orange' | 'yellow' | 'red';
  title: string;
  description: string;
}

function AlertItem({ icon: Icon, color, title, description }: AlertItemProps) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="flex items-start">
      <div className={`flex-shrink-0 p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
