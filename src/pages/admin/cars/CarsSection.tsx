import { useEffect, useRef, useState, useMemo } from 'react';
import { supabase, type Car, type Tariff } from '@/lib/supabase';
import CarForm from '@/components/admin/CarForm';
import { Plus, Edit2, Trash2, Download, Upload, Sun, Snowflake } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCurrency, currencies, convertPrice } from '@/lib/currency';

const COL_MAP: Record<string, keyof Omit<Car, 'id' | 'created_at' | 'updated_at' | 'image'>> = {
  'Nom': 'name',
  'Catégorie': 'category',
  'Prix': 'price',
  'Durée': 'duration',
  'Places': 'seats',
  'Transmission': 'transmission',
  'Portes': 'doors',
  'Carburant': 'fuel',
  'Active': 'active',
};

const VALID_CATEGORIES = ['CAT A', 'CAT B', 'CAT C', 'CAT D'];

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

export default function CarsSection() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [importing, setImporting] = useState(false);
  const [seasonStart, setSeasonStart] = useState('07-01');
  const [seasonEnd, setSeasonEnd] = useState('08-25');
  const fileRef = useRef<HTMLInputElement>(null);
  const { currency, setCurrency } = useCurrency();

  const isHaute = useMemo(() => isInRange(new Date(), seasonStart, seasonEnd), [seasonStart, seasonEnd]);

  function getTariffPrice(category: string): number {
    const bracket = tariffs.find(t => t.category === category && t.min_days === 1);
    if (!bracket) return 0;
    return isHaute ? bracket.haute_rate : bracket.normal_rate;
  }

  useEffect(() => {
    Promise.all([
      supabase.from('cars').select('*').order('id'),
      supabase.from('tariffs').select('*').order('category').order('min_days'),
      supabase.from('settings').select('key, value'),
    ]).then(([carsRes, tariffsRes, settingsRes]) => {
      if (carsRes.data) setCars(carsRes.data);
      if (tariffsRes.data) setTariffs(tariffsRes.data);
      if (settingsRes.data) {
        const s = settingsRes.data;
        const get = (key: string) => s.find((x: { key: string }) => x.key === key)?.value;
        setSeasonStart(get('haute_saison_start') ?? '07-01');
        setSeasonEnd(get('haute_saison_end') ?? '08-25');
        const defaultCur = get('default_currency');
        if (defaultCur) {
          const found = currencies.find(c => c.code === defaultCur);
          if (found && found.code !== currency.code) {
            setCurrency(found);
          }
        }
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (data: Partial<Car>) => {
    setErrorMsg(null);
    if (editingCar) {
      const { error } = await supabase.from('cars').update(data).eq('id', editingCar.id);
      if (error) { setErrorMsg(error.message); return; }
    } else {
      const { error } = await supabase.from('cars').insert(data);
      if (error) { setErrorMsg(error.message); return; }
    }
    setShowForm(false);
    setEditingCar(null);
    await reload();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette voiture définitivement ?')) return;
    setErrorMsg(null);
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) { setErrorMsg(error.message); return; }
    await reload();
  };

  async function reload() {
    const { data } = await supabase.from('cars').select('*').order('id');
    if (data) setCars(data);
  }

  function handleExport() {
    const rows = cars.map(c => ({
      'Nom': c.name,
      'Catégorie': c.category,
      'Prix': c.price,
      'Durée': c.duration,
      'Places': c.seats,
      'Transmission': c.transmission,
      'Portes': c.doors,
      'Carburant': c.fuel,
      'Image': c.image,
      'Active': c.active ? 'Oui' : 'Non',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voitures');
    XLSX.writeFile(wb, `voitures_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    setImporting(true);

      try {
        const { data: tariffData } = await supabase.from('tariffs').select('category, normal_rate').eq('min_days', 1);
        const tariffMap: Record<string, number> = {};
        if (tariffData) {
          for (const t of tariffData) {
            tariffMap[t.category] = t.normal_rate;
          }
        }

        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

        const errors: string[] = [];
        const valid: Partial<Car>[] = [];

        for (let i = 0; i < raw.length; i++) {
        const row = raw[i];
        const item: Partial<Car> = {};
        const rowNum = i + 2;

        for (const [frCol, enCol] of Object.entries(COL_MAP)) {
          let val = row[frCol];
          if (val === undefined || val === null || val === '') {
            if (enCol === 'name' || enCol === 'category') {
              errors.push(`Ligne ${rowNum} : "${frCol}" est requis`);
            }
            continue;
          }

          if (enCol === 'price' || enCol === 'seats' || enCol === 'doors') {
            val = Number(val);
            if (isNaN(val as number)) {
              errors.push(`Ligne ${rowNum} : "${frCol}" doit être un nombre`);
              continue;
            }
          }

          if (enCol === 'category') {
            const cat = String(val).toUpperCase();
            if (!VALID_CATEGORIES.includes(cat)) {
              errors.push(`Ligne ${rowNum} : Catégorie "${val}" invalide (attendue: ${VALID_CATEGORIES.join(', ')})`);
              continue;
            }
            val = cat;
          }

          if (enCol === 'active') {
            const s = String(val).toLowerCase();
            if (s === 'oui' || s === 'o' || s === 'yes' || s === 'y' || s === '1' || s === 'true') val = true;
            else if (s === 'non' || s === 'n' || s === 'no' || s === '0' || s === 'false') val = false;
            else {
              errors.push(`Ligne ${rowNum} : "${frCol}" doit être Oui/Non`);
              continue;
            }
          }

          (item as Record<string, unknown>)[enCol] = val;
        }

        if (!item.name || !item.category) continue;
        if (item.price === undefined) {
          item.price = tariffMap[item.category];
          if (item.price === undefined) {
            errors.push(`Ligne ${rowNum} : Aucun tarif trouvé pour la catégorie "${item.category}" dans la section Tarifs`);
            continue;
          }
        }
        item.duration ??= 'jour';
        item.seats ??= 5;
        item.transmission ??= 'Manuelle';
        item.doors ??= 4;
        item.fuel ??= 'Essence';
        item.active ??= true;
        item.image ??= '';
        valid.push(item);
      }

      if (errors.length > 0) {
        setImportMsg(`⚠️ ${errors.length} erreur(s) détectée(s) :\n${errors.join('\n')}`);
        setImporting(false);
        return;
      }

      if (valid.length === 0) {
        setImportMsg('Aucune ligne valide à importer.');
        setImporting(false);
        return;
      }

      const { error } = await supabase.from('cars').insert(valid);
      if (error) {
        setImportMsg(`Erreur lors de l'import : ${error.message}`);
      } else {
        setImportMsg(`✅ ${valid.length} voiture(s) importée(s) avec succès !`);
        await reload();
      }
    } catch (err) {
      setImportMsg(`Erreur de lecture du fichier : ${err instanceof Error ? err.message : 'Fichier invalide'}`);
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  }

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
          {cars.filter(c => c.active).length} voitures actives sur {cars.length}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-remons-border text-remons-dark font-poppins text-sm font-medium px-3 sm:px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exporter Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2 border border-remons-border text-remons-dark font-poppins text-sm font-medium px-3 sm:px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {importing ? '...' : <span className="hidden sm:inline">Importer Excel</span>}
            {importing ? '...' : <span className="sm:hidden">Importer</span>}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => { setEditingCar(null); setShowForm(true); setErrorMsg(null); setImportMsg(null); }}
            className="flex items-center gap-2 bg-remons-primary text-white font-poppins text-sm font-medium px-3 sm:px-4 py-2.5 rounded-xl hover:bg-remons-primary-dark transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-inter whitespace-pre-line">
          {importMsg}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h2 className="font-poppins text-lg font-semibold text-remons-dark mb-4">
            {editingCar ? 'Modifier la voiture' : 'Nouvelle voiture'}
          </h2>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-inter">
              {errorMsg}
            </div>
          )}
          <CarForm key={editingCar?.id ?? 'new'} car={editingCar} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingCar(null); setErrorMsg(null); }} />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-inter">
            <thead>
              <tr className="border-b border-remons-border bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-remons-dark">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-remons-dark">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-remons-dark">Catégorie</th>
                <th className="text-right py-3 px-4 font-semibold text-remons-dark">
                  <div className="flex items-center justify-end gap-1.5">
                    {isHaute ? <Sun size={13} className="text-amber-500" /> : <Snowflake size={13} className="text-blue-400" />}
                    <span>Prix</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isHaute ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {isHaute ? 'Haute saison' : 'Saison normale'}
                    </span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-remons-dark">Places</th>
                <th className="text-center py-3 px-4 font-semibold text-remons-dark">Transmission</th>
                <th className="text-center py-3 px-4 font-semibold text-remons-dark">Portes</th>
                <th className="text-center py-3 px-4 font-semibold text-remons-dark">Carburant</th>
                <th className="text-center py-3 px-4 font-semibold text-remons-dark">Active</th>
                <th className="text-right py-3 px-4 font-semibold text-remons-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id} className="border-b border-remons-border hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-remons-gray">{car.id}</td>
                  <td className="py-3 px-4 font-medium text-remons-dark">{car.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-remons-primary/10 text-remons-primary">
                      {car.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-remons-dark font-medium">
                    {convertPrice(getTariffPrice(car.category) || car.price, currency.code)} {currency.symbol}
                    {getTariffPrice(car.category) !== 0 && getTariffPrice(car.category) !== car.price && (
                      <span className="text-[10px] text-remons-gray ml-1">(tarif)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-remons-gray">{car.seats}</td>
                  <td className="py-3 px-4 text-center text-remons-gray">{car.transmission}</td>
                  <td className="py-3 px-4 text-center text-remons-gray">{car.doors}</td>
                  <td className="py-3 px-4 text-center text-remons-gray">{car.fuel}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      car.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {car.active ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingCar(car); setShowForm(true); setErrorMsg(null); }}
                        className="p-1.5 rounded-lg hover:bg-remons-light-gray transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={14} className="text-remons-gray" />
                      </button>
                      <button
                        onClick={() => handleDelete(car.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
