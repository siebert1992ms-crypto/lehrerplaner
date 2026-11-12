/* Lehrerplaner – lokaler Speicher (IndexedDB). Alle Daten bleiben auf dem Gerät.
   Optional: transparente AES-GCM-Verschlüsselung (setKey). Einträge „meta:*“ bleiben unverschlüsselt. */
(function (root) {
  'use strict';
  let db = null, key = null, locked = false;
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open('lehrerplaner-db', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => { db = r.result; res(); };
    r.onerror = () => rej(r.error);
  });
  const store = mode => db.transaction('kv', mode).objectStore('kv');
  const wrap = req => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  const isMeta = k => String(k).startsWith('meta:');
  const isEnc = v => !!(v && typeof v === 'object' && v.__e === 1);

  async function seal(v) {
    const blob = v instanceof Blob;
    const bytes = blob ? new Uint8Array(await v.arrayBuffer()) : new TextEncoder().encode(JSON.stringify(v));
    const e = await LK.enc(key, bytes);
    return { __e: 1, iv: e.iv, ct: e.ct, blob: blob ? (v.type || '') : null };
  }
  async function unseal(v) {
    if (!key) throw new Error('locked');
    const bytes = await LK.dec(key, v.iv, v.ct);
    return v.blob !== null ? new Blob([bytes], { type: v.blob }) : JSON.parse(new TextDecoder().decode(bytes));
  }
  const rawGet = k => wrap(store('readonly').get(k));
  const rawPut = (k, v) => wrap(store('readwrite').put(v, k));
  const get = async k => { const v = await rawGet(k); return isEnc(v) ? unseal(v) : v; };
  const put = async (k, v) => { if (locked && !key && !isMeta(k)) throw new Error('locked'); return rawPut(k, key && !isMeta(k) ? await seal(v) : v); };
  const del = k => wrap(store('readwrite').delete(k));
  const clear = () => wrap(store('readwrite').clear());
  const keys = () => wrap(store('readonly').getAllKeys());
  /** alle Einträge; skip = Präfixe, die übersprungen werden (z. B. große Ink-/Bilddaten) */
  const all = async (skip = []) => {
    const ents = await new Promise((res, rej) => {
      const out = [], r = store('readonly').openCursor();
      r.onsuccess = () => { const c = r.result; if (!c) return res(out); if (!skip.some(p => String(c.key).startsWith(p))) out.push([c.key, c.value]); c.continue(); };
      r.onerror = () => rej(r.error);
    });
    const out = {};
    for (const [k, v] of ents) out[k] = isEnc(v) ? await unseal(v) : v;
    return out;
  };
  /** alle Nutzdaten (ohne meta:) um-/verschlüsseln: mode 'enc' | 'dec' */
  async function migrate(mode) {
    for (const k of await keys()) {
      if (isMeta(k)) continue;
      const raw = await rawGet(k);
      if (mode === 'enc' && !isEnc(raw)) await rawPut(k, await seal(raw));
      else if (mode === 'dec' && isEnc(raw)) await rawPut(k, await unseal(raw));
    }
  }
  root.DB = { open, get, put, del, clear, all, keys, rawGet, rawPut, migrate, setKey: (k, lk) => { key = k; locked = !k && !!lk; }, hasKey: () => !!key };
})(window);
