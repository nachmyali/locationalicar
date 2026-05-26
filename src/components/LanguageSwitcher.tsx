import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { i18n } = useTranslation();

  const current = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  return (
    <div className={`flex items-center gap-0.5 rounded-xl p-0.5 border transition-colors duration-300 ${
      variant === 'dark'
        ? 'bg-gray-100/60 border-gray-200'
        : 'bg-white/10 border-white/20'
    }`}>
      {languages.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-inter font-medium
              transition-all duration-300 ease-out
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
            <span className="text-base leading-none">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}
