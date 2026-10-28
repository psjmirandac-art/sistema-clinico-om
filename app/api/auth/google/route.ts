import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profId = searchParams.get('profId');

  if (!profId) return NextResponse.json({ error: 'Falta ID del profesional' }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = 'https://sistema-clinico-om-hbva.vercel.app/api/auth/callback/google';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent&state=${profId}`;

  return NextResponse.redirect(authUrl);
}