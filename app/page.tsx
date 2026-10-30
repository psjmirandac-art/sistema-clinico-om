'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Calendar, User, ArrowRight, ShieldCheck, HeartHandshake, Clock, Sparkles } from 'lucide-react';
import { useTenant } from '@/providers/TenantProvider';

export default function LandingPage() {
  const { center } = useTenant(); // Consumimos el motor multi-tenant

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* NAVBAR DINÁMICO */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full fixed top-0 bg-white/80 backdrop-blur-md border-b border-stone-100 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-kairos-primary text-white rounded-xl flex items-center justify-center shadow-md transition-colors">
              <ShieldCheck size={22} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-lg leading-tight tracking-tight">
                {center?.name || 'Kairós'}
              </h1>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Salud Mental</span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/portal-pacientes" className="text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors">
              Soy Paciente
            </Link>
            <Link href="/agendar" className="bg-kairos-primary text-white hover:bg-kairos-primary/90 transition-all px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm">
              Agendar Sesión
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-10 px-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-4xl w-full text-center space-y-8"
        >
          {/* Badge Superior */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <span className="bg-white border border-stone-200 text-stone-600 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2">
              <Sparkles size={14} className="text-kairos-accent" /> Atención Psicológica Especializada
            </span>
          </motion.div>

          {/* Titular */}
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl md:text-7xl font-bold text-stone-900 tracking-tight leading-[1.1]">
            Tu bienestar mental, <br />
            <span className="text-kairos-accent transition-colors">nuestra prioridad.</span>
          </motion.h1>

          {/* Bajada */}
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed">
            Un espacio seguro, profesional y confidencial diseñado para tu tranquilidad. Agenda tu sesión online o presencial en menos de 2 minutos.
          </motion.p>

          {/* Tarjetas de Acción (Embudo) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-8">
            
            {/* Card Agendar */}
            <Link href="/agendar" className="group text-left">
              <div className="bg-white border border-stone-100 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all h-full relative overflow-hidden flex flex-col justify-between">
                <div className="h-14 w-14 bg-stone-50 text-kairos-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Agendar nueva cita</h3>
                  <p className="text-sm text-stone-500 mb-6">Revisa la disponibilidad de nuestros especialistas y reserva tu hora de inmediato.</p>
                </div>
                <div className="flex items-center gap-2 text-kairos-accent font-semibold text-sm group-hover:text-kairos-primary transition-colors">
                  Comenzar ahora <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card Portal */}
            <Link href="/portal-pacientes" className="group text-left">
              <div className="bg-kairos-primary border border-kairos-primary/80 p-8 rounded-[2rem] shadow-md hover:shadow-xl transition-all h-full relative overflow-hidden flex flex-col justify-between text-white">
                <div className="h-14 w-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/10">
                  <User size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Portal de Pacientes</h3>
                  <p className="text-sm text-white/70 mb-6">Ingresa para gestionar tus citas, revisar tu historial y acceder a enlaces de telemedicina.</p>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold text-sm opacity-90 group-hover:opacity-100">
                  Acceder a mi cuenta <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Banderas de Confianza */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 border-t border-stone-200 pt-10 flex flex-wrap justify-center gap-10 text-stone-400"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest"><HeartHandshake size={18} /> Profesionales Clínicos</div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest"><ShieldCheck size={18} /> Privacidad Absoluta</div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest"><Clock size={18} /> Gestión Rápida</div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-stone-200 bg-white/50 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 font-medium">
            © {new Date().getFullYear()} {center?.name || 'Centro Clínico'}. Impulsado por Kairós.
          </p>
          <Link href="/admin" className="text-[10px] font-bold text-stone-400 hover:text-kairos-accent uppercase tracking-widest transition-colors flex items-center gap-2">
            <ShieldCheck size={14} /> Acceso Equipo Clínico
          </Link>
        </div>
      </footer>

    </div>
  );
}