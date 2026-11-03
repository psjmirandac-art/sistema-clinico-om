import { NextResponse } from 'next/server';

function generateUniqueMeetRoom(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const pick = (len: number) =>
    Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
}

function safeString(val: unknown, fallback: string): string {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  return fallback;
}

function safeNumber(val: unknown, fallback: number): number {
  const parsed = Number(val);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const accessToken = safeString(body?.accessToken, '');
    const summary = safeString(body?.summary, 'Sesión Clínica');
    const description = safeString(body?.description, 'Atención psicológica');
    const isoDate = safeString(body?.isoDate, '2026-11-03');
    const time = safeString(body?.time, '10:00');
    const durationMinutes = safeNumber(body?.durationMinutes, 50);
    const patientEmail = safeString(body?.patientEmail, '');
    const professionalEmail = safeString(body?.professionalEmail, '');
    const modality = safeString(body?.modality, 'Online');
    const locationAddress = safeString(body?.locationAddress, '');

    const startDateTime = `${isoDate}T${time}:00`;
    const timeParts = time.split(':');
    const rawH = parseInt(timeParts[0] ?? '10', 10);
    const rawM = parseInt(timeParts[1] ?? '0', 10);

    const startH = Number.isNaN(rawH) ? 10 : rawH;
    const startM = Number.isNaN(rawM) ? 0 : rawM;

    const totalMinutes = startH * 60 + startM + durationMinutes;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    const endDateTime = `${isoDate}T${endH}:${endM}:00`;

    if (accessToken.length > 10) {
      const attendees: Array<{ email: string }> = [];
      if (patientEmail.length > 0) {
        attendees.push({ email: patientEmail });
      }
      if (professionalEmail.length > 0) {
        attendees.push({ email: professionalEmail });
      }

      const googlePayload: Record<string, unknown> = {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Santiago',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Santiago',
        },
        attendees,
      };

      if (modality === 'Online') {
        googlePayload.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      } else if (locationAddress.length > 0) {
        googlePayload.location = locationAddress;
      }

      const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googlePayload),
        }
      );

      if (calRes.ok) {
        const calData = await calRes.json();
        const videoEntry = Array.isArray(calData?.conferenceData?.entryPoints)
          ? calData.conferenceData.entryPoints.find(
              (ep: { entryPointType?: string; uri?: string }) =>
                ep?.entryPointType === 'video'
            )
          : undefined;

        const officialMeetUrl = safeString(
          calData?.hangoutLink ?? videoEntry?.uri,
          generateUniqueMeetRoom()
        );

        return NextResponse.json({
          success: true,
          syncedWithGoogleApi: true,
          eventId: safeString(calData?.id, ''),
          meetUrl: modality === 'Online' ? officialMeetUrl : '',
          htmlLink: safeString(calData?.htmlLink, ''),
        });
      }
    }

    const fallbackMeetUrl = modality === 'Online' ? generateUniqueMeetRoom() : '';

    return NextResponse.json({
      success: true,
      syncedWithGoogleApi: false,
      meetUrl: fallbackMeetUrl,
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : 'Fallback Meet generado';
    return NextResponse.json({
      success: true,
      syncedWithGoogleApi: false,
      meetUrl: generateUniqueMeetRoom(),
      warning: errMsg,
    });
  }
}