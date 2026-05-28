import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Users, DoorOpen, Settings2, Fuel, ArrowRight, X } from 'lucide-react';
import { img } from '@/lib/utils';
import { DatePicker } from '@/components/DatePicker';
import { useCurrency, convertPrice } from '@/lib/currency';

interface Car {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: string;
  seats: number;
  transmission: string;
  doors: number;
  fuel: string;
  image: string;
}

interface PriceBracket {
  minDays: number;
  maxDays: number;
  label: string;
  normal: number;
  haute: number;
}

const TARIFFS: Record<string, PriceBracket[]> = {
  'CAT A': [
    { minDays: 1, maxDays: 4, label: '1-4 j', normal: 30, haute: 43 },
    { minDays: 5, maxDays: 8, label: '5-8 j', normal: 25, haute: 38 },
    { minDays: 9, maxDays: 21, label: '9-21 j', normal: 23, haute: 33 },
    { minDays: 22, maxDays: Infinity, label: '+21 j', normal: 20, haute: 28 },
  ],
  'CAT B': [
    { minDays: 1, maxDays: 4, label: '1-4 j', normal: 35, haute: 50 },
    { minDays: 5, maxDays: 8, label: '5-8 j', normal: 30, haute: 45 },
    { minDays: 9, maxDays: 21, label: '9-21 j', normal: 27, haute: 40 },
    { minDays: 22, maxDays: Infinity, label: '+21 j', normal: 25, haute: 35 },
  ],
  'CAT C': [
    { minDays: 1, maxDays: 4, label: '1-4 j', normal: 45, haute: 55 },
    { minDays: 5, maxDays: 8, label: '5-8 j', normal: 42, haute: 50 },
    { minDays: 9, maxDays: 21, label: '9-21 j', normal: 38, haute: 45 },
    { minDays: 22, maxDays: Infinity, label: '+21 j', normal: 35, haute: 40 },
  ],
  'CAT D': [
    { minDays: 1, maxDays: 4, label: '1-4 j', normal: 70, haute: 80 },
    { minDays: 5, maxDays: 8, label: '5-8 j', normal: 60, haute: 75 },
    { minDays: 9, maxDays: 21, label: '9-21 j', normal: 50, haute: 70 },
    { minDays: 22, maxDays: Infinity, label: '+21 j', normal: 40, haute: 60 },
  ],
};

function getSeason(dateStr: string): 'normal' | 'haute' {
  if (!dateStr) return 'normal';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 7 || (m === 8 && day <= 25)) return 'haute';
  return 'normal';
}

function getDurationDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getBracket(category: string, days: number): PriceBracket | undefined {
  const brackets = TARIFFS[category];
  if (!brackets) return undefined;
  return brackets.find(b => days >= b.minDays && days <= b.maxDays);
}

function getStartingPrice(category: string, season: 'normal' | 'haute'): number {
  const brackets = TARIFFS[category];
  if (!brackets) return 0;
  const bracket = brackets[0];
  return season === 'haute' ? bracket.haute : bracket.normal;
}

function getCurrentSeason(): 'normal' | 'haute' {
  const today = new Date().toISOString().split('T')[0];
  return getSeason(today);
}

