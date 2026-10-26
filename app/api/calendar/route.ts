import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'google-credentials.json'),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    if (body.action === 'check') {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: body.timeMin, 
          timeMax: body.timeMax,
          timeZone: 'America/Santiago',
          items: [{ id: calendarId }],
        }
      });
      return NextResponse.json(response.data.calendars?.[calendarId || '']?.busy || []);
    }

    if (body.action === 'create') {
      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: {
          summary: `${body.service} con ${body.professional} - Paciente: ${body.name}`,
          description: `Teléfono: ${body.phone}\nMotivo: ${body.reason}`,
          start: { dateTime: body.start, timeZone: 'America/Santiago' },
          end: { dateTime: body.end, timeZone: 'America/Santiago' },
        }
      });
      return NextResponse.json({ success: true, link: response.data.htmlLink });
    }

    // NUEVO: Modificado para traer las citas desde el día 1 del mes actual
    if (body.action === 'list') {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: firstDayOfMonth.toISOString(), 
        maxResults: 100, // Aumentamos el límite para ver el mes completo
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Santiago'
      });
      return NextResponse.json({ events: response.data.items });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });

  } catch (error) {
    console.error('Error interno del servidor:', error);
    return NextResponse.json({ error: 'Error comunicándose con Google' }, { status: 500 });
  }
}