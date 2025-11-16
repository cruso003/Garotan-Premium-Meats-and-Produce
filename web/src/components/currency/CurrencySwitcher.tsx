import { useState, useEffect } from 'react';
import { DollarSign, Info } from 'lucide-react';
import { Currency, CurrencyService, CURRENCIES } from '@/lib/currency';

export default function CurrencySwitcher() {
  const [currency, setCurrency] = useState<Currency>(CurrencyService.getCurrency());
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent<Currency>) => {
      setCurrency(e.detail);
    };

    window.addEventListener('currencyChange' as any, handleCurrencyChange);
    return () => window.removeEventListener('currencyChange' as any, handleCurrencyChange);
  }, []);

  const handleChange = (newCurrency: Currency) => {
    CurrencyService.setCurrency(newCurrency);
    setCurrency(newCurrency);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-gray-600" />
        <select
          value={currency}
          onChange={(e) => handleChange(e.target.value as Currency)}
          className="input-sm border-gray-300 rounded-md text-sm font-medium focus:ring-primary focus:border-primary"
          title="Select currency"
        >
          {Object.values(CURRENCIES).map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Exchange rate info"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-semibold text-gray-900 mb-2">Exchange Rate</div>
            <div>{CurrencyService.getExchangeRate()}</div>
            <div className="text-gray-500 mt-2 pt-2 border-t">
              All prices are stored in LRD and converted for display
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
