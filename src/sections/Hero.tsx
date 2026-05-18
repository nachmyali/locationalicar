import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ChevronDown } from 'lucide-react';
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
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [carNames, setCarNames] = useState<string[]>([]);
  const [location, setLocation] = useState(locations[0]);
  const [vehicleType, setVehicleType] = useState('');

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

  return (
    <section ref={sectionRef} className="relative min-h-screen lg:min-h-[700px] lg:overflow-hidden pb-8 lg:pb-0">
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

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-0 lg:h-full lg:flex lg:items-center">
        <div ref={titleRef} className="max-w-lg pt-10 lg:pt-0">
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
        className="relative lg:absolute mt-8 lg:mt-0 lg:bottom-16 lg:right-[5%] z-20 w-full lg:w-[380px] max-w-[380px] mx-auto lg:max-w-[90vw] bg-remons-primary rounded-3xl p-8 shadow-elevated"
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
    </section>
  );
}
