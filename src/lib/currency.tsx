import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
  MAD: 10,
};

export function convertPrice(euroAmount: number, to: CurrencyCode): number {
  return Math.round(euroAmount * rates[to] * 100) / 100;
}

export function convertToEUR(amount: number, from: CurrencyCode): number {
  return Math.round((amount / rates[from]) * 100) / 100;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('default_currency') : null;
    return currencies.find(c => c.code === saved) || currencies[0];
  });

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'default_currency').single().then(({ data }) => {
      if (data?.value) {
        const found = currencies.find(c => c.code === data.value);
        if (found && found.code !== currency.code) {
          setCurrency(found);
          localStorage.setItem('default_currency', found.code);
        }
      }
    });
  }, []);

  const setAndPersist = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('default_currency', c.code);
  };
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: setAndPersist }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
