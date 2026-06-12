import { createClient } from "@supabase/supabase-js";

// Server-side only — used in API routes.
// These are NOT exported to the client bundle.

const authUrl = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!;
const authServiceKey = process.env.AUTH_SUPABASE_SERVICE_ROLE_KEY!;
const dataUrl = process.env.NEXT_PUBLIC_DATA_SUPABASE_URL!;
const dataServiceKey = process.env.DATA_SUPABASE_SERVICE_ROLE_KEY!;

if (!authUrl || !authServiceKey || !dataUrl || !dataServiceKey) {
  throw new Error("Missing required Supabase server environment variables");
}

// AUTH project — service role (for admin.createUser + token verification)
export const supabaseAuthServer = createClient(authUrl, authServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// DATA project — service role (no auth, business data only)
export const supabaseData = createClient(dataUrl, dataServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
