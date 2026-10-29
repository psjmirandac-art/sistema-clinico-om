import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, patient_name, patient_rut, date } = await request.json();
    
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'Falta configurar GROQ_API_KEY en Vercel' }, { status: 500 });
    }

    const groqPrompt = `Eres un PSICÓLOGO CLÍNICO experto redactando certificados en Chile. NO ERES MÉDICO.
    Datos del paciente: Nombre: ${patient_name}, RUT: ${patient_rut}.
    Fecha de la sesión clínica: ${date}.
    
    Instrucción del terapeuta: "${prompt}".
    
    Redacta de manera formal, profesional y compasiva ÚNICAMENTE EL CUERPO del certificado (ej: "Por medio del presente documento se certifica que..."). 
    
    REGLAS ESTRICTAS Y LEGALES: 
    1. ERES PSICÓLOGO: NO puedes otorgar licencias médicas ni días de reposo. NUNCA uses términos como "reposo médico", "licencia", o "ausencia por X días".
    2. Solo puedes "sugerir flexibilización académica/laboral", "recomendar contención familiar en el hogar", o "justificar inasistencia por haber asistido a sesión/evaluación psicológica".
    3. NO uses placeholders como [fecha] o [número]. Utiliza la Fecha de la sesión (${date}) de forma natural en tu redacción.
    4. Solo entrega 1 o 2 párrafos de texto continuo. NO agregues membretes, fechas al inicio/final, ni firmas, ya que el sistema lo añadirá automáticamente.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b', // Rollback a tu modelo funcional
        messages: [{ role: 'user', content: groqPrompt }],
        temperature: 0.2
      })
    });

    const data = await response.json();
    
    if (data.error) {
        return NextResponse.json({ error: `Groq API: ${data.error.message}` }, { status: 500 });
    }
    
    if (!data.choices || !data.choices[0]) {
        return NextResponse.json({ error: 'La IA devolvió una respuesta en blanco. Intenta nuevamente.' }, { status: 500 });
    }

    return NextResponse.json({ certificate: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}