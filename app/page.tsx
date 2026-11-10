'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar, 
  Sparkles, 
  HeartHandshake, 
  MapPin, 
  Video,
  Star,
  User,
  Leaf
} from 'lucide-react';

const ENCUADRADO_URL = "https://enc.do/jaime-miranda-cabrera";

export default function PersonalLandingPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans selection:bg-[#2C4A3B]/20 overflow-x-hidden relative">
      
      {/* Luces Ambientales */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#2C4A3B]/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#C87D65]/5 blur-[100px]" />

      {/* NAVBAR */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 w-full max-w-5xl mx-auto">
        <header className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl px-5 py-3.5 shadow-[0_8px_30px_rgb(28,25,23,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              JM
            </div>
            <div>
              <h1 className="text-sm font-bold text-stone-900 leading-none">Ps. Jaime Miranda Cabrera</h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold block mt-1">
                Psicología Clínica
              </span>
            </div>
          </div>

          <a 
            href={ENCUADRADO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C4A3B] hover:bg-[#1E3329] text-white text-xs font-bold transition-all shadow-sm"
          >
            <span>Agendar Sesión</span>
            <Calendar size={14} />
          </a>
        </header>
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-24 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E4ECE7] text-[11px] font-bold uppercase tracking-[0.15em] text-[#2C4A3B] shadow-sm"
          >
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
            </div>
            <span className="border-l border-stone-200 pl-2">4.9/5.0 en valoraciones de pacientes</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold text-stone-900 tracking-tight leading-[1.05]"
          >
            Reconecta con tu <span className="text-[#2C4A3B] italic pr-2">esencia</span> y vive de forma plena.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-stone-500 max-w-2xl mx-auto leading-relaxed"
          >
            Con un enfoque cercano y profesional, mi objetivo es ayudarte a sanar las partes de ti que lo necesitan y equiparte con herramientas para vivir de manera más consciente. ¿Listo para el cambio?
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <a 
              href={ENCUADRADO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2C4A3B] hover:bg-[#1E3329] text-white font-bold text-sm transition-all shadow-[0_8px_25px_rgb(44,74,59,0.25)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <span>Ver Horarios en Encuadrado</span>
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </section>

        {/* ESPECIALIDADES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: User,
              title: "Adolescentes y Adultos",
              desc: "Acompañamiento especializado para el manejo de ansiedad, depresión y estrés en distintas etapas del desarrollo."
            },
            {
              icon: HeartHandshake,
              title: "Terapia de Pareja",
              desc: "Espacio seguro para reconstruir la comunicación, sanar vínculos y resolver conflictos relacionales profundos."
            },
            {
              icon: Leaf,
              title: "Manejo de Duelo y Estrés",
              desc: "Herramientas clínicas para procesar pérdidas, cerrar ciclos y gestionar la sobrecarga del día a día."
            }
          ].map((pillar, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/60 backdrop-blur-lg rounded-[2rem] p-8 border border-white/60 shadow-[0_8px_30px_rgb(28,25,23,0.03)] hover:bg-white transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center mb-6">
                <pillar.icon size={22} />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{pillar.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* REVIEWS SOCIAL PROOF */}
        <section className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 sm:p-12 border border-[#E4ECE7] shadow-sm">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65]">Experiencia de Pacientes</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">Lo que dicen en consulta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex text-amber-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
              <p className="text-sm text-stone-600 italic leading-relaxed">"Excelente profesional. Tiene una gran capacidad para conectar con adolescentes, generando confianza desde el primer momento."</p>
              <p className="text-xs font-bold text-stone-900">— Ian G.</p>
            </div>
            <div className="space-y-3">
              <div className="flex text-amber-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
              <p className="text-sm text-stone-600 italic leading-relaxed">"Un profesional muy comprometido, empático, muy preocupado de sus pacientes, flexible. Ha ayudado mucho a mi hijo en todo ámbito."</p>
              <p className="text-xs font-bold text-stone-900">— Benjamín D.</p>
            </div>
          </div>
        </section>

        {/* SERVICIOS Y TARIFAS */}
        <section className="space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65]">
              Atención Clínica
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">
              Reserva tu sesión
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Tarjeta 1: Online */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#E4ECE7] shadow-sm flex flex-col justify-between group hover:border-[#2C4A3B]/30 transition-all">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#F9F8F6] text-[#2C4A3B] flex items-center justify-center border border-[#E4ECE7]">
                    <Video size={20} />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-[#EBF3EE] text-[#2C4A3B] text-[10px] font-bold uppercase tracking-wider">
                    Telemedicina
                  </span>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">Terapia Online</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Atención psicológica a través de videollamada. Un espacio confidencial y seguro desde cualquier parte de Chile o el mundo.
                  </p>
                </div>
              </div>

              <a 
                href={ENCUADRADO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full py-4 rounded-2xl bg-[#F9F8F6] group-hover:bg-[#2C4A3B] text-stone-700 group-hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Agendar Hora Online</span>
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Tarjeta 2: Presencial */}
            <div className="bg-[#1E3329] text-white rounded-[2.5rem] p-8 sm:p-10 border border-[#2C4A3B] shadow-lg flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center border border-white/10">
                    <MapPin size={20} />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    La Serena
                  </span>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Terapia Presencial</h3>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    Atención directa. Avenida Balmaceda 1629, Piso 3, Oficina 40, La Serena.
                  </p>
                </div>
              </div>

              <a 
                href={ENCUADRADO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full py-4 rounded-2xl bg-white hover:bg-stone-100 text-[#1E3329] font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Agendar Hora Presencial</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#E4ECE7] bg-white pt-12 pb-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-sm font-bold text-stone-900">Ps. Jaime Miranda Cabrera</h4>
            <p className="text-xs text-stone-500 mt-1">+56 9 7425 8528 · La Serena, Chile</p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-stone-400">
            <span>Powered by Encuadrado</span>
          </div>
        </div>
      </footer>
      
    </div>
  );
}