import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product, PaginatedResponse } from '@/types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get<PaginatedResponse<Product>>(
        `/products?page=${page}&limit=20&search=${searchQuery}`
      );
      // Debug: log the shape we received so we can diagnose runtime mismatches
      // eslint-disable-next-line no-console
      console.debug('products response', response);

      // The API client may return either:
      // 1) ApiResponse<PaginatedResponse<T>> => { success, message?, data: { data: T[], pagination } }
      // 2) PaginatedResponse<T> directly => { success, data: T[], pagination }
      // 3) or even the items array directly (T[]). Normalize all cases.
      const raw: any =
        response && (response as any).data ? (response as any).data : response;

      const items: Product[] = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
          ? raw
          : [];
      const pages = raw?.pagination?.totalPages ?? 1;

      setProducts(items);
      setTotalPages(pages);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      CHICKEN: 'bg-yellow-100 text-yellow-800',
      BEEF: 'bg-red-100 text-red-800',
      PORK: 'bg-pink-100 text-pink-800',
      PRODUCE: 'bg-green-100 text-green-800',
      VALUE_ADDED: 'bg-purple-100 text-purple-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.OTHER;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">
            Manage your product catalog and pricing
          </p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Search and filters */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              className="input w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchProducts();
                }
              }}
            />
          </div>
          <button onClick={fetchProducts} className="btn btn-primary">
            Search
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-left">SKU</th>
                    <th className="table-header text-left">Category</th>
                    <th className="table-header text-right">Cost</th>
                    <th className="table-header text-right">Retail Price</th>
                    <th className="table-header text-right">Stock</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(
                            product.category
                          )}`}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(product.retailPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <span
                          className={
                            (product.currentStock || 0) <= product.minStockLevel
                              ? 'text-red-600 font-semibold'
                              : ''
                          }
                        >
                          {product.currentStock || 0} {product.unitOfMeasure}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="text-primary hover:text-primary-600 mr-3">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
