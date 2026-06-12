import { useEffect, useState } from 'react';
import { supabase, CATEGORIES } from '@/lib/supabase';
import { Save, Mail, Send } from 'lucide-react';
import { sendTestEmail } from '@/lib/email';
import { useCurrency, convertPrice } from '@/lib/currency';

interface FranchiseRow {
  category: string;
  amount_eur: number;
}

export default function ConfigSection() {
  const [hauteStart, setHauteStart] = useState('07-01');
  const [hauteEnd, setHauteEnd] = useState('08-25');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('AliCar');
  const [defaultCurrency, setDefaultCurrency] = useState('EUR');
  const { currency } = useCurrency();
  const [franchises, setFranchises] = useState<FranchiseRow[]>(
    CATEGORIES.map(c => ({ category: c, amount_eur: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  useEffect(() => {
    Promise.all([
      supabase.from('settings').select('*'),
      supabase.from('franchises').select('*'),
    ]).then(([settingsRes, franchisesRes]) => {
      if (settingsRes.data) {
        const s = settingsRes.data;
        const get = (key: string) => s.find((x: { key: string }) => x.key === key)?.value;
        setHauteStart(get('haute_saison_start') ?? '07-01');
        setHauteEnd(get('haute_saison_end') ?? '08-25');
        setSmtpHost(get('smtp_host') ?? 'smtp.gmail.com');
        setSmtpPort(get('smtp_port') ?? '587');
        setSmtpEmail(get('smtp_email') ?? '');
        setSmtpPassword(get('smtp_password') ?? '');
        setSmtpFromName(get('smtp_from_name') ?? 'AliCar');
        setDefaultCurrency(get('default_currency') ?? 'EUR');
      }
      if (franchisesRes.data) {
        const f = franchisesRes.data;
        setFranchises(
          CATEGORIES.map(c => ({
            category: c,
            amount_eur: f.find((x: { category: string }) => x.category === c)?.amount_eur ?? 0,
          }))
        );
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setErrorMsg(null);
    setSaved(false);

    const { error: settingsError } = await supabase.from('settings').upsert([
      { key: 'haute_saison_start', value: hauteStart },
      { key: 'haute_saison_end', value: hauteEnd },
      { key: 'smtp_host', value: smtpHost },
      { key: 'smtp_port', value: smtpPort },
      { key: 'smtp_email', value: smtpEmail },
      { key: 'smtp_password', value: smtpPassword },
      { key: 'smtp_from_name', value: smtpFromName },
      { key: 'default_currency', value: defaultCurrency },
    ], { ignoreDuplicates: false });

    if (settingsError) { setErrorMsg(settingsError.message); return; }

    for (const f of franchises) {
      const { error } = await supabase.from('franchises').upsert(
        { category: f.category, amount_eur: f.amount_eur },
        { onConflict: 'category', ignoreDuplicates: false }
      );
      if (error) { setErrorMsg(error.message); return; }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-remons-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Season dates */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-poppins text-base font-semibold text-remons-dark mb-4">
          Périodes tarifaires
        </h3>
        <p className="text-xs text-remons-gray font-inter mb-4">
          Définissez les dates de début et fin de la haute saison.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Début haute saison</label>
            <input type="text" value={hauteStart} onChange={(e) => setHauteStart(e.target.value)} placeholder="MM-JJ" className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Fin haute saison</label>
            <input type="text" value={hauteEnd} onChange={(e) => setHauteEnd(e.target.value)} placeholder="MM-JJ" className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
        </div>
      </div>

      {/* Franchises */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-poppins text-base font-semibold text-remons-dark mb-4">Franchises assurance</h3>
        <p className="text-xs text-remons-gray font-inter mb-4">
          Montants de franchise par catégorie (en EUR). Affichés en {currency.label} ({currency.symbol}).
        </p>
        <div className="space-y-3">
          {franchises.map((f) => (
            <div key={f.category} className="grid grid-cols-2 gap-4 items-center">
              <span className="text-sm font-inter font-medium text-remons-dark">{f.category}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 flex items-center justify-between border border-remons-border rounded-xl px-4 py-2 text-sm font-inter">
                  <span className="text-remons-dark">{convertPrice(f.amount_eur, currency.code)}</span>
                  <span className="text-remons-gray">{currency.symbol}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Devise par défaut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-poppins text-base font-semibold text-remons-dark mb-4">Devise par défaut</h3>
        <p className="text-xs text-remons-gray font-inter mb-4">
          Devise utilisée par défaut sur le site. Le client peut la changer depuis la page d'accueil.
        </p>
        <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}
          className="w-full max-w-xs border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary bg-white"
        >
          <option value="EUR">Euro (€)</option>
          <option value="USD">Dollar ($)</option>
          <option value="MAD">Dirham (Dhs)</option>
        </select>
      </div>

      {/* SMTP Gmail */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-remons-primary" />
          <h3 className="font-poppins text-base font-semibold text-remons-dark">Email automatique (Gmail SMTP)</h3>
        </div>
        <p className="text-xs text-remons-gray font-inter mb-4">
          Configuration pour l'envoi d'emails automatiques aux clients lors des réservations et changements de statut.
          Utilisez un <strong>mot de passe d'application</strong> Gmail (pas votre mot de passe personnel).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Serveur SMTP</label>
            <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Port</label>
            <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Adresse Gmail</label>
            <input type="email" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} placeholder="votre@gmail.com" className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Mot de passe d'application</label>
            <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="16 caractères" className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1">Nom de l'expéditeur</label>
            <input type="text" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} className="w-full border border-remons-border rounded-xl px-4 py-2.5 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary" />
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
            placeholder="adresse@test.com"
            className="w-full sm:flex-1 border border-remons-border rounded-xl px-4 py-2 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
          />
          <div className="flex items-center gap-3">
            <button onClick={async () => {
              setTestStatus('sending');
              const result = await sendTestEmail(testEmail);
              setTestStatus(result.ok ? 'ok' : 'error');
              if (!result.ok) setErrorMsg(result.error || 'Test échoué');
              setTimeout(() => setTestStatus('idle'), 3000);
            }} disabled={testStatus === 'sending' || !testEmail}
              className="flex items-center gap-2 bg-remons-primary text-white font-poppins text-sm font-medium px-4 py-2 rounded-xl hover:bg-remons-primary-dark transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {testStatus === 'sending' ? 'Envoi...' : 'Test SMTP'}
            </button>
            {testStatus === 'ok' && <span className="text-sm text-green-600 font-inter">✓</span>}
            {testStatus === 'error' && <span className="text-sm text-remons-primary font-inter">✗</span>}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-remons-primary font-inter">{errorMsg}</div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 bg-remons-primary text-white font-poppins text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-remons-primary-dark transition-colors">
          <Save size={16} />
          Enregistrer
        </button>
        {saved && <span className="text-sm text-green-600 font-inter">✓ Configuration enregistrée</span>}
      </div>
    </div>
  );
}
