import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Award } from 'lucide-react';
import { api } from '@/lib/api';
import CustomerModal from '@/components/customers/CustomerModal';
import type { Customer, PaginatedResponse } from '@/types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get<PaginatedResponse<Customer>>(
        `/customers?page=${page}&limit=20&search=${searchQuery}`
      );
      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/customers/${customer.id}`);
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedCustomer) {
        // Update existing customer
        await api.put(`/customers/${selectedCustomer.id}`, data);
      } else {
        // Create new customer
        await api.post('/customers', data);
      }
      setIsModalOpen(false);
      setSelectedCustomer(undefined);
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save customer');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLoyaltyBadge = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: 'bg-orange-100 text-orange-800',
      SILVER: 'bg-gray-100 text-gray-800',
      GOLD: 'bg-yellow-100 text-yellow-800',
    };
    return colors[tier] || colors.BRONZE;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      RETAIL: 'bg-blue-100 text-blue-800',
      B2B_RESTAURANT: 'bg-purple-100 text-purple-800',
      B2B_HOTEL: 'bg-pink-100 text-pink-800',
      B2B_INSTITUTION: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || colors.RETAIL;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">
            Manage customer relationships and loyalty program
          </p>
        </div>
        <button onClick={handleAddCustomer} className="btn btn-primary flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="input w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  fetchCustomers();
                }
              }}
            />
          </div>
          <button
            onClick={() => {
              setPage(1);
              fetchCustomers();
            }}
            className="btn btn-primary"
          >
            Search
          </button>
        </div>
      </div>

      {/* Customers table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header text-left">Customer</th>
                    <th className="table-header text-left">Type</th>
                    <th className="table-header text-left">Contact</th>
                    <th className="table-header text-center">Loyalty Tier</th>
                    <th className="table-header text-right">Points</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        {customer.address && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {customer.address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(
                            customer.customerType
                          )}`}
                        >
                          {customer.customerType.replace('B2B_', '')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${getLoyaltyBadge(
                            customer.loyaltyTier
                          )}`}
                        >
                          <Award className="h-3 w-3 mr-1" />
                          {customer.loyaltyTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {customer.loyaltyPoints.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            customer.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-primary hover:text-primary-600 mr-3"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete customer"
                        >
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

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(undefined);
        }}
        onSubmit={handleSubmit}
        customer={selectedCustomer}
        isLoading={isSubmitting}
      />
    </div>
  );
}
