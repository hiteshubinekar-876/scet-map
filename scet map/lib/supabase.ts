import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable extraction (supports both ANON_KEY and PUBLISHABLE_KEY naming)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// Validation helper to avoid runtime throws on unconfigured or placeholder credentials
function isValidSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url.includes('YOUR_PROJECT') || key.includes('YOUR_SUPABASE')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = isValidSupabaseConfig(supabaseUrl, supabaseKey);

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    try {
      cachedClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('[CampusPath] Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return cachedClient;
}

export const supabase = getSupabaseClient();

/**
 * Health check helper to test database connectivity
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials not configured. Running in offline demo mode.',
    };
  }

  try {
    const { error } = await client.from('floors').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Database connection error: ${error.message}. Running in demo mode.`,
      };
    }
    return {
      connected: true,
      message: 'Connected to Supabase live database.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Database ping failed: ${message}. Running in demo mode.`,
    };
  }
}

