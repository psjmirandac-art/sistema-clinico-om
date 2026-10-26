import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar GROQ_API_KEY en .env.local' }, { status: 500 });
    }

    const promptSystem = `Eres un asistente clínico experto. Analiza la siguiente transcripción de una sesión y devuelve EXCLUSIVAMENTE un objeto JSON válido con 3 propiedades: 
    "motivo": (Resumen del motivo de consulta en 1-2 líneas), 
    "desarrollo": (El desarrollo clínico detallado, síntomas, observaciones y trabajo realizado), 
    "plan": (Indicaciones, tareas, próximos pasos o medicación).
    No devuelvas texto adicional, solo el objeto JSON puro.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b', // <-- Modelo estable y oficial recomendado por Groq
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: promptSystem },
          { role: 'user', content: transcript }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const content = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(content);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}