import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { img } from '@/lib/utils';
import { DatePicker } from '@/components/DatePicker';

const PHONE = '212630230803';
const locations = ['Agence', 'Aéroport'];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const band1Ref = useRef<HTMLDivElement>(null);
  const band2Ref = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [carNames, setCarNames] = useState<string[]>([]);
  const [location, setLocation] = useState(locations[0]);
  const [vehicleType, setVehicleType] = useState('');

  const handleBooking = () => {
    const message = [
      '*Nouvelle Réservation*',
      '',
      '*Lieu :* ' + location,
      '*Véhicule :* ' + (vehicleType || 'Non spécifié'),
      '*Date de prise en charge :* ' + (pickupDate || 'Non spécifiée'),
      '*Date de retour :* ' + (returnDate || 'Non spécifiée'),
    ].join('\n');
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cars.json`)
      .then((res) => res.json())
      .then((data) => setCarNames(data.map((c: { name: string }) => c.name)))
      .catch(() => {});
  }, []);

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
      gsap.from(formRef.current, {
        opacity: 0,
        x: 50,
        duration: 0.7,
        delay: 0.6,
        ease: 'power2.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % 3);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + 3) % 3);

  return (
    <section ref={sectionRef} className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
        style={{ backgroundImage: `url(${img('/images/hero-bg.jpg')})` }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Diagonal Bands */}
      <div
        ref={band1Ref}
        className="absolute top-0 left-[-10%] h-full w-[45%] bg-remons-primary/85"
        style={{ transform: 'skewX(-15deg)' }}
      />
      <div
        ref={band2Ref}
        className="absolute top-0 left-[25%] h-full w-[20%] bg-remons-blue/60"
        style={{ transform: 'skewX(-15deg)' }}
      />

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 w-[50px] h-[50px] rounded-full border border-white/30 bg-black/50 flex items-center justify-center text-white hover:bg-remons-primary hover:border-remons-primary transition-all duration-300"
        aria-label="Diapositive précédente"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-[50px] h-[50px] rounded-full border border-white/30 bg-black/50 flex items-center justify-center text-white hover:bg-remons-primary hover:border-remons-primary transition-all duration-300"
        aria-label="Diapositive suivante"
      >
        <ChevronRight size={20} />
      </button>

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div ref={titleRef} className="max-w-lg">
          <p className="text-white/90 text-sm font-poppins tracking-[0.2em] uppercase mb-4">
            Recherchez Votre Voiture
          </p>
          <h1 className="font-poppins text-4xl sm:text-5xl lg:text-[52px] font-bold text-white leading-[1.2]">
            Recherchez &amp; Réservez
            <br />
            Votre Véhicule
            <br />
            Facilement
          </h1>
        </div>
      </div>

      {/* Booking Form Card */}
      <div
        ref={formRef}
        className="absolute bottom-16 right-[5%] z-20 w-[380px] max-w-[90vw] bg-remons-primary rounded-3xl p-8 shadow-elevated"
      >
        <div className="space-y-4">
          {/* Lieu de prise en charge */}
          <div>
            <label className="block text-white text-[13px] font-inter font-medium mb-2">
              Lieu de prise en charge
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3.5 pr-10 appearance-none font-inter text-remons-dark text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {locations.map((loc) => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-remons-gray pointer-events-none" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-[13px] font-inter font-medium mb-2">
                Date de prise en charge
              </label>
              <DatePicker
                  value={pickupDate}
                  onChange={setPickupDate}
                />
            </div>
            <div>
              <label className="block text-white text-[13px] font-inter font-medium mb-2">
                Date de retour
              </label>
              <DatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                />
            </div>
          </div>

          {/* Type de véhicule */}
          <div>
            <label className="block text-white text-[13px] font-inter font-medium mb-2">
              Type de véhicule
            </label>
            <div className="relative">
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3.5 pr-10 appearance-none font-inter text-remons-dark text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="">Sélectionnez un véhicule</option>
                {carNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-remons-gray pointer-events-none" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleBooking}
            className="w-full bg-remons-secondary text-white font-poppins text-sm font-semibold py-3.5 rounded-xl hover:bg-remons-secondary/90 transition-colors"
          >
            Réserver Maintenant
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'w-6 bg-remons-primary' : 'w-2.5 bg-white/50'
            }`}
            aria-label={`Aller à la diapositive ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
