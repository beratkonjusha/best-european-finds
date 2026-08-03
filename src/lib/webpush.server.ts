/**
 * Web-Push (RFC 8291 / aes128gcm + RFC 8292 VAPID) auf WebCrypto-Basis.
 * Läuft im Edge-/Worker-Runtime ohne Node-only Abhängigkeiten.
 */

const enc = new TextEncoder();

/** WebCrypto-Typen erwarten ArrayBuffer-basierte Views. */
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", bs(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, bs(data)));
}

async function importVapidPrivateKey(privateD: string, publicRaw: Uint8Array) {
  const x = bytesToB64url(publicRaw.slice(1, 33));
  const y = bytesToB64url(publicRaw.slice(33, 65));
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: privateD, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function vapidHeader(endpoint: string, publicKey: string, privateKey: string, subject: string) {
  const audience = new URL(endpoint).origin;
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const unsigned = `${header}.${payload}`;
  const key = await importVapidPrivateKey(privateKey, b64urlToBytes(publicKey));
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned)),
  );
  return `vapid t=${unsigned}.${bytesToB64url(sig)}, k=${publicKey}`;
}

async function encryptPayload(
  payload: string,
  uaPublicRaw: Uint8Array,
  authSecret: Uint8Array,
): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const asKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey(
    "raw",
    bs(uaPublicRaw),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256),
  );

  const prkKey = await hmac(authSecret, shared);
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublicRaw, asPublicRaw);
  const ikm = await hmac(prkKey, concat(keyInfo, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);

  const aesKey = await crypto.subtle.importKey("raw", bs(cek), { name: "AES-GCM" }, false, ["encrypt"]);
  const record = concat(enc.encode(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: bs(nonce) }, aesKey, bs(record)),
  );

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([asPublicRaw.length]), asPublicRaw, ciphertext);
}

export type PushSubscriptionRecord = {
  endpoint: string;
  keys: { p256dh?: string; auth?: string } | Record<string, unknown>;
};

export type PushResult = { ok: boolean; status: number; gone: boolean };

export async function sendWebPush(
  sub: PushSubscriptionRecord,
  payload: Record<string, unknown>,
  ttlSeconds = 3600,
): Promise<PushResult> {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:push@eurodeal.app";
  if (!publicKey || !privateKey) return { ok: false, status: 500, gone: false };

  const keys = sub.keys as { p256dh?: string; auth?: string };
  if (!keys?.p256dh || !keys?.auth) return { ok: false, status: 400, gone: true };

  const body = await encryptPayload(
    JSON.stringify(payload),
    b64urlToBytes(keys.p256dh),
    b64urlToBytes(keys.auth),
  );

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      TTL: String(ttlSeconds),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: await vapidHeader(sub.endpoint, publicKey, privateKey, subject),
    },
    body: body as unknown as BodyInit,
  });

  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
