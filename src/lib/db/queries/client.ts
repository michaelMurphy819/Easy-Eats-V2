import { createBrowserClient } from '@supabase/ssr'

// 1. Create a variable outside the function to hold the instance
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // 2. If we already have a client, return it instead of making a new one
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-auth-token',
        // 3. Optional: If the lock error persists even with a singleton, 
        // uncomment the line below to bypass the Web Lock API entirely.
        // lock: (name, acquireTimeout, fn) => fn(),
      }
    }
  )

  return client;
}