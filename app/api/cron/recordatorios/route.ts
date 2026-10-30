export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // 1. Blindaje del Cron: Solo Vercel (o tú con la llave) puede ejecutar esto
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('Intento de ejecución de cron no autorizado');
      return new Response('Unauthorized', { status: 401 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // 2. Usar Service Role Key para saltar el RLS de forma segura en backend
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // 3. Manejo de fechas asegurando UTC pero apuntando a "mañana"
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow.setUTCHours(0, 0, 0, 0)).toISOString();
    const endOfTomorrow = new Date(tomorrow.setUTCHours(23, 59, 59, 999)).toISOString();

    // 4. Traer solo las citas validadas
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, professionals(name)')
      .gte('start_time', startOfTomorrow)
      .lte('start_time', endOfTomorrow)
      .eq('consent_accepted', true); 

    if (error) throw error;
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: 'Sin citas agendadas para mañana' });
    }

    const emailsToSend = [];

    for (const appt of appointments) {
      if (!appt.patient_email) continue;

      // 5. Forzar zona horaria de Chile sin importar el servidor de Vercel
      const dateObj = new Date(appt.start_time);
      const formattedTime = dateObj.toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit', 
        minute: '2-digit'
      });

      const isOnline = appt.modality === 'Online';
      const locationText = isOnline && appt.meet_link
        ? `<a href="${appt.meet_link}" style="color: #5F8575; text-decoration: underline; font-weight: 600;">Enlace de Videollamada (Google Meet)</a>` 
        : 'Presencial (En Clínica)';

      // 6. UI/UX Premium incrustado en el correo
      const htmlTemplate = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F9F8F6; padding: 40px 20px; color: #1c1917;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #f5f5f4;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2C4A3B; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">Centro OM</h1>
              <p style="color: #78716c; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Portal Clínico</p>
            </div>
            
            <p style="font-size: 15px; color: #44403c; line-height: 1.6;">Hola <strong>${appt.patient_name}</strong>,</p>
            <p style="font-size: 15px; color: #44403c; line-height: 1.6;">Este es un recordatorio de tu sesión programada para mañana. Hemos preparado todo para tu atención.</p>
            
            <div style="background-color: #F4F7F5; border: 1px solid #E4ECE7; border-radius: 16px; padding: 24px; margin: 30px 0;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #2C4A3B;">
                <span style="color: #5F8575; margin-right: 8px;">📅</span> <strong>Mañana</strong> a las <strong>${formattedTime} hrs</strong>
              </p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #2C4A3B;">
                <span style="color: #5F8575; margin-right: 8px;">👤</span> Especialista: <strong>${appt.professionals?.name || 'Tu terapeuta'}</strong>
              </p>
              <p style="margin: 0; font-size: 14px; color: #2C4A3B;">
                <span style="color: #5F8575; margin-right: 8px;">📍</span> ${locationText}
              </p>
            </div>
            
            <p style="font-size: 13px; color: #78716c; line-height: 1.5; margin-top: 30px;">
              Si necesitas reagendar, por favor contáctanos con anticipación para liberar la hora a otro paciente que lo necesite.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f5f5f4; text-align: center;">
              <p style="font-size: 11px; color: #a8a29e;">Nos vemos pronto.<br/>El equipo de Centro OM.</p>
            </div>
          </div>
        </div>
      `;

      emailsToSend.push({
        from: 'Centro OM <onboarding@resend.dev>', // Cámbialo a tu dominio verificado cuando pases a prod
        to: appt.patient_email,
        subject: `Recordatorio: Tu sesión clínica mañana a las ${formattedTime}`,
        html: htmlTemplate,
      });
    }

    // 7. Batch send: Enviamos todos los correos en UNA SOLA petición HTTP a Resend
    if (emailsToSend.length > 0) {
        await resend.batch.send(emailsToSend);
    }

    return NextResponse.json({ success: true, correosEnviados: emailsToSend.length });
  } catch (error: any) {
    console.error('Error crítico en el Cron Job:', error?.message);
    return NextResponse.json({ error: 'Fallo interno al procesar los recordatorios' }, { status: 500 });
  }
}