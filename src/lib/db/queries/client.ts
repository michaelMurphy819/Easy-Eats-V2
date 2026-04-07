import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // This is the fix: it stops Supabase from fighting over browser locks
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // In dev, sometimes it's safer to use 'localstorage' if 'indexeddb' is locking
        storageKey: 'sb-auth-token', 
      }
    }
  )
}