/* Lehrerplaner – Sperre & Verschlüsselung (optional).
   Passwort → PBKDF2-SHA256 (600.000 Runden) → Schlüssel, der einen zufälligen Datenschlüssel (DEK) schützt.
   Alle Daten werden mit AES-256-GCM verschlüsselt. Fingerabdruck = Komfort: Nach erfolgreicher
   Geräte-Verifizierung (WebAuthn) wird der DEK mit einem nicht exportierbaren Geräteschlüssel entsperrt. */
(function (root) {
  'use strict';
  const te = new TextEncoder(), td = new TextDecoder(), S = () => crypto.subtle;
  const rnd = n => crypto.getRandomValues(new Uint8Array(n));
  const b64 = u8 => { u8 = new Uint8Array(u8); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const ITER = 600000;
  async function kek(pw, salt, iter) {
    const km = await S().importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
    return S().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, km, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
  }
  async function wrapWith(pw, dek, salt, iter) {
    const iv = rnd(12), k = await kek(pw, salt, iter);
    const wk = await S().wrapKey('raw', dek, k, { name: 'AES-GCM', iv });
    return { v: 1, iter, salt: b64(salt), iv: b64(iv), wk: b64(wk) };
  }
  const newDek = () => S().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  async function create(pw) { const dek = await newDek(); return { meta: await wrapWith(pw, dek, rnd(16), ITER), dek }; }
  async function openPw(meta, pw) {
    const k = await kek(pw, unb64(meta.salt), meta.iter);
    return S().unwrapKey('raw', unb64(meta.wk), k, { name: 'AES-GCM', iv: unb64(meta.iv) }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }
  async function rewrap(meta, dek, pw) { const m = await wrapWith(pw, dek, rnd(16), ITER); if (meta.bio) m.bio = meta.bio; return m; }
  const plainMeta = meta => ({ v: meta.v, iter: meta.iter, salt: meta.salt, iv: meta.iv, wk: meta.wk });

  async function enc(dek, bytes) { const iv = rnd(12); return { iv, ct: await S().encrypt({ name: 'AES-GCM', iv }, dek, bytes) }; }
  const dec = (dek, iv, ct) => S().decrypt({ name: 'AES-GCM', iv }, dek, ct);

  /* ---- Fingerabdruck (WebAuthn, Plattform-Authenticator) ---- */
  async function bioSupported() {
    try { return !!(root.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() && root.isSecureContext); } catch (_) { return false; }
  }
  async function bioEnroll(dek) {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: rnd(32), rp: { name: 'Lehrerplaner' }, user: { id: rnd(16), name: 'lehrer', displayName: 'Lehrerplaner' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000 } });
    if (!cred) throw new Error('Abgebrochen');
    const devkey = await S().generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const raw = await S().exportKey('raw', dek), e = await enc(devkey, raw);
    return { devkey, bio: { credId: b64(cred.rawId), iv: b64(e.iv), ct: b64(e.ct) } };
  }
  async function bioOpen(bio, devkey) {
    const a = await navigator.credentials.get({ publicKey: { challenge: rnd(32), allowCredentials: [{ type: 'public-key', id: unb64(bio.credId) }], userVerification: 'required', timeout: 60000 } });
    if (!a) throw new Error('Abgebrochen');
    const raw = await dec(devkey, unb64(bio.iv), unb64(bio.ct));
    return S().importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }
  root.LK = { b64, unb64, create, openPw, rewrap, plainMeta, enc, dec, bioSupported, bioEnroll, bioOpen, te, td };
})(window);
