/**
 * Currency utilities for the application
 */

export type Currency = 'LRD' | 'USD';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  exchangeRate: number; // Rate to USD
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  LRD: {
    code: 'LRD',
    symbol: 'L$',
    name: 'Liberian Dollar',
    exchangeRate: 1, // Base currency
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRate: 0.0052, // 1 LRD = 0.0052 USD (approx 192 LRD = 1 USD)
  },
};

const CURRENCY_STORAGE_KEY = 'garotan_currency';

export class CurrencyService {
  /**
   * Get the currently selected currency
   */
  static getCurrency(): Currency {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return (stored as Currency) || 'LRD';
  }

  /**
   * Set the current currency
   */
  static setCurrency(currency: Currency): void {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: currency }));
  }

  /**
   * Get currency configuration
   */
  static getConfig(currency?: Currency): CurrencyConfig {
    return CURRENCIES[currency || this.getCurrency()];
  }

  /**
   * Convert amount from LRD to target currency
   */
  static convert(amountInLRD: number, targetCurrency?: Currency): number {
    const currency = targetCurrency || this.getCurrency();
    const config = CURRENCIES[currency];

    if (currency === 'LRD') {
      return amountInLRD;
    }

    // Convert LRD to USD
    return amountInLRD * config.exchangeRate;
  }

  /**
   * Format amount in the current or specified currency
   */
  static format(amountInLRD: number, targetCurrency?: Currency): string {
    const currency = targetCurrency || this.getCurrency();
    const config = CURRENCIES[currency];
    const amount = this.convert(amountInLRD, currency);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(amount);
  }

  /**
   * Get just the symbol
   */
  static getSymbol(currency?: Currency): string {
    return this.getConfig(currency).symbol;
  }

  /**
   * Get exchange rate info
   */
  static getExchangeRate(): string {
    const lrd = CURRENCIES.LRD;
    const usd = CURRENCIES.USD;
    const rate = Math.round(1 / usd.exchangeRate);
    return `1 USD = ${rate} LRD`;
  }
}

/**
 * React hook for formatting currency
 */
export function useCurrencyFormatter() {
  const [currency, setCurrency] = React.useState<Currency>(CurrencyService.getCurrency());

  React.useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent<Currency>) => {
      setCurrency(e.detail);
    };

    window.addEventListener('currencyChange' as any, handleCurrencyChange);
    return () => window.removeEventListener('currencyChange' as any, handleCurrencyChange);
  }, []);

  return {
    currency,
    format: (amount: number) => CurrencyService.format(amount),
    convert: (amount: number) => CurrencyService.convert(amount),
    getSymbol: () => CurrencyService.getSymbol(),
  };
}

// For React import
import React from 'react';
