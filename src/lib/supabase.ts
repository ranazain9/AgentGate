import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Get a valid JWT for calling edge functions.
 * If an anonymous session exists, returns its token.
 * If not, creates a new anonymous session first.
 */
export async function getEdgeToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    return data.session.access_token;
  }

  // Fallback to the public Anon Key so we don't require Authentication configuration
  return SUPABASE_ANON_KEY;
}