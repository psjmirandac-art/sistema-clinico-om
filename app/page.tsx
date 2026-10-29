import Link from 'next/link';
import { Calendar, Users, ShieldCheck, ArrowRight, UserCircle, LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">OM</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Centro OM</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login-pacientes" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
              <UserCircle className="w-4 h-4" />
              Portal Pacientes
            </Link>
            <div className="w-px h-4 bg-slate-300"></div>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
              <LogIn className="w-4 h-4" />
              Acceso Equipo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (Bienvenida) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Tu bienestar mental, <span className="text-blue-600">nuestra prioridad</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Agenda tu sesión de psicoterapia presencial u online en menos de 2 minutos. 
          Encuentra el espacio seguro que necesitas para sanar y crecer.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/agendar" className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-200">
            <Calendar className="w-5 h-5" />
            Agendar mi primera sesión
          </Link>
        </div>
      </section>

      {/* SECCIÓN: CONOCE A NUESTROS TERAPEUTAS */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Conoce a nuestro equipo</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Contamos con profesionales altamente capacitados en diversas áreas de la psicología, listos para acompañarte en tu proceso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tarjeta Terapeuta 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow text-center">
              <div className="w-24 h-24 mx-auto bg-slate-300 rounded-full mb-4 overflow-hidden">
                {/* Puedes poner un tag <img /> aquí */}
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-2xl">JM</div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Jaime Miranda</h3>
              <p className="text-sm text-blue-600 font-medium mb-3">Psicólogo Clínico Adultos</p>
              <p className="text-sm text-slate-500 mb-6">Especialista en ansiedad, depresión y terapia sistémica.</p>
              <Link href="/agendar?profesional=jaime" className="text-blue-600 font-medium text-sm hover:underline flex items-center justify-center gap-1">
                Ver disponibilidad <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Tarjeta Terapeuta 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow text-center">
              <div className="w-24 h-24 mx-auto bg-slate-300 rounded-full mb-4 overflow-hidden">
                <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-500 font-bold text-2xl">IO</div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ivette Olivares</h3>
              <p className="text-sm text-purple-600 font-medium mb-3">Psicóloga Infanto-Juvenil</p>
              <p className="text-sm text-slate-500 mb-6">Enfoque en desarrollo emocional, crianza y terapia familiar.</p>
              <Link href="/agendar?profesional=ivette" className="text-blue-600 font-medium text-sm hover:underline flex items-center justify-center gap-1">
                Ver disponibilidad <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Tarjeta Terapeuta 3 (Ejemplo) */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow text-center flex flex-col justify-center border-dashed">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Ver todo el equipo</h3>
              <p className="text-sm text-slate-500 mb-6">Conoce a todos nuestros especialistas y sus enfoques.</p>
              <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                Ver directorio completo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE VENTAJAS (Estilo tarjetas informativas) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Agendamiento 100% online</h3>
            <p className="text-slate-600">Revisa la disponibilidad en tiempo real y reserva tu hora al instante, sin esperas ni llamadas telefónicas.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Telemedicina integrada</h3>
            <p className="text-slate-600">Conéctate a tus sesiones desde cualquier lugar con enlaces seguros de Google Meet generados automáticamente.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Privacidad garantizada</h3>
            <p className="text-slate-600">Tus datos y registros clínicos están encriptados bajo los más altos estándares de seguridad y confidencialidad.</p>
          </div>
        </div>
      </section>
      
      {/* FOOTER BÁSICO */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Centro Clínico OM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}