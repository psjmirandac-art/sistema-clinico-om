import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. Opt-out explícito de caché para que siempre evalúe en tiempo real
  noStore();

  // 2. Seguridad: Validar que la petición venga exclusivamente de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 401 });
  }

  // 3. Inicialización en RUNTIME (Sortea el error de build de Vercel)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno de Supabase.');
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

  try {
    // 4. Calcular la fecha de mañana para buscar citas (YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split('T')[0];

    // 5. Buscar citas confirmadas para mañana (bypass RLS gracias a service_key)
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, patient_name, patient_email, time, professional_name, modality, centers(name)')
      .eq('date', targetDate)
      .eq('status', 'confirmada');

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay citas para recordar mañana.' });
    }

    // 6. Procesar envío de correos en paralelo
    const emailsToSend = appointments.map((appt) => {
      // Manejo seguro del nombre del centro
      const centerData = Array.isArray(appt.centers) ? appt.centers[0] : appt.centers;
      const clinicName = centerData?.name || 'nuestro centro clínico';

      return resend.emails.send({
        from: 'Kairós Clínico <recordatorios@kairosclinico.cl>', 
        to: appt.patient_email,
        subject: `Recordatorio de tu sesión mañana a las ${appt.time}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-w: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #F9F8F6;">
            <h2 style="color: #1F2937; margin-bottom: 16px;">Hola ${appt.patient_name},</h2>
            <p style="color: #4B5563; line-height: 1.6; font-size: 15px;">
              Te escribimos para recordarte que tienes una sesión agendada para mañana a las <strong>${appt.time} hrs</strong> con <strong>${appt.professional_name}</strong>.
            </p>
            <div style="background-color: #FFFFFF; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #E5E7EB;">
              <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Modalidad:</strong> ${appt.modality === 'online' ? 'Videollamada' : 'Presencial'}</p>
              <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;"><strong>Clínica:</strong> ${clinicName}</p>
            </div>
            <p style="color: #6B7280; font-size: 13px; line-height: 1.5;">
              Si necesitas reagendar, por favor contáctanos con al menos 24 horas de anticipación.<br>
              ¡Te esperamos!
            </p>
          </div>
        `,
      });
    });

    const results = await Promise.allSettled(emailsToSend);
    
    // Contar cuántos fallaron vs tuvieron éxito para monitoreo en logs
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({ 
      success: true, 
      message: `Proceso completado. ${successCount} correos enviados de ${appointments.length} citas.` 
    });

  } catch (error: any) {
    console.error('Error en Cron Job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}