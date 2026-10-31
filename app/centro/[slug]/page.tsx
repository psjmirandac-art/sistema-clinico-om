import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Calendar, UserCheck, MapPin } from 'lucide-react';
import Link from 'next/link';

// Usamos el cliente estándar para Server Components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tipado asíncrono para parámetros dinámicos (Next.js 15 ready)
type PageProps = {
  params: Promise<{ slug: string }>;
};

// ⚠️ Usamos generateMetadata para asegurar compatibilidad SEO y evitar errores de prerender
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Portal de Pacientes | ${slug}`,
  };
}

export default async function CenterPatientPortal({ params }: PageProps) {
  // Desestructuración asíncrona segura del parámetro
  const { slug } = await params;

  // Buscamos si existe un centro con ese slug (subdominio)
  const { data: center, error: centerError } = await supabase
    .from('centers')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  // Si no hay centro o hay error, 404 seguro
  if (centerError || !center) {
    notFound();
  }

  // Traemos a los profesionales activos de este centro específico
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name, specialty, role')
    .eq('center_id', center.id)
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans selection:bg-[#2C4A3B] selection:text-white">
      
      {/* Header Institucional de la Clínica */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-stone-900 leading-tight">{center.name}</h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Portal de Pacientes</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
            <MapPin size={14} className="text-[#2C4A3B]" /> Atención Presencial y Online
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Banner de Bienvenida */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Agenda tu sesión en <span className="text-[#2C4A3B]">{center.name}</span>
          </h2>
          <p className="text-stone-500 leading-relaxed">
            Selecciona a tu especialista clínico a continuación para ver su disponibilidad en tiempo real y coordinar tu próxima sesión de forma confidencial.
          </p>
        </div>

        {/* Directorio de Especialistas Filtrado por Tenant */}
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-200 pb-2">
            Equipo Clínico Disponible
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {professionals && professionals.length > 0 ? (
              professionals.map((prof) => (
                <div key={prof.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs hover:shadow-md hover:border-stone-300 transition-all flex flex-col justify-between space-y-5 group">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center font-bold text-xl shrink-0">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{prof.name}</h4>
                      <p className="text-xs font-semibold text-[#2C4A3B] mt-0.5">{prof.specialty || 'Psicoterapia'}</p>
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1.5">
                        <UserCheck size={12} /> Profesional Certificado
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/agendar?terapeuta=${prof.id}`}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 group-hover:bg-[#2C4A3B] group-hover:text-white group-hover:border-[#2C4A3B] transition-colors"
                  >
                    Ver Disponibilidad <Calendar size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-stone-100">
                <p className="text-stone-500 font-medium">No hay profesionales disponibles en este momento.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}