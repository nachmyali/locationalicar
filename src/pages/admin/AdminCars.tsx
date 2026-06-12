import { useState } from 'react';
import { Car, Receipt, MapPin, Settings2 } from 'lucide-react';
import CarsSection from './cars/CarsSection';
import TariffsSection from './cars/TariffsSection';
import TransportSection from './cars/TransportSection';
import ConfigSection from './cars/ConfigSection';

const TABS = [
  { id: 'cars', label: 'Voitures', icon: Car },
  { id: 'tariffs', label: 'Tarifs', icon: Receipt },
  { id: 'transport', label: 'Transport', icon: MapPin },
  { id: 'config', label: 'Configuration', icon: Settings2 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminCars() {
  const [tab, setTab] = useState<TabId>('cars');

  return (
    <div>
      <h1 className="font-poppins text-xl sm:text-2xl font-bold text-remons-dark mb-6">
        Gestion des véhicules
      </h1>

      <div className="flex gap-1 mb-6 border-b border-remons-border overflow-x-auto flex-nowrap scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-inter font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === id
                ? 'border-remons-primary text-remons-primary'
                : 'border-transparent text-remons-gray hover:text-remons-dark'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'cars' && <CarsSection />}
      {tab === 'tariffs' && <TariffsSection />}
      {tab === 'transport' && <TransportSection />}
      {tab === 'config' && <ConfigSection />}
    </div>
  );
}
