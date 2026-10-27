import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
    
    const { patient_email, patient_name, professional_name, start_time } = await request.json();

    if (!patient_email) {
      return NextResponse.json({ error: 'El paciente no tiene correo electrónico' }, { status: 400 });
    }

    const formattedDate = new Date(start_time).toLocaleString('es-CL', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const data = await resend.emails.send({
      from: 'Centro OM <onboarding@resend.dev>',
      to: [patient_email],
      subject: 'Confirmación de tu cita y Consentimiento Informado - Centro OM',
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a;">¡Hola, ${patient_name}!</h2>
          <p>Tu cita ha sido agendada con éxito en el <strong>Centro OM</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Profesional:</strong> ${professional_name}</p>
            <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${formattedDate}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h3 style="color: #0f172a; font-size: 14px; text-transform: uppercase;">Consentimiento Informado</h3>
          <p style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: justify;">
            Al asistir a esta sesión, usted acepta voluntariamente participar en la evaluación y tratamiento propuesto por el profesional. Toda la información compartida durante la sesión está protegida por el secreto profesional, salvo en situaciones que involucren riesgo inminente para su vida o la de terceros, o por mandato legal. Su asistencia confirma la comprensión y aceptación de estos términos clínicos.
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px; font-weight: bold;">Si necesitas reagendar o cancelar, por favor comunícate con nosotros con al menos 24 horas de anticipación.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}