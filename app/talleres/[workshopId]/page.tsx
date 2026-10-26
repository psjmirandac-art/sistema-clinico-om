'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function WorkshopContent() {
  const params = useParams();
  const workshopId = params.workshopId;

  const [workshop, setWorkshop] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [center, setCenter] = useState<any>(null);
  const [registrationsCount, setRegistrationsCount] = useState(0);

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadWorkshopData() {
      if (!workshopId) return;

      const { data: wsData } = await supabase.from('workshops').select('*').eq('id', workshopId).single();
      if (wsData) {
        setWorkshop(wsData);
        
        const [{ data: prof }, { data: cent }, { count }] = await Promise.all([
          supabase.from('professionals').select('*').eq('id', wsData.professional_id).single(),
          supabase.from('centers').select('*').eq('id', wsData.center_id).single(),
          // Corrección de sintaxis aquí:
          supabase.from('workshop_registrations').select('*', { count: 'exact', head: true }).eq('workshop_id', workshopId)
        ]);

        if (prof) setProfessional(prof);
        if (cent) setCenter(cent);
        if (count !== null) setRegistrationsCount(count);
      }
    }
    loadWorkshopData();
  }, [workshopId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setStatus('Debes aceptar el consentimiento de privacidad.');
      return;
    }
    setLoading(true); setStatus('Inscribiendo...');

    if (registrationsCount >= workshop.max_capacity) {
      setStatus('Lo sentimos, este taller ya completó sus cupos máximos.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('workshop_registrations').insert([{
      workshop_id: workshop.id,
      patient_name: formData.name,
      patient_phone: formData.phone,
      consent_accepted: true
    }]);

    if (!error) {
      setStatus('¡Inscripción exitosa! Te esperamos en el taller.');
      setFormData({ name: '', phone: '' });
      setConsentAccepted(false);
      setRegistrationsCount(prev => prev + 1);
    } else {
      setStatus('Error al registrarse. Intenta nuevamente.');
    }
    setLoading(false);
  };

  if (!workshop || !professional || !center) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">Cargando información del taller...</div>;
  }

  const dateObj = new Date(workshop.start_time);
  const isFull = registrationsCount >= workshop.max_capacity;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100 p-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
        
        <div className="mb-6 text-center bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Taller Grupal</span>
          <h1 className="text-2xl font-extrabold text-slate-800 mt-3">{workshop.title}</h1>
          <p className="text-slate-600 font-medium mt-1">Facilitado por {professional.name}</p>
          <p className="text-xs text-purple-700 font-semibold mt-2">📍 {center.name}</p>
          <p className="text-purple-900 font-bold text-xl mt-3">${workshop.price.toLocaleString('es-CL')}</p>
        </div>

        <div className="mb-6 bg-slate-50 p-4 rounded-xl border text-sm text-slate-700 space-y-2">
          <p>📅 <strong>Fecha:</strong> {dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p>⏰ <strong>Hora:</strong> {dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs</p>
          <p>👥 <strong>Cupos Disponibles:</strong> {workshop.max_capacity - registrationsCount} de {workshop.max_capacity}</p>
          {workshop.description && <p className="pt-2 border-t text-slate-600">📝 {workshop.description}</p>}
        </div>

        {isFull ? (
          <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-center font-bold">
            Este taller ha alcanzado su capacidad máxima.
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo</label>
              <input type="text" required placeholder="Tu nombre" className="w-full border p-3 rounded-xl bg-slate-50 text-slate-900 font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
              <input type="tel" required placeholder="Tu teléfono" className="w-full border p-3 rounded-xl bg-slate-50 text-slate-900 font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <input type="checkbox" id="consent" required className="mt-1 h-4 w-4 text-purple-600 rounded border-slate-300" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} />
              <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed">
                Autorizo el tratamiento confidencial de mis datos para este taller conforme a la <strong>Ley 21.719</strong>.
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all disabled:opacity-50">
              {loading ? 'Inscribiendo...' : '🎯 Inscribirme al Taller'}
            </button>
          </form>
        )}

        {status && <div className={`mt-4 p-4 rounded-xl text-center font-semibold text-sm ${status.includes('éxito') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>{status}</div>}
      </div>
    </main>
  );
}

export default function WorkshopRegistration() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">Preparando enlace...</div>}>
      <WorkshopContent />
    </Suspense>
  );
}