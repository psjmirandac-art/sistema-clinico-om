"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AgendarPage() {
  const router = useRouter();
  const [profesional, setProfesional] = useState('');

  // Esta función maneja lo que ocurre cuando el paciente elige un profesional
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProfesional(value);
    
    // Si tenías una ruta dinámica para los servicios, esto los redirige automáticamente
    if (value) {
       // router.push(`/agendar/${value}`); 
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
            value={profesional}
            onChange={handleSelect}
          >
            <option value="">Elegir especialista...</option>
            <option value="jaime">Jaime Miranda - Psicólogo Clínico Adultos</option>
            <option value="ivette">Ivette Olivares - Psicóloga Infanto-Juvenil</option>
          </select>
        </div>
      </div>
    </div>
  );
}