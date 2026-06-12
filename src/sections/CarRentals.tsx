import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Users, DoorOpen, Settings2, Fuel, ArrowRight, X } from 'lucide-react';
import { img } from '@/lib/utils';
import { DatePicker } from '@/components/DatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency, convertPrice } from '@/lib/currency';
import { supabase, type TransportPrice } from '@/lib/supabase';
import { sendReservationEmail } from '@/lib/email';

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

const DEFAULT_SEASON_START = '07-01';
const DEFAULT_SEASON_END = '08-25';

function parseSeasonDate(mmdd: string): { m: number; day: number } {
  const parts = mmdd.split('-');
  return { m: parseInt(parts[0], 10), day: parseInt(parts[1], 10) };
}

function isInRange(d: Date, start: string, end: string): boolean {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const s = parseSeasonDate(start);
  const e = parseSeasonDate(end);

  if (s.m <= e.m) {
    if (m > s.m && m < e.m) return true;
    if (m === s.m && day >= s.day) return true;
    if (m === e.m && day <= e.day) return true;
    return false;
  }
  if (m > s.m || m < e.m) return true;
  if (m === s.m && day >= s.day) return true;
  if (m === e.m && day <= e.day) return true;
  return false;
}

function getSeason(dateStr: string, start: string, end: string): 'normal' | 'haute' {
  if (!dateStr) return 'normal';
  return isInRange(new Date(dateStr), start, end) ? 'haute' : 'normal';
}

function getDurationDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getBracket(category: string, days: number, tariffs: Record<string, PriceBracket[]>): PriceBracket | undefined {
  const brackets = tariffs[category];
  if (!brackets) return undefined;
  return brackets.find(b => days >= b.minDays && days <= b.maxDays);
}

function getStartingPrice(category: string, season: 'normal' | 'haute', tariffs: Record<string, PriceBracket[]>): number {
  const brackets = tariffs[category];
  if (!brackets) return 0;
  const bracket = brackets[0];
  return season === 'haute' ? bracket.haute : bracket.normal;
}

function buildTariffMap(data: { category: string; min_days: number; max_days: number; normal_rate: number; haute_rate: number }[]): Record<string, PriceBracket[]> {
  const grouped: Record<string, PriceBracket[]> = {};
  for (const t of data) {
    if (!grouped[t.category]) grouped[t.category] = [];
    const label = t.max_days === 999 ? '+21 j' : `${t.min_days}-${t.max_days} j`;
    grouped[t.category].push({ minDays: t.min_days, maxDays: t.max_days, label, normal: t.normal_rate, haute: t.haute_rate });
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.minDays - b.minDays);
  }
  return grouped;
}

function buildTransportMap(data: TransportPrice[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of data) {
    map[p.to_location] = p.price_eur;
  }
  return map;
}

