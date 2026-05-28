import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { img } from '@/lib/utils';

const navKeys = [
  { key: 'home', href: '#' },
  { key: 'about', href: '#about' },
  { key: 'gallery', href: '#gallery' },
  { key: 'cars', href: '#cars' },
  { key: 'contact', href: '#contact' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const initial = useRef(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (initial.current) {
        lastScrollY.current = currentY;
        initial.current = false;
        return;
      }

      if (currentY > lastScrollY.current && currentY > 80) {
        setHidden(true);
      } else if (currentY < lastScrollY.current) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };

    const handleScrollSection = () => {
      const sections = navKeys.map(l => l.href.replace('#', ''));
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection('');
    };

    handleScroll();
    handleScrollSection();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScrollSection, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { passive: true } as EventListenerOptions);
      window.removeEventListener('scroll', handleScrollSection, { passive: true } as EventListenerOptions);
    };
  }, []);

  return (
    <nav
      className={`
        bg-white border-b border-remons-border sticky top-0 z-50
        transition-all duration-500 ease-in-out
        ${hidden ? '-translate-y-full' : 'translate-y-0'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 shrink-0">
            <img src={img('/logo.png')} alt="Yacout Tours" className="h-28 w-auto" />
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navKeys.map((link) => {
              const sectionId = link.href.replace('#', '');
              const isActive = sectionId ? activeSection === sectionId : activeSection === '';
              return (
                <a
                  key={link.key}
                  href={link.href}
                  className={`
                    font-poppins text-[15px] font-medium transition-colors relative
                    ${isActive ? 'text-remons-primary' : 'text-remons-dark hover:text-remons-primary'}
                  `}
                >
                  {t(`navbar.${link.key}`)}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-remons-primary rounded-full" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <CurrencySwitcher variant="dark" />
            <LanguageSwitcher variant="dark" />

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-remons-primary to-remons-primary-light shadow-button flex items-center justify-center">
                <Phone size={18} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-remons-gray font-inter">{t('navbar.callUs')}</p>
                <p className="text-[15px] font-poppins font-semibold text-remons-dark">+212 6 61 34 14 07</p>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="#cars"
              className="btn-primary inline-flex items-center justify-center font-poppins text-sm px-6 py-3"
            >
              {t('navbar.findCar')}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t('navbar.menu')}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-remons-border">
          <div className="px-4 py-4 space-y-3">
            {navKeys.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="block font-poppins text-base font-medium text-remons-dark hover:text-remons-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(`navbar.${link.key}`)}
              </a>
            ))}
            <a
              href="#cars"
              className="btn-primary block font-poppins text-sm text-center mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('navbar.findCar')}
            </a>
            <div className="pt-2 flex items-center gap-2">
              <CurrencySwitcher variant="dark" />
              <LanguageSwitcher variant="dark" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
