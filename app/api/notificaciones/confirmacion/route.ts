import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function escapeHtml(value: unknown): string {
  const str = typeof value === 'string' ? value : String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pickString(primary: unknown, fallback: string): string {
  if (typeof primary === 'string' && primary.trim().length > 0) {
    return primary.trim();
  }
  return fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const patientName = pickString(body?.patientName, 'Paciente');
    const patientEmail = pickString(body?.patientEmail, '');
    const overrideAdminEmail = pickString(body?.overrideAdminEmail, '');
    const isoDate = pickString(body?.isoDate, '2026-11-03');
    const dateLabel = pickString(body?.date, isoDate);
    const time = pickString(body?.time, '11:00');
    const serviceName = pickString(body?.serviceName, 'Sesión de Psicoterapia');
    const modality = pickString(body?.modality, 'Online (Videollamada)');
    const locationAddress = pickString(
      body?.locationAddress,
      'Enlace enviado previo a la sesión'
    );
    const professionalName = pickString(body?.professionalName, 'Especialista Kairós');
    const centerName = pickString(body?.centerName, 'Kairós Clínico');

    const resendApiKey = pickString(process.env.RESEND_API_KEY, '');
    const customFromEmail = pickString(
      process.env.RESEND_FROM_EMAIL,
      'Kairós Clínico <onboarding@resend.dev>'
    );

    const safeName = escapeHtml(patientName);
    const safeProf = escapeHtml(professionalName);
    const safeCenter = escapeHtml(centerName);
    const safeDate = escapeHtml(dateLabel);
    const safeTime = escapeHtml(time);
    const safeService = escapeHtml(serviceName);
    const safeModality = escapeHtml(modality);
    const safeLocation = escapeHtml(locationAddress);

    const calDate = isoDate.replace(/-/g, '');
    const startHour = time.replace(':', '');
    const parsedHour = parseInt(startHour.slice(0, 2), 10);
    const endHourNum = Number.isNaN(parsedHour) ? 12 : parsedHour + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`;

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${serviceName} - ${professionalName}`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent(
      `Atención en ${centerName} con ${professionalName}. Modalidad: ${modality}. Ubicación/Acceso: ${locationAddress}`
    )}&location=${encodeURIComponent(locationAddress)}`;

    const diagnostics = {
      emailSent: false,
      emailError: '',
    };

    const targetEmail = patientEmail.length > 0 ? patientEmail : overrideAdminEmail;

    if (targetEmail.length > 0 && resendApiKey.length > 0) {
      try {
        const resend = new Resend(resendApiKey);

        const htmlContent = `
          <div style="background-color: #F9F8F6; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1C1917;">
            <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border-radius: 28px; padding: 38px; border: 1px solid #E4ECE7; box-shadow: 0 12px 32px rgba(44, 74, 59, 0.06);">
              <div style="display: inline-block; padding: 6px 14px; background-color: #EBF3EE; color: #2C4A3B; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px;">
                Confirmación Oficial · ${safeCenter}
              </div>
              <h1 style="font-size: 23px; font-weight: 700; color: #1C1917; margin: 0 0 10px 0;">
                Hola, ${safeName}
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                Tu sesión clínica ha sido agendada y confirmada. Aquí tienes todos los detalles de tu atención:
              </p>
              <div style="background-color: #F9F8F6; border-radius: 20px; padding: 22px; border: 1px solid #E4ECE7; margin-bottom: 24px;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Servicio:</strong> ${safeService}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Especialista:</strong> ${safeProf}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #2C4A3B;"><strong>Fecha y Hora:</strong> ${safeDate} a las ${safeTime} hrs</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Modalidad:</strong> ${safeModality}</p>
                <p style="margin: 0; font-size: 13px; color: #1C1917;"><strong>Dirección / Acceso:</strong> ${safeLocation}</p>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${gCalUrl}" target="_blank" style="display: inline-block; background-color: #2C4A3B; color: #FFFFFF; text-decoration: none; padding: 13px 26px; border-radius: 14px; font-size: 13px; font-weight: 600;">
                  Agregar a Google Calendar
                </a>
              </div>
              <p style="font-size: 12px; color: #A8A29E; text-align: center; margin: 0; border-top: 1px solid #F5F5F4; padding-top: 18px;">
                Si necesitas reagendar, por favor avísanos con al menos 24 horas de anticipación.
              </p>
            </div>
          </div>
        `;

        let emailResponse = await resend.emails.send({
          from: customFromEmail,
          to: targetEmail,
          subject: `Cita Confirmada · ${safeDate} (${safeTime} hrs)`,
          html: htmlContent,
        });

        if (emailResponse.error) {
          emailResponse = await resend.emails.send({
            from: 'Kairós Clínico <onboarding@resend.dev>',
            to: targetEmail,
            subject: `Cita Confirmada · ${safeDate} (${safeTime} hrs)`,
            html: htmlContent,
          });
        }

        if (
          emailResponse.error &&
          overrideAdminEmail.length > 0 &&
          overrideAdminEmail !== targetEmail
        ) {
          emailResponse = await resend.emails.send({
            from: 'Kairós Clínico <onboarding@resend.dev>',
            to: overrideAdminEmail,
            subject: `[Copia Admin] Cita Confirmada de ${safeName} · ${safeDate}`,
            html: htmlContent,
          });
        }

        if (emailResponse.error) {
          diagnostics.emailError = pickString(
            emailResponse.error.message,
            'Rechazado por Resend'
          );
        } else {
          diagnostics.emailSent = true;
        }
      } catch (err: any) {
        diagnostics.emailError = pickString(
          err?.message,
          'Error al enviar correo con Resend'
        );
      }
    } else {
      diagnostics.emailError = 'Falta destinatario o variable RESEND_API_KEY en el servidor';
    }

    return NextResponse.json({
      success: diagnostics.emailSent,
      diagnostics,
    });
  } catch (error: any) {
    const fallbackError = pickString(error?.message, 'Error interno del servidor');
    return NextResponse.json(
      { success: false, error: fallbackError },
      { status: 500 }
    );
  }
}