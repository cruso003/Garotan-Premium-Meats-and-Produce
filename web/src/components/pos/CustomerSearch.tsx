import { useState, useEffect } from 'react';
import { Search, X, User, Phone, Mail, Award, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { Customer, LoyaltyTier } from '@/types';

interface CustomerSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: 'bg-amber-700 text-white',
  SILVER: 'bg-gray-400 text-white',
  GOLD: 'bg-yellow-500 text-white',
};

const TIER_BENEFITS = {
  BRONZE: { discount: '0%', multiplier: '1x', bonus: '50 pts' },
  SILVER: { discount: '5%', multiplier: '1.25x', bonus: '100 pts' },
  GOLD: { discount: '10%', multiplier: '1.5x', bonus: '200 pts' },
};

export default function CustomerSearch({
  isOpen,
  onClose,
  onSelectCustomer,
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query) ||
          (customer.email && customer.email.toLowerCase().includes(query))
        );
      });
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ data: Customer[] }>('/customers?limit=100');
      const activeCustomers = response.data.data.filter((c: Customer) => c.isActive);
      setCustomers(activeCustomers);
      setFilteredCustomers(activeCustomers);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Select Customer</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="input w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading customers...</div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="space-y-2">
              {filteredCustomers.map((customer) => {
                const tierBenefits = TIER_BENEFITS[customer.loyaltyTier];
                const isSelected = selectedCustomerId === customer.id;

                return (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {customer.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              TIER_COLORS[customer.loyaltyTier]
                            }`}
                          >
                            {customer.loyaltyTier}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Loyalty info */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-blue-50 rounded px-2 py-1">
                            <div className="flex items-center gap-1 text-blue-700 font-medium">
                              <Award className="h-3 w-3" />
                              <span>{customer.loyaltyPoints} pts</span>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded px-2 py-1">
                            <div className="text-green-700 font-medium">
                              {tierBenefits.discount} off
                            </div>
                          </div>
                          <div className="bg-purple-50 rounded px-2 py-1">
                            <div className="flex items-center gap-1 text-purple-700 font-medium">
                              <TrendingUp className="h-3 w-3" />
                              <span>{tierBenefits.multiplier}</span>
                            </div>
                          </div>
                          <div className="bg-orange-50 rounded px-2 py-1">
                            <div className="text-orange-700 font-medium">
                              {tierBenefits.bonus} 🎂
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <User className="h-16 w-16 mb-4" />
              <p>No customers found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
