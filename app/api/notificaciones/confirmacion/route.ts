import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || '');
  const whatsappToken = process.env.WHATSAPP_TOKEN || '';
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID || '';

  try {
    const body = await request.json();
    const { patientName, patientEmail, patientPhone, date, time, professionalName, centerName } = body;

    const notificationPromises: Promise<any>[] = [];

    // --- 1. DISPARAR CORREO (RESEND) ---
    if (patientEmail) {
      const emailPromise = resend.emails.send({
        from: 'Kairós Clínico <notificaciones@kairosclinico.cl>',
        to: patientEmail,
        subject: `Cita Confirmada: ${date} a las ${time}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-w: 600px; margin: 0 auto; padding: 32px; border: 1px solid #E4ECE7; border-radius: 24px; background-color: #F9F8F6;">
            <h2 style="color: #1F2937; margin-bottom: 16px; font-size: 22px; font-weight: 800;">Hola ${patientName},</h2>
            <p style="color: #4B5563; line-height: 1.6; font-size: 15px;">
              Confirmamos tu cita para el día <strong>${date}</strong> a las <strong>${time} hrs</strong> con <strong>${professionalName}</strong>.
            </p>
            <div style="background-color: #FFFFFF; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #E4ECE7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Lugar/Modalidad:</strong> ${centerName}</p>
            </div>
            <p style="color: #6B7280; font-size: 13px; line-height: 1.5;">
              Si deseas reagendar o cancelar, por favor comunícate con nosotros con anticipación.<br><br>
              Atte,<br>
              <strong>${centerName}</strong>
            </p>
          </div>
        `,
      });
      notificationPromises.push(emailPromise);
    }

    // --- 2. DISPARAR WHATSAPP (META CLOUD API - SANDBOX MODE) ---
    if (patientPhone && whatsappToken && whatsappPhoneId) {
      const cleanPhone = patientPhone.replace(/\D/g, ''); // Limpiar formato (ej: 5691699991)
      
      if (cleanPhone.length >= 11) {
        // Usamos la plantilla nativa 'hello_world' para pasar el Sandbox sin errores de variables
        const waPromise = fetch(`https://graph.facebook.com/v25.0/${whatsappPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: 'hello_world', // Plantilla universal pre-aprobada por Meta en todos los Sandbox
              language: { code: 'en_US' }
            }
          }),
        }).then(res => res.json());

        notificationPromises.push(waPromise);
      }
    }

    // Ejecutar envíos en paralelo
    await Promise.allSettled(notificationPromises);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al notificar confirmación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}