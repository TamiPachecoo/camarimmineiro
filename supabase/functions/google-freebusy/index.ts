// Verifica disponibilidade: recebe uma lista de perfis + uma janela de
// tempo e devolve os blocos ocupados no Google Calendar de cada um que
// estiver conectado. Chamada pelo agenda.html ao checar um novo pedido.
import { clienteAdmin } from "../_shared/cliente_admin.ts";
import { renovarAccessToken, buscarFreeBusy } from "../_shared/google.ts";

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CABECALHOS_CORS });

  try {
    const { perfilIds, inicio, fim } = await req.json();
    if (!Array.isArray(perfilIds) || !inicio || !fim) {
      return new Response(JSON.stringify({ error: "perfilIds, inicio e fim são obrigatórios" }), {
        status: 400,
        headers: { ...CABECALHOS_CORS, "Content-Type": "application/json" },
      });
    }

    const admin = clienteAdmin();
    const { data: integracoes } = await admin
      .from("integracoes_google")
      .select("perfil_id, refresh_token, calendar_id")
      .in("perfil_id", perfilIds);

    const resultado: Record<string, { start: string; end: string }[]> = {};
    for (const integracao of integracoes ?? []) {
      try {
        const accessToken = await renovarAccessToken(integracao.refresh_token);
        resultado[integracao.perfil_id] = await buscarFreeBusy(accessToken, integracao.calendar_id, inicio, fim);
      } catch (erro) {
        console.error(`Freebusy falhou para perfil ${integracao.perfil_id}:`, erro);
        resultado[integracao.perfil_id] = [];
      }
    }

    return new Response(JSON.stringify({ busy: resultado }), {
      headers: { ...CABECALHOS_CORS, "Content-Type": "application/json" },
    });
  } catch (erro) {
    console.error(erro);
    return new Response(JSON.stringify({ error: String(erro) }), {
      status: 500,
      headers: { ...CABECALHOS_CORS, "Content-Type": "application/json" },
    });
  }
});
