import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: Request) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, professionals(name)')
      .gte('start_time', startOfTomorrow)
      .lte('start_time', endOfTomorrow);

    if (error) throw error;
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: 'No hay citas para mañana' });
    }

    for (const appt of appointments) {
      if (!appt.patient_email) continue;

      const formattedTime = new Date(appt.start_time).toLocaleTimeString('es-CL', {
        hour: '2-digit', minute: '2-digit'
      });

      const htmlTemplate = `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Recordatorio de Cita - Centro OM</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hola <strong>${appt.patient_name}</strong>,</p>
            <p>Te escribimos para recordarte que tienes una cita programada para mañana.</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 5px 0;">📅 <strong>Fecha:</strong> Mañana</p>
              <p style="margin: 5px 0;">⏰ <strong>Hora:</strong> ${formattedTime}</p>
              <p style="margin: 5px 0;">👨‍⚕️ <strong>Profesional:</strong> ${appt.professionals?.name || 'Tu especialista'}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Si tienes algún inconveniente y no puedes asistir, por favor contáctanos lo antes posible para reagendar.</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Centro OM <onboarding@resend.dev>',
        to: [appt.patient_email],
        subject: `⏰ Recordatorio de tu cita mañana a las ${formattedTime}`,
        html: htmlTemplate,
      });
    }

    return NextResponse.json({ success: true, correosEnviados: appointments.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}