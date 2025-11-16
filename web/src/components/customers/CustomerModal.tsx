import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/common/Modal';
import type { Customer, CustomerType, LoyaltyTier } from '@/types';

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: CustomerType;
  loyaltyTier?: LoyaltyTier;
  loyaltyPoints?: number;
  creditLimit?: number;
  isActive: boolean;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  customer?: Customer;
  isLoading?: boolean;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  isLoading = false,
}: CustomerModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: customer ? {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      address: customer.address || undefined,
      customerType: customer.customerType,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints,
      creditLimit: customer.creditLimit ? parseFloat(customer.creditLimit) : undefined,
      isActive: customer.isActive,
    } : {
      isActive: true,
      customerType: 'RETAIL' as CustomerType,
      loyaltyTier: 'BRONZE' as LoyaltyTier,
      loyaltyPoints: 0,
    },
  });

  const customerType = watch('customerType');

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || undefined,
        address: customer.address || undefined,
        customerType: customer.customerType,
        loyaltyTier: customer.loyaltyTier,
        loyaltyPoints: customer.loyaltyPoints,
        creditLimit: customer.creditLimit ? parseFloat(customer.creditLimit) : undefined,
        isActive: customer.isActive,
      });
    } else {
      reset({
        isActive: true,
        customerType: 'RETAIL',
        loyaltyTier: 'BRONZE',
        loyaltyPoints: 0,
      });
    }
  }, [customer, reset]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
              {...register('name', { required: 'Customer name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              className={`input w-full ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="+231..."
              {...register('phone', { required: 'Phone number is required' })}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              rows={2}
              className="input w-full"
              {...register('address')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Type *
            </label>
            <select
              className={`input w-full ${errors.customerType ? 'border-red-500' : ''}`}
              {...register('customerType', { required: 'Customer type is required' })}
            >
              <option value="RETAIL">Retail</option>
              <option value="B2B_RESTAURANT">Restaurant</option>
              <option value="B2B_HOTEL">Hotel</option>
              <option value="B2B_INSTITUTION">Institution</option>
            </select>
            {errors.customerType && (
              <p className="mt-1 text-sm text-red-600">{errors.customerType.message}</p>
            )}
          </div>

          {customerType !== 'RETAIL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Limit (LRD)
              </label>
              <input
                type="number"
                step="0.01"
                className="input w-full"
                {...register('creditLimit', {
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
            </div>
          )}
        </div>

        {/* Loyalty Program */}
        {customerType === 'RETAIL' && (
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3">
              Loyalty Program
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loyalty Tier
                </label>
                <select className="input w-full" {...register('loyaltyTier')}>
                  <option value="BRONZE">Bronze</option>
                  <option value="SILVER">Silver</option>
                  <option value="GOLD">Gold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loyalty Points
                </label>
                <input
                  type="number"
                  className="input w-full"
                  {...register('loyaltyPoints', {
                    min: { value: 0, message: 'Must be positive' },
                  })}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Tier thresholds: Bronze (0-199 pts), Silver (200-499 pts), Gold (500+ pts)
            </p>
          </div>
        )}

        {/* Active Status */}
        <div className="flex items-center pt-4">
          <input
            type="checkbox"
            id="isActive"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            {...register('isActive')}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active Customer
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
