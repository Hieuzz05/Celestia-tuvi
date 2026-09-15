'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseDaCauHinh } from './config';

export function taoSupabaseClient() {
  if (!supabaseDaCauHinh) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
