import { Mail, Phone } from 'lucide-react';

const quickLinks = [
  { label: 'À Propos', href: '#about' },
  { label: 'Nouvelles Voitures', href: '#cars' },
  { label: 'Galerie', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
  { label: 'FAQ', href: '#faq' },
];

const socialLinks = [
  {
    name: 'Facebook',
    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    name: 'Twitter',
    path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
  },
  {
    name: 'LinkedIn',
    path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    name: 'YouTube',
    path: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z M9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02z',
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-remons-secondary pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10 mb-10 border-b border-white/10">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FF3B30"/>
              <path d="M12 28c0-3 2.5-5.5 5.5-5.5h3.5c2 0 3.5 1 4.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M11 29.5h22" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="17" cy="29.5" r="3" stroke="white" strokeWidth="1.5"/>
              <circle cx="27" cy="29.5" r="3" stroke="white" strokeWidth="1.5"/>
              <path d="M14.5 27.5l-1.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 22h10l-1.5-4h-7z" stroke="white" strokeWidth="1.5"/>
            </svg>
            <div className="leading-tight">
              <span className="font-poppins font-bold text-[18px] text-white tracking-tight block">REMONS</span>
              <span className="font-inter text-[10px] text-white/60 tracking-widest uppercase block -mt-0.5">car rental</span>
            </div>
          </a>

          {/* Tagline */}
          <p className="text-white/80 font-poppins text-lg font-semibold">
            Économisez Gros Avec Notre Location de Voitures
          </p>

          {/* Social */}
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-remons-primary transition-colors duration-300"
                aria-label={link.name}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={link.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid sm:grid-cols-2 gap-10 mb-16">
          {/* Column 1 - Contact */}
          <div>
            <h4 className="font-poppins text-lg font-semibold text-white mb-6">Contact</h4>
            <p className="text-white/60 text-sm font-inter leading-relaxed mb-4">
              66 Road Broklyn Golden Street, 600
              <br />
              New York, USA
            </p>
            <a
              href="mailto:needhelp@company.com"
              className="flex items-center gap-2 text-white/60 text-sm font-inter hover:text-remons-primary transition-colors mb-3"
            >
              <Mail size={16} />
              needhelp@company.com
            </a>
            <a
              href="tel:+92666888000"
              className="flex items-center gap-2 text-white/60 text-sm font-inter hover:text-remons-primary transition-colors"
            >
              <Phone size={16} />
              +92 (666) 888 0000
            </a>
          </div>

          {/* Column 2 - Links */}
          <div>
            <h4 className="font-poppins text-lg font-semibold text-white mb-6">Liens Rapides</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/60 text-sm font-inter hover:text-remons-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>


        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/50 text-sm font-inter">
            &copy; 2024 Remons.com — Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
