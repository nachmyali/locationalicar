import { createContext, useContext, useState, type ReactNode } from 'react';

export type CurrencyCode = 'EUR' | 'USD' | 'MAD';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar' },
  { code: 'MAD', symbol: 'Dhs', label: 'Dirham' },
];

const rates: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.10,
  MAD: 10.80,
};

export function convertPrice(euroAmount: number, to: CurrencyCode): number {
  return Math.round(euroAmount * rates[to] * 100) / 100;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
