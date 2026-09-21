// Espelha um compromisso da agenda no Google Calendar do profissional
// responsável. Chamada pelo agenda.html depois de salvar/excluir um evento.
import { clienteAdmin } from "../_shared/cliente_admin.ts";
import { renovarAccessToken, upsertEventoGoogle, excluirEventoGoogle } from "../_shared/google.ts";

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CABECALHOS_CORS });

  try {
    const { eventoId, acao } = await req.json();
    const admin = clienteAdmin();

    const { data: evento, error: erroEvento } = await admin
      .from("eventos_calendario")
      .select("id, titulo, observacoes, local, data_inicio, data_fim, responsavel_nome, google_event_id")
      .eq("id", eventoId)
      .single();
    if (erroEvento || !evento) throw erroEvento ?? new Error("Evento não encontrado");

    // Não há FK de evento -> perfil; o responsável é gravado por nome
    // (Tami / Stefania / Outra), então resolvemos o perfil por esse nome.
    const { data: perfilResponsavel } = await admin
      .from("perfis")
      .select("id")
      .eq("nome", evento.responsavel_nome)
      .maybeSingle();
    const perfilId = perfilResponsavel?.id;
    if (!perfilId) return new Response(JSON.stringify({ skipped: "sem perfil responsável vinculado" }), { headers: CABECALHOS_CORS });

    const { data: integracao } = await admin
      .from("integracoes_google")
      .select("refresh_token, calendar_id")
      .eq("perfil_id", perfilId)
      .maybeSingle();
    if (!integracao) return new Response(JSON.stringify({ skipped: "perfil não conectou o Google Calendar" }), { headers: CABECALHOS_CORS });

    const accessToken = await renovarAccessToken(integracao.refresh_token);

    if (acao === "excluir") {
      if (evento.google_event_id) await excluirEventoGoogle(accessToken, integracao.calendar_id, evento.google_event_id);
      return new Response(JSON.stringify({ ok: true }), { headers: CABECALHOS_CORS });
    }

    const eventoGoogle = await upsertEventoGoogle(accessToken, integracao.calendar_id, evento.google_event_id, {
      titulo: evento.titulo,
      descricao: evento.observacoes ?? undefined,
      local: evento.local ?? undefined,
      inicio: evento.data_inicio,
      fim: evento.data_fim ?? evento.data_inicio,
    });

    if (!evento.google_event_id) {
      await admin.from("eventos_calendario").update({ google_event_id: eventoGoogle.id }).eq("id", eventoId);
    }

    return new Response(JSON.stringify({ ok: true, googleEventId: eventoGoogle.id }), {
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
