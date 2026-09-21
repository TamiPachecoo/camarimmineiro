// Chamada por um agendamento pg_cron (ver supabase/SETUP.md) a cada
// 30 min. Manda um lembrete de push para compromissos que começam nas
// próximas horas e ainda não tiveram lembrete enviado.
import { clienteAdmin } from "../_shared/cliente_admin.ts";
import { enviarPush } from "../_shared/push.ts";

const HORAS_DE_ANTECEDENCIA = 24; // lembrete no dia anterior

Deno.serve(async () => {
  try {
    const admin = clienteAdmin();
    const agora = new Date();
    const limite = new Date(agora.getTime() + HORAS_DE_ANTECEDENCIA * 60 * 60 * 1000);

    const { data: eventos, error } = await admin
      .from("eventos_calendario")
      .select("id, titulo, local, data_inicio, responsavel_nome")
      .eq("lembrete_enviado", false)
      .gte("data_inicio", agora.toISOString())
      .lte("data_inicio", limite.toISOString());
    if (error) throw error;

    const { data: inscricoes } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");

    for (const evento of eventos ?? []) {
      const hora = new Date(evento.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const local = evento.local ? ` em ${evento.local}` : "";
      const payload = {
        titulo: "Compromisso amanhã",
        corpo: `${evento.titulo} às ${hora}${local}${evento.responsavel_nome ? ` — ${evento.responsavel_nome}` : ""}`,
        url: "agenda.html",
      };
      await Promise.allSettled((inscricoes ?? []).map((inscricao) => enviarPush(inscricao, payload)));
      await admin.from("eventos_calendario").update({ lembrete_enviado: true }).eq("id", evento.id);
    }

    return new Response(JSON.stringify({ lembretesEnviados: (eventos ?? []).length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (erro) {
    console.error(erro);
    return new Response(JSON.stringify({ error: String(erro) }), { status: 500 });
  }
});
