import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../supabase-config';

export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);
