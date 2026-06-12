import { useEffect, useState, useRef } from 'react';
import { supabase, type Tariff, CATEGORIES } from '@/lib/supabase';
import { Edit2, Save, X, Download, Upload } from 'lucide-react';
import { useCurrency, currencies, convertPrice, convertToEUR } from '@/lib/currency';
import * as XLSX from 'xlsx';

export default function TariffsSection() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tariff>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { currency, setCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportXlsx = () => {
    const data = tariffs.map(t => ({
      Catégorie: t.category,
      'Durée min (jours)': t.min_days,
      'Durée max (jours)': t.max_days === 999 ? 21 : t.max_days,
      'Prix normal (EUR)': t.normal_rate,
      'Prix haute saison (EUR)': t.haute_rate,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Tarifs');
    XLSX.writeFile(wb, 'tarifs.xlsx');
  };

  const importXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        setErrorMsg(null);
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<{
          Catégorie: string;
          'Durée min (jours)': number;
          'Durée max (jours)': number;
          'Prix normal (EUR)': number;
          'Prix haute saison (EUR)': number;
        }>(ws);

        for (const row of rows) {
          if (!row.Catégorie || row['Durée min (jours)'] == null) continue;
          const existing = tariffs.find(
            t => t.category === row.Catégorie && t.min_days === row['Durée min (jours)']
          );
          if (existing) {
            await supabase.from('tariffs').update({
              normal_rate: row['Prix normal (EUR)'],
              haute_rate: row['Prix haute saison (EUR)'],
              max_days: row['Durée max (jours)'],
            }).eq('id', existing.id);
          }
        }

        const { data } = await supabase.from('tariffs').select('*').order('category').order('min_days');
        if (data) setTariffs(data);
      } catch {
        setErrorMsg('Erreur lors de l\'import du fichier.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  useEffect(() => {
    Promise.all([
      supabase.from('tariffs').select('*').order('category').order('min_days'),
      supabase.from('settings').select('value').eq('key', 'default_currency').single(),
    ]).then(([tariffsRes, settingsRes]) => {
      if (tariffsRes.data) setTariffs(tariffsRes.data);
      if (settingsRes.data?.value) {
        const found = currencies.find(c => c.code === settingsRes.data.value);
        if (found && found.code !== currency.code) {
          setCurrency(found);
        }
      }
      setLoading(false);
    });
  }, []);

  const startEdit = (t: Tariff) => {
    setEditingId(t.id);
    setEditForm({
      normal_rate: convertPrice(t.normal_rate, currency.code),
      haute_rate: convertPrice(t.haute_rate, currency.code),
      min_days: t.min_days,
      max_days: t.max_days,
    });
  };

  const saveEdit = async (t: Tariff) => {
    setErrorMsg(null);
    const { error } = await supabase.from('tariffs').update({
      normal_rate: editForm.normal_rate !== undefined ? convertToEUR(editForm.normal_rate, currency.code) : undefined,
      haute_rate: editForm.haute_rate !== undefined ? convertToEUR(editForm.haute_rate, currency.code) : undefined,
      min_days: editForm.min_days,
      max_days: editForm.max_days,
    }).eq('id', t.id);
    if (error) { setErrorMsg(error.message); return; }
    setEditingId(null);
    const { data } = await supabase.from('tariffs').select('*').order('category').order('min_days');
    if (data) setTariffs(data);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-remons-primary" />
      </div>
    );
  }

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    brackets: tariffs.filter(t => t.category === cat),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-remons-gray font-inter">
          Grille tarifaire par catégorie et durée de location.
          Les prix sont en euros par jour. Affichés en {currency.label} ({currency.symbol}).
        </p>
        <div className="flex gap-2">
          <button onClick={exportXlsx} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-inter font-medium text-white bg-remons-primary rounded-xl hover:opacity-90 transition-opacity">
            <Download size={14} />
            Exporter XLSX
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-inter font-medium text-remons-primary border border-remons-primary rounded-xl hover:bg-remons-light-gray transition-colors">
            <Upload size={14} />
            Importer XLSX
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={importXlsx} className="hidden" />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-remons-primary font-inter">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(({ category, brackets }) => (
          <div key={category} className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-remons-border">
              <h3 className="font-poppins font-semibold text-remons-dark">
                {category}
                <span className="ml-2 text-xs font-inter font-normal text-remons-gray">
                  {brackets.length} tranches
                </span>
              </h3>
            </div>
            <table className="w-full text-sm font-inter">
              <thead>
                <tr className="border-b border-remons-border">
                  <th className="text-left py-2.5 px-4 font-semibold text-remons-dark">Durée</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-remons-dark">Normal ({currency.symbol}/j)</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-remons-dark">Haute saison ({currency.symbol}/j)</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-remons-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((t) => (
                  <tr key={t.id} className="border-b border-remons-border hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4 text-remons-dark font-medium">
                      {t.min_days}-{t.max_days === 999 ? '+21' : t.max_days} jours
                    </td>
                    {editingId === t.id ? (
                      <>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number" min={0} step={0.01}
                            value={editForm.normal_rate ?? t.normal_rate}
                            onChange={(e) => setEditForm({ ...editForm, normal_rate: Number(e.target.value) })}
                            className="w-20 text-right border border-remons-border rounded-lg px-2 py-1 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number" min={0} step={0.01}
                            value={editForm.haute_rate ?? t.haute_rate}
                            onChange={(e) => setEditForm({ ...editForm, haute_rate: Number(e.target.value) })}
                            className="w-20 text-right border border-remons-border rounded-lg px-2 py-1 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => saveEdit(t)} className="p-1.5 rounded-lg hover:bg-green-50 transition-colors">
                              <Save size={14} className="text-green-500" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                              <X size={14} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-4 text-right text-remons-dark">{convertPrice(t.normal_rate, currency.code)} {currency.symbol}</td>
                        <td className="py-2.5 px-4 text-right text-remons-dark">{convertPrice(t.haute_rate, currency.code)} {currency.symbol}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-remons-light-gray transition-colors">
                            <Edit2 size={14} className="text-remons-gray" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
