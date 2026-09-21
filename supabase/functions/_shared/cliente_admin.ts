// Cliente Supabase com service_role — só roda dentro das Edge Functions,
// nunca é exposto ao navegador. Usado para ler/gravar tokens do Google
// e inscrições de push.
import { createClient } from "npm:@supabase/supabase-js@2";

export function clienteAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