const TRANSPORT_PRICES: Record<string, number> = {
  'Marrakech ville': 0,
  'Aéroport Marrakech': 0,
  'Casablanca ville': 53,
  'Aéroport Casablanca': 53,
  'Rabat ville': 63,
  'Aéroport Rabat': 63,
  'Agadir ville': 53,
  'Aéroport Agadir': 53,
  'Fès ville': 115,
  'Aéroport Fès': 115,
  'Ouarzazate ville': 53,
  'Aéroport Ouarzazate': 53,
  'Essaouira ville': 53,
  'Aéroport Essaouira': 53,
  'Tanger ville': 125,
  'Aéroport Tanger': 125,
};

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
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const locations = [
    'Marrakech ville', 'Aéroport Marrakech',
    'Casablanca ville', 'Aéroport Casablanca',
    'Rabat ville', 'Aéroport Rabat',
    'Agadir ville', 'Aéroport Agadir',
    'Fès ville', 'Aéroport Fès',
    'Ouarzazate ville', 'Aéroport Ouarzazate',
    'Essaouira ville', 'Aéroport Essaouira',
    'Tanger ville', 'Aéroport Tanger',
  ];

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    location: locations[0],
  });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const days = getDurationDays(form.startDate, form.endDate);
  const season = getSeason(form.startDate);
  const bracket = getBracket(car.category, days);
  const dailyRateEUR = bracket ? (season === 'haute' ? bracket.haute : bracket.normal) : 0;
  const transportEUR = TRANSPORT_PRICES[form.location] ?? 0;
  const rentalTotalEUR = dailyRateEUR * days;
  const totalEUR = rentalTotalEUR + transportEUR;
  const symbol = currency.symbol;
  const dailyRate = convertPrice(dailyRateEUR, currency.code);
  const transportPrice = convertPrice(transportEUR, currency.code);
  const rentalTotal = convertPrice(rentalTotalEUR, currency.code);
  const total = convertPrice(totalEUR, currency.code);

  const sendReservationToSheet = async () => {
    if (!BOOKING_WEB_APP_URL) {
      throw new Error(t('cars.sheetError'));
    }

    const payload = {
      action: 'createReservation',
      pwa_secret: BOOKING_WEB_APP_SECRET,
      reservation: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        carName: car.name,
        carCategory: car.category,
        carPrice: car.price,
        carDuration: car.duration,
        startDate: form.startDate,
        endDate: form.endDate,
        location: form.location,
        transportEUR: transportEUR,
        season: season,
        durationDays: days,
        dailyRateEUR: dailyRateEUR,
        rentalTotalEUR: rentalTotalEUR,
        totalEUR: totalEUR,
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
      throw new Error(result.error || t('cars.submitError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    const seasonLabel = season === 'haute' ? 'Haute Saison' : 'Saison Normale';
    const durationLabel = bracket ? bracket.label : '-';
    const transportDetail = transportPrice > 0
      ? `Trajet : ${form.location} (${transportPrice} ${symbol})`
      : null;
    const message = [
      t('cars.bookingTitle'),
      ``,
      t('cars.carField') + car.name,
      `Catégorie : ${car.category}`,
      `Saison : ${seasonLabel}`,
      `Durée : ${days} jours (${durationLabel})`,
      `Location : ${dailyRate} ${symbol} × ${days} j = ${rentalTotal} ${symbol}`,
      ...(transportDetail ? [transportDetail] : []),
      `*Total : ${total} ${symbol}*`,
      t('cars.locationField') + form.location,
      t('cars.nameField') + form.name,
      t('cars.emailField') + form.email,
      t('cars.phoneField') + form.phone,
      t('cars.startField') + form.startDate,
      t('cars.endField') + form.endDate,
    ].join('\n');

    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    try {
      await sendReservationToSheet();
      setSubmitMessage(t('cars.successMessage'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('cars.submitErrorMessage');
      setSubmitMessage(message);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-elevated my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-remons-light-gray flex items-center justify-center hover:bg-remons-primary hover:text-white transition-colors"
          aria-label={t('cars.modal.close')}
        >
          <X size={18} />
        </button>

        <h3 className="font-poppins text-xl font-bold text-remons-dark mb-1">
          {t('cars.modal.title')}
        </h3>
        <p className="text-remons-gray text-sm font-inter mb-6">{car.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              {t('cars.modal.name')}
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder={t('cars.modal.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              {t('cars.modal.phone')}
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder={t('cars.modal.phonePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              {t('cars.modal.email')}
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder={t('cars.modal.emailPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label={t('cars.modal.startDate')}
              value={form.startDate}
              onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
              min={today}
              required
            />
            <DatePicker
              label={t('cars.modal.endDate')}
              value={form.endDate}
              onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
              min={today}
              required
            />
          </div>

          {form.startDate && form.endDate && days > 0 && dailyRateEUR > 0 && (
            <div className="bg-remons-light-gray rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-inter font-semibold text-remons-dark uppercase tracking-wider">
                Détail du prix
              </p>
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Catégorie</span>
                <span className="font-medium">{car.category}</span>
              </div>
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Saison</span>
                <span className="font-medium">{season === 'haute' ? 'Haute Saison' : 'Saison Normale'}</span>
              </div>
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Durée</span>
                <span className="font-medium">{days} jours ({bracket?.label})</span>
              </div>
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Location ({dailyRate} {symbol} × {days} j)</span>
                <span className="font-medium">{rentalTotal} {symbol}</span>
              </div>
              {transportPrice > 0 && (
                <div className="flex justify-between text-sm font-inter text-remons-dark">
                  <span>Trajet ({form.location})</span>
                  <span className="font-medium">{transportPrice} {symbol}</span>
                </div>
              )}
              <div className="border-t border-remons-border pt-1.5 mt-1.5 flex justify-between text-sm font-inter font-bold text-remons-primary">
                <span>Total</span>
                <span>{total} {symbol}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              {t('cars.modal.location')}
            </label>
            <select
              name="location"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary bg-white appearance-none"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
              {t('cars.modal.selectedCar')}
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
            {t('cars.modal.submit')}
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
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const currentSeason = getCurrentSeason();

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
          <p className="text-red-500 text-lg">{t('cars.error')}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="cars" className="bg-white py-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-12">
          <span className="text-remons-primary text-[13px] font-inter font-medium uppercase tracking-wider">
            {t('cars.subtitle')}
          </span>
          <h2 className="font-poppins text-3xl sm:text-[42px] font-bold text-remons-dark leading-[1.2] mt-3"
            dangerouslySetInnerHTML={{ __html: t('cars.title') }} />
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
                      {convertPrice(getStartingPrice(car.category, currentSeason), currency.code)} {currency.symbol}
                    </span>
                    <span className="text-remons-gray text-sm font-inter">/ {car.duration}</span>
                    {currentSeason === 'haute' && (
                      <span className="text-[10px] font-inter font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                        Haute Saison
                      </span>
                    )}
                  </div>

                  <div className="border-t border-remons-border mb-4" />

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.seats} {t('cars.seats')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings2 size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.transmission}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen size={14} className="text-remons-gray" />
                      <span className="text-remons-gray text-sm font-inter">{car.doors} {t('cars.doors')}</span>
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
                    {t('cars.bookNow')}
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
