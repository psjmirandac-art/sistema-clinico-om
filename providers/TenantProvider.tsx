'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TenantContextType {
  center: { id: string; name: string; slug: string; boxes_count: number } | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({ center: null, loading: true });

// Fallback seguro para evitar que el build reviente si las envs no están definidas en Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      try {
        // Si estamos en entorno de pruebas sin envs reales, evitamos la consulta
        if (supabaseUrl.includes('placeholder')) {
          setCenter({ id: 'demo-center', name: 'Kairós Clínico', slug: 'kairos', boxes_count: 2 });
          setLoading(false);
          return;
        }

        const hostname = window.location.hostname;
        const slug = hostname.includes('localhost') ? 'centro-om' : hostname.split('.')[0];
        
        const { data } = await supabase.from('centers').select('*').eq('slug', slug).maybeSingle();
        if (data) {
          setCenter(data);
        } else {
          // Fallback por defecto al primer centro disponible
          const { data: firstCenter } = await supabase.from('centers').select('*').limit(1).maybeSingle();
          setCenter(firstCenter || { id: 'demo-center', name: 'Kairós Clínico', slug: 'kairos', boxes_count: 2 });
        }
      } catch (err) {
        console.error('Error cargando tenant:', err);
        setCenter({ id: 'demo-center', name: 'Kairós Clínico', slug: 'kairos', boxes_count: 2 });
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ center, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);