import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = ['CAT A', 'CAT B', 'CAT C', 'CAT D'] as const;
export type CarCategory = typeof CATEGORIES[number];
export { CATEGORIES };

export type Car = {
  id: number;
  name: string;
  category: CarCategory;
  price: number;
  duration: string;
  seats: number;
  transmission: string;
  doors: number;
  fuel: string;
  image: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Tariff = {
  id: number;
  category: CarCategory;
  min_days: number;
  max_days: number;
  normal_rate: number;
  haute_rate: number;
  updated_at: string;
};

export type Reservation = {
  id: number;
  name: string;
  email: string;
  phone: string;
  car_name: string;
  car_category: string;
  car_price: number;
  car_duration: string;
  start_date: string;
  end_date: string;
  location: string;
  transport_eur: number;
  season: string;
  duration_days: number;
  daily_rate_eur: number;
  rental_total_eur: number;
  total_eur: number;
  status: 'new' | 'contacted' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type TransportPrice = {
  id: number;
  from_location: string;
  to_location: string;
  price_eur: number;
  updated_at: string;
};

export type Setting = {
  key: string;
  value: string;
  updated_at: string;
};

export type Franchise = {
  id: number;
  category: CarCategory;
  amount_eur: number;
  updated_at: string;
};

