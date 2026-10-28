import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { apptId, profId, patientName, startTime, endTime } = await request.json();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: 'Faltan credenciales de Supabase' }, { status: 500 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 1. Buscar al profesional y su llave de Google
    const { data: prof, error: profError } = await supabase.from('professionals').select('google_refresh_token').eq('id', profId).single();
    
    if (profError || !prof || !prof.google_refresh_token) {
        return NextResponse.json({ error: 'El profesional no ha vinculado su cuenta de Google Calendar' }, { status: 400 });
    }

    // 2. Canjear llave por acceso temporal a Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: prof.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) { return NextResponse.json({ error: 'Fallo al autenticar con Google' }, { status: 500 }); }

    // 3. Crear el evento en Calendar + Enlace de Google Meet
    const event = {
      summary: `Sesión Clínica: ${patientName}`,
      description: `Cita agendada automáticamente desde el Sistema Clínico OM.\nModalidad: Telemedicina / Online.`,
      start: { dateTime: startTime, timeZone: 'America/Santiago' },
      end: { dateTime: endTime, timeZone: 'America/Santiago' },
      conferenceData: {
        createRequest: { 
            requestId: apptId.toString(), 
            conferenceSolutionKey: { type: 'hangoutsMeet' } 
        }
      }
    };

    const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const eventData = await eventResponse.json();
    const meetLink = eventData.hangoutLink;

    // 4. Guardar el enlace secreto de Meet en nuestra base de datos
    if (meetLink) {
        await supabase.from('appointments').update({ meet_link: meetLink }).eq('id', apptId);
    }

    return NextResponse.json({ success: true, meetLink });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}