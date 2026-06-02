import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, CalendarCheck, Receipt, TrendingUp } from 'lucide-react';
import { useCurrency, convertPrice } from '@/lib/currency';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ cars: 0, reservations: 0, newReservations: 0 });
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();

  useEffect(() => {
    async function loadStats() {
      const [carsRes, reservationsRes, newRes, revenueRes] = await Promise.all([
        supabase.from('cars').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('reservations').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('reservations').select('total_eur').eq('status', 'confirmed'),
      ]);

      const revenue = (revenueRes.data ?? []).reduce((sum, r) => sum + Number(r.total_eur), 0);

      setStats({
        cars: carsRes.count ?? 0,
        reservations: reservationsRes.count ?? 0,
        newReservations: newRes.count ?? 0,
      });

      setRevenue(revenue);
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Voitures actives', value: stats.cars, icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Réservations totales', value: stats.reservations, icon: CalendarCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Nouvelles réservations', value: stats.newReservations, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: `Revenu total (${currency.symbol})`, value: convertPrice(revenue, currency.code).toLocaleString('fr-FR'), icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-remons-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-poppins text-xl sm:text-2xl font-bold text-remons-dark mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-card p-6">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold font-poppins text-remons-dark">{card.value}</p>
            <p className="text-sm font-inter text-remons-gray mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
