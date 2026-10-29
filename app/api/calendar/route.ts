import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Validación estricta de credenciales en el entorno Serverless
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !calendarId) {
      console.error('API Error: Faltan credenciales de Google Service Account en Vercel.');
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 });
    }

    // Formateo obligatorio de la llave privada para entornos de Vercel
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ACCIÓN: Consultar disponibilidad
    if (body.action === 'check') {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: body.timeMin, 
          timeMax: body.timeMax,
          timeZone: 'America/Santiago',
          items: [{ id: calendarId }],
        }
      });
      return NextResponse.json(response.data.calendars?.[calendarId]?.busy || []);
    }

    // ACCIÓN: Crear nueva cita
    if (body.action === 'create') {
      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: {
          summary: `${body.service} con ${body.professional} | Paciente: ${body.name}`,
          description: `Teléfono: ${body.phone}\nMotivo: ${body.reason}`,
          start: { dateTime: body.start, timeZone: 'America/Santiago' },
          end: { dateTime: body.end, timeZone: 'America/Santiago' },
        }
      });
      return NextResponse.json({ success: true, link: response.data.htmlLink });
    }

    // ACCIÓN: Listar citas del mes
    if (body.action === 'list') {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: firstDayOfMonth.toISOString(), 
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Santiago'
      });
      return NextResponse.json({ events: response.data.items || [] });
    }

    return NextResponse.json({ error: 'Acción de calendario no reconocida' }, { status: 400 });

  } catch (error: any) {
    console.error('Error interno del servidor (Google API):', error?.message);
    return NextResponse.json({ error: 'Fallo al comunicarse con Google Calendar' }, { status: 500 });
  }
}