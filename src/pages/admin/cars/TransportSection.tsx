import { useEffect, useState } from 'react';
import { supabase, type TransportPrice } from '@/lib/supabase';
import { Plus, Edit2, Save, X, Trash2 } from 'lucide-react';
import { useCurrency, currencies, convertPrice, convertToEUR } from '@/lib/currency';

export default function TransportSection() {
  const [prices, setPrices] = useState<TransportPrice[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { currency, setCurrency } = useCurrency();

  async function loadData() {
    const [pricesRes, settingsRes] = await Promise.all([
      supabase.from('transport_prices').select('*'),
      supabase.from('settings').select('value').eq('key', 'default_currency').single(),
    ]);
    if (pricesRes.data) {
      setPrices(pricesRes.data);
      const all = new Set<string>();
      for (const p of pricesRes.data) {
        all.add(p.from_location);
        all.add(p.to_location);
      }
      setLocations(Array.from(all).sort());
    }
    if (settingsRes.data?.value) {
      const found = currencies.find(c => c.code === settingsRes.data.value);
      if (found && found.code !== currency.code) {
        setCurrency(found);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    setErrorMsg(null);
    if (!newFrom || !newTo || newFrom === newTo) return;
    const priceEUR = currency.code === 'EUR' ? newPrice : convertToEUR(newPrice, currency.code);
    const exists = prices.find(p => p.from_location === newFrom && p.to_location === newTo);
    const { error } = exists
      ? await supabase.from('transport_prices').update({ price_eur: priceEUR }).eq('id', exists.id)
      : await supabase.from('transport_prices').insert({ from_location: newFrom, to_location: newTo, price_eur: priceEUR });
    if (error) { setErrorMsg(error.message); return; }
    setShowNew(false);
    setNewFrom(''); setNewTo(''); setNewPrice(0);
    await loadData();
  };

  const handleUpdate = async (p: TransportPrice) => {
    setErrorMsg(null);
    const priceEUR = currency.code === 'EUR' ? editValue : convertToEUR(editValue, currency.code);
    const { error } = await supabase.from('transport_prices').update({ price_eur: priceEUR }).eq('id', p.id);
    if (error) { setErrorMsg(error.message); return; }
    setEditingId(null);
    await loadData();
  };

  const handleDelete = async (id: number) => {
    setErrorMsg(null);
    const { error } = await supabase.from('transport_prices').delete().eq('id', id);
    if (error) { setErrorMsg(error.message); return; }
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-remons-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-remons-gray font-inter">
          {prices.length} trajets configurés sur {locations.length} villes différentes.
        </p>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 bg-remons-primary text-white font-poppins text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-remons-primary-dark transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          {showNew ? 'Annuler' : 'Ajouter un trajet'}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-inter">
          {errorMsg}
        </div>
      )}

      {showNew && (
        <div className="bg-white rounded-2xl shadow-card p-4 mb-4 flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-inter font-medium text-remons-dark mb-1">De</label>
            <input
              type="text" value={newFrom}
              onChange={(e) => setNewFrom(e.target.value)}
              placeholder="Ex: Marrakech Ville"
              className="border border-remons-border rounded-xl px-3 py-2 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-inter font-medium text-remons-dark mb-1">Vers</label>
            <input
              type="text" value={newTo}
              onChange={(e) => setNewTo(e.target.value)}
              placeholder="Ex: Casablanca Aéroport"
              className="border border-remons-border rounded-xl px-3 py-2 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-inter font-medium text-remons-dark mb-1">Prix ({currency.symbol})</label>
            <input
              type="number" min={0} step={0.01} value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-24 border border-remons-border rounded-xl px-3 py-2 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newFrom || !newTo || newFrom === newTo}
            className="bg-remons-primary text-white font-poppins text-sm font-medium px-4 py-2 rounded-xl hover:bg-remons-primary-dark transition-colors disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm font-inter">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-remons-border">
                <th className="text-left py-2.5 px-3 font-semibold text-remons-dark whitespace-nowrap min-w-[140px]">De / Vers</th>
                {locations.map(to => (
                  <th key={to} className="text-right py-2.5 px-2 font-semibold text-remons-dark text-xs whitespace-nowrap">{to}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map(from => (
                <tr key={from} className="border-b border-remons-border hover:bg-gray-50 transition-colors group">
                  <td className="py-2 px-3 font-medium text-remons-dark text-xs whitespace-nowrap">{from}</td>
                  {locations.map(to => {
                    if (to === from) return <td key={to} className="py-2 px-2 text-center text-remons-border">—</td>;
                    const p = prices.find(pr => pr.from_location === from && pr.to_location === to);
                    return (
                      <td key={to} className="py-2 px-2 text-right">
                        {editingId === p?.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number" min={0} step={0.01}
                              value={editValue}
                              onChange={(e) => setEditValue(Number(e.target.value))}
                              className="w-16 text-right border border-remons-border rounded px-1 py-0.5 text-xs font-inter focus:outline-none focus:ring-1 focus:ring-remons-primary"
                              autoFocus
                            />
                            <button onClick={() => p && handleUpdate(p)} className="p-0.5 hover:text-green-500">
                              <Save size={12} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-0.5 hover:text-red-400">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-remons-dark text-xs">{p ? `${convertPrice(p.price_eur, currency.code)}${currency.symbol}` : '—'}</span>
                            {p && (
                              <>
                                <button
                                  onClick={() => { setEditingId(p.id); setEditValue(convertPrice(p.price_eur, currency.code)); }}
                                  className="p-0.5 hover:text-remons-primary opacity-0 group-hover:opacity-100"
                                >
                                  <Edit2 size={10} className="text-remons-gray" />
                                </button>
                                <button onClick={() => handleDelete(p.id)} className="p-0.5 hover:text-red-400">
                                  <Trash2 size={10} className="text-red-300" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
