import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Search, User, Package, CheckCircle, Camera, Award, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import PrintReceipt from '@/components/receipts/PrintReceipt';
import CustomerSearch from '@/components/pos/CustomerSearch';
import CustomerHistory from '@/components/pos/CustomerHistory';
import type { Product, Customer, LoyaltyTier } from '@/types';

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  discount: number;
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

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<{
    id: string;
    receiptNumber: string;
  } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered.slice(0, 20));
    } else {
      setFilteredProducts(products.slice(0, 20));
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get<{ data: Product[] }>('/products?limit=100');
      const activeProducts = response.data.data.filter((p: Product) => p.isActive);
      setProducts(activeProducts);
      setFilteredProducts(activeProducts.slice(0, 20));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Find product by barcode
    const product = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()
    );

    if (product) {
      addToCart(product);
    } else {
      // If not found by barcode, try SKU
      const productBySku = products.find(
        (p) => p.sku && p.sku.toLowerCase() === barcode.toLowerCase()
      );

      if (productBySku) {
        addToCart(productBySku);
      } else {
        alert(`Product not found for barcode: ${barcode}`);
      }
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: parseFloat(product.retailPrice),
          quantity: 1,
          discount: 0,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      const transactionData = {
        customerId: selectedCustomer?.id,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      };

      const response = await api.post<{ data: { id: string; receiptNumber: string } }>('/transactions', transactionData);

      // Store completed transaction for receipt printing
      setCompletedTransaction({
        id: response.data.data.id,
        receiptNumber: response.data.data.receiptNumber,
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Clear cart
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('CASH');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex">
      {/* Success notification with print receipt */}
      {showSuccess && completedTransaction && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-6 w-6 mr-3" />
            <div>
              <p className="font-semibold">Transaction completed successfully!</p>
              <p className="text-sm opacity-90">Receipt #{completedTransaction.receiptNumber}</p>
            </div>
          </div>
          <PrintReceipt
            transactionId={completedTransaction.id}
            receiptNumber={completedTransaction.receiptNumber}
            onPrintComplete={() => setCompletedTransaction(null)}
            className="mt-2"
          />
        </div>
      )}

      {/* Products section */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Point of Sale</h1>

          {/* Search bar with scanner button */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="btn btn-primary flex items-center px-4"
              title="Scan barcode with camera"
            >
              <Camera className="h-5 w-5 mr-2" />
              Scan
            </button>
          </div>
        </div>

        {/* Products grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="card hover:shadow-lg transition-shadow text-left"
              >
                <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(parseFloat(product.retailPrice))}
                </p>
                {product.currentStock !== undefined && product.currentStock <= product.minStockLevel && (
                  <p className="text-xs text-red-600 mt-1">Low stock!</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Cart section */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Customer selection */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {selectedCustomer ? (
            <>
              <div className="bg-primary-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>

                {/* Loyalty tier badge and points */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      TIER_COLORS[selectedCustomer.loyaltyTier]
                    }`}
                  >
                    {selectedCustomer.loyaltyTier} TIER
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    <Award className="h-4 w-4" />
                    {selectedCustomer.loyaltyPoints} points
                  </span>
                </div>

                {/* Tier benefits */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white rounded px-2 py-1.5 text-center">
                    <div className="text-gray-500 mb-0.5">Discount</div>
                    <div className="font-semibold text-green-600">
                      {TIER_BENEFITS[selectedCustomer.loyaltyTier].discount}
                    </div>
                  </div>
                  <div className="bg-white rounded px-2 py-1.5 text-center">
                    <div className="text-gray-500 mb-0.5 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Points
                    </div>
                    <div className="font-semibold text-purple-600">
                      {TIER_BENEFITS[selectedCustomer.loyaltyTier].multiplier}
                    </div>
                  </div>
                  <div className="bg-white rounded px-2 py-1.5 text-center">
                    <div className="text-gray-500 mb-0.5">Birthday</div>
                    <div className="font-semibold text-orange-600">
                      {TIER_BENEFITS[selectedCustomer.loyaltyTier].bonus}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer history */}
              <CustomerHistory customer={selectedCustomer} />
            </>
          ) : (
            <button
              onClick={() => setIsCustomerSearchOpen(true)}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              <User className="mr-2 h-5 w-5" />
              Select Customer
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="h-16 w-16 mb-4" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart totals and checkout */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input w-full"
            >
              <option value="CASH">Cash</option>
              <option value="MOBILE_MONEY_MTN">Mobile Money (MTN)</option>
              <option value="MOBILE_MONEY_ORANGE">Mobile Money (Orange)</option>
              <option value="CARD">Card</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (10%)</span>
              <span className="font-semibold">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Customer Search Modal */}
      <CustomerSearch
        isOpen={isCustomerSearchOpen}
        onClose={() => setIsCustomerSearchOpen(false)}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setIsCustomerSearchOpen(false);
        }}
      />
    </div>
  );
}
