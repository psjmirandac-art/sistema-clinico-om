"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexión automática a tu Supabase usando las variables de Vercel
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgendarPage() {
  const router = useRouter();
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarProfesionales() {
      // Extrae la lista dinámica desde tu tabla de profesionales
      const { data, error } = await supabase
        .from('professionals')
        .select('*');
        
      if (data) {
        setProfesionales(data);
      }
      setCargando(false);
    }
    
    cargarProfesionales();
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idProfesional = e.target.value;
    
    if (idProfesional) {
       // Ahora envía el UUID real a la siguiente página para cargar el calendario
       router.push(`/agendar/${idProfesional}`); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reserva de Horas</h1>
        <p className="text-sm text-slate-500 mb-8">Agendamiento clínico oficial - Centro OM</p>
        
        <div className="text-left">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            1. Profesional
          </label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-3 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow cursor-pointer"
            onChange={handleSelect}
            defaultValue=""
            disabled={cargando}
          >
            <option value="">
              {cargando ? 'Cargando especialistas...' : 'Elegir especialista...'}
            </option>
            {profesionales.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name || prof.nombre} {prof.specialty || prof.especialidad ? `- ${prof.specialty || prof.especialidad}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}