'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface CenterConfig {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  accent_color: string;
}

interface TenantContextType {
  center: CenterConfig | null;
  loading: boolean;
  switchCenter: (slug: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  center: null,
  loading: true,
  switchCenter: async () => {},
});

export function TenantProvider({ children, defaultSlug = 'centro-om' }: { children: React.ReactNode, defaultSlug?: string }) {
  const [center, setCenter] = useState<CenterConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCenterBySlug = async (slug: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      setCenter(data);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--kairos-primary', data.primary_color || '#2C4A3B');
        document.documentElement.style.setProperty('--kairos-accent', data.accent_color || '#5F8575');
      }
    } else {
      setCenter({
        id: 'default',
        name: 'Kairós Clínico',
        slug: defaultSlug,
        primary_color: '#2C4A3B',
        accent_color: '#5F8575'
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCenterBySlug(defaultSlug);
  }, [defaultSlug]);

  const switchCenter = async (slug: string) => {
    await fetchCenterBySlug(slug);
  };

  return (
    <TenantContext.Provider value={{ center, loading, switchCenter }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);