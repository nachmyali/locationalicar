import { useCurrency, convertPrice } from '@/lib/currency';
import type { Reservation } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

interface ReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onStatusChange: (id: number, status: Reservation['status']) => void;
  onDelete: (id: number) => void;
  emptyMessage?: string;
}

const STATUS_LABELS: Record<Reservation['status'], string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<Reservation['status'], string> = {
  new: 'bg-blue-50 text-blue-600',
  contacted: 'bg-yellow-50 text-yellow-600',
  confirmed: 'bg-green-50 text-green-600',
  cancelled: 'bg-remons-primary/10 text-remons-primary',
};

export default function ReservationTable({ reservations, loading, onStatusChange, onDelete, emptyMessage }: ReservationTableProps) {
  const { currency } = useCurrency();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-remons-primary" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-remons-gray font-inter text-sm">{emptyMessage || 'Aucune réservation'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-inter">
        <thead>
          <tr className="border-b border-remons-border">
            <th className="text-left py-3 px-3 font-semibold text-remons-dark">Date</th>
            <th className="text-left py-3 px-3 font-semibold text-remons-dark">Client</th>
            <th className="text-left py-3 px-3 font-semibold text-remons-dark">Voiture</th>
            <th className="text-left py-3 px-3 font-semibold text-remons-dark">Du</th>
            <th className="text-left py-3 px-3 font-semibold text-remons-dark">Au</th>
            <th className="text-right py-3 px-3 font-semibold text-remons-dark">Total</th>
            <th className="text-center py-3 px-3 font-semibold text-remons-dark">Statut</th>
            <th className="text-center py-3 px-3 font-semibold text-remons-dark">Action</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((res) => (
            <tr key={res.id} className="border-b border-remons-border hover:bg-gray-50 transition-colors">
              <td className="py-3 px-3 text-remons-gray whitespace-nowrap">
                {new Date(res.created_at).toLocaleDateString('fr-FR')}
              </td>
              <td className="py-3 px-3">
                <div className="font-medium text-remons-dark">{res.name}</div>
                <div className="text-remons-gray text-xs">{res.email}</div>
                <div className="text-remons-gray text-xs">{res.phone}</div>
              </td>
              <td className="py-3 px-3 text-remons-dark whitespace-nowrap">
                {res.car_name}
                <span className="text-remons-gray text-xs ml-1">({res.car_category})</span>
              </td>
              <td className="py-3 px-3 text-remons-gray whitespace-nowrap">
                {new Date(res.start_date).toLocaleDateString('fr-FR')}
              </td>
              <td className="py-3 px-3 text-remons-gray whitespace-nowrap">
                {new Date(res.end_date).toLocaleDateString('fr-FR')}
              </td>
              <td className="py-3 px-3 text-right font-medium text-remons-dark whitespace-nowrap">
                {convertPrice(res.total_eur, currency.code)} {currency.symbol}
              </td>
              <td className="py-3 px-3 text-center whitespace-nowrap">
                <select
                  value={res.status}
                  onChange={(e) => onStatusChange(res.id, e.target.value as Reservation['status'])}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[res.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-3 text-center whitespace-nowrap">
                <button
                  onClick={() => onDelete(res.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
