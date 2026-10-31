import { createClient } from '@supabase/supabase-js';
import { env, validateClientEnv } from './env';

validateClientEnv();

export const supabase = createClient(
  env.supabase.url || 'https://placeholder.supabase.co',
  env.supabase.anonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);