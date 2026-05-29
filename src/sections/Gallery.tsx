import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Star, X, Play } from 'lucide-react';
import { img } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

export default function Gallery() {
  const { t } = useTranslation();
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useScrollAnimation<HTMLElement>({
    animation: 'fadeIn',
  });
  const imagesRef = useScrollAnimation<HTMLDivElement>({
    animation: 'scaleIn',
    childSelector: '.gallery-item',
    stagger: 0.1,
  });

  useEffect(() => {
    if (selectedVideo !== null && modalVideoRef.current) {
      modalVideoRef.current.play().catch(() => {});
    }
  }, [selectedVideo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVideo(null);
    };
    if (selectedVideo !== null) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [selectedVideo]);

  return (
    <section id="gallery" ref={sectionRef} className="bg-remons-light-gray py-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
          {/* Masonry Grid */}
          <div ref={imagesRef} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="gallery-item aspect-[4/3] relative rounded-xl overflow-hidden group cursor-pointer" onClick={() => setSelectedVideo(i)}>
                <video
                  src={img(`/tmx/${i + 1}.mp4`)}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Play size={28} className="text-remons-primary ml-1" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-remons-primary/0 group-hover:bg-remons-primary/20 transition-colors duration-300" />
              </div>
            ))}
          </div>

          {/* Video Modal */}
          {selectedVideo !== null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
                <video
                  ref={modalVideoRef}
                  src={img(`/tmx/${selectedVideo + 1}.mp4`)}
                  controls
                  autoPlay
                  playsInline
                  className="w-full rounded-xl shadow-2xl"
                />
              </div>
            </div>
          )}

          {/* Google Reviews Panel */}
          <div className="relative rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-br from-remons-primary to-remons-blue" />

            <div className="relative z-10 text-center p-8">
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <h3 className="font-poppins text-2xl font-bold text-white leading-tight mb-2">
                {t('gallery.title')}
              </h3>
              <p className="text-white/80 text-sm font-inter mb-6">
                Note 4.9/5 sur Google
              </p>
              <a
                href="https://search.google.com/local/writereview?placeid=ChIJS4Si8pHurw0RBf6gdITg6Rw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-remons-primary font-semibold font-inter text-sm hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                Donnez votre avis
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
