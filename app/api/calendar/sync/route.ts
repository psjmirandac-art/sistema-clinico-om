import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apptId, profId, patientName, startTime, endTime } = body;

    // 1. Validación estricta del payload entrante
    if (!apptId || !profId || !patientName || !startTime || !endTime) {
      return NextResponse.json({ error: 'Datos de agendamiento incompletos' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // CRÍTICO: Usar Service Role Key en backend para bypasear RLS con seguridad
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API Error: Faltan credenciales de Supabase en el servidor');
      return NextResponse.json({ error: 'Configuración interna del servidor incompleta' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 2. Buscar al profesional y su llave de Google
    const { data: prof, error: profError } = await supabase
      .from('professionals')
      .select('google_refresh_token')
      .eq('id', profId)
      .single();
    
    if (profError || !prof || !prof.google_refresh_token) {
      console.warn(`Sincronización omitida: Profesional ${profId} no tiene Google Calendar vinculado.`);
      return NextResponse.json({ error: 'El profesional no ha vinculado su cuenta de Google Calendar' }, { status: 400 });
    }

    // 3. Canjear llave por acceso temporal a Google
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
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('API Error: Rechazo de token por Google', tokenData);
      return NextResponse.json({ error: 'Fallo de autenticación con el proveedor de calendario' }, { status: 401 });
    }

    // 4. Crear el evento en Calendar + Enlace de Google Meet
    const event = {
      summary: `Sesión Clínica: ${patientName}`,
      description: `Cita agendada automáticamente desde el portal de Centro OM.\nModalidad: Telemedicina / Online.`,
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
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const eventData = await eventResponse.json();

    if (!eventResponse.ok) {
      console.error('API Error: Fallo al crear evento en Google Calendar', eventData);
      return NextResponse.json({ error: 'No se pudo crear el evento en el calendario' }, { status: 500 });
    }

    const meetLink = eventData.hangoutLink;

    // 5. Guardar el enlace secreto de Meet en nuestra base de datos
    if (meetLink) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ meet_link: meetLink })
        .eq('id', apptId);
        
      if (updateError) {
        console.error('API Error: No se pudo guardar el link de Meet en BD', updateError.message);
        // Retornamos success de todos modos porque el evento SÍ se creó, 
        // pero enviamos una advertencia en la consola.
      }
    }

    return NextResponse.json({ success: true, meetLink });
  } catch (error: any) {
    console.error('Excepción no controlada en Sync Route:', error?.message);
    return NextResponse.json({ error: 'Error interno de sincronización' }, { status: 500 });
  }
}