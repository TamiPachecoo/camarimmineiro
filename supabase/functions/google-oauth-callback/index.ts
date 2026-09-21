// Recebe o redirect do Google após o consentimento, troca o "code" por
// tokens e salva o refresh_token do perfil (Tami ou Stefania). O `state`
// carrega o id do perfil que iniciou a conexão (vindo de integracoes.html).
import { clienteAdmin } from "../_shared/cliente_admin.ts";
import { trocarCodigoPorTokens } from "../_shared/google.ts";

const URL_APP_SUCESSO = Deno.env.get("APP_URL_SUCESSO") ?? "https://SEU-DOMINIO/integracoes.html?google=ok";
const URL_APP_ERRO = Deno.env.get("APP_URL_ERRO") ?? "https://SEU-DOMINIO/integracoes.html?google=erro";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const perfilId = url.searchParams.get("state");
  const erroGoogle = url.searchParams.get("error");

  if (erroGoogle || !code || !perfilId) {
    return Response.redirect(URL_APP_ERRO, 302);
  }

  try {
    const redirectUri = `${url.origin}${url.pathname}`;
    const tokens = await trocarCodigoPorTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      // Google só devolve refresh_token no primeiro consentimento;
      // se o perfil já tinha autorizado antes, é preciso revogar o
      // acesso em myaccount.google.com/permissions e tentar de novo.
      throw new Error("Google não retornou refresh_token (revogue o acesso anterior e tente novamente).");
    }

    const admin = clienteAdmin();
    const { error } = await admin.from("integracoes_google").upsert({
      perfil_id: perfilId,
      refresh_token: tokens.refresh_token,
      atualizado_em: new Date().toISOString(),
    });
    if (error) throw error;

    return Response.redirect(URL_APP_SUCESSO, 302);
  } catch (erro) {
    console.error(erro);
    return Response.redirect(URL_APP_ERRO, 302);
  }
});
