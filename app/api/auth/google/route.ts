import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const profId = searchParams.get('state'); 

  if (!code || !profId) {
    return NextResponse.redirect(new URL('/admin?error=Faltan_datos', request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Obtener la URL base de forma dinámica para producción y desarrollo
    const host = request.headers.get('host') || 'sistema-clinico-om-hbva.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      console.error('Faltan credenciales de Google OAuth en las variables de entorno.');
      return NextResponse.redirect(new URL('/admin?error=Configuracion_incompleta', request.url));
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Error al intercambiar el código por tokens de Google:', tokenData);
      return NextResponse.redirect(new URL('/admin?error=Fallo_token_google', request.url));
    }

    if (tokenData.refresh_token) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          auth: { persistSession: false }
        }
      );

      const { error: dbError } = await supabase
        .from('professionals')
        .update({ google_refresh_token: tokenData.refresh_token })
        .eq('id', profId);

      if (dbError) {
        console.error('Error guardando refresh token en Supabase:', dbError.message);
        return NextResponse.redirect(new URL('/admin?error=Fallo_guardar_token', request.url));
      }
    } else {
      console.warn('Google no retornó un nuevo refresh_token (es posible que ya estuviera vinculado previamente).');
    }

    return NextResponse.redirect(new URL('/admin?google_linked=true', request.url));
  } catch (error: any) {
    console.error('Excepción crítica en callback de Google OAuth:', error?.message || error);
    return NextResponse.redirect(new URL('/admin?error=Fallo_vinculacion', request.url));
  }
}