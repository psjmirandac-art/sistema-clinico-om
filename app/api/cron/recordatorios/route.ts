import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. Opt-out explícito de caché
  noStore();

  // 2. Seguridad: Validar que la petición venga exclusivamente de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 401 });
  }

  // 3. Inicialización en RUNTIME de Credenciales
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const whatsappToken = process.env.WHATSAPP_TOKEN || ''; // Token de Meta Cloud API
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID || ''; // ID del número de teléfono en Meta
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Falta configuración de DB' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

  try {
    // 4. Calcular fecha de mañana (YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split('T')[0];

    // 5. Buscar citas (FÍJATE QUE AÑADIMOS patient_phone AL SELECT)
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, patient_name, patient_email, patient_phone, time, professional_name, modality, centers(name)')
      .eq('date', targetDate)
      .eq('status', 'confirmada');

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay citas para mañana.' });
    }

    // 6. Preparar array de promesas para envíos concurrentes (Email + WhatsApp)
    const notificationPromises: Promise<any>[] = [];

    appointments.forEach((appt) => {
      const centerData = Array.isArray(appt.centers) ? appt.centers[0] : appt.centers;
      const clinicName = centerData?.name || 'nuestro centro clínico';

      // --- BLOQUE 1: ENVÍO DE EMAIL ---
      if (appt.patient_email) {
        const emailPromise = resend.emails.send({
          from: 'Kairós Clínico <recordatorios@kairosclinico.cl>', 
          to: appt.patient_email,
          subject: `Recordatorio de tu sesión mañana a las ${appt.time}`,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-w: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #F9F8F6;">
              <h2 style="color: #1F2937; margin-bottom: 16px;">Hola ${appt.patient_name},</h2>
              <p style="color: #4B5563; line-height: 1.6; font-size: 15px;">
                Te recordamos que tienes una sesión agendada para mañana a las <strong>${appt.time} hrs</strong> con <strong>${appt.professional_name}</strong> en ${clinicName}.
              </p>
            </div>
          `,
        });
        notificationPromises.push(emailPromise);
      }

      // --- BLOQUE 2: ENVÍO DE WHATSAPP (META CLOUD API) ---
      if (appt.patient_phone && whatsappToken && whatsappPhoneId) {
        // Limpiar número: Meta requiere código de país (ej. 56912345678) sin el "+"
        const cleanPhone = appt.patient_phone.replace(/\D/g, ''); 
        
        // Solo enviar si parece un número válido (mínimo 11 dígitos para Chile 569...)
        if (cleanPhone.length >= 11) {
          const waPromise = fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
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
                name: 'recordatorio_cita', // ⚠️ DEBE COINCIDIR EXACTAMENTE CON EL NOMBRE EN META BUSINESS
                language: { code: 'es' },
                components: [
                  {
                    type: 'body',
                    parameters: [
                      { type: 'text', text: appt.patient_name },
                      { type: 'text', text: appt.time },
                      { type: 'text', text: appt.professional_name },
                      { type: 'text', text: clinicName }
                    ]
                  }
                ]
              }
            }),
          }).then(res => res.json());

          notificationPromises.push(waPromise);
        }
      }
    });

    // 7. Ejecutar todos los envíos al mismo tiempo
    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({ 
      success: true, 
      message: `Envíos procesados: ${successCount} exitosos de ${notificationPromises.length} intentos.` 
    });

  } catch (error: any) {
    console.error('Error crítico en Cron Job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}