import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return NextResponse.json({ error: 'La transcripción está vacía o no es válida.' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Falta GROQ_API_KEY en las variables de entorno de Vercel.' }, { status: 500 });
    }

    const prompt = `Analiza la siguiente transcripción de una sesión clínica (que puede tener errores de dictado por voz) y extrae la información estructurándola estrictamente en 3 categorías formales:
1. Motivo de consulta (breve y directo)
2. Desarrollo de la sesión (resumen clínico detallado)
3. Plan o indicaciones (si aplica, sino pon "Ninguna")
    
Devuelve un objeto JSON válido que contenga exclusivamente estas tres claves: "motivo", "desarrollo", "plan".
    
Transcripción bruta a analizar: "${transcript}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Modelo actual de alto rendimiento en Groq
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1 // Temperatura baja para respuestas clínicas precisas y sin alucinaciones
      })
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: `Groq API Error: ${data.error.message || 'Desconocido'}` }, { status: 500 });
    }

    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json({ error: 'Respuesta vacía o inválida recibida de la IA.' }, { status: 500 });
    }

    let aiResult;
    try {
      aiResult = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      return NextResponse.json({ error: 'La IA no devolvió un JSON con el formato esperado.' }, { status: 500 });
    }

    return NextResponse.json(aiResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor.' }, { status: 500 });
  }
}