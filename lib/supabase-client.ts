import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client for AUTH project only.
// Used for: signIn, signUp, signOut, password reset, getUser on client side.
const supabaseAuthUrl = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!;
const supabaseAuthAnonKey = process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!;

if (!supabaseAuthUrl || !supabaseAuthAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_AUTH_SUPABASE_URL or NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY"
  );
}

export const supabaseAuth = createClient(supabaseAuthUrl, supabaseAuthAnonKey, {
  auth: {
    persistSession: false, // We manage the token manually in localStorage
    autoRefreshToken: false,
    detectSessionInUrl: true, // Needed for password reset redirect
  },
});
