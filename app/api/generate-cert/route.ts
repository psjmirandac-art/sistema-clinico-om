import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, patient_name, patient_rut } = await request.json();
    
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'Falta GROQ_API_KEY' }, { status: 500 });
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
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: groqPrompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    return NextResponse.json({ certificate: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}