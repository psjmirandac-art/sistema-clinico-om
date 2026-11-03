import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Sanitizador básico para evitar inyección HTML en el correo
function escapeHtml(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Normalizador estricto a formato Meta E.164 sin '+' (Ej: 56961699991)
function normalizeChileanPhone(rawPhone: string = ''): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 8) return `569${digits}`;
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
  if (digits.length === 11 && digits.startsWith('569')) return digits;
  return digits;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const whatsappToken = process.env.WHATSAPP_TOKEN || '';
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID || '';
  const customTemplate = process.env.WHATSAPP_TEMPLATE_NAME || '';

  try {
    const body = await request.json();
    const {
      patientName,
      patientEmail,
      patientPhone,
      date,
      isoDate,
      time,
      modality = 'Online (Videollamada)',
      professionalName,
      centerName = 'Kairós Clínico',
    } = body;

    if (!patientName || (!patientEmail && !patientPhone)) {
      return NextResponse.json(
        { success: false, error: 'Datos de contacto insuficientes' },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(patientName);
    const safeProf = escapeHtml(professionalName);
    const safeCenter = escapeHtml(centerName);
    const safeDate = escapeHtml(date);
    const safeTime = escapeHtml(time);
    const safeModality = escapeHtml(modality);

    // Generar enlace directo a Google Calendar para el correo
    const calDate = (isoDate || '20261115').replace(/-/g, '');
    const startHour = (time || '14:30').replace(':', '');
    const endHourNum = parseInt(startHour.slice(0, 2), 10) + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Sesión Clínica - ${professionalName} (${centerName})`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent(
      `Atención psicológica con ${professionalName}. Modalidad: ${modality}.`
    )}`;

    const results: Record<string, any> = { email: null, whatsapp: null };

    // 1. ENVÍO DE CORREO PREMIUM (RESEND)
    if (patientEmail && resendApiKey) {
      const resend = new Resend(resendApiKey);
      const emailRes = await resend.emails.send({
        from: 'Kairós Clínico <notificaciones@kairosclinico.cl>',
        to: patientEmail.trim(),
        subject: `Reserva Confirmada · ${safeDate} a las ${safeTime} hrs`,
        html: `
          <div style="background-color: #F9F8F6; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1C1917;">
            <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border-radius: 28px; padding: 40px; border: 1px solid #E4ECE7; box-shadow: 0 12px 32px rgba(44, 74, 59, 0.05);">
              <div style="display: inline-block; padding: 6px 14px; background-color: #EBF3EE; color: #2C4A3B; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px;">
                Confirmación Oficial · ${safeCenter}
              </div>
              <h1 style="font-size: 24px; font-weight: 700; color: #1C1917; margin: 0 0 12px 0; letter-spacing: -0.02em;">
                Hola, ${safeName}
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #57534E; margin: 0 0 28px 0;">
                Tu espacio terapéutico ya está reservado. Hemos preparado todo para recibirte con tranquilidad y puntualidad.
              </p>
              
              <div style="background-color: #F9F8F6; border-radius: 20px; padding: 24px; border: 1px solid #E4ECE7; margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #78716C; font-weight: 600;">Especialista</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #1C1917; font-weight: 600; text-align: right;">${safeProf}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #78716C; font-weight: 600;">Fecha y Hora</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #2C4A3B; font-weight: 700; text-align: right;">${safeDate} · ${safeTime} hrs</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #78716C; font-weight: 600;">Modalidad</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #1C1917; font-weight: 500; text-align: right;">${safeModality}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${gCalUrl}" target="_blank" style="display: inline-block; background-color: #2C4A3B; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-size: 14px; font-weight: 600;">
                  Agregar a Google Calendar
                </a>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #A8A29E; text-align: center; margin: 0; border-top: 1px solid #F5F5F4; padding-top: 20px;">
                Este mensaje es confidencial. Si necesitas reprogramar tu sesión, hazlo con al menos 24 horas de anticipación.
              </p>
            </div>
          </div>
        `,
      });
      results.email = emailRes;
    }

    // 2. ENVÍO DE WHATSAPP CON FALLBACK INTELIGENTE (META CLOUD API v25.0)
    if (patientPhone && whatsappToken && whatsappPhoneId) {
      const cleanPhone = normalizeChileanPhone(patientPhone);

      if (cleanPhone.length >= 11) {
        const endpoint = `https://graph.facebook.com/v25.0/${whatsappPhoneId}/messages`;
        const headers = {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        };

        let waResponseData: any = null;

        // Si algún día configuras WHATSAPP_TEMPLATE_NAME en Vercel, intenta usar tu plantilla clínica primero
        if (customTemplate) {
          const customRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'template',
              template: {
                name: customTemplate,
                language: { code: 'es' },
                components: [
                  {
                    type: 'body',
                    parameters: [
                      { type: 'text', text: patientName },
                      { type: 'text', text: `${date} a las ${time} hrs` },
                      { type: 'text', text: professionalName },
                    ],
                  },
                ],
              },
            }),
          });
          waResponseData = await customRes.json();

          // Si falla la plantilla personalizada, cae automáticamente a hello_world
          if (!customRes.ok) {
            console.warn('Plantilla personalizada rechazada, ejecutando fallback a hello_world:', waResponseData);
            waResponseData = null;
          }
        }

        // Envío garantizado con plantilla nativa pre-aprobada del Sandbox
        if (!waResponseData) {
          const fallbackRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'template',
              template: {
                name: 'hello_world',
                language: { code: 'en_US' },
              },
            }),
          });
          waResponseData = await fallbackRes.json();
        }

        results.whatsapp = waResponseData;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Error en motor de notificaciones:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}