/**
 * Lien de désinscription signé : le compte est dans le lien, avec une
 * signature HMAC (secret EMAIL_UNSUB_SECRET). Sans le secret, impossible de
 * fabriquer le lien de quelqu'un d'autre. Pas d'expiration : un lien de
 * désinscription doit marcher même dans un vieux mail.
 */
const enc = new TextEncoder();

async function key(secret: string) {
  return await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function signUnsubscribe(userId: string, secret: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(`unsub:${userId}`));
  return `${userId}.${b64url(sig).slice(0, 32)}`;
}

export async function verifyUnsubscribe(token: string, secret: string): Promise<string | null> {
  const [userId, sig] = (token || "").split(".");
  if (!userId || !sig || !/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const expected = await signUnsubscribe(userId, secret);
  // Comparaison à temps constant.
  const a = enc.encode(expected), b = enc.encode(`${userId}.${sig}`);
  if (a.length !== b.length) return null;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0 ? userId : null;
}

export const unsubscribeUrl = (functionsBase: string, token: string) =>
  `${functionsBase}/email-unsubscribe?t=${encodeURIComponent(token)}`;
