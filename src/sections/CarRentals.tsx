import { useEffect, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Users, DoorOpen, Settings2, Fuel, ArrowRight, X } from 'lucide-react';
import { img } from '@/lib/utils';
import { DatePicker } from '@/components/DatePicker';

interface Car {
  id: number;
  name: string;
  price: number;
  duration: string;
  seats: number;
  transmission: string;
  doors: number;
  fuel: string;
  image: string;
}

const PHONE = '212661341407';
const BOOKING_WEB_APP_URL = import.meta.env.VITE_BOOKING_WEB_APP_URL || '';
const BOOKING_WEB_APP_SECRET = import.meta.env.VITE_BOOKING_WEB_APP_SECRET || '';

function encodePayload(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function BookingModal({ car, onClose }: { car: Car; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
  });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const sendReservationToSheet = async () => {
    if (!BOOKING_WEB_APP_URL) {
      throw new Error('Configuration Google Sheet manquante.');
    }

    const payload = {
      action: 'createReservation',
      pwa_secret: BOOKING_WEB_APP_SECRET,
      reservation: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        carName: car.name,
        carPrice: car.price,
        carDuration: car.duration,
        startDate: form.startDate,
        endDate: form.endDate,
      },
    };

    const url = new URL(BOOKING_WEB_APP_URL);
    url.searchParams.set('payload', encodePayload(payload));
    if (BOOKING_WEB_APP_SECRET) {
      url.searchParams.set('pwa_secret', BOOKING_WEB_APP_SECRET);
    }

    const response = await fetch(url.toString());
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'La reservation n a pas ete enregistree.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    const message = [
      `*Nouvelle Réservation*`,
      ``,
      `*Voiture :* ${car.name}`,
      `*Prix :* ${car.price} MAD / ${car.duration}`,
      `*Nom :* ${form.name}`,
      `*Email :* ${form.email}`,
      `*Téléphone :* ${form.phone}`,
      `*Date de départ :* ${form.startDate}`,
      `*Date de retour :* ${form.endDate}`,
    ].join('\n');

    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    try {
      await sendReservationToSheet();
      setSubmitMessage('Reservation envoyee avec succes.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur pendant l envoi vers Google Sheet.';
      setSubmitMessage(message);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-elevated">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-remons-light-gray flex items-center justify-center hover:bg-remons-primary hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <h3 className="font-poppins text-xl font-bold text-remons-dark mb-1">
          Réserver
        </h3>
        <p className="text-remons-gray text-sm font-inter mb-6">{car.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              Nom complet
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder="+212 6XX XX XX XX"
            />
          </div>

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder="client@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date de départ"
              value={form.startDate}
              onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
              min={today}
              required
            />
            <DatePicker
              label="Date de retour"
              value={form.endDate}
              onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
              min={today}
              required
            />
          </div>

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              Voiture choisie
            </label>
            <input
              type="text"
              value={car.name}
              disabled
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter bg-remons-light-gray text-remons-gray cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full font-poppins text-sm py-3.5"
          >
            Envoyer via WhatsApp
          </button>
          {submitMessage && (
            <p className="text-center text-xs font-inter text-remons-gray">
              {submitMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function CarRentals() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cars.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load cars');
        return res.json();
      })
      .then((data) => {
        setCars(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const headerRef = useScrollAnimation<HTMLDivElement>({ animation: 'fadeInUp' });
  const gridRef = useScrollAnimation<HTMLDivElement>({
    animation: 'fadeInUp',
    childSelector: '.car-card',
    stagger: 0.1,
  });

  if (error) {
    return (
      <section id="cars" className="bg-white py-[100px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-500 text-lg">Impossible de charger les voitures pour le moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="cars" className="bg-white py-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-12">
          <span className="text-remons-primary text-[13px] font-inter font-medium uppercase tracking-wider">
            DÉCOUVREZ NOS NOUVEAUX VÉHICULES
          </span>
          <h2 className="font-poppins text-3xl sm:text-[42px] font-bold text-remons-dark leading-[1.2] mt-3">
            Voitures Que Nous Proposons
            <br />
            À La Location
          </h2>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="car-card bg-white rounded-2xl overflow-hidden shadow-card animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-px bg-gray-200" />
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded" />
                    ))}
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div
                key={car.id}
                className="car-card bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={img(car.image)}
                    alt={car.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                </div>

                <div className="p-6">


                  <h4 className="font-poppins text-lg font-semibold text-remons-dark mb-1">
                    {car.name}
                  </h4>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-poppins text-xl font-bold text-remons-primary">
                      {car.price} MAD
                    </span>
                    <span className="text-remons-gray text-sm font-inter">/ {car.duration}</span>
                  </div>

                  <div className="border-t border-remons-border mb-4" />

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.seats} Places</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings2 size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.transmission}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.doors} Portes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.fuel}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCar(car)}
                    className="w-full flex items-center justify-center gap-2 bg-remons-light-gray text-remons-dark font-poppins text-sm font-medium py-3 rounded-xl hover:bg-remons-primary hover:text-white hover:shadow-button transition-all duration-300"
                  >
                    Réserver Maintenant
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCar && (
        <BookingModal car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </section>
  );
}
