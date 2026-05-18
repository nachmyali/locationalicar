import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'remons-pwa-dismissed';

export default function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (dismissed || isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    (prompt as any).prompt();
    const result = await (prompt as any).userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pb-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-md rounded-2xl bg-white/95 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 p-4 flex items-center gap-3">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="shrink-0">
          <rect width="44" height="44" rx="10" fill="#FF3B30"/>
          <path d="M12 28c0-3 2.5-5.5 5.5-5.5h3.5c2 0 3.5 1 4.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M11 29.5h22" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="17" cy="29.5" r="3" stroke="white" strokeWidth="1.5"/>
          <circle cx="27" cy="29.5" r="3" stroke="white" strokeWidth="1.5"/>
          <path d="M14.5 27.5l-1.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 22h10l-1.5-4h-7z" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-poppins font-semibold text-sm text-gray-900">Installer Remons</p>
          <p className="font-inter text-xs text-gray-500 truncate">Ajoutez à votre écran d'accueil</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 bg-remons-primary hover:bg-[#E6352A] text-white text-sm font-semibold font-poppins px-5 py-2.5 rounded-full transition-all duration-200 active:scale-95"
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
