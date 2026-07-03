// Copy this file to supabase-config.ts and fill in your Supabase project details
// Get these values from your Supabase project dashboard: https://supabase.com/dashboard

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-project-url',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key',
} as const;

// Required environment variables:
// NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
