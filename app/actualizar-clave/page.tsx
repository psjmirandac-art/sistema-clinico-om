'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ActualizarClave() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Supabase ya sabe qué usuario es gracias al token oculto en la URL
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      alert('Error al actualizar: ' + error.message);
      setLoading(false);
    } else {
      alert('Contraseña actualizada exitosamente.');
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-3">SC</div>
          <h1 className="text-xl font-bold text-slate-900">Nueva Contraseña</h1>
          <p className="text-xs text-slate-500 mt-2">Ingresa tu nueva credencial de acceso seguro.</p>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nueva Contraseña</label>
            <input type="password" required minLength={6} className="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Confirmar cambio'}
          </button>
        </form>
      </div>
    </div>
  );
}