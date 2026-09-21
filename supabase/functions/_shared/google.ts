// Helpers para trocar/renovar tokens do Google e chamar a API de
// Calendar. Segredos (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) vêm
// das variáveis de ambiente da Edge Function — nunca do navegador.

export async function trocarCodigoPorTokens(code: string, redirectUri: string) {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!resp.ok) throw new Error(`Falha ao trocar código: ${await resp.text()}`);
  return resp.json(); // { access_token, refresh_token, expires_in, ... }
}

export async function renovarAccessToken(refreshToken: string) {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) throw new Error(`Falha ao renovar token: ${await resp.text()}`);
  const dados = await resp.json();
  return dados.access_token as string;
}

export async function buscarFreeBusy(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const resp = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });
  if (!resp.ok) throw new Error(`Falha ao consultar disponibilidade: ${await resp.text()}`);
  const dados = await resp.json();
  return (dados.calendars?.[calendarId]?.busy ?? []) as { start: string; end: string }[];
}

export async function upsertEventoGoogle(accessToken: string, calendarId: string, googleEventId: string | null, evento: {
  titulo: string;
  descricao?: string;
  local?: string;
  inicio: string;
  fim: string;
}) {
  const corpo = {
    summary: evento.titulo,
    description: evento.descricao ?? undefined,
    location: evento.local ?? undefined,
    start: { dateTime: evento.inicio },
    end: { dateTime: evento.fim },
  };
  const url = googleEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const resp = await fetch(url, {
    method: googleEventId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });
  if (!resp.ok) throw new Error(`Falha ao sincronizar evento no Google: ${await resp.text()}`);
  return resp.json();
}

export async function excluirEventoGoogle(accessToken: string, calendarId: string, googleEventId: string) {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
  );
}
