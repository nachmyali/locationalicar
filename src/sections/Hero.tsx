import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { Headphones, MousePointerClick, ShieldCheck } from 'lucide-react';
import { img } from '@/lib/utils';

const featureKeys = ['express', 'insurance', 'support'] as const;

export default function Hero() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const band1Ref = useRef<HTMLDivElement>(null);
  const band2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(band1Ref.current, {
        scaleX: 0,
        duration: 0.8,
        ease: 'power2.out',
        transformOrigin: 'left',
      });
      gsap.from(band2Ref.current, {
        scaleX: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power2.out',
        transformOrigin: 'left',
      });
      gsap.from(titleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        delay: 0.4,
        ease: 'power2.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen lg:min-h-[700px] overflow-x-hidden lg:overflow-hidden pb-8 lg:pb-0">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={img('/Vid.mp4')} type="video/mp4" />
      </video>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/40" />

      {/* Diagonal Bands */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={band1Ref}
          className="absolute top-0 left-[-10%] h-full w-[55%] lg:w-[45%] bg-gradient-to-br from-remons-primary/90 to-remons-primary-light/75"
          style={{ transform: 'skewX(-15deg)' }}
        />
        <div
          ref={band2Ref}
          className="absolute top-0 left-[30%] lg:left-[25%] h-full w-[25%] lg:w-[20%] bg-white/18"
          style={{ transform: 'skewX(-15deg)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-[125px]">
        <div ref={titleRef} className="max-w-lg pt-6 sm:pt-10 lg:pt-0 lg:ml-[12%]">
          <p className="text-white/90 text-sm font-poppins tracking-[0.2em] uppercase mb-4">
            {t('hero.subtitle')}
          </p>
          <h1 className="font-poppins text-4xl sm:text-5xl lg:text-[48px] font-bold text-white leading-[1.2]"
            dangerouslySetInnerHTML={{ __html: t('hero.title') }} />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:ml-[12%] lg:max-w-[680px]">
          {featureKeys.map((key, i) => {
            const icons = [MousePointerClick, ShieldCheck, Headphones];
            const Icon = icons[i];

            return (
              <div
                key={key}
                className="group rounded-2xl border border-white/20 bg-white/[0.13] p-4 text-white shadow-[0_18px_45px_rgba(15,28,46,0.22)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.2]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-remons-primary shadow-lg shadow-slate-950/10">
                  <Icon size={22} />
                </div>
                <h4 className="font-poppins text-sm font-semibold leading-snug">
                  {t(`features.${key}.title`)}
                </h4>
                <p className="mt-2 font-inter text-xs leading-relaxed text-white/78">
                  {t(`features.${key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
