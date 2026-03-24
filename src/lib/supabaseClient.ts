import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Database features will not work until configured in .env');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      storageKey: 'sb-vxenjlgoatbkfrfrkoeq-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Disable navigator lock to prevent lock contention under React StrictMode
      lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      },
    },
  }
);
