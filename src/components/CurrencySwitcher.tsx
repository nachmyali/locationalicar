import { currencies, useCurrency } from '@/lib/currency';

export default function CurrencySwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`flex items-center gap-0.5 rounded-xl p-0.5 border transition-colors duration-300 ${
      variant === 'dark'
        ? 'bg-gray-100/60 border-gray-200'
        : 'bg-white/10 border-white/20'
    }`}>
      {currencies.map((c) => {
        const active = currency.code === c.code;
        return (
          <button
            key={c.code}
            onClick={() => setCurrency(c)}
            className={`
              flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[13px] font-inter font-medium
              transition-all duration-300 ease-out whitespace-nowrap
              ${active
                ? variant === 'dark'
                  ? 'bg-white text-remons-dark shadow-sm'
                  : 'bg-white/20 text-white shadow-sm'
                : variant === 'dark'
                  ? 'text-gray-400 hover:text-remons-dark'
                  : 'text-white/60 hover:text-white'
              }
            `}
          >
            <span>{c.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}
