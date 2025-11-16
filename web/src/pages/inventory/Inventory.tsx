import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/types';

interface StockBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string | null;
  receivedDate: string;
  productId: string;
  product: {
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
}

export default function Inventory() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [nearExpiryBatches, setNearExpiryBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [lowStockRes, nearExpiryRes] = await Promise.all([
        api.get<Product[]>('/inventory/low-stock'),
        api.get<StockBatch[]>('/inventory/near-expiry'),
      ]);

      setLowStockProducts(lowStockRes.data);
      setNearExpiryBatches(nearExpiryRes.data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="mt-2 text-gray-600">
            Track stock levels and manage inventory
          </p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Stock Adjustment
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {lowStockProducts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Near Expiry</p>
              <p className="text-2xl font-bold text-gray-900">
                {nearExpiryBatches.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Low Stock Products
              </h3>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                All products are adequately stocked
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {product.currentStock || 0} {product.unitOfMeasure}
                      </p>
                      <p className="text-xs text-gray-600">
                        Min: {product.minStockLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Near Expiry Batches */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Products Near Expiry
              </h3>
              <TrendingDown className="h-5 w-5 text-yellow-600" />
            </div>
            {nearExpiryBatches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No products expiring soon
              </p>
            ) : (
              <div className="space-y-3">
                {nearExpiryBatches.map((batch) => {
                  const daysLeft = batch.expiryDate
                    ? getDaysUntilExpiry(batch.expiryDate)
                    : null;
                  return (
                    <div
                      key={batch.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        daysLeft && daysLeft <= 3
                          ? 'bg-red-50 border-red-100'
                          : 'bg-yellow-50 border-yellow-100'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {batch.product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Batch: {batch.batchNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        {batch.expiryDate && (
                          <>
                            <p
                              className={`text-sm font-bold ${
                                daysLeft && daysLeft <= 3
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                              }`}
                            >
                              {daysLeft} days left
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(batch.expiryDate)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustments History - Placeholder */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Stock Adjustments
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No recent stock adjustments</p>
        </div>
      </div>
    </div>
  );
}
