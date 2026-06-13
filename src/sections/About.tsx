import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { MousePointerClick, MapPin } from 'lucide-react';
import { img } from '@/lib/utils';

export default function About() {
  const { t } = useTranslation();

  const features = [
    {
      icon: MousePointerClick,
      titleKey: 'booking',
    },
    {
      icon: MapPin,
      titleKey: 'locations',
    },
  ];

  const sectionRef = useScrollAnimation<HTMLElement>({ animation: 'fadeInUp' });
  const leftRef = useScrollAnimation<HTMLDivElement>({
    animation: 'fadeInUp',
    childSelector: '.animate-item',
    stagger: 0.1,
  });
  const rightRef = useScrollAnimation<HTMLDivElement>({
    animation: 'fadeInRight',
    delay: 0.2,
  });

  return (
    <section id="about" ref={sectionRef} className="bg-remons-light-gray py-[100px] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[55%_45%] gap-16 items-center">
          {/* Left Content */}
          <div ref={leftRef}>
            {/* Subtitle */}
            <div className="flex items-center gap-3 mb-4 animate-item">
              <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                <path d="M2 12c0-4 3-7 7-7h5c3 0 5 1.5 6 4" stroke="#3BB8FF" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <circle cx="8" cy="12" r="3" stroke="#3BB8FF" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="12" r="3" stroke="#3BB8FF" strokeWidth="1.5" fill="none"/>
                <path d="M6 10l-2-5" stroke="#3BB8FF" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="text-remons-primary text-[13px] font-inter font-medium uppercase tracking-wider">
                {t('about.subtitle')}
              </span>
            </div>

            <h2 className="font-poppins text-3xl sm:text-[42px] font-bold text-remons-dark leading-[1.2] mb-6 animate-item"
              dangerouslySetInnerHTML={{ __html: t('about.title') }} />

            <p className="text-remons-gray text-base font-inter leading-relaxed mb-10 animate-item">
              {t('about.description')}
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((f) => (
                <div key={f.titleKey} className="animate-item">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-remons-primary to-remons-primary-light shadow-button flex items-center justify-center mb-4">
                    <f.icon size={24} className="text-white" />
                  </div>
                  <h4 className="font-poppins text-lg font-semibold text-remons-dark mb-1">
                    {t(`about.features.${f.titleKey}.title`)}
                  </h4>
                  <p className="text-remons-gray text-sm font-inter">{t(`about.features.${f.titleKey}.desc`)}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="animate-item mt-10">
              <div className="flex items-center gap-3 mb-4">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                  <path d="M2 12c0-4 3-7 7-7h5c3 0 5 1.5 6 4" stroke="#3BB8FF" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <circle cx="8" cy="12" r="3" stroke="#3BB8FF" strokeWidth="1.5" fill="none"/>
                  <circle cx="24" cy="12" r="3" stroke="#3BB8FF" strokeWidth="1.5" fill="none"/>
                  <path d="M6 10l-2-5" stroke="#3BB8FF" strokeWidth="1.5" fill="none"/>
                </svg>
                <span className="text-remons-primary text-[13px] font-inter font-medium uppercase tracking-wider">
                  NOS ATOUTS
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Véhicules récents', 'Prix compétitifs', 'Réservation rapide', 'Kilométrage flexible', 'Assistance 24h/24', 'Service client réactif'].map((tag) => (
                  <span key={tag} className="inline-block bg-remons-primary/10 text-remons-primary text-xs font-medium px-3 py-1.5 rounded-full border border-remons-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-remons-gray text-sm font-inter leading-relaxed mb-4">
                Livraison et récupération du véhicule à Casablanca, à l'aéroport Mohammed V, à votre hôtel ou à votre adresse.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-remons-gray font-inter text-sm">WhatsApp :</span>
                <a
                  href="https://wa.me/212664405566"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-remons-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-remons-primary-dark transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-button"
                >
                  0664405566
                </a>
              </div>
            </div>
          </div>

          {/* Right - Video */}
          <div ref={rightRef} className="relative h-full">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover rounded-2xl relative z-10"
            >
              <source src={img('/Vid.mp4')} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}