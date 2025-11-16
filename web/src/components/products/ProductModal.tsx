import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/common/Modal';
import ImageUpload from '@/components/products/ImageUpload';
import type { Product, ProductCategory, UnitOfMeasure, StorageLocation } from '@/types';

interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  unitOfMeasure: UnitOfMeasure;
  costPrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  minStockLevel: number;
  storageLocation: StorageLocation;
  shelfLifeDays?: number;
  imageUrl?: string;
  isActive: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  product?: Product;
  isLoading?: boolean;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading = false,
}: ProductModalProps) {
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: product ? {
      name: product.name,
      description: product.description || undefined,
      sku: product.sku,
      barcode: product.barcode || undefined,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure,
      costPrice: parseFloat(product.costPrice),
      retailPrice: parseFloat(product.retailPrice),
      wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice) : undefined,
      minStockLevel: product.minStockLevel,
      storageLocation: product.storageLocation,
      shelfLifeDays: product.shelfLifeDays || undefined,
      imageUrl: product.imageUrl || undefined,
      isActive: product.isActive,
    } : {
      isActive: true,
      minStockLevel: 10,
    },
  });

  useEffect(() => {
    if (product) {
      setImageUrl(product.imageUrl || '');
      reset({
        name: product.name,
        description: product.description || undefined,
        sku: product.sku,
        barcode: product.barcode || undefined,
        category: product.category,
        unitOfMeasure: product.unitOfMeasure,
        costPrice: parseFloat(product.costPrice),
        retailPrice: parseFloat(product.retailPrice),
        wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice) : undefined,
        minStockLevel: product.minStockLevel,
        storageLocation: product.storageLocation,
        shelfLifeDays: product.shelfLifeDays || undefined,
        imageUrl: product.imageUrl || undefined,
        isActive: product.isActive,
      });
    } else {
      setImageUrl('');
      reset({
        isActive: true,
        minStockLevel: 10,
      });
    }
  }, [product, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit({
      ...data,
      imageUrl: imageUrl || undefined,
    });
    reset();
    setImageUrl('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
              {...register('name', { required: 'Product name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="input w-full"
              {...register('description')}
            />
          </div>

          <div className="col-span-2">
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUploaded={setImageUrl}
              folder="products"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input
              type="text"
              className={`input w-full ${errors.sku ? 'border-red-500' : ''}`}
              {...register('sku', { required: 'SKU is required' })}
            />
            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <input type="text" className="input w-full" {...register('barcode')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              className={`input w-full ${errors.category ? 'border-red-500' : ''}`}
              {...register('category', { required: 'Category is required' })}
            >
              <option value="">Select category</option>
              <option value="CHICKEN">Chicken</option>
              <option value="BEEF">Beef</option>
              <option value="PORK">Pork</option>
              <option value="PRODUCE">Produce</option>
              <option value="VALUE_ADDED">Value Added</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure *
            </label>
            <select
              className={`input w-full ${errors.unitOfMeasure ? 'border-red-500' : ''}`}
              {...register('unitOfMeasure', { required: 'Unit is required' })}
            >
              <option value="">Select unit</option>
              <option value="KG">Kilogram (KG)</option>
              <option value="LBS">Pounds (LBS)</option>
              <option value="PIECE">Piece</option>
              <option value="PACK">Pack</option>
              <option value="BOX">Box</option>
            </select>
            {errors.unitOfMeasure && (
              <p className="mt-1 text-sm text-red-600">{errors.unitOfMeasure.message}</p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t pt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Pricing</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (LRD) *
              </label>
              <input
                type="number"
                step="0.01"
                className={`input w-full ${errors.costPrice ? 'border-red-500' : ''}`}
                {...register('costPrice', {
                  required: 'Cost price is required',
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              {errors.costPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.costPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retail Price (LRD) *
              </label>
              <input
                type="number"
                step="0.01"
                className={`input w-full ${errors.retailPrice ? 'border-red-500' : ''}`}
                {...register('retailPrice', {
                  required: 'Retail price is required',
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              {errors.retailPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.retailPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wholesale Price (LRD)
              </label>
              <input
                type="number"
                step="0.01"
                className="input w-full"
                {...register('wholesalePrice', {
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="border-t pt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Storage & Inventory</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Location *
              </label>
              <select
                className={`input w-full ${
                  errors.storageLocation ? 'border-red-500' : ''
                }`}
                {...register('storageLocation', {
                  required: 'Storage location is required',
                })}
              >
                <option value="">Select location</option>
                <option value="COLD_ROOM">Cold Room</option>
                <option value="FREEZER">Freezer</option>
                <option value="DRY_STORAGE">Dry Storage</option>
                <option value="WAREHOUSE">Warehouse</option>
              </select>
              {errors.storageLocation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.storageLocation.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level *
              </label>
              <input
                type="number"
                className={`input w-full ${errors.minStockLevel ? 'border-red-500' : ''}`}
                {...register('minStockLevel', {
                  required: 'Minimum stock level is required',
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              {errors.minStockLevel && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.minStockLevel.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelf Life (days)
              </label>
              <input
                type="number"
                className="input w-full"
                {...register('shelfLifeDays', {
                  min: { value: 1, message: 'Must be at least 1' },
                })}
              />
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            {...register('isActive')}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active (product is available for sale)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
