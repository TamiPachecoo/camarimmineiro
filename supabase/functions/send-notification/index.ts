// Alvo de um Database Webhook do Supabase (configurado no dashboard:
// Database → Webhooks) em INSERT de eventos_calendario e UPDATE de
// clientes.status. Recebe o payload padrão do webhook e manda push
// para todos os dispositivos inscritos.
import { clienteAdmin } from "../_shared/cliente_admin.ts";
import { enviarPush } from "../_shared/push.ts";

const ROTULOS_STATUS: Record<string, string> = {
  contato: "Contato",
  orcamento: "Orçamento",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    let titulo = "Camarim Mineiro";
    let corpo = "";
    let url = "index.html";

    if (table === "eventos_calendario" && type === "INSERT") {
      titulo = "Novo compromisso agendado";
      corpo = record.titulo || "Um novo compromisso foi adicionado à agenda.";
      url = "agenda.html";
    } else if (table === "clientes" && type === "UPDATE" && record.status !== old_record?.status) {
      titulo = `${record.nome_noiva}: ${ROTULOS_STATUS[record.status] ?? record.status}`;
      corpo = `Status mudou de "${ROTULOS_STATUS[old_record?.status] ?? old_record?.status}" para "${ROTULOS_STATUS[record.status] ?? record.status}".`;
      url = "clientes.html";
    } else {
      return new Response(JSON.stringify({ skipped: true }), { headers: { "Content-Type": "application/json" } });
    }

    const admin = clienteAdmin();
    const { data: inscricoes } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");

    const resultados = await Promise.allSettled(
      (inscricoes ?? []).map((inscricao) => enviarPush(inscricao, { titulo, corpo, url })),
    );

    // Remove inscrições que o navegador já revogou (erro 404/410)
    const expiradas = (inscricoes ?? []).filter((_, i) => {
      const r = resultados[i];
      return r.status === "rejected" && [404, 410].includes((r.reason as any)?.statusCode);
    });
    if (expiradas.length) {
      await admin.from("push_subscriptions").delete().in("id", expiradas.map((e) => e.id));
    }

    return new Response(JSON.stringify({ enviados: resultados.filter((r) => r.status === "fulfilled").length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (erro) {
    console.error(erro);
    return new Response(JSON.stringify({ error: String(erro) }), { status: 500 });
  }
});
