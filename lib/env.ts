export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kairosclinico.cl',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  centerId: process.env.NEXT_PUBLIC_CENTER_ID || '60a9791f-4a2f-423b-8543-aa4eca86ce6f',
  google: {
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'ps.jmirandacabrera@gmail.com',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  groqApiKey: process.env.GROQ_API_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
};

export function validateClientEnv() {
  const missing: string[] = [];
  if (!env.supabase.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!env.supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!env.centerId) missing.push('NEXT_PUBLIC_CENTER_ID');

  if (missing.length > 0 && typeof window !== 'undefined') {
    console.error(`⚠️ [Kairós Config] Faltan variables públicas de entorno: ${missing.join(', ')}`);
  }
}