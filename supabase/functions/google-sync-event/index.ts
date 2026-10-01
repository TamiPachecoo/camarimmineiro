// Espelha um compromisso da agenda no Google Calendar de cada profissional
// responsável (pode ser mais de uma/um — atendimentos em grupo). Chamada
// pelo agenda.html depois de salvar/excluir um evento.
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
      .select("id, titulo, observacoes, local, data_inicio, data_fim, responsavel_nome, responsaveis, google_event_ids")
      .eq("id", eventoId)
      .single();
    if (erroEvento || !evento) throw erroEvento ?? new Error("Evento não encontrado");

    // Não há FK de evento -> perfil; os responsáveis são gravados por nome
    // (Tami / Stefania / Outra(s)), então resolvemos o perfil de cada um
    // por esse nome. "Outra" não tem perfil/login próprio, então é ignorada.
    const nomes: string[] = (evento.responsaveis && evento.responsaveis.length)
      ? evento.responsaveis
      : (evento.responsavel_nome ? [evento.responsavel_nome] : []);

    const googleEventIds: Record<string, string> = { ...(evento.google_event_ids ?? {}) };
    const resultados: Record<string, string> = {};

    for (const nome of nomes) {
      const { data: perfilResponsavel } = await admin.from("perfis").select("id").eq("nome", nome).maybeSingle();
      const perfilId = perfilResponsavel?.id;
      if (!perfilId) continue;

      const { data: integracao } = await admin
        .from("integracoes_google")
        .select("refresh_token, calendar_id")
        .eq("perfil_id", perfilId)
        .maybeSingle();
      if (!integracao) continue;

      const accessToken = await renovarAccessToken(integracao.refresh_token);
      const googleEventIdExistente = googleEventIds[perfilId];

      if (acao === "excluir") {
        if (googleEventIdExistente) await excluirEventoGoogle(accessToken, integracao.calendar_id, googleEventIdExistente);
        delete googleEventIds[perfilId];
        continue;
      }

      const eventoGoogle = await upsertEventoGoogle(accessToken, integracao.calendar_id, googleEventIdExistente ?? null, {
        titulo: evento.titulo,
        descricao: evento.observacoes ?? undefined,
        local: evento.local ?? undefined,
        inicio: evento.data_inicio,
        fim: evento.data_fim ?? evento.data_inicio,
      });
      googleEventIds[perfilId] = eventoGoogle.id;
      resultados[nome] = eventoGoogle.id;
    }

    await admin.from("eventos_calendario").update({ google_event_ids: googleEventIds }).eq("id", eventoId);

    return new Response(JSON.stringify({ ok: true, sincronizados: resultados }), {
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
