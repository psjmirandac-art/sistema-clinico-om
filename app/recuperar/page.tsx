'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, KeyRound, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function RecuperarClave() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, text: string }>({ type: null, text: '' });

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, text: '' });
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`,
    });

    if (error) {
      // Sanitizamos el error para no asustar al usuario con logs de base de datos
      setStatus({ type: 'error', text: 'No pudimos procesar la solicitud. Verifica el correo e intenta nuevamente.' });
    } else {
      // Mensaje ambiguo por seguridad (evita enumeración de usuarios)
      setStatus({ type: 'success', text: 'Si el correo está registrado, recibirás un enlace seguro en breve.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#E4ECE7]">
      
      {/* Botón Volver */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10">
        <Link 
          href="/admin" 
          className="text-stone-400 hover:text-stone-800 flex items-center gap-2 transition-colors font-medium text-sm px-4 py-2 hover:bg-stone-100/50 rounded-full"
        >
          <ArrowLeft size={16} />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-8 sm:p-10 space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-[#F4F7F5] text-[#2C4A3B] rounded-2xl flex items-center justify-center shadow-sm border border-[#E4ECE7] mb-6">
            <KeyRound strokeWidth={1.5} size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Recuperar Acceso</h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              Ingresa tu correo institucional y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
          </div>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="email" 
                required 
                placeholder="correo@ejemplo.com"
                className="w-full pl-10 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800 placeholder:text-stone-300" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || status.type === 'success'} 
            className="w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl transition-all hover:bg-[#233b2f] hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-none flex justify-center items-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-[#E4ECE7]" /> : 'Enviar enlace seguro'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status.type && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-start gap-2 p-4 rounded-xl text-sm overflow-hidden ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#F4F7F5] text-[#2C4A3B]'}`}
            >
              {status.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
              <p className="leading-relaxed font-medium">{status.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}