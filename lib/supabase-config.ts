export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
} as const;
