// Envio de notificações push (Web Push / VAPID). Usa a lib `web-push`
// via especificador npm: (suportado pelo runtime Deno das Edge Functions).
import webpush from "npm:web-push@3";

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@camarimmineiro.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

export async function enviarPush(
  inscricao: { endpoint: string; p256dh: string; auth: string },
  payload: { titulo: string; corpo: string; url?: string },
) {
  const assinatura = {
    endpoint: inscricao.endpoint,
    keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
  };
  try {
    await webpush.sendNotification(assinatura, JSON.stringify(payload));
  } catch (erro) {
    // 410/404 = inscrição expirada/revogada — não é um erro do sistema
    console.error(`Push falhou para ${inscricao.endpoint.slice(-12)}:`, erro?.statusCode ?? erro);
    throw erro;
  }
}
