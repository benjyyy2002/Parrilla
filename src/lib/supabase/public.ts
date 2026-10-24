import { createClient } from "@supabase/supabase-js";

/** Cliente sin sesión, para datos públicos (link compartido, imágenes para redes). */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
