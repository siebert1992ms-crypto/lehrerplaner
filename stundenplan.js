/* Lehrerplaner – Stundenplan
   Mehrere Stundenpläne mit „gültig ab“-Datum. Ein Plan gilt bis zum Tag vor dem nächsten Plan.
   Wochenseiten: jede Tagesspalte (Mo–Fr) wird in 4 gleich große Blöcke (1./2. … 7./8. Std.) geteilt,
   darin stehen die Klassen des an diesem Tag gültigen Plans (nicht an Ferien-/Feiertagen).
   Daten: IndexedDB-Schlüssel „stundenplaene“ (wird mit gesichert/verschlüsselt wie alles andere). */
(function () {
  'use strict';
  const KEY = 'stundenplaene';
  const BLK = ['1./2.', '3./4.', '5./6.', '7./8.'];
  const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const deIso = iso => (iso ? PL.de(PL.parseISO(iso)) : '');
  let sel = null;

  /* ---------- Speicher ---------- */
  async function load() { try { return (await DB.get(KEY)) || []; } catch (e) { return []; } }
  const save = plans => DB.put(KEY, plans).catch(e => console.error(e));
  const sorted = plans => plans.slice().sort((a, b) => (a.ab || '').localeCompare(b.ab || ''));
  function planFor(plans, iso) { let p = null; for (const x of sorted(plans)) if (x.ab && x.ab <= iso) p = x; return p; }
  function bisOf(plans, p) {
    const s = sorted(plans), i = s.indexOf(p), n = s[i + 1];
    return n && n.ab ? PL.iso(PL.addDays(PL.parseISO(n.ab), -1)) : null;
  }
  async function classNames() {
    try { const ks = (await DB.keys()).filter(k => String(k).startsWith('class:')); const out = []; for (const k of ks) { const c = await DB.get(k); if (c && c.name) out.push(c.name); } return out.sort((a, b) => a.localeCompare(b, 'de')); }
    catch (e) { return []; }
  }

  /* ---------- Wochenseite ---------- */
  async function decorateWeek(wg) {
    wg.dataset.sp = '1';
    const plans = await load();
    if (!wg.isConnected) return;
    [...wg.children].filter(el => el.classList.contains('wcol')).slice(0, 5).forEach(col => {
      const body = col.querySelector('.wcb'), u = col.querySelector('.wch u');
      if (!body || !u) return;
      const m = u.textContent.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      const iso = m ? `${m[3]}-${PL.pad(+m[2])}-${PL.pad(+m[1])}` : null;
      const day = m ? (new Date(+m[3], +m[2] - 1, +m[1]).getDay() + 6) % 7 : -1;
      const school = iso && day >= 0 && day < 5 && !col.classList.contains('fer') && !col.classList.contains('hol');
      const p = school ? planFor(plans, iso) : null, slots = (p && p.slots) || {};
      body.classList.add('spb');
      body.innerHTML = BLK.map((n, b) => {
        const e = slots[`${day}-${b}`] || {}, k = (e.k || '').trim(), z = (e.z || '').trim();
        return `<div class="spbl${k || z ? ' has' : ''}"><span class="spn">${n}</span>${k || z ? `<span class="spk">${esc(k)}${z ? ` <small>${esc(z)}</small>` : ''}</span>` : ''}</div>`;
      }).join('');
    });
  }

  /* ---------- Einstellungen ---------- */
  async function renderCard(card) {
    const plans = await load(), names = await classNames();
    if (!card.isConnected) return;
    const list = sorted(plans);
    if (!list.find(p => p.id === sel)) { const today = PL.iso(new Date()), cur = planFor(plans, today); sel = (cur || list[list.length - 1] || {}).id || null; }
    const p = list.find(x => x.id === sel);
    let h = `<b>Stundenplan</b><p class="muted">Klassen je Doppelstunde eintragen (optional Fach/Raum). Sie erscheinen auf jeder Wochenseite in den vier Blöcken – außer an Ferien- und Feiertagen.
      Für einen neuen Stundenplan (z. B. ab Januar) einfach einen weiteren Plan mit „gültig ab“ anlegen: Jeder Plan gilt bis zum Tag vor dem nächsten.</p>`;
    if (!p) {
      h += `<button class="btn pri" data-spact="new">Ersten Stundenplan anlegen</button>`;
      card.innerHTML = h; return;
    }
    h += `<div class="chips" style="margin-bottom:12px">${list.map(x => { const bis = bisOf(plans, x); return `<button class="chip ${x.id === sel ? 'on' : ''}" data-spact="sel:${x.id}">${esc(x.name || 'Stundenplan')} · ab ${deIso(x.ab)}${bis ? ' bis ' + deIso(bis) : ''}</button>`; }).join('')}</div>
      <div class="row"><div class="field" style="flex:1;min-width:200px"><label>Bezeichnung</label><input type="text" data-spf="name" value="${esc(p.name || '')}" placeholder="z. B. 1. Halbjahr"></div>
        <div class="field" style="width:200px"><label>gültig ab</label><input type="date" data-spf="ab" value="${esc(p.ab || '')}"></div></div>
      <div style="overflow-x:auto"><table class="tbl sptbl"><thead><tr><th></th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>
      ${BLK.map((n, b) => `<tr><th>${n} Std.</th>${DAYS.map((_, d) => { const e = (p.slots || {})[`${d}-${b}`] || {}; return `<td><input type="text" list="spcl" data-sps="${d}-${b}" data-spk="k" value="${esc(e.k || '')}" placeholder="Klasse"><input type="text" class="spz" data-sps="${d}-${b}" data-spk="z" value="${esc(e.z || '')}" placeholder="Fach / Raum"></td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div><datalist id="spcl">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-spact="new">+ Neuer Plan (leer)</button><button class="btn sm" data-spact="copy">Als Kopie neu anlegen</button><button class="btn sm warn" data-spact="del">Plan löschen</button></div>`;
    card.innerHTML = h;
  }
  const card = () => document.getElementById('spcard');
  const nextMonday = () => { const d = new Date(); return PL.iso(PL.addDays(PL.mondayOf(d), 7)); };

  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-spact]'); if (!el) return;
    const a = el.dataset.spact, plans = await load();
    if (a.startsWith('sel:')) sel = a.slice(4);
    else if (a === 'new' || a === 'copy') {
      const src = plans.find(x => x.id === sel);
      const p = { id: uid(), name: plans.length ? 'Neuer Stundenplan' : 'Stundenplan', ab: plans.length ? nextMonday() : `${PL.schuljahrOf(new Date())}-08-01`, slots: a === 'copy' && src ? JSON.parse(JSON.stringify(src.slots || {})) : {} };
      plans.push(p); sel = p.id; await save(plans);
    } else if (a === 'del') {
      const p = plans.find(x => x.id === sel); if (!p) return;
      if (!confirmDel(p)) return;
      await save(plans.filter(x => x !== p)); sel = null;
    }
    if (card()) renderCard(card());
  });
  // Bestätigung ohne Browser-Dialog: zweimal tippen
  let armed = null;
  function confirmDel(p) {
    if (armed === p.id) { armed = null; return true; }
    armed = p.id; const b = document.querySelector('[data-spact="del"]'); if (b) b.textContent = 'Wirklich löschen? Nochmals tippen';
    setTimeout(() => { if (armed === p.id) { armed = null; const b2 = document.querySelector('[data-spact="del"]'); if (b2) b2.textContent = 'Plan löschen'; } }, 4000);
    return false;
  }
  document.addEventListener('change', async e => {
    const t = e.target; if (!t.dataset || !(t.dataset.spf || t.dataset.sps)) return;
    const plans = await load(), p = plans.find(x => x.id === sel); if (!p) return;
    if (t.dataset.spf) {
      const f = t.dataset.spf;
      if (f === 'ab' && !t.value) { t.value = p.ab; return; }
      if (f === 'ab' && plans.some(x => x !== p && x.ab === t.value)) { t.value = p.ab; alertLine('Ab diesem Datum gilt schon ein anderer Plan.'); return; }
      p[f] = f === 'name' ? t.value.trim() : t.value;
      await save(plans); return renderCard(card());
    }
    const slots = p.slots = p.slots || {}, s = slots[t.dataset.sps] = slots[t.dataset.sps] || {};
    s[t.dataset.spk] = t.value.trim(); if (!s.k && !s.z) delete slots[t.dataset.sps];
    await save(plans);
  });
  function alertLine(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }

  /* ---------- Einhängen in die Oberfläche ---------- */
  function scan() {
    const wg = document.querySelector('#paper .pp .wg'); if (wg && !wg.dataset.sp) decorateWeek(wg);
    const h2 = document.querySelector('#main .wrap > h2.h');
    if (h2 && h2.textContent.trim() === 'Einstellungen' && !card()) {
      const c = document.createElement('div'); c.className = 'card'; c.id = 'spcard'; c.style.marginBottom = '14px';
      h2.after(c); renderCard(c);
    }
  }
  const start = () => { const m = document.getElementById('main'); if (m) new MutationObserver(scan).observe(m, { childList: true, subtree: true }); scan(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  const css = document.createElement('style');
  css.textContent = `
  .pp .wcb.spb { margin: 0; background: none; display: flex; flex-direction: column; }
  .pp .spbl { flex: 1 1 0; min-height: 0; margin: 0 5px; position: relative; border-top: 1.5px solid #9fb0bc; overflow: hidden;
    background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 26px, #dadada 26px, #dadada 27px); }
  .pp .spbl:first-child { border-top: 0; }
  .pp .spbl.has { background-color: #f1f5f8; }
  .pp .spn { position: absolute; left: 1px; top: 4px; font-size: 9.5px; font-weight: 700; color: #8a9aa6; }
  .pp .spk { position: absolute; left: 30px; right: 2px; top: 3px; font-size: 12.5px; font-weight: 700; color: #2b4f66; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pp .spk small { font-weight: 500; color: #6e8797; font-size: 11px; }
  .sptbl td { vertical-align: top; min-width: 150px; }
  .sptbl tbody th { white-space: nowrap; font-size: 13px; color: var(--ink); }
  .sptbl input.spz { margin-top: 4px; font-size: 13px; min-height: 34px; }`;
  document.head.appendChild(css);
})();
