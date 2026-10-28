import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, patient_name, patient_rut } = await request.json();
    
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'Falta configurar GROQ_API_KEY en Vercel' }, { status: 500 });
    }

    const groqPrompt = `Eres un profesional clínico experto redactando certificados.
    Datos del paciente: Nombre: ${patient_name}, RUT: ${patient_rut}.
    Instrucción del terapeuta: "${prompt}".
    Redacta de manera formal, profesional y compasiva ÚNICAMENTE EL CUERPO del certificado médico/psicológico (ej: "Por medio del presente documento se certifica que el paciente..."). 
    Solo entrega 1 o 2 párrafos de texto continuo. NO agregues saludos, fechas, membretes, ni nombres al final, ya que el sistema lo añadirá automáticamente.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: groqPrompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    // SISTEMA DE DEFENSA: Atrapa errores internos de Groq
    if (data.error) {
        return NextResponse.json({ error: `Groq API: ${data.error.message}` }, { status: 500 });
    }
    
    // SISTEMA DE DEFENSA: Atrapa respuestas vacías
    if (!data.choices || !data.choices[0]) {
        return NextResponse.json({ error: 'La IA devolvió una respuesta en blanco. Intenta nuevamente.' }, { status: 500 });
    }

    return NextResponse.json({ certificate: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}