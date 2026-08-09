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

  // No session — sign in anonymously
  const { data: anonData, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Auth error: ${error.message}`);
  if (!anonData.session?.access_token) {
    throw new Error('No session after anonymous sign-in');
  }
  return anonData.session.access_token;
}