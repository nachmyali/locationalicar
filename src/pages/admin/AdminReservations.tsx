import { useEffect, useState, useCallback } from 'react';
import { supabase, type Reservation } from '@/lib/supabase';
import ReservationTable from '@/components/admin/ReservationTable';
import { sendReservationEmail } from '@/lib/email';

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    let query = supabase.from('reservations').select('*');
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setReservations(data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const handleStatusChange = async (id: number, status: Reservation['status']) => {
    setErrorMsg(null);
    const { data: existing } = await supabase.from('reservations').select('*').eq('id', id).single();
    if (!existing) { setErrorMsg('Réservation introuvable'); return; }
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) { setErrorMsg(error.message); return; }
    await loadReservations();
    sendReservationEmail(existing.client_email, status, {
      client_name: existing.client_name,
      client_email: existing.client_email,
      client_phone: existing.client_phone,
      car_name: existing.car_name || undefined,
      start_date: existing.start_date || undefined,
      end_date: existing.end_date || undefined,
      total_eur: existing.total_eur || undefined,
      location: existing.location || undefined,
      message: existing.message || undefined,
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="font-poppins text-xl sm:text-2xl font-bold text-remons-dark">Réservations</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
          className="border border-remons-border rounded-xl px-4 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-remons-primary self-start sm:self-auto"
        >
          <option value="all">Tous les statuts</option>
          <option value="new">Nouveau</option>
          <option value="contacted">Contacté</option>
          <option value="confirmed">Confirmé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-inter">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card p-4">
        <ReservationTable
          reservations={reservations}
          loading={loading}
          onStatusChange={handleStatusChange}
          emptyMessage="Aucune réservation trouvée"
        />
      </div>
    </div>
  );
}
