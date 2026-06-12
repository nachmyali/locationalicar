import { useTranslation } from 'react-i18next';
import { Mail, MapPin } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';

export default function TopBar() {
  const { t } = useTranslation();
  return (
    <div className="bg-remons-secondary text-white hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[42px]">
          <div className="flex items-center gap-4 text-[13px] font-inter">
            <a href="mailto:contact@locationalicar.com" className="flex items-center gap-2 hover:text-remons-primary transition-colors">
              <Mail size={14} />
              <span>{t('topbar.email')}</span>
            </a>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>{t('topbar.address')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
