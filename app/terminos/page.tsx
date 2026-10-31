import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones de Uso | Kairós Clínico',
  description: 'Condiciones de uso de la plataforma de agendamiento y gestión clínica Kairós Clínico.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-[#2C4A3B] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#2C4A3B] text-white flex items-center justify-center shadow-xs">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-xs text-stone-500">Kairós Clínico • Versión 1.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-10 shadow-xs space-y-6 text-sm text-stone-600 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">1. Objeto del Servicio</h2>
            <p>
              Kairós Clínico provee herramientas digitales de software como servicio (SaaS) destinadas a la 
              coordinación de horarios, asignación de salas físicas (boxes) y registro estructurado de información
              profesional para profesionales de la salud.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">2. Responsabilidad Profesional</h2>
            <p>
              El profesional de la salud o centro clínico suscrito es el único responsable ético y legal de las 
              decisiones médicas, psicológicas o terapéuticas adoptadas durante las sesiones con sus pacientes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">3. Disponibilidad y Seguridad de la Plataforma</h2>
            <p>
              La suite cuenta con protocolos de cifrado TLS 1.3 en tránsito y base de datos con políticas de
              seguridad a nivel de fila (Row Level Security). Nos comprometemos a mantener una disponibilidad 
              de infraestructura continua para la continuidad de la atención médica.
            </p>
          </section>

        </div>

        <footer className="text-center text-xs text-stone-400">
          © 2026 Kairós Clínico. Todos los derechos reservados.
        </footer>

      </div>
    </div>
  );
}