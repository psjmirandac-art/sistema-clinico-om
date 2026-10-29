'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ActualizarClave() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setStatus({ type: 'error', message: error.message });
      setLoading(false);
    } else {
      setStatus({ type: 'success', message: 'Contraseña asegurada correctamente. Ingresando...' });
      setTimeout(() => router.push('/admin'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans selection:bg-[#E4ECE7]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-10 space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-md">
            <ShieldCheck strokeWidth={1.5} size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Acceso Seguro</h1>
            <p className="text-sm text-stone-500 mt-1">Configura tu nueva contraseña clínica.</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-stone-600 ml-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="w-full border border-stone-200 py-3.5 pl-4 pr-12 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800 placeholder:text-stone-400"
                placeholder="Mínimo 8 caracteres"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || status.type === 'success'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded-lg"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status.type && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-2 p-3 rounded-xl text-sm overflow-hidden ${
                  status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#F4F7F5] text-[#2C4A3B]'
                }`}
              >
                {status.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <ShieldCheck size={18} className="shrink-0 mt-0.5" />}
                <p className="leading-relaxed">{status.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading || status.type === 'success'} 
            className="relative w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl transition-all hover:bg-[#233b2f] hover:shadow-lg hover:shadow-[#2C4A3B]/20 disabled:opacity-70 disabled:hover:shadow-none flex items-center justify-center overflow-hidden"
          >
            {loading ? (
              <Loader2 className="animate-spin text-[#E4ECE7]" size={20} />
            ) : status.type === 'success' ? (
              'Guardado'
            ) : (
              'Actualizar Credenciales'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}