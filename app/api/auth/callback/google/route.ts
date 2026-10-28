import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const profId = searchParams.get('state'); 

  if (!code || !profId) return NextResponse.redirect(new URL('/admin?error=Faltan_datos', request.url));

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: 'https://sistema-clinico-om-hbva.vercel.app/api/auth/callback/google',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.refresh_token) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      await supabase
        .from('professionals')
        .update({ google_refresh_token: tokenData.refresh_token })
        .eq('id', profId);
    }

    return NextResponse.redirect(new URL('/admin?google_linked=true', request.url));
  } catch (error: any) {
    return NextResponse.redirect(new URL('/admin?error=Fallo_vinculacion', request.url));
  }
}