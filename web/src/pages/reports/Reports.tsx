import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

interface SalesTrend {
  date: string;
  revenue: number;
  transactions: number;
}

interface CategorySales {
  category: string;
  revenue: number;
  quantity: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [trendsRes, categoryRes] = await Promise.all([
        api.get<SalesTrend[]>(`/reports/sales-trends?period=${period}`),
        api.get<CategorySales[]>('/reports/sales-by-category'),
      ]);

      setSalesTrends(trendsRes.data as SalesTrend[]);
      setCategorySales(categoryRes.data as CategorySales[]);

      // Calculate totals
      const revenue = salesTrends.reduce((sum, item) => sum + item.revenue, 0);
      const transactions = salesTrends.reduce((sum, item) => sum + item.transactions, 0);
      setTotalRevenue(revenue);
      setTotalTransactions(transactions);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#2D5016', '#0077BE', '#FF6B35', '#4A7A2C', '#1E90D5'];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">
            View sales performance and business insights
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="input"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
          <button className="btn btn-primary flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 text-blue-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalTransactions > 0 ? totalRevenue / totalTransactions : 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-orange-100 text-orange-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold text-green-600">+12.5%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Trend Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2D5016"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Transactions Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Transactions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip labelStyle={{ color: '#374151' }} />
                  <Legend />
                  <Bar dataKey="transactions" fill="#0077BE" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Revenue Pie Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {categorySales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Table */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">
                        Category
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">
                        Revenue
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySales.map((cat, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3 text-sm text-gray-900">{cat.category}</td>
                        <td className="py-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(cat.revenue)}
                        </td>
                        <td className="py-3 text-sm text-gray-600 text-right">
                          {cat.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
