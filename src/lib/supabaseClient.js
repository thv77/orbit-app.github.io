/**
 * ORBIT HEALTH — Supabase Client Initializer
 * NASA Space Apps Challenge Astronaut Health & Operations Platform
 *
 * Security Notice:
 * - Uses only public client credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * - Service-role credentials must NEVER be placed in client-side code.
 * - Enforces zero-trust role hydration and database Row Level Security.
 * - Provides graceful fallback to offline demonstration mode when environment variables are unset.
 */

import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate presence and shape of environment credentials
export const isConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.trim() !== '' &&
  rawKey.trim() !== '' &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your-project')
)

export const supabase = isConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'orbit-health.auth.token',
      },
    })
  : null

/**
 * Diagnostic helper to report client configuration status without leaking keys.
 */
export function getSupabaseConfigStatus() {
  return {
    isConfigured,
    urlConfigured: Boolean(rawUrl && rawUrl.trim() !== ''),
    keyConfigured: Boolean(rawKey && rawKey.trim() !== ''),
    authMode: isConfigured ? 'LIVE_SUPABASE_AUTH' : 'SIMULATED_DEMO_OFFLINE',
    disclaimer: isConfigured
      ? 'Connected to live Supabase backend with PostgreSQL Row Level Security.'
      : 'Running in simulated demonstration mode. Authentication and registration operate on isolated local state.',
  }
}

