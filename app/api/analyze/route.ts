import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Falta GROQ_API_KEY en Vercel' }, { status: 500 });
    }

    const prompt = `Analiza la siguiente transcripción de una sesión clínica (que puede tener errores de dictado) y extrae la información estructurándola en 3 categorías formales:
    1. Motivo de consulta (breve y directo)
    2. Desarrollo de la sesión (resumen clínico detallado)
    3. Plan o indicaciones (si aplica, sino pon "Ninguna")
    
    Devuelve un JSON válido estrictamente con las claves: "motivo", "desarrollo", "plan".
    
    Transcripción bruta a analizar: "${transcript}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    const data = await response.json();

    // SISTEMA DE DEFENSA
    if (data.error) {
        return NextResponse.json({ error: `Groq API: ${data.error.message}` }, { status: 500 });
    }

    if (!data.choices || !data.choices[0]) {
        return NextResponse.json({ error: 'Respuesta vacía de la IA.' }, { status: 500 });
    }

    const aiResult = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(aiResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}