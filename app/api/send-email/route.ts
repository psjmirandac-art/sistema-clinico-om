import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_email, patient_name, professional_name, start_time } = body;

    // 1. Validación estricta temprana
    if (!patient_email || !patient_name || !start_time) {
      return NextResponse.json({ error: 'Faltan datos requeridos para generar el correo.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('API Error: Falta RESEND_API_KEY en Vercel');
      return NextResponse.json({ error: 'Error de configuración en el servidor de correos.' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 2. Formateo de fecha blindado contra el UTC de Vercel
    const dateObj = new Date(start_time);
    const formattedDate = dateObj.toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 3. Envío con UI Premium inyectada
    const data = await resend.emails.send({
      from: 'Centro OM <onboarding@resend.dev>', // Asegúrate de cambiar esto a tu dominio verificado en prod
      to: [patient_email],
      subject: `Confirmación de reserva: ${formattedDate} - Centro OM`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F9F8F6; padding: 40px 20px; color: #1c1917;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #f5f5f4;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #2C4A3B; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Centro OM</h1>
              <p style="color: #78716c; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;">Confirmación de Reserva</p>
            </div>
            
            <!-- Body -->
            <p style="font-size: 15px; color: #44403c; line-height: 1.6;">Hola <strong>${patient_name}</strong>,</p>
            <p style="font-size: 15px; color: #44403c; line-height: 1.6;">Tu sesión clínica ha sido agendada y confirmada exitosamente.</p>
            
            <!-- Detalles de Cita (Glassmorphism solid emulation) -->
            <div style="background-color: #F4F7F5; border: 1px solid #E4ECE7; border-radius: 16px; padding: 24px; margin: 32px 0;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #2C4A3B; text-transform: capitalize;">
                <span style="color: #5F8575; margin-right: 8px;">📅</span> <strong>Fecha:</strong> ${formattedDate}
              </p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #2C4A3B;">
                <span style="color: #5F8575; margin-right: 8px;">⏰</span> <strong>Hora:</strong> ${formattedTime} hrs
              </p>
              <p style="margin: 0; font-size: 14px; color: #2C4A3B;">
                <span style="color: #5F8575; margin-right: 8px;">👤</span> <strong>Profesional:</strong> ${professional_name || 'Especialista Clínico'}
              </p>
            </div>
            
            <!-- Consentimiento Informado -->
            <div style="margin-top: 32px; border-top: 1px solid #f5f5f4; padding-top: 24px;">
              <h3 style="color: #2C4A3B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Consentimiento Informado</h3>
              <p style="font-size: 12px; color: #78716c; line-height: 1.6; text-align: justify; margin: 0;">
                Al asistir a esta sesión, usted acepta voluntariamente participar en la evaluación y tratamiento propuesto. Toda la información compartida está estrictamente protegida por el secreto profesional, salvo en situaciones que involucren riesgo inminente para su vida o la de terceros, o por mandato legal. Su asistencia confirma la comprensión y aceptación de estos términos.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; text-align: center;">
              <p style="font-size: 12px; color: #a8a29e; font-weight: 500;">Si necesitas reagendar o cancelar, por favor comunícate con nosotros con al menos 24 horas de anticipación.</p>
            </div>
            
          </div>
        </div>
      `,
    });

    if (data.error) {
      console.error('Error de Resend:', data.error);
      return NextResponse.json({ error: 'No se pudo enviar el correo de confirmación' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.data?.id });
  } catch (error: any) {
    console.error('Error interno del servidor (Send Email):', error?.message);
    return NextResponse.json({ error: 'Fallo interno al procesar el envío de correo' }, { status: 500 });
  }
}