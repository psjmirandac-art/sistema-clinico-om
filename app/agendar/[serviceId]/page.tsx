'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';

// Tipado estricto para proteger el build en Vercel
interface Service {
  id: string;
  name?: string;
  nombre?: string;
  price?: number;
  precio?: number;
  description?: string;
  descripcion?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AgendarPage() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionando, setSeleccionando] = useState<string | null>(null);

  useEffect(() => {
    async function cargarServicios() {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        if (data) setServicios(data);
      } catch (err: any) {
        setError('No pudimos cargar los servicios disponibles. Intenta nuevamente.');
      } finally {
        setCargando(false);
      }
    }
    
    cargarServicios();
  }, []);

  const handleSelect = (idServicio: string) => {
    setSeleccionando(idServicio);
    // Retardo sutil para que el usuario alcance a ver la animación de selección
    setTimeout(() => {
      router.push(`/agendar/${idServicio}`);
    }, 400);
  };

  // Variantes de framer-motion con tipado estricto
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center py-16 px-4 font-sans text-stone-800 selection:bg-[#E4ECE7]">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl space-y-8"
      >
        {/* Header Premium */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-white text-[#5F8575] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4 border border-stone-100">
            <Sparkles strokeWidth={1.5} size={30} />
          </div>
          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">¿En qué podemos ayudarte?</h1>
          <p className="text-base text-stone-500 max-w-sm mx-auto">
            Selecciona el tipo de atención que necesitas hoy.
          </p>
        </div>

        {/* Contenedor Principal */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
          <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-6 ml-1">
            Servicios Clínicos
          </h2>

          <AnimatePresence mode="wait">
            {cargando ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <Loader2 className="animate-spin text-[#5F8575]" size={32} />
                <p className="text-sm text-stone-400 font-medium">Cargando opciones...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            ) : servicios.length === 0 ? (
              <motion.div key="empty" className="text-center py-12 text-stone-500 text-sm">
                No hay servicios configurados en el sistema.
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {servicios.map((serv) => {
                  const price = serv.price || serv.precio;
                  return (
                    <motion.button
                      key={serv.id}
                      variants={itemVariants}
                      onClick={() => handleSelect(serv.id)}
                      disabled={seleccionando !== null}
                      whileHover={{ scale: 1.01, backgroundColor: "#F4F7F5" }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-colors text-left group
                        ${seleccionando === serv.id 
                          ? 'border-[#5F8575] bg-[#F4F7F5] shadow-sm' 
                          : 'border-stone-100 bg-white hover:border-[#E4ECE7]'
                        }
                      `}
                    >
                      <div className="flex-1 pr-4">
                        <h3 className="text-base font-semibold text-stone-800">
                          {serv.name || serv.nombre}
                        </h3>
                        {(serv.description || serv.descripcion) && (
                          <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                            {serv.description || serv.descripcion}
                          </p>
                        )}
                        {price && (
                          <p className="text-sm font-medium text-[#5F8575] mt-2">
                            ${price.toLocaleString('es-CL')}
                          </p>
                        )}
                      </div>

                      <div className="text-stone-300 group-hover:text-[#5F8575] transition-colors shrink-0">
                        {seleccionando === serv.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}