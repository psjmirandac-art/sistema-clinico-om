'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserCircle, Lock, ArrowLeft, Eye, EyeOff, Loader2, HeartHandshake } from 'lucide-react';

export default function PortalPacientesLogin() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Aquí inyectarás la llamada a Supabase Auth
    // ej: await supabase.auth.signInWithPassword({ email: rutToEmail(rut), password })
    setTimeout(() => setIsLoading(false), 2000); 
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#E4ECE7]">
      
      {/* Botón Volver Premium */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10">
        <Link 
          href="/" 
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
        {/* Header Terapéutico */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-[#F4F7F5] text-[#2C4A3B] rounded-2xl flex items-center justify-center shadow-sm border border-[#E4ECE7] mb-6">
            <HeartHandshake strokeWidth={1.5} size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Portal de Pacientes</h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              Ingresa para gestionar tus sesiones, revisar pagos y acceder a telemedicina.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">RUT</label>
            <div className="relative">
              <UserCircle size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                required
                placeholder="12.345.678-9" 
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800 placeholder:text-stone-300"
              />
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center pr-1">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Contraseña</label>
              <Link href="#" className="text-[11px] font-semibold text-[#5F8575] hover:text-[#2C4A3B] transition-colors">
                ¿La olvidaste?
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800 placeholder:text-stone-300"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl transition-all hover:bg-[#233b2f] hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-none flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin text-[#E4ECE7]" /> : 'Ingresar a mi portal'}
          </button>
        </form>

        <div className="mt-8 text-center text-[13px] text-stone-500 border-t border-stone-100 pt-8">
          ¿Primera vez en el centro? <br/>
          <Link href="/agendar" className="text-[#5F8575] font-semibold hover:text-[#2C4A3B] transition-colors mt-1.5 inline-block">
            Agenda tu primera sesión aquí
          </Link>
        </div>
      </motion.div>
    </div>
  );
}