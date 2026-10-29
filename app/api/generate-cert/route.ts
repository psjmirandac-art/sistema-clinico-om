import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, patient_name, patient_rut, date } = body;
    
    // 1. Validación estricta temprana
    if (!prompt || !patient_name || !patient_rut || !date) {
      return NextResponse.json({ error: 'Faltan datos requeridos del paciente o instrucción.' }, { status: 400 });
    }
    
    if (!process.env.GROQ_API_KEY) {
      console.error('API Error: Falta configurar GROQ_API_KEY en Vercel');
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 });
    }

    // 2. Prompt engineering reforzado
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

    // 3. Petición a Groq con el modelo correcto
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Modelo real y de alta precisión
        messages: [{ role: 'user', content: groqPrompt }],
        temperature: 0.1 // Casi cero creatividad para no arriesgar documentos legales
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error('Groq API Error:', data.error);
      return NextResponse.json({ error: 'Fallo al procesar el certificado con IA en el proveedor.' }, { status: 500 });
    }
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json({ error: 'La IA devolvió una respuesta en blanco. Intenta nuevamente.' }, { status: 500 });
    }

    return NextResponse.json({ certificate: data.choices[0].message.content.trim() });
  } catch (error: any) {
    console.error('Excepción no controlada en generate-cert:', error?.message);
    return NextResponse.json({ error: 'Error interno de procesamiento de IA.' }, { status: 500 });
  }
}