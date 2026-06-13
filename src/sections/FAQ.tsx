import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ChevronDown } from 'lucide-react';

const faqs = [1, 2, 3, 4];

export default function FAQ() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<number | null>(3);
  const sectionRef = useScrollAnimation<HTMLElement>({ animation: 'fadeInUp' });
  const leftRef = useScrollAnimation<HTMLDivElement>({ animation: 'fadeInLeft' });
  const rightRef = useScrollAnimation<HTMLDivElement>({
    animation: 'fadeInRight',
    childSelector: '.faq-item',
    stagger: 0.1,
  });

  const toggle = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section ref={sectionRef} className="bg-remons-light-gray py-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[2fr_3fr] gap-16">
          {/* Left */}
          <div ref={leftRef}>
            <span className="text-remons-primary text-[13px] font-inter font-medium uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="font-poppins text-3xl sm:text-[42px] font-bold text-remons-dark leading-[1.2] mt-3"
              dangerouslySetInnerHTML={{ __html: t('faq.sectionHeading') }} />
            <p className="text-remons-gray text-sm font-inter leading-relaxed mt-6">
              {t('faq.moreQuestions')} <br />
              <a href="https://wa.me/212664405566" target="_blank" rel="noopener noreferrer" className="text-remons-primary font-semibold hover:underline">
                {t('faq.contactWhatsApp')}
              </a>
            </p>
          </div>

          {/* Right - Accordion */}
          <div ref={rightRef} className="space-y-0">
            {faqs.map((id) => (
              <div key={id} className="faq-item border-b border-remons-border">
                <button
                  onClick={() => toggle(id)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="font-poppins text-lg font-semibold text-remons-dark pr-4 group-hover:text-remons-primary transition-colors">
                    {t(`faq.q${id}`)}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-remons-gray shrink-0 transition-transform duration-300 ${
                      openId === id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    openId === id ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-remons-gray text-base font-inter leading-relaxed">
                      {t(`faq.a${id}`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
