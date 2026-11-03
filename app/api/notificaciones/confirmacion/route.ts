import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeChileanPhone(rawPhone: string = ''): string {
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 8) return `569${digits}`;
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
  if (digits.length === 11 && digits.startsWith('569')) return digits;
  return digits;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientName = 'Paciente',
      patientEmail = '',
      patientPhone = '',
      date = '',
      isoDate = '',
      time = '',
      serviceName = 'Sesión de Psicoterapia',
      modality = 'Online (Videollamada)',
      locationAddress = 'Enlace de videollamada enviado previo a la sesión',
      professionalName = 'Especialista Kairós',
      centerName = 'Kairós Clínico',
      // Overrides opcionales desde el panel Admin para pruebas en vivo sin esperar redeploy
      overrideWhatsappToken = '',
      overrideWhatsappPhoneId = '',
      overrideAdminEmail = '',
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY || '';
    const whatsappToken = (overrideWhatsappToken || process.env.WHATSAPP_TOKEN || '').trim();
    const whatsappPhoneId = (overrideWhatsappPhoneId || process.env.WHATSAPP_PHONE_ID || '1409350122262116').trim();
    const customFromEmail = process.env.RESEND_FROM_EMAIL || '';

    const safeName = escapeHtml(patientName);
    const safeProf = escapeHtml(professionalName);
    const safeCenter = escapeHtml(centerName);
    const safeDate = escapeHtml(date || isoDate);
    const safeTime = escapeHtml(time);
    const safeService = escapeHtml(serviceName);
    const safeModality = escapeHtml(modality);
    const safeLocation = escapeHtml(locationAddress);

    const calDate = (isoDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const startHour = (time || '11:00').replace(':', '');
    const endHourNum = parseInt(startHour.slice(0, 2), 10) + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${serviceName} - ${professionalName}`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent(
      `Atención en ${centerName} con ${professionalName}. Modalidad: ${modality}. Ubicación/Acceso: ${locationAddress}`
    )}&location=${encodeURIComponent(locationAddress)}`;

    const diagnostics: {
      emailSent: boolean;
      emailError: string | null;
      whatsappSent: boolean;
      whatsappError: string | null;
    } = {
      emailSent: false,
      emailError: null,
      whatsappSent: false,
      whatsappError: null,
    };

    // 1. ENVÍO DE CORREO TRANSACCIONAL (RESEND)
    const targetEmail = (patientEmail || overrideAdminEmail || '').trim();
    if (targetEmail && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const htmlContent = `
          <div style="background-color: #F9F8F6; padding: 40px 20px; font-family: 'Inter', -apple-system, sans-serif; color: #1C1917;">
            <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border-radius: 28px; padding: 38px; border: 1px solid #E4ECE7; box-shadow: 0 12px 32px rgba(44, 74, 59, 0.06);">
              <div style="display: inline-block; padding: 6px 14px; background-color: #EBF3EE; color: #2C4A3B; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px;">
                Confirmación & Recordatorio · ${safeCenter}
              </div>
              <h1 style="font-size: 23px; font-weight: 700; color: #1C1917; margin: 0 0 10px 0;">
                Hola, ${safeName}
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                Tu sesión ha sido agendada y confirmada exitosamente. A continuación encontrarás los datos de tu cita:
              </p>
              <div style="background-color: #F9F8F6; border-radius: 20px; padding: 22px; border: 1px solid #E4ECE7; margin-bottom: 24px;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Servicio:</strong> ${safeService}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Especialista:</strong> ${safeProf}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #2C4A3B;"><strong>Fecha y Hora:</strong> ${safeDate} a las ${safeTime} hrs</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Modalidad:</strong> ${safeModality}</p>
                <p style="margin: 0; font-size: 13px; color: #1C1917;"><strong>Dirección / Sala Online:</strong> ${safeLocation}</p>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${gCalUrl}" target="_blank" style="display: inline-block; background-color: #2C4A3B; color: #FFFFFF; text-decoration: none; padding: 13px 26px; border-radius: 14px; font-size: 13px; font-weight: 600;">
                  Agregar a Google Calendar
                </a>
              </div>
            </div>
          </div>
        `;

        const fromAddress = customFromEmail || 'Kairós Clínico <onboarding@resend.dev>';
        let emailResponse = await resend.emails.send({
          from: fromAddress,
          to: targetEmail,
          subject: `Cita Confirmada · ${safeDate} (${safeTime} hrs)`,
          html: htmlContent,
        });

        // Si el dominio personalizado falla, reintenta con onboarding@resend.dev
        if (emailResponse.error && customFromEmail) {
          emailResponse = await resend.emails.send({
            from: 'Kairós Clínico <onboarding@resend.dev>',
            to: targetEmail,
            subject: `Cita Confirmada · ${safeDate} (${safeTime} hrs)`,
            html: htmlContent,
          });
        }

        // Si Resend bloquea porque el destinatario no es el dueño de la cuenta en modo Sandbox, envía copia al correo del admin
        if (emailResponse.error && overrideAdminEmail && overrideAdminEmail !== targetEmail) {
          emailResponse = await resend.emails.send({
            from: 'Kairós Clínico <onboarding@resend.dev>',
            to: overrideAdminEmail.trim(),
            subject: `[Copia Admin] Cita Confirmada de ${safeName} · ${safeDate}`,
            html: htmlContent,
          });
        }

        if (emailResponse.error) {
          diagnostics.emailError = emailResponse.error.message;
        } else {
          diagnostics.emailSent = true;
        }
      } catch (err: any) {
        diagnostics.emailError = err.message || 'Error al conectar con Resend';
      }
    } else if (!resendApiKey) {
      diagnostics.emailError = 'RESEND_API_KEY no configurada en Vercel';
    }

    // 2. ENVÍO DE WHATSAPP AUTOMÁTICO (META CLOUD API v25.0)
    if (patientPhone && whatsappToken && whatsappPhoneId) {
      try {
        const cleanPhone = normalizeChileanPhone(patientPhone);
        const endpoint = `https://graph.facebook.com/v25.0/${whatsappPhoneId}/messages`;
        const headers = {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        };

        // Paso A: Intentar enviar mensaje de texto enriquecido (funciona si el paciente escribió en las últimas 24h)
        const textRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: {
              body: `✅ *Kairós Clínico - Cita Confirmada*\n\nHola *${patientName}*, tu sesión de *${serviceName}* (${modality}) con *${professionalName}* quedó agendada para el *${date || isoDate}* a las *${time} hrs*.\n\n📍 *Acceso / Dirección:* ${locationAddress}`,
            },
          }),
        });

        if (textRes.ok) {
          diagnostics.whatsappSent = true;
        } else {
          // Paso B (Fallback garantizado): Plantilla pre-aprobada hello_world del Sandbox de Meta
          const tplRes = await fetch(endpoint, {
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

          const tplData = await tplRes.json();
          if (tplRes.ok) {
            diagnostics.whatsappSent = true;
          } else {
            diagnostics.whatsappError =
              tplData?.error?.message || 'Rechazado por Meta Cloud API';
          }
        }
      } catch (err: any) {
        diagnostics.whatsappError = err.message || 'Error de red hacia Meta Cloud API';
      }
    } else {
      diagnostics.whatsappError =
        'Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_ID (Configúralo en el botón superior "Credenciales API" o en Vercel)';
    }

    return NextResponse.json({
      success: diagnostics.emailSent || diagnostics.whatsappSent,
      diagnostics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}