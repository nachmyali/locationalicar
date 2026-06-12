const SUPABASE_EDGE_URL = 'https://suvsudggaozxqtsxqwxq.supabase.co/functions/v1/send-email';
const DEV_PROXY_URL = '/api/send-email';

function getEndpoint(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return DEV_PROXY_URL;
  }
  return SUPABASE_EDGE_URL;
}

export async function sendReservationEmail(
  to: string,
  status: string,
  data: {
    client_name: string;
    client_email: string;
    client_phone: string;
    car_name?: string;
    start_date?: string;
    end_date?: string;
    total_eur?: number;
    location?: string;
    message?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reservation_status',
        to,
        status,
        data,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `Erreur ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}

export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test', to }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `Erreur ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}
