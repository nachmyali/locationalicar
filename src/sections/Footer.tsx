import { useTranslation } from 'react-i18next';
import { ArrowUp, Star, LogIn } from 'lucide-react';
import { img } from '@/lib/utils';
import { useState } from 'react';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';

const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/moveupautomotive/',
    icon: (
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/moveupautomotive/',
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/moveupautomotive/',
    icon: (
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    ),
  },
];

export default function Footer() {
  const { t } = useTranslation();
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  return (
    <footer id="contact" className="bg-[#060816] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-10 mb-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3">
              <img src={img('/pwa.png')} alt="ALICAR" className="h-28 w-auto" />
            </a>

            {/* Tagline */}
            <p className="text-gray-400 font-poppins text-lg font-semibold">
              {t('footer.tagline')}
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-remons-primary hover:text-white transition-colors duration-300"
                  aria-label={link.name}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {link.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Review Panel */}
          <div className="relative rounded-xl overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#111827] to-[#090d1a]" />
            <div className="relative z-10 text-center px-6 py-4">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <h3 className="font-poppins text-lg font-bold text-white leading-tight mb-1">
                {t('gallery.title')}
              </h3>
              <p className="text-white/80 text-xs font-inter mb-2">
                Trustpilot 4.8/5 — Tripadvisor 5.0/5
              </p>
              <a
                href="https://maps.app.goo.gl/wjPkukvmkyaMPFCL9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-remons-primary font-semibold font-inter text-xs hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                Donnez votre avis
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm font-inter">
            &copy; {t('footer.copyright')}
            {' — '}
            <button onClick={() => setTermsOpen(true)} className="underline hover:text-white transition-colors">
              {t('footer.terms')}
            </button>
            {' — '}
            <button onClick={() => setPrivacyOpen(true)} className="underline hover:text-white transition-colors">
              {t('footer.privacy')}
            </button>
            {' — '}
            <a href={`${base}/admin/login`} className="inline-flex items-center gap-1 underline hover:text-white transition-colors">
              <LogIn size={12} /> Connexion
            </a>
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-remons-primary hover:text-white transition-all duration-300"
            aria-label={t('footer.backToTop')}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </footer>
  );
}
