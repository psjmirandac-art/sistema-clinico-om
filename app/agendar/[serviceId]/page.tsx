"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgendarPage() {
  const router = useRouter();
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarServicios() {
      // Extrae la lista de servicios desde la base de datos
      const { data, error } = await supabase
        .from('services')
        .select('*');
        
      if (data) {
        setServicios(data);
      }
      setCargando(false);
    }
    
    cargarServicios();
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idServicio = e.target.value;
    
    if (idServicio) {
       // Envía el UUID del servicio al calendario
       router.push(`/agendar/${idServicio}`); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reserva de Horas</h1>
        <p className="text-sm text-slate-500 mb-8">Agendamiento clínico oficial - Centro OM</p>
        
        <div className="text-left">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            1. ¿Qué servicio necesitas?
          </label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-3 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow cursor-pointer"
            onChange={handleSelect}
            defaultValue=""
            disabled={cargando}
          >
            <option value="">
              {cargando ? 'Cargando servicios...' : 'Elegir servicio...'}
            </option>
            {servicios.map((serv) => (
              <option key={serv.id} value={serv.id}>
                {serv.name || serv.nombre} {serv.price || serv.precio ? `($${(serv.price || serv.precio).toLocaleString('es-CL')})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}