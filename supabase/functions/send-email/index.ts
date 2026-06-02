import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as nodemailer from 'https://esm.sh/nodemailer@6.9.16';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface SettingsRow {
  key: string;
  value: string;
}

async function getSettings(supabase: ReturnType<typeof createClient>): Promise<Record<string, string>> {
  const { data } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  if (data) {
    for (const row of data as SettingsRow[]) {
      map[row.key] = row.value;
    }
  }
  return map;
}

function buildTransport(smtp: Record<string, string>) {
  return nodemailer.createTransport({
    host: smtp.smtp_host || 'smtp.gmail.com',
    port: parseInt(smtp.smtp_port || '587', 10),
    secure: (smtp.smtp_port || '587') === '465',
    auth: {
      user: smtp.smtp_email,
      pass: smtp.smtp_password,
    },
  });
}

function buildReservationEmail(
  status: string,
  data: {
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    car_name?: string;
    start_date?: string;
    end_date?: string;
    total_eur?: number;
    location?: string;
    message?: string;
  },
  fromName: string,
) {
  const statusLabels: Record<string, string> = {
    new: 'Nouvelle',
    contacted: 'Contact\u00e9',
    confirmed: 'Confirm\u00e9e',
    cancelled: 'Annul\u00e9e',
    completed: 'Termin\u00e9e',
  };

  const statusColors: Record<string, string> = {
    new: '#DC2626',
    contacted: '#F59E0B',
    confirmed: '#16A34A',
    cancelled: '#6B7280',
    completed: '#2563EB',
  };

  const statusIcons: Record<string, string> = {
    new: '\u{1F534}',
    contacted: '\u23F3',
    confirmed: '\u2705',
    cancelled: '\u274C',
    completed: '\u2705',
  };

  const label = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#DC2626';
  const statusIcon = statusIcons[status] || '';

  const isNew = status === 'new';
  const greeting = isNew
    ? `Bonjour <strong>${fromName}</strong>, une nouvelle r\u00e9servation vient d\u2019\u00eatre effectu\u00e9e par <strong>${data.client_name || 'un client'}</strong>.`
    : `Bonjour <strong>${data.client_name || 'Client'}</strong>, le statut de votre r\u00e9servation a \u00e9t\u00e9 mis \u00e0 jour.`;

  const greetingSub = isNew
    ? 'Vous trouverez ci-dessous les d\u00e9tails de la r\u00e9servation.'
    : 'Voici un r\u00e9capitulatif de votre r\u00e9servation mise \u00e0 jour.';

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const detailRows: string[] = [];
  if (data.car_name) detailRows.push(`
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #F3F4F6;">
        <span style="display: block; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">V\u00e9hicule</span>
        <span style="color: #111827; font-size: 15px; font-weight: 600;">${data.car_name}</span>
      </td>
    </tr>`);
  if (data.start_date) detailRows.push(`
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #F3F4F6;">
        <span style="display: block; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">D\u00e9but</span>
        <span style="color: #111827; font-size: 15px; font-weight: 600;">${formatDate(data.start_date)}</span>
      </td>
    </tr>`);
  if (data.end_date) detailRows.push(`
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #F3F4F6;">
        <span style="display: block; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Fin</span>
        <span style="color: #111827; font-size: 15px; font-weight: 600;">${formatDate(data.end_date)}</span>
      </td>
    </tr>`);
  if (data.location) detailRows.push(`
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #F3F4F6;">
        <span style="display: block; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Lieu</span>
        <span style="color: #111827; font-size: 15px; font-weight: 600;">${data.location}</span>
      </td>
    </tr>`);
  if (data.total_eur !== undefined) detailRows.push(`
    <tr>
      <td style="padding: 14px 20px; background-color: #FEF2F2;">
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="font-size: 14px; color: #111827; font-weight: 600;">Total</td>
            <td style="text-align: right; font-size: 18px; font-weight: 700; color: #DC2626;">${data.total_eur.toFixed(2)} \u20ac</td>
          </tr>
        </table>
      </td>
    </tr>`);

  const clientRows: string[] = [];
  if (data.client_name) clientRows.push(`
    <tr>
      <td style="padding: 4px 0; color: #374151; font-size: 13px;"><strong>Nom :</strong></td>
      <td style="padding: 4px 0 4px 12px; color: #111827; font-size: 13px;">${data.client_name}</td>
    </tr>`);
  if (data.client_email) clientRows.push(`
    <tr>
      <td style="padding: 4px 0; color: #374151; font-size: 13px;"><strong>Email :</strong></td>
      <td style="padding: 4px 0 4px 12px; color: #111827; font-size: 13px;"><a href="mailto:${data.client_email}" style="color: #DC2626; text-decoration: none;">${data.client_email}</a></td>
    </tr>`);
  if (data.client_phone) clientRows.push(`
    <tr>
      <td style="padding: 4px 0; color: #374151; font-size: 13px;"><strong>T\u00e9l :</strong></td>
      <td style="padding: 4px 0 4px 12px; color: #111827; font-size: 13px;"><a href="tel:${data.client_phone}" style="color: #111827; text-decoration: none;">${data.client_phone}</a></td>
    </tr>`);

  const html = `
    <div style="background-color: #F3F4F6; padding: 24px 16px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
      <table align="center" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 36px 32px 28px; text-align: center;">
            <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: 1px;">${fromName}</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; letter-spacing: 0.3px;">Location de v\u00e9hicules \u2022 Marrakech</p>
          </td>
        </tr>

        <!-- Status badge + greeting -->
        <tr>
          <td style="padding: 32px 32px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="display: inline-block; background-color: ${statusColor}12; color: ${statusColor}; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; letter-spacing: 0.5px;">
                ${statusIcon} ${label}
              </span>
            </div>
            <p style="margin: 0 0 4px; color: #111827; font-size: 16px; line-height: 1.6; text-align: center;">${greeting}</p>
            <p style="margin: 0 0 24px; color: #6B7280; font-size: 14px; line-height: 1.5; text-align: center;">${greetingSub}</p>
          </td>
        </tr>

        <!-- Details table -->
        <tr>
          <td style="padding: 0 32px;">
            <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB;">
              ${detailRows.join('')}
            </table>
          </td>
        </tr>

        <!-- Client message -->
        ${data.message ? `
        <tr>
          <td style="padding: 16px 32px 0;">
            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 0 10px 10px 0;">
              <p style="margin: 0 0 4px; color: #92400E; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message du client</p>
              <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">${data.message}</p>
            </div>
          </td>
        </tr>` : ''}

        <!-- Client contact -->
        <tr>
          <td style="padding: 24px 32px 32px;">
            <div style="background-color: #F9FAFB; border-radius: 12px; padding: 20px; border: 1px solid #E5E7EB;">
              <p style="margin: 0 0 12px; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Coordonn\u00e9es client</p>
              <table cellpadding="0" cellspacing="0">
                ${clientRows.join('')}
              </table>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #111827; padding: 24px 32px; text-align: center;">
            <p style="margin: 0; color: #9CA3AF; font-size: 13px; font-weight: 600;">${fromName}</p>
            <p style="margin: 4px 0 0; color: #6B7280; font-size: 12px;">Location de v\u00e9hicules \u2014 Marrakech, Maroc</p>
            <div style="height: 1px; background-color: #374151; margin: 16px auto; max-width: 200px;"></div>
            <p style="margin: 0; color: #6B7280; font-size: 11px;">Cet email est automatique, merci de ne pas y r\u00e9pondre.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { subject: `R\u00e9servation ${label} \u2014 ${fromName}`, html };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), { status: 500, headers: CORS_HEADERS });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const settings = await getSettings(supabase);
    const fromName = settings.smtp_from_name || 'INVOLOCATION';
    const smtpEmail = settings.smtp_email;

    const { type, to, status, data } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing "to" recipient' }), { status: 400, headers: CORS_HEADERS });
    }

    if (!smtpEmail || !settings.smtp_password) {
      return new Response(
        JSON.stringify({ error: 'SMTP non configur\u00e9. Renseignez les param\u00e8tres email dans Configuration.' }),
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const transporter = buildTransport(settings);

    let subject: string;
    let html: string;

    if (type === 'test') {
      subject = `Test \u2014 ${fromName}`;
      html = `
        <div style="background-color: #F3F4F6; padding: 24px 16px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
          <table align="center" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
            <tr>
              <td style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 36px 32px 28px; text-align: center;">
                <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: 1px;">${fromName}</h1>
                <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; letter-spacing: 0.3px;">Location de v\u00e9hicules \u2022 Marrakech</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 48px 32px; text-align: center;">
                <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #16A34A, #22C55E); border-radius: 50%; display: inline-block; line-height: 72px; font-size: 32px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(22,163,74,0.25);">\u2705</div>
                <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">Configuration r\u00e9ussie</h2>
                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.7; max-width: 360px; margin: 0 auto;">Si vous recevez ce message, la configuration SMTP de <strong>${fromName}</strong> est correcte et pleinement fonctionnelle.</p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #111827; padding: 24px 32px; text-align: center;">
                <p style="margin: 0; color: #9CA3AF; font-size: 12px; font-weight: 600;">${fromName}</p>
                <p style="margin: 4px 0 0; color: #6B7280; font-size: 11px;">Location de v\u00e9hicules \u2014 Marrakech, Maroc</p>
              </td>
            </tr>
          </table>
        </div>`;
    } else if (type === 'reservation_status') {
      const emailData = buildReservationEmail(status || '', data || {}, fromName);
      subject = emailData.subject;
      html = emailData.html;
    } else {
      return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: CORS_HEADERS });
    }

    const info = await transporter.sendMail({
      from: `"${fromName}" <${smtpEmail}>`,
      to,
      subject,
      html,
    });

    return new Response(JSON.stringify({ ok: true, messageId: info.messageId }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: CORS_HEADERS });
  }
});