const PHONE = '21264405566';

  function BookingModal({
  car, tariffs, transportPrices, locations, seasonStart, seasonEnd,
  onClose,
  }: {
    car: Car;
    tariffs: Record<string, PriceBracket[]>;
    transportPrices: Record<string, number>;
    locations: string[];
    seasonStart: string;
    seasonEnd: string;
    onClose: () => void;
  }) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    pickupLocation: '',
    deliveryLocation: '',
  });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const days = getDurationDays(form.startDate, form.endDate);
  const season = getSeason(form.startDate, seasonStart, seasonEnd);
  const bracket = getBracket(car.category, days, tariffs);
  const dailyRateEUR = bracket ? (season === 'haute' ? bracket.haute : bracket.normal) : 0;
  const transportEUR = transportPrices[form.deliveryLocation] ?? 0;
  const rentalTotalEUR = dailyRateEUR * days;
  const totalEUR = rentalTotalEUR + transportEUR;
  const symbol = currency.symbol;
  const dailyRate = convertPrice(dailyRateEUR, currency.code);
  const transportPrice = convertPrice(transportEUR, currency.code);
  const rentalTotal = convertPrice(rentalTotalEUR, currency.code);
  const total = convertPrice(totalEUR, currency.code);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    const message = [
      'Nouvelle réservation',
      ``,
      `Véhicule : ${car.name}`,
      `Nom : ${form.name}`,
      `Téléphone : ${form.phone}`,
      ``,
      `Date départ : ${form.startDate}`,
      `Date retour : ${form.endDate}`,
      ``,
      `Prise en charge : ${form.pickupLocation || '-'}`,
      `Livraison : ${form.deliveryLocation || '-'}`,
      ``,
      `Prix : ${rentalTotal} ${symbol}`,
      `Total : ${total} ${symbol}`,
    ].join('\n');

    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    try {
      const { error } = await supabase.from('reservations').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        car_name: car.name,
        car_category: car.category,
        car_price: car.price,
        car_duration: car.duration,
        start_date: form.startDate,
        end_date: form.endDate,
        location: `${form.pickupLocation} → ${form.deliveryLocation}`,
        transport_eur: transportEUR,
        season: season,
        duration_days: days,
        daily_rate_eur: dailyRateEUR,
        rental_total_eur: rentalTotalEUR,
        total_eur: totalEUR,
      });

      if (error) throw new Error(error.message);
      setSubmitted(true);
      sendReservationEmail('contact@locationalicar.com', 'new', {
        client_name: form.name,
        client_email: form.email,
        client_phone: form.phone,
        car_name: car.name,
        start_date: form.startDate,
        end_date: form.endDate,
        total_eur: totalEUR,
        location: `${form.pickupLocation} → ${form.deliveryLocation}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('cars.submitErrorMessage');
      setSubmitMessage(message);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl p-10 shadow-elevated text-center">
          <div className="w-16 h-16 rounded-full bg-[#3BB8FF]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#3BB8FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="font-poppins text-xl font-bold text-remons-dark mb-4">
            Réservation confirmée
          </h3>
          <p className="text-remons-gray text-sm font-inter leading-relaxed mb-6">
            Votre demande de réservation a bien été enregistrée. Notre équipe va la vérifier et vous contacter dans les plus brefs délais pour confirmer votre réservation. Merci de votre confiance et à bientôt chez AliCar.
          </p>
          <button
            onClick={onClose}
            className="btn-primary font-poppins text-sm px-8 py-3"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
                Prise en charge
              </label>
              <Select
                value={form.pickupLocation}
                onValueChange={(v) => setForm((p) => ({ ...p, pickupLocation: v }))}
              >
                <SelectTrigger className="w-full border border-remons-border rounded-xl px-4 py-3 h-auto bg-white text-remons-dark text-sm shadow-xs">
                  <SelectValue placeholder="Lieu de départ" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-remons-dark text-sm font-inter font-medium mb-1.5">
                Livraison
              </label>
              <Select
                value={form.deliveryLocation}
                onValueChange={(v) => setForm((p) => ({ ...p, deliveryLocation: v }))}
              >
                <SelectTrigger className="w-full border border-remons-border rounded-xl px-4 py-3 h-auto bg-white text-remons-dark text-sm shadow-xs">
                  <SelectValue placeholder="Lieu de livraison" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>



          <div className="bg-remons-light-gray rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-inter font-semibold text-remons-dark uppercase tracking-wider">
              Détail du prix
            </p>
            {form.startDate && form.endDate && days > 0 && (
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Durée</span>
                <span className="font-medium">{days} jours ({bracket?.label})</span>
              </div>
            )}
            {dailyRateEUR > 0 && days > 0 && (
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Location ({dailyRate} {symbol} × {days} j)</span>
                <span className="font-medium">{rentalTotal} {symbol}</span>
              </div>
            )}
            {transportPrice > 0 && form.deliveryLocation && (
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Livraison ({form.deliveryLocation})</span>
                <span className="font-medium">{transportPrice} {symbol}</span>
              </div>
            )}
            {transportPrice === 0 && form.deliveryLocation && (
              <div className="flex justify-between text-sm font-inter text-remons-dark">
                <span>Livraison ({form.deliveryLocation})</span>
                <span className="font-medium">Gratuit</span>
              </div>
            )}
            {(dailyRateEUR > 0 && days > 0) || transportPrice > 0 ? (
              <div className="border-t border-remons-border pt-1.5 mt-1.5 flex justify-between text-sm font-inter font-bold text-remons-primary">
                <span>Total</span>
                <span>{total} {symbol}</span>
              </div>
            ) : (
              <div className="border-t border-remons-border pt-1.5 mt-1.5 flex justify-between text-sm font-inter text-remons-gray">
                <span>Sélectionnez les dates et le lieu pour voir le total</span>
              </div>
            )}
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
  const [tariffs, setTariffs] = useState<Record<string, PriceBracket[]>>({});
  const [transportPrices, setTransportPrices] = useState<Record<string, number>>({});
  const [locations, setLocations] = useState<string[]>([]);
  const [seasonStart, setSeasonStart] = useState(DEFAULT_SEASON_START);
  const [seasonEnd, setSeasonEnd] = useState(DEFAULT_SEASON_END);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  function getCurrentSeason(): 'normal' | 'haute' {
    const today = new Date().toISOString().split('T')[0];
    return getSeason(today, seasonStart, seasonEnd);
  }

  const currentSeason = getCurrentSeason();

  useEffect(() => {
    async function loadData() {
      try {
        const [carsResult, tariffsResult, transportResult, settingsResult] = await Promise.all([
          supabase.from('cars').select('*').eq('active', true).order('id'),
          supabase.from('tariffs').select('*'),
          supabase.from('transport_prices').select('*'),
          supabase.from('settings').select('*'),
        ]);

        if (carsResult.error) throw new Error(carsResult.error.message);
        if (tariffsResult.error) throw new Error(tariffsResult.error.message);

        setCars(carsResult.data || []);
        if (tariffsResult.data) {
          setTariffs(buildTariffMap(tariffsResult.data));
        }
        if (transportResult.data && transportResult.data.length > 0) {
          setTransportPrices(buildTransportMap(transportResult.data));
          const uniqueLocations = new Set<string>();
          for (const p of transportResult.data) {
            uniqueLocations.add(p.from_location);
            uniqueLocations.add(p.to_location);
          }
          setLocations(Array.from(uniqueLocations).sort());
        }
        if (settingsResult.data) {
          const s = settingsResult.data;
          const start = s.find((x: { key: string }) => x.key === 'haute_saison_start');
          const end = s.find((x: { key: string }) => x.key === 'haute_saison_end');
          if (start) setSeasonStart(start.value);
          if (end) setSeasonEnd(end.value);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
          <p className="text-remons-primary text-lg">{t('cars.error')}</p>
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
                <div className="aspect-[4/3] bg-remons-light-gray" />
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
                <div className="relative aspect-[4/3] overflow-hidden bg-remons-light-gray">
                  <img
                    src={img(car.image)}
                    alt={car.name}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-1"
                  />
                </div>

                <div className="p-6">
                  <h4 className="font-poppins text-lg font-semibold text-remons-dark mb-1">
                    {car.name}
                  </h4>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-poppins text-xl font-bold text-remons-primary">
                      {convertPrice(getStartingPrice(car.category, currentSeason, tariffs), currency.code)} {currency.symbol}
                    </span>
                    <span className="text-remons-gray text-sm font-inter">/ {car.duration}</span>
                    {currentSeason === 'haute' && (
                      <span className="text-[10px] font-inter font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
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
        <BookingModal
          car={selectedCar}
          tariffs={tariffs}
          transportPrices={transportPrices}
          locations={locations}
          seasonStart={seasonStart}
          seasonEnd={seasonEnd}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </section>
  );
}
