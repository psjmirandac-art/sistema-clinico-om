'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function RecuperarClave() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    // Aquí usamos window.location.origin para que la redirección funcione tanto en local como en producción
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`,
    });

    if (error) setMessage('Error: ' + error.message);
    else setMessage('Si el correo está registrado, recibirás un enlace de recuperación pronto.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-3">SC</div>
          <h1 className="text-xl font-bold text-slate-900">Recuperar Acceso</h1>
          <p className="text-xs text-slate-500 mt-2">Ingresa tu correo para recibir un enlace seguro.</p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
            <input type="email" required className="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        {message && <p className="text-xs font-semibold text-center text-emerald-600 bg-emerald-50 p-3 rounded-xl">{message}</p>}
        <div className="text-center">
          <Link href="/admin" className="text-xs font-bold text-slate-500 hover:text-slate-900">← Volver al login</Link>
        </div>
      </div>
    </div>
  );
}