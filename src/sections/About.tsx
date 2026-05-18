import { useState, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { MousePointerClick, MapPin, ChevronDown } from 'lucide-react';
import { img } from '@/lib/utils';
import { DatePicker } from '@/components/DatePicker';

const PHONE = '212630230803';
const locations = ['Agence', 'Aéroport'];

const features = [
  {
    icon: MousePointerClick,
    title: 'Réservations Rapides & Faciles',
    desc: 'Réservez votre voiture en minutes grâce à notre processus simplifié.',
  },
  {
    icon: MapPin,
    title: 'Multiples Lieux de Prise en Charge',
    desc: 'Plusieurs emplacements pratiques à travers la ville.',
  },
];

export default function About() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [carNames, setCarNames] = useState<string[]>([]);
  const [location, setLocation] = useState(locations[0]);
  const [vehicleType, setVehicleType] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cars.json`)
      .then((res) => res.json())
      .then((data) => setCarNames(data.map((c: { name: string }) => c.name)))
      .catch(() => {});
  }, []);

  const handleBooking = () => {
    const message = [
      '*Nouvelle Réservation*',
      '',
      '*Lieu :* ' + location,
      '*Véhicule :* ' + (vehicleType || 'Non spécifié'),
      '*Date de départ :* ' + (fromDate || 'Non spécifiée'),
      '*Date de retour :* ' + (toDate || 'Non spécifiée'),
    ].join('\n');
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };
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
    <section id="about" ref={sectionRef} className="bg-remons-light-gray py-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[55%_45%] gap-16 items-center">
          {/* Left Content */}
          <div ref={leftRef}>
            {/* Subtitle */}
            <div className="flex items-center gap-3 mb-4 animate-item">
              <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                <path d="M2 12c0-4 3-7 7-7h5c3 0 5 1.5 6 4" stroke="#FF3B30" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <circle cx="8" cy="12" r="3" stroke="#FF3B30" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="12" r="3" stroke="#FF3B30" strokeWidth="1.5" fill="none"/>
                <path d="M6 10l-2-5" stroke="#FF3B30" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="text-remons-primary text-[13px] font-inter font-medium uppercase tracking-wider">
                APPRENEZ À NOUS CONNAÎTRE
              </span>
            </div>

            {/* Title */}
            <h2 className="font-poppins text-3xl sm:text-[42px] font-bold text-remons-dark leading-[1.2] mb-6 animate-item">
              Recherchez &amp; Réservez
              <br />
              Votre Véhicule Facilement
            </h2>

            {/* Description */}
            <p className="text-remons-gray text-base font-inter leading-relaxed mb-10 animate-item">
              Nous offrons une large gamme de véhicules adaptés à tous vos besoins.
              Que ce soit pour un voyage d&apos;affaires ou des vacances en famille,
              trouvez la voiture parfaite avec un service client exceptionnel.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="animate-item">
                  <div className="w-14 h-14 rounded-full bg-remons-blue flex items-center justify-center mb-4">
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <h4 className="font-poppins text-lg font-semibold text-remons-dark mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-remons-gray text-sm font-inter">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Image + Form */}
          <div ref={rightRef} className="relative">
            <img
              src={img('/images/about-man.png')}
              alt="Consultant professionnel"
              className="w-full max-w-[400px] mx-auto object-contain relative z-10"
            />

            {/* Floating Form */}
            <div className="absolute bottom-[-30px] right-0 lg:right-[-20px] w-[300px] max-w-full bg-remons-primary rounded-3xl p-6 shadow-elevated z-20">
              <div className="space-y-3">
                <div>
                  <label className="block text-white text-[12px] font-inter font-medium mb-1.5">
                    Lieu de prise en charge
                  </label>
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white rounded-lg px-3 py-2.5 pr-8 appearance-none font-inter text-remons-dark text-sm focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc}>{loc}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-remons-gray pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    label="Date de départ"
                    value={fromDate}
                    onChange={setFromDate}
                  />
                  <DatePicker
                    label="Date de retour"
                    value={toDate}
                    onChange={setToDate}
                  />
                </div>

                <div>
                  <label className="block text-white text-[12px] font-inter font-medium mb-1.5">
                    Type de véhicule
                  </label>
                  <div className="relative">
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-white rounded-lg px-3 py-2.5 pr-8 appearance-none font-inter text-remons-dark text-sm focus:outline-none"
                    >
                      <option value="">Sélectionnez un véhicule</option>
                      {carNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-remons-gray pointer-events-none" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBooking}
                  className="w-full bg-remons-secondary text-white font-poppins text-sm font-semibold py-2.5 rounded-lg hover:bg-remons-secondary/90 transition-colors"
                >
                  Réserver Maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
