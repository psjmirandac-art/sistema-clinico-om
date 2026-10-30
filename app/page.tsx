'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Sparkles, Calendar, User, Users, Building2, 
  ArrowRight, CheckCircle2, Mic, Wallet, DoorOpen, Lock, 
  Clock, HeartHandshake
} from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/providers/TenantProvider';

export default function HomePage() {
  const { center } = useTenant();
  const [viewMode, setViewMode] = useState<'saas' | 'patient'>('saas');
  const [accountTypeTab, setAccountTypeTab] = useState<'independiente' | 'centro'>('independiente');

  // Si la URL trae ?centro=slug, mostramos directamente el portal del paciente de ese centro/profesional
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('centro')) {
        setViewMode('patient');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans text-stone-800 selection:bg-[#E4ECE7]">
      
      {/* NAVBAR GLOBAL INTELIGENTE */}
      <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center shadow-xs">
              <ShieldCheck size={22} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-sm leading-tight">
                {viewMode === 'patient' ? (center?.name || 'Kairós Clínico') : 'Kairós'}
              </h1>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">
                {viewMode === 'patient' ? 'Salud Mental' : 'Plataforma Clínica & SaaS'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Conmutador rápido entre la web comercial y el portal de pacientes */}
            <button
              onClick={() => setViewMode(viewMode === 'saas' ? 'patient' : 'saas')}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors"
            >
              {viewMode === 'saas' ? 'Soy Paciente' : '← Volver a Kairós Profesionales'}
            </button>

            {viewMode === 'saas' ? (
              <>
                <Link 
                  href="/admin" 
                  className="text-xs font-semibold text-stone-700 hover:text-[#2C4A3B] px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-[#2C4A3B] transition-all"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/onboarding" 
                  className="bg-[#2C4A3B] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#233b2f] transition-all shadow-xs flex items-center gap-1.5"
                >
                  Crear Cuenta <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/portal-pacientes" 
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2"
                >
                  Mi Portal
                </Link>
                <Link 
                  href="/agendar" 
                  className="bg-[#2C4A3B] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#233b2f] transition-all shadow-xs"
                >
                  Agendar Sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        
        {/* =========================================================
            MODO 1: LANDING COMERCIAL PARA INDEPENDIENTES Y CENTROS
           ========================================================= */}
        {viewMode === 'saas' && (
          <motion.main 
            key="saas-landing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-6xl mx-auto px-6 py-14 sm:py-20 space-y-20"
          >
            {/* HERO SECTION */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 bg-white border border-stone-200/80 px-4 py-1.5 rounded-full shadow-2xs">
                <Sparkles size={13} className="text-[#5F8575]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                  Para Profesionales Independientes y Centros de Salud
                </span>
              </div>

              <h2 className="text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight leading-[1.08]">
                Tu consulta o centro clínico,{' '}
                <span className="text-[#5F8575] block sm:inline">en piloto automático.</span>
              </h2>

              <p className="text-stone-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Agenda sincronizada con Google Calendar, fichas clínicas por voz con IA, certificados en 1 clic, control de boxes físicos y cobros sin inasistencias.
              </p>

              {/* Selector interactivo de modalidad */}
              <div className="inline-flex p-1.5 bg-stone-200/70 rounded-2xl border border-stone-200">
                <button
                  onClick={() => setAccountTypeTab('independiente')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    accountTypeTab === 'independiente' 
                      ? 'bg-white text-stone-900 shadow-xs' 
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <User size={15} className="text-[#2C4A3B]" /> Soy Profesional Independiente
                </button>
                <button
                  onClick={() => setAccountTypeTab('centro')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    accountTypeTab === 'centro' 
                      ? 'bg-white text-stone-900 shadow-xs' 
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Building2 size={15} className="text-[#2C4A3B]" /> Represento un Centro Clínico
                </button>
              </div>
            </div>

            {/* TARJETAS GEMELAS DE ACCESO Y REGISTRO (INDEPENDIENTE VS CENTRO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* Tarjeta 1: Profesional Independiente */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={`rounded-[2rem] p-8 transition-all border flex flex-col justify-between ${
                  accountTypeTab === 'independiente'
                    ? 'bg-white border-[#2C4A3B] shadow-[0_12px_40px_rgb(0,0,0,0.06)]'
                    : 'bg-white/80 border-stone-200/80 shadow-xs'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center">
                      <User size={22} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[#F4F7F5] text-[#2C4A3B] px-3 py-1 rounded-full">
                      Consulta Individual
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Profesional Independiente</h3>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      Diseñado para psicólogos, psiquiatras y terapeutas que atienden en su propia consulta online o presencial.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-stone-600 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#2C4A3B] shrink-0" /> Link propio de agendamiento y Vitrina personal</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#2C4A3B] shrink-0" /> Dictado de fichas clínicas y certificados con IA</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#2C4A3B] shrink-0" /> Finanzas personales (Bruto vs Neto) y paquetes de sesiones</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#2C4A3B] shrink-0" /> Sincronización con tu Google Calendar y Meet</li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link 
                    href="/onboarding?type=independiente"
                    className="w-full bg-[#2C4A3B] text-white font-semibold text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-[#233b2f] transition-colors"
                  >
                    Crear mi Consulta Independiente <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>

              {/* Tarjeta 2: Centro Clínico Multi-Profesional */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={`rounded-[2rem] p-8 transition-all border flex flex-col justify-between ${
                  accountTypeTab === 'centro'
                    ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-[0_12px_40px_rgb(0,0,0,0.1)]'
                    : 'bg-[#2C4A3B] text-white border-[#2C4A3B] opacity-95'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
                      <Building2 size={22} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/15 text-emerald-100 px-3 py-1 rounded-full">
                      Multi-Profesional & Boxes
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">Registra tu Centro Clínico</h3>
                    <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed">
                      Para centros médicos y psicológicos con múltiples terapeutas, boxes físicos de atención y dirección clínica.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-emerald-50 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300 shrink-0" /> Gestión de múltiples terapeutas y asientos (Admin gratis)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300 shrink-0" /> Control de Boxes físicos y bloqueo de salas ocupadas</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300 shrink-0" /> Reportes ejecutivos de ocupación y liquidación por doctor</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300 shrink-0" /> Identidad corporativa propia (Colores y URL de tu clínica)</li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link 
                    href="/onboarding?type=centro"
                    className="w-full bg-white text-[#2C4A3B] font-bold text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors"
                  >
                    Registrar mi Centro Clínico <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* BENTO GRID DE DIFERENCIADORES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center">
                  <Mic size={18} />
                </div>
                <h4 className="font-bold text-sm text-stone-900">Fichas y Certificados con IA</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Graba o dicta la evolución de la sesión y deja que Groq IA redacte la ficha psicológica estructurada y los certificados en segundos.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center">
                  <DoorOpen size={18} />
                </div>
                <h4 className="font-bold text-sm text-stone-900">Boxes Físicos y Telemedicina</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Tanto si tienes 1 consulta propia como 15 boxes en un centro, el sistema evita choques de sala y genera links de Google Meet.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <h4 className="font-bold text-sm text-stone-900">Finanzas y Anulación por No Pago</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Recupera el 82% de las horas impagas liberando el cupo automáticamente, vende paquetes de sesiones y descarga reportes CSV.
                </p>
              </div>
            </div>

            {/* BANNER INFERIOR PARA PACIENTES */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                  <HeartHandshake size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">¿Eres paciente y buscas agendar o entrar a tu sesión?</h4>
                  <p className="text-xs text-stone-500">Accede a la vista de pacientes para reservar hora o revisar tus enlaces de videollamada.</p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('patient')}
                className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold shrink-0 transition-colors"
              >
                Ir al Portal de Pacientes →
              </button>
            </div>
          </motion.main>
        )}

        {/* =========================================================
            MODO 2: PORTAL DE PACIENTES (VISTA CLÍNICA / INDEPENDIENTE)
           ========================================================= */}
        {viewMode === 'patient' && (
          <motion.main 
            key="patient-landing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-14"
          >
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white border border-stone-200/80 px-4 py-1.5 rounded-full shadow-2xs">
                <Sparkles size={13} className="text-[#5F8575]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                  Atención Psicológica Especializada
                </span>
              </div>

              <h2 className="text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight leading-tight">
                Tu bienestar mental,{' '}
                <span className="text-[#5F8575] block">nuestra prioridad.</span>
              </h2>

              <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
                Un espacio seguro, profesional y confidencial diseñado para tu tranquilidad. Agenda tu sesión online o presencial en menos de 2 minutos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
              <Link 
                href="/agendar"
                className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[#2C4A3B] transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center">
                    <Calendar size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">Agendar nueva cita</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Revisa la disponibilidad de nuestros especialistas y reserva tu hora de inmediato.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#2C4A3B] pt-6 inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  Comenzar ahora <ArrowRight size={14} />
                </span>
              </Link>

              <Link 
                href="/portal-pacientes"
                className="bg-[#2C4A3B] text-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-[#233b2f] transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                    <User size={22} />
                  </div>
                  <h3 className="text-xl font-bold">Portal de Pacientes</h3>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    Ingresa para gestionar tus citas, revisar tu historial y acceder a enlaces de telemedicina.
                  </p>
                </div>
                <span className="text-xs font-bold text-white pt-6 inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  Acceder a mi cuenta <ArrowRight size={14} />
                </span>
              </Link>
            </div>

            <div className="pt-8 border-t border-stone-200/70 max-w-2xl mx-auto flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <span className="flex items-center gap-1.5"><Users size={13} /> Profesionales Clínicos</span>
              <span className="flex items-center gap-1.5"><Lock size={13} /> Privacidad Absoluta</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> Gestión Rápida</span>
            </div>
          </motion.main>
        )}

      </AnimatePresence>
    </div>
  );
}