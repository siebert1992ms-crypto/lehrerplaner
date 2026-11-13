/* Lehrerplaner – Oberfläche */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = v => (v == null || v === '' ? '' : String(v).replace('.', ','));
  const safe = s => String(s || 'Datei').replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '_') || 'Datei';

  const ICON = {
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    hl: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    gear: '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.6a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.6a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>'
  };
  const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

  const PEN_COLORS = ['#1b1f24', '#1f5fbf', '#c62d2d', '#1f8a4c', '#e07b00'];
  const HL_COLORS = ['#ffd400', '#7ddc6f', '#ff7eb6', '#6ec6ff'];
  const PEN_SIZES = [1.6, 2.8, 4.8];
  const HL_SIZES = [12, 18, 28];

  const CAL = ['ov', 'ferien', 'pnote', 'month', 'week'];
  const APP_VERSION = '1.4.0';
  const S = { sy: PL.schuljahrOf(new Date()), settings: null, classes: [], pages: [], view: null, P: null, lastCal: null, classFilter: {}, persisted: null };

  /* ---------- Hilfen ---------- */
  let toastT = 0;
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); if (ms) toastT = setTimeout(() => t.classList.remove('show'), ms);
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function modal({ title, body, buttons, wide, onOpen }) {
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = `<div class="dlg ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><header>${title}</header><div class="bd">${body || ''}</div><footer></footer></div>`;
    const close = () => ov.remove();
    const foot = $('footer', ov);
    (buttons || [{ label: 'OK' }]).forEach(b => {
      const el = document.createElement('button'); el.className = 'btn ' + (b.cls || ''); el.textContent = b.label;
      el.onclick = async () => { const r = b.onClick ? await b.onClick(ov) : undefined; if (r !== false) close(); };
      foot.appendChild(el);
    });
    document.body.appendChild(ov); if (onOpen) onOpen(ov);
    return { ov, close };
  }
  const ask = (title, text, ok = 'OK', danger = false) => new Promise(res => {
    modal({ title, body: `<p>${text}</p>`, buttons: [{ label: 'Abbrechen', onClick: () => res(false) }, { label: ok, cls: danger ? 'warn' : 'pri', onClick: () => res(true) }] });
  });
  const setSub = html => { $('#sub').innerHTML = html; };

  /* ---------- Daten laden/speichern ---------- */
  const defaultSettings = () => ({
    ferien: PL.STANDARD_FERIEN.map(f => ({ id: uid(), ...f })),
    termine: PL.STANDARD_TERMINE.map(t => ({ id: uid(), ...t })), planV: 2, key: PL.DEFAULT_KEY.slice(), fingerDraw: false, tool: 'pen', penColor: PEN_COLORS[0], hlColor: HL_COLORS[0], penSize: 1, hlSize: 1, lastBackup: null
  });
  const saveSettings = () => DB.put('settings', S.settings);
  const saveClass = c => DB.put('class:' + c.id, c);
  const savePages = () => DB.put('pages', S.pages);
  const getClass = id => S.classes.find(c => c.id === id);

  async function loadState() {
    const kv = await DB.all(['ink:', 'bg:']);
    S.settings = Object.assign(defaultSettings(), kv.settings || {});
    if (!(kv.settings && kv.settings.planV >= 2)) { const d = defaultSettings(); S.settings.ferien = d.ferien; S.settings.termine = d.termine; S.settings.planV = 2; kv.settings = null; }
    S.settings.ferien.forEach(f => { if (!f.id) f.id = uid(); });
    (S.settings.termine = S.settings.termine || []).forEach(t => { if (!t.id) t.id = uid(); });
    if (!kv.settings) await saveSettings();
    S.pages = kv.pages || [];
    S.classes = Object.keys(kv).filter(k => k.startsWith('class:')).map(k => kv[k]).sort((a, b) => (a.created || 0) - (b.created || 0));
  }

  /* ---------- Navigation ---------- */
  function go(v, push = true) {
    cleanupPage(); S.view = v; S.popOpen = false;
    if (CAL.includes(v.t)) S.lastCal = v;
    if (push) history.pushState({ v }, '');
    render();
  }
  window.addEventListener('popstate', e => { if (e.state && e.state.v) { cleanupPage(); S.view = e.state.v; S.popOpen = false; render(); } });
  const todayView = () => { const d = new Date(); return { t: 'month', y: d.getFullYear(), m: d.getMonth() }; };

  function render() {
    const t = S.view.t;
    document.body.classList.toggle('cal', [...CAL, 'note'].includes(t));
    renderTop();
    if ([...CAL, 'note'].includes(t)) showInkPage();
    else if (t === 'notes') viewNotes();
    else if (t === 'classes') viewClasses();
    else if (t === 'class') viewClass();
    else if (t === 'settings') viewSettings();
  }
  function renderTop() {
    const t = S.view.t, on = a => (a.includes(t) ? 'on' : '');
    $('#nav').innerHTML = `<button class="nav ${on(CAL)}" data-act="nav-cal" title="Kalender">${ic('calendar')}<span class="lbl">Kalender</span></button>
      <button class="nav ${on(['notes', 'note'])}" data-act="nav-notes" title="Notizen">${ic('file')}<span class="lbl">Notizen</span></button>
      <button class="nav ${on(['classes', 'class'])}" data-act="nav-classes" title="Klassen">${ic('users')}<span class="lbl">Klassen</span></button><span class="vsep"></span>`;
    $('#topr').innerHTML = `<span class="vsep"></span>${S.lockMeta ? `<button class="nav ic" data-act="lock-now" aria-label="Sperren" title="Sperren">${ic('lock')}</button>` : ''}
      <button class="nav ic ${on(['settings'])}" data-act="nav-settings" aria-label="Einstellungen" title="Einstellungen">${ic('gear')}</button>`;
  }

  const sjLabel = sy => `${sy}/${String(sy + 1).slice(2)}`;
  /* ---------- Planerseiten bauen (Format 16:10 für das Tab S9, logisch 1280 × 760) ---------- */
  const PPW = 1280, PPH = 760;
  const MON3 = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monNav = (y, m) => `month:${y}-${PL.pad(m + 1)}`;
  function frame(o) {
    const tabs = `<div class="tabs">${PL.schuljahrMonths(o.sy).map(mm => `<div class="tab ${o.active && o.active.y === mm.y && o.active.m === mm.m ? 'on' : ''}" data-nav="${monNav(mm.y, mm.m)}" data-pen="1"><span>${MON3[mm.m]} ${String(mm.y).slice(2)}</span></div>`).join('')}</div>`;
    const link = x => `<span class="lnk" data-nav="${x[1]}" data-pen="1">${esc(x[0])}</span>`;
    const lk = [];
    if (o.prev) lk.push(`<span class="lnk" data-nav="${o.prev[1]}" data-pen="1">‹ ${esc(o.prev[0])}</span>`);
    (o.bc || []).forEach(b => lk.push(link(b)));
    if (o.next) lk.push(`<span class="lnk" data-nav="${o.next[1]}" data-pen="1">${esc(o.next[0])} ›</span>`);
    return `<div class="pp"><div class="pph"><span class="t">${o.title}</span>${o.meta ? `<span class="m">${o.meta}</span>` : ''}<div class="lk">${lk.join('<span class="dot"></span>')}</div></div><div class="ppb">${o.body}</div>${tabs}</div>`;
  }
  const terminOn = iso => (S.settings.termine || []).filter(t => t.datum === iso);

  function buildOverview(sy, info) {
    const now = new Date();
    const tiles = PL.schuljahrMonths(sy).map(mm => {
      const n = PL.weeksOfMonth(mm.y, mm.m).length, days = new Date(mm.y, mm.m + 1, 0).getDate();
      let hasF = false; for (let d = 1; d <= days && !hasF; d++) if (info(new Date(mm.y, mm.m, d)).fer) hasF = true;
      const cur = now.getFullYear() === mm.y && now.getMonth() === mm.m;
      return `<div class="ovt ${cur ? 'cur' : ''}" data-nav="${monNav(mm.y, mm.m)}" data-pen="1"><b>${PL.MONTHS[mm.m]} ${mm.y}</b><span>${n} Wochen</span>${hasF ? '<span class="f">mit Ferientagen</span>' : ''}</div>`;
    }).join('');
    return frame({ sy, title: 'Übersicht', meta: `Schuljahr ${sy}/${String(sy + 1).slice(2)} · Niedersachsen`,
      body: `<div class="ovq"><div class="f" data-nav="ferien:" data-pen="1">Ferien und Feiertage</div><div class="n" data-nav="pnote:1" data-pen="1">Notizen</div></div><div class="ovg">${tiles}</div>` });
  }
  function buildFerien(sy) {
    const a = `${sy}-08-01`, b = `${sy + 1}-07-31`;
    const fer = S.settings.ferien.filter(f => f.von && f.bis && f.bis >= a && f.von <= b).sort((x, y) => x.von.localeCompare(y.von));
    const hol = Object.entries({ ...PL.feiertage(sy), ...PL.feiertage(sy + 1) }).filter(([d]) => d >= a && d <= b).sort((x, y) => x[0].localeCompare(y[0]));
    const term = (S.settings.termine || []).filter(t => t.datum >= a && t.datum <= b).sort((x, y) => x.datum.localeCompare(y.datum));
    const dstr = iso => PL.de(PL.parseISO(iso));
    const wd = iso => PL.WD2[(PL.parseISO(iso).getDay() + 6) % 7];
    return frame({ sy, title: 'Ferien und Feiertage', meta: `Schuljahr ${sy}/${String(sy + 1).slice(2)}`, bc: [['Übersicht', 'ov:']],
      body: `<div class="fw"><div><h4>Schulferien</h4>${fer.map(f => { const n = PL.daysBetween(f.von, f.bis); return `<div class="fi f"><b>${esc(f.name)}</b><span>${dstr(f.von)}${f.bis !== f.von ? ' – ' + dstr(f.bis) : ''} · ${n} Tag${n > 1 ? 'e' : ''}</span></div>`; }).join('')}
        ${term.length ? `<h4 style="margin-top:16px">Wichtige Termine</h4>${term.map(t => `<div class="fi t"><b>${esc(t.name)}</b><span>${wd(t.datum)}, ${dstr(t.datum)}</span></div>`).join('')}` : ''}</div>
        <div><h4>Gesetzliche Feiertage</h4>${hol.map(([d, n]) => `<div class="fi h"><b>${esc(n)}</b><span>${wd(d)}, ${dstr(d)}</span></div>`).join('')}
        <div class="fnote">Ferienordnung des Niedersächsischen Kultusministeriums, Feiertage für Niedersachsen. Ohne Gewähr, im Zweifel mit dem Schulkalender abgleichen. Anpassbar unter Einstellungen.</div></div></div>` });
  }
  function buildMonth(y, m, info) {
    const sy = PL.schuljahrOf(new Date(y, m, 1)), first = new Date(y, m, 1), start = PL.mondayOf(first), last = new Date(y, m + 1, 0);
    const weeks = Math.round((PL.mondayOf(last) - start) / 86400000 / 7) + 1, todayIso = PL.iso(new Date());
    let cells = '<div class="mh">KW</div>' + PL.WD.map(w => `<div class="mh">${w}</div>`).join('');
    for (let w = 0; w < weeks; w++) {
      const mon = PL.addDays(start, w * 7), mIso = PL.iso(mon);
      cells += `<div class="mk" data-nav="week:${mIso}" data-pen="1">${PL.isoWeek(mon).week}</div>`;
      for (let i = 0; i < 7; i++) {
        const d = PL.addDays(mon, i), inf = info(d), out = d.getMonth() !== m;
        let labs = '';
        if (!out) {
          if (inf.hol) labs += `<i>${esc(inf.hol)}</i>`;
          if (inf.fer) labs += `<i>${esc(inf.fer.name)}</i>`;
          terminOn(inf.iso).forEach(t => { labs += `<i class="tm">${esc(t.name)}</i>`; });
        }
        const cls = ['mc', inf.we ? 'we' : '', inf.fer && !out ? 'fer' : '', inf.hol && !out ? 'hol' : '', out ? 'out' : '', inf.iso === todayIso ? 'today' : ''].filter(Boolean).join(' ');
        cells += `<div class="${cls}" data-nav="week:${mIso}"><b>${d.getDate()}</b>${labs}</div>`;
      }
    }
    const pm = new Date(y, m - 1, 1), nm = new Date(y, m + 1, 1);
    return frame({ sy, active: { y, m }, title: `${PL.MONTHS[m]} ${y}`, meta: `Schuljahr ${sy}/${String(sy + 1).slice(2)}`, bc: [['Übersicht', 'ov:'], ['Ferien', 'ferien:']],
      prev: [`${MON3[pm.getMonth()]} ${pm.getFullYear()}`, monNav(pm.getFullYear(), pm.getMonth())], next: [`${MON3[nm.getMonth()]} ${nm.getFullYear()}`, monNav(nm.getFullYear(), nm.getMonth())],
      body: `<div class="mg" style="grid-template-rows:32px repeat(${weeks},minmax(0,1fr))">${cells}</div>` });
  }
  function buildWeek(monIso, info) {
    const mon = PL.parseISO(monIso), th = PL.addDays(mon, 3), y = th.getFullYear(), m = th.getMonth(), sy = PL.schuljahrOf(th), todayIso = PL.iso(new Date());
    const col = i => {
      const d = PL.addDays(mon, i), inf = info(d), t = terminOn(inf.iso);
      const cls = inf.hol ? 'hol' : inf.fer ? 'fer' : i > 4 ? 'we' : 'sch';
      let lab = ''; if (inf.hol) lab += `<em>${esc(inf.hol)}</em>`; if (inf.fer) lab += `<em>${esc(inf.fer.name)}</em>`; t.forEach(x => { lab += `<em>${esc(x.name)}</em>`; });
      return `<div class="wcol ${cls}${inf.iso === todayIso ? ' today' : ''}" data-date="${inf.iso}"><div class="wch"><b>${PL.WD[i]}</b><u>${PL.deShort(d)}</u>${lab}</div><div class="wcb"></div></div>`;
    };
    const wkNo = d => PL.isoWeek(d).week, pw = PL.addDays(mon, -7), nw = PL.addDays(mon, 7), sun = PL.addDays(mon, 6);
    const range = mon.getMonth() === sun.getMonth() ? `${mon.getDate()}. – ${sun.getDate()}. ${PL.MONTHS[sun.getMonth()]} ${sun.getFullYear()}` : `${mon.getDate()}. ${PL.MONTHS[mon.getMonth()]} – ${sun.getDate()}. ${PL.MONTHS[sun.getMonth()]} ${sun.getFullYear()}`;
    return frame({ sy, active: { y, m }, title: `KW ${wkNo(mon)}`, meta: range, bc: [['Übersicht', 'ov:'], [`${PL.MONTHS[m]}`, monNav(y, m)], ['Ferien', 'ferien:']],
      prev: [`KW ${wkNo(pw)}`, `week:${PL.iso(pw)}`], next: [`KW ${wkNo(nw)}`, `week:${PL.iso(nw)}`],
      body: `<div class="wg">${[0, 1, 2, 3, 4].map(col).join('')}<div class="wside">${col(5)}${col(6)}</div></div>` });
  }
  function buildPNote(sy, n) {
    return frame({ sy, title: 'Notizen', meta: `Seite ${n} von 8`, bc: [['Übersicht', 'ov:']],
      prev: n > 1 ? ['Vorherige', `pnote:${n - 1}`] : null, next: n < 8 ? ['Nächste', `pnote:${n + 1}`] : null, body: '<div class="nl"></div>' });
  }
  function pageDef() {
    const v = S.view, info = PL.makeDayInfo(S.settings.ferien), W = PPW, H = PPH;
    if (v.t === 'ov') return { id: `ov-${S.sy}`, W, H, html: buildOverview(S.sy, info), fit: 'page' };
    if (v.t === 'ferien') return { id: `ferien-${S.sy}`, W, H, html: buildFerien(S.sy), fit: 'page' };
    if (v.t === 'pnote') return { id: `pn-${S.sy}-${v.n}`, W, H, html: buildPNote(S.sy, v.n), fit: 'page' };
    if (v.t === 'month') { S.sy = PL.schuljahrOf(new Date(v.y, v.m, 1)); return { id: `month-${v.y}-${PL.pad(v.m + 1)}`, W, H, html: buildMonth(v.y, v.m, info), fit: 'page' }; }
    if (v.t === 'week') { S.sy = PL.schuljahrOf(PL.addDays(PL.parseISO(v.mon), 3)); return { id: `week-${v.mon}`, W, H, html: buildWeek(v.mon, info), fit: 'page' }; }
    const p = S.pages.find(x => x.id === v.id); if (!p) return null;
    const img = p.kind === 'pdf' || p.kind === 'img';
    return { id: p.id, W: p.w, H: p.h, page: p, fit: 'width', bg: img,
      html: `<div class="pg pg-note ${img ? '' : p.kind}" style="width:${p.w}px;height:${p.h}px">${img ? '<img id="bgimg" alt="">' : ''}</div>` };
  }

  /* ---------- Ink-Seite ---------- */
  function cleanupPage() {
    const P = S.P; if (!P) return;
    flushInk(P); if (P.ro) P.ro.disconnect(); if (P.url) URL.revokeObjectURL(P.url);
    S.P = null;
  }
  function flushInk(P) {
    clearTimeout(P.saveT); P.saveT = 0;
    if (!P.dirty || !P.ink) return;
    P.dirty = false;
    return (P.ink.strokes.length ? DB.put('ink:' + P.id, P.ink.strokes) : DB.del('ink:' + P.id)).catch(() => { });
  }
  window.addEventListener('pagehide', () => S.P && flushInk(S.P));
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.P) flushInk(S.P); });

  async function showInkPage() {
    const def = pageDef();
    if (!def) { go({ t: 'notes' }, false); return; }
    $('#main').innerHTML = `<div id="stage"><div id="sheet"><div id="paper" style="width:${def.W}px;height:${def.H}px">${def.html}</div><canvas id="ink"></canvas></div></div>`;
    const P = S.P = { id: def.id, W: def.W, H: def.H, scale: 1, fit: def.fit, ink: null, dirty: false, saveT: 0, url: null, raf: 0, page: def.page };
    P.ink = new Ink($('#ink'), {
      tool: () => S.settings.tool,
      color: t => (t === 'hl' ? S.settings.hlColor : S.settings.penColor),
      size: t => (t === 'hl' ? HL_SIZES[S.settings.hlSize] : PEN_SIZES[S.settings.penSize]),
      fingerDraw: () => S.settings.fingerDraw,
      onChange: () => { P.dirty = true; clearTimeout(P.saveT); P.saveT = setTimeout(() => flushInk(P), 1200); updUndo(); },
      onTap: tapNav, onPenTap: penTap, canSwipe, onSwipe,
      pan: (dx, dy) => { const st = $('#stage'); if (st) { st.scrollLeft += dx; st.scrollTop += dy; } },
      zoomTo, getScale: () => P.scale
    });
    if (S.swipe) { const sh = $('#sheet'); sh.classList.add(S.swipe); S.swipe = null; }
    renderSubInk();
    P.scale = fitScale(P.fit); applySize(true);
    P.ro = new ResizeObserver(en => { const r = en[0].contentRect, k = Math.round(r.width) + 'x' + Math.round(r.height); if (k === P.roK) return; P.roK = k; if (S.P === P && P.fit) { P.scale = fitScale(P.fit); applySize(); } });
    P.ro.observe($('#stage'));
    if (def.bg) {
      const blob = await DB.get('bg:' + def.id);
      if (S.P !== P) return;
      if (blob) { P.url = URL.createObjectURL(blob); const im = $('#bgimg'); if (im) im.src = P.url; }
    }
    const strokes = await DB.get('ink:' + def.id);
    if (S.P !== P) return;
    P.ink.setStrokes(strokes || []); renderSubInk();
  }
  function fitScale(mode) {
    const st = $('#stage'), P = S.P, aw = st.clientWidth - 24, ah = st.clientHeight - 24;
    return clamp(mode === 'width' ? aw / P.W : Math.min(aw / P.W, ah / P.H), 0.25, 4);
  }
  function applySize(now, lazy) {
    const P = S.P; if (!P) return;
    $('#sheet').style.width = P.W * P.scale + 'px'; $('#sheet').style.height = P.H * P.scale + 'px';
    $('#paper').style.transform = `scale(${P.scale})`;
    const cv = $('#ink'); cv.style.width = P.W * P.scale + 'px'; cv.style.height = P.H * P.scale + 'px';
    const run = () => { P.raf = 0; P.lt = 0; if (S.P === P) P.ink.layout(P.W, P.H, P.scale); };
    clearTimeout(P.lt);
    if (now) run(); else if (lazy) P.lt = setTimeout(run, 160); // beim Zoomen erst nach der Geste scharf neu zeichnen
    else if (!P.raf) P.raf = requestAnimationFrame(run);
  }
  function zoomTo(s, cx, cy) {
    const P = S.P; if (!P) return;
    s = clamp(s, 0.25, 4);
    const st = $('#stage'), r = $('#sheet').getBoundingClientRect();
    const lx = (cx - r.left) / P.scale, ly = (cy - r.top) / P.scale;
    P.scale = s; P.fit = null; applySize(false, true);
    const r2 = $('#sheet').getBoundingClientRect();
    st.scrollLeft += r2.left + lx * s - cx; st.scrollTop += r2.top + ly * s - cy;
  }
  function navTo(str) {
    const i = str.indexOf(':'), k = str.slice(0, i), a = str.slice(i + 1);
    if (k === 'month') { const [y2, m] = a.split('-').map(Number); go({ t: 'month', y: y2, m: m - 1 }); }
    else if (k === 'week') go({ t: 'week', mon: a });
    else if (k === 'ov') go({ t: 'ov' });
    else if (k === 'ferien') go({ t: 'ferien' });
    else if (k === 'pnote') go({ t: 'pnote', n: +a || 1 });
  }
  function navAt(x, y, penOnly) {
    const cv = $('#ink'); if (!cv) return false;
    cv.style.pointerEvents = 'none'; const el = document.elementFromPoint(x, y); cv.style.pointerEvents = '';
    const t = el && el.closest ? el.closest('[data-nav]') : null; if (!t || (penOnly && !t.dataset.pen)) return false;
    navTo(t.dataset.nav); return true;
  }
  const tapNav = (x, y) => { navAt(x, y, false); };
  const penTap = (x, y) => navAt(x, y, true);
  function canSwipe() {
    const st = $('#stage'), v = S.view;
    return !S.settings.fingerDraw && !!st && st.scrollWidth <= st.clientWidth + 2 && (CAL.includes(v.t) && v.t !== 'ov' && v.t !== 'ferien' || v.t === 'note');
  }
  function onSwipe(dir) {
    const v = S.view;
    S.swipe = dir > 0 ? 'sw-next' : 'sw-prev';
    if (v.t === 'note') {
      const p = S.pages.find(x => x.id === v.id); if (!p || !p.docId) { S.swipe = null; return; }
      const sib = S.pages.filter(x => x.docId === p.docId).sort((a, b) => a.idx - b.idx), i = sib.findIndex(x => x.id === p.id), n = sib[i + dir];
      if (n) go({ t: 'note', id: n.id }); else S.swipe = null;
    } else stepCal(dir);
  }

  function toolsHtml() {
    const s = S.settings, P = S.P, hl = s.tool === 'hl';
    const can = P && P.ink, cur = hl ? s.hlColor : s.penColor;
    let pop = '';
    if (S.popOpen) {
      const pal = hl ? HL_COLORS : PEN_COLORS, sizes = hl ? HL_SIZES : PEN_SIZES, si = hl ? s.hlSize : s.penSize;
      pop = `<div class="pop"><p class="pl">${hl ? 'Textmarker' : 'Stift'}: Farbe</p><div class="row">${pal.map(c => `<button class="sw ${c === cur ? 'on' : ''}" style="background:${c}" data-act="color:${c}" aria-label="Farbe ${c}"></button>`).join('')}</div>
        <p class="pl">Strichstärke</p><div class="row">${sizes.map((z, i) => `<button class="szb ${i === si ? 'on' : ''}" data-act="size:${i}" aria-label="Stärke ${i + 1}"><span style="width:${hl ? 8 + i * 4 : 3 + i * 3}px;height:${hl ? 8 + i * 4 : 3 + i * 3}px;${hl ? 'border-radius:2px;background:' + cur : ''}"></span></button>`).join('')}</div>
        <button class="btn sm warn" data-act="clear">${ic('trash')} Seite leeren</button></div>`;
    }
    return `<div class="grp tools"><button class="btn gh ic ${s.tool === 'pen' ? 'on' : ''}" data-act="tool:pen" aria-label="Stift" title="Stift">${ic('pen')}</button>
      <button class="btn gh ic ${hl ? 'on' : ''}" data-act="tool:hl" aria-label="Textmarker" title="Textmarker">${ic('hl')}</button>
      <button class="btn gh ic ${s.tool === 'eraser' ? 'on' : ''}" data-act="tool:eraser" aria-label="Radierer" title="Radierer (auch: Seitentaste am S Pen)">${ic('eraser')}</button>
      <span class="popwrap"><button class="btn gh ic ${S.popOpen ? 'on' : ''}" data-act="pop" aria-label="Farbe und Stärke" title="Farbe und Stärke"><span class="pdot" style="background:${s.tool === 'eraser' ? 'transparent' : cur}"></span></button>${pop}</span>
      <span class="vsep"></span>
      <button class="btn gh ic" data-act="undo" ${can && P.ink.canUndo() ? '' : 'disabled'} aria-label="Rückgängig" title="Rückgängig">${ic('undo')}</button>
      <button class="btn gh ic" data-act="redo" ${can && P.ink.canRedo() ? '' : 'disabled'} aria-label="Wiederholen" title="Wiederholen">${ic('redo')}</button>
      <button class="btn gh ic" data-act="fit" aria-label="Einpassen" title="Einpassen">${ic('fit')}</button>
      <span class="vsep"></span>
      <button class="btn gh ic ${s.fingerDraw ? 'on' : ''}" data-act="finger" aria-label="Mit dem Finger schreiben" title="${s.fingerDraw ? 'Finger schreibt' : 'Finger blättert und zoomt'}">${ic('hand')}</button></div>`;
  }
  function updUndo() {
    const P = S.P, u = $('[data-act="undo"]'), r = $('[data-act="redo"]');
    if (u) u.disabled = !(P && P.ink && P.ink.canUndo());
    if (r) r.disabled = !(P && P.ink && P.ink.canRedo());
  }
  function renderSubInk() {
    const v = S.view;
    let left = '';
    if (v.t === 'note') {
      const p = S.pages.find(x => x.id === v.id);
      let nav = '', meta = '';
      if (p && p.docId) {
        const sib = S.pages.filter(x => x.docId === p.docId).sort((a, b) => a.idx - b.idx), i = sib.findIndex(x => x.id === p.id);
        meta = `Seite ${i + 1} von ${sib.length}`;
        nav = `<button class="btn gh ic" data-act="note-go:${i > 0 ? sib[i - 1].id : ''}" ${i > 0 ? '' : 'disabled'} aria-label="Vorherige Seite">${ic('left')}</button><button class="btn gh ic" data-act="note-go:${i < sib.length - 1 ? sib[i + 1].id : ''}" ${i < sib.length - 1 ? '' : 'disabled'} aria-label="Nächste Seite">${ic('right')}</button>`;
      }
      left = `<div class="grp"><button class="btn gh" data-act="nav-notes" title="Notizen">${ic('left')} Notizen</button>${nav}<div class="ttl l">${esc(p ? (p.docName || p.name) : '')}${meta ? `<small>${meta}</small>` : ''}</div></div>`;
    } else {
      let title = '', small = '';
      if (v.t === 'ov') title = `Schuljahr ${sjLabel(S.sy)}`;
      else if (v.t === 'ferien') { title = 'Ferien'; small = `Schuljahr ${sjLabel(S.sy)}`; }
      else if (v.t === 'pnote') { title = `Notizen ${v.n}/8`; small = `Schuljahr ${sjLabel(S.sy)}`; }
      else if (v.t === 'month') { title = `${PL.MONTHS[v.m]} ${v.y}`; small = `Schuljahr ${sjLabel(S.sy)}`; }
      else { const mon = PL.parseISO(v.mon); title = `KW ${PL.isoWeek(mon).week}`; small = `${PL.deShort(mon)} – ${PL.deShort(PL.addDays(mon, 6))}`; }
      const ovv = v.t === 'ov' || v.t === 'ferien' || v.t === 'pnote';
      const stepable = !(v.t === 'ov' || v.t === 'ferien');
      left = `<div class="seg"><button class="${ovv ? 'on' : ''}" data-act="view-ov">Jahr</button><button class="${v.t === 'month' ? 'on' : ''}" data-act="view-month">Monat</button><button class="${v.t === 'week' ? 'on' : ''}" data-act="view-week">Woche</button></div>
        <div class="grp"><button class="btn gh ic" data-act="prev" aria-label="Zurück" ${stepable ? '' : 'disabled'}>${ic('left')}</button><div class="ttl">${title}${small ? `<small>${small}</small>` : ''}</div><button class="btn gh ic" data-act="next" aria-label="Weiter" ${stepable ? '' : 'disabled'}>${ic('right')}</button><button class="btn gh" data-act="today">Heute</button></div>`;
    }
    setSub(left + toolsHtml());
  }

  /* ---------- Kalender-Navigation ---------- */
  function calRef() {
    const v = S.view, now = new Date();
    if (v.t === 'month') return new Date(v.y, v.m, 15);
    if (v.t === 'week') return PL.addDays(PL.parseISO(v.mon), 3);
    return PL.schuljahrOf(now) === S.sy ? now : new Date(S.sy, 8, 1);
  }
  function stepCal(dir) {
    const v = S.view;
    if (v.t === 'month') { const d = new Date(v.y, v.m + dir, 1); go({ t: 'month', y: d.getFullYear(), m: d.getMonth() }); }
    else if (v.t === 'week') go({ t: 'week', mon: PL.iso(PL.addDays(PL.parseISO(v.mon), 7 * dir)) });
    else if (v.t === 'pnote') { const n = v.n + dir; if (n >= 1 && n <= 8) go({ t: 'pnote', n }); else S.swipe = null; }
  }
  function toView(kind) {
    const ref = calRef(), now = new Date();
    if (kind === 'ov') return go({ t: 'ov' });
    if (kind === 'month') return go({ t: 'month', y: ref.getFullYear(), m: ref.getMonth() });
    const inMonth = ref.getFullYear() === now.getFullYear() && ref.getMonth() === now.getMonth();
    let d = S.view.t === 'week' ? ref : inMonth ? now : new Date(ref.getFullYear(), ref.getMonth(), 1);
    go({ t: 'week', mon: PL.iso(PL.mondayOf(d)) });
  }
  function goToday() {
    const n = new Date(), t = S.view.t;
    if (t === 'month') go({ t: 'month', y: n.getFullYear(), m: n.getMonth() });
    else if (t === 'week') go({ t: 'week', mon: PL.iso(PL.mondayOf(n)) });
    else go({ t: 'ov' });
  }

  /* ---------- Notizen & Dokumente ---------- */
  const KIND_LABEL = { blank: 'Leere Seite', lined: 'Liniert', grid: 'Kariert', dots: 'Punkteraster', img: 'Bild', pdf: 'PDF' };
  function viewNotes() {
    setSub(`<div class="grp"><button class="btn pri" data-act="note-new">${ic('plus')} Neue Seite</button><button class="btn" data-act="note-import">${ic('upload')} PDF / Bild importieren</button></div>`);
    const seen = new Set(), items = [];
    S.pages.forEach(p => { if (p.docId) { if (seen.has(p.docId)) return; seen.add(p.docId); items.push({ id: p.id, docId: p.docId, name: p.docName, meta: `PDF · ${S.pages.filter(x => x.docId === p.docId).length} Seiten` }); } else items.push({ id: p.id, name: p.name, meta: `${KIND_LABEL[p.kind] || ''}${p.kind === 'img' ? '' : p.w > p.h ? ' · quer' : ' · hoch'}` }); });
    $('#main').innerHTML = `<div class="scroll"><div class="wrap"><h2 class="h">Notizen &amp; Dokumente</h2>
      <p class="muted" style="margin-top:-8px">Eigene Seiten zum Beschreiben – oder dein vorhandenes PDF (z. B. ein Jahreskalender) importieren und direkt mit dem S Pen beschriften.</p>
      <div class="tiles">${items.map(it => `<div class="tile" data-act="note-open:${it.id}"><div><div class="tn">${esc(it.name)}</div><div class="tm">${esc(it.meta)}</div></div>
        <div class="row"><button class="btn sm" data-act="note-rename:${it.id}">Umbenennen</button><button class="btn sm warn" data-act="note-del:${it.id}">Löschen</button></div></div>`).join('')}
        <button class="tile add" data-act="note-new">${ic('plus')} Neue Seite</button></div></div></div>
      <input type="file" id="fileIn" hidden accept="application/pdf,image/*">`;
    $('#fileIn').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); };
  }
  function newNoteDialog() {
    modal({ title: 'Neue Seite', body: `<div class="field"><label>Name</label><input type="text" id="nn" value="Notizen"></div>
      <div class="field"><label>Hintergrund</label><select id="nk"><option value="lined">Liniert</option><option value="grid">Kariert</option><option value="dots">Punkteraster</option><option value="blank">Leer</option></select></div>
      <div class="field"><label>Format</label><select id="no"><option value="p">A4 hochkant</option><option value="l">A4 quer</option></select></div>`,
      buttons: [{ label: 'Abbrechen' }, { label: 'Anlegen', cls: 'pri', onClick: async () => {
        const land = $('#no').value === 'l', p = { id: uid(), kind: $('#nk').value, name: $('#nn').value.trim() || 'Notizen', w: land ? 1414 : 1000, h: land ? 1000 : 1414, created: Date.now() };
        S.pages.push(p); await savePages(); go({ t: 'note', id: p.id });
      } }] });
  }
  function renameNote(id) {
    const p = S.pages.find(x => x.id === id); if (!p) return;
    modal({ title: 'Umbenennen', body: `<div class="field"><input type="text" id="rn" value="${esc(p.docName || p.name)}"></div>`,
      buttons: [{ label: 'Abbrechen' }, { label: 'Speichern', cls: 'pri', onClick: async () => {
        const n = $('#rn').value.trim(); if (!n) return false;
        S.pages.filter(x => (p.docId ? x.docId === p.docId : x.id === p.id)).forEach(x => { if (p.docId) x.docName = n; else x.name = n; });
        await savePages(); viewNotes();
      } }] });
  }
  async function deleteNote(id) {
    const p = S.pages.find(x => x.id === id); if (!p) return;
    const list = S.pages.filter(x => (p.docId ? x.docId === p.docId : x.id === p.id));
    if (!await ask('Löschen?', `„${esc(p.docName || p.name)}“${list.length > 1 ? ` mit ${list.length} Seiten` : ''} samt allen Handschrift-Notizen endgültig löschen?`, 'Löschen', true)) return;
    for (const x of list) { await DB.del('ink:' + x.id); await DB.del('bg:' + x.id); }
    S.pages = S.pages.filter(x => !list.includes(x)); await savePages(); viewNotes();
  }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('PDF-Modul konnte nicht geladen werden')); document.head.appendChild(s); }); }
  async function importFile(file) {
    try {
      if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
        if (!window.pdfjsLib) await loadScript('vendor/pdf.min.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const docId = uid(), base = file.name.replace(/\.pdf$/i, '');
        for (let i = 1; i <= pdf.numPages; i++) {
          toast(`PDF wird importiert … Seite ${i} von ${pdf.numPages}`, 0);
          const page = await pdf.getPage(i), v1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 1600 / v1.width });
          const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
          const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
          await page.render({ canvasContext: cx, viewport: vp }).promise;
          const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.86)), id = uid();
          await DB.put('bg:' + id, blob);
          S.pages.push({ id, kind: 'pdf', name: base, docName: base, docId, idx: i, w: 1000, h: Math.round(1000 * vp.height / vp.width), created: Date.now() });
          cv.width = cv.height = 1;
        }
        await savePages(); toast('PDF importiert', 2200);
        const first = S.pages.find(x => x.docId === docId); go({ t: 'note', id: first.id });
      } else if (/^image\//.test(file.type)) {
        const bmp = await createImageBitmap(file), sc = Math.min(1, 1800 / bmp.width);
        const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
        cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
        const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.88)), id = uid();
        await DB.put('bg:' + id, blob);
        S.pages.push({ id, kind: 'img', name: file.name.replace(/\.[^.]+$/, ''), w: 1000, h: Math.round(1000 * cv.height / cv.width), created: Date.now() });
        await savePages(); go({ t: 'note', id });
      } else toast('Bitte eine PDF- oder Bilddatei wählen.');
    } catch (err) { console.error(err); toast('Import fehlgeschlagen: ' + err.message, 4000); }
  }

  /* ---------- Klassen ---------- */
  function viewClasses() {
    setSub(`<div class="grp"><button class="btn pri" data-act="class-new">${ic('plus')} Neue Klasse</button><button class="btn" data-act="export-all" ${S.classes.length ? '' : 'disabled'}>${ic('download')} Alle Klassen als Excel</button></div>`);
    $('#main').innerHTML = `<div class="scroll"><div class="wrap"><h2 class="h">Klassen</h2>
      <div class="tiles">${S.classes.map(c => `<button class="tile" data-act="class-open:${c.id}"><div><div class="tn">${esc(c.name)}</div><div class="tm">${esc(c.fach || '')}</div></div><div class="tm">${c.students.length} Schüler · ${c.cols.length} Bewertungen</div></button>`).join('')}
      <button class="tile add" data-act="class-new">${ic('plus')} Neue Klasse</button></div></div></div>`;
  }
  function newClassDialog() {
    modal({ title: 'Neue Klasse', body: `<div class="field"><label>Klasse</label><input type="text" id="cn" placeholder="z. B. MA2-26"></div><div class="field"><label>Fach / Bemerkung (optional)</label><input type="text" id="cf" placeholder="z. B. Deutsch/Kommunikation"></div>`,
      buttons: [{ label: 'Abbrechen' }, { label: 'Anlegen', cls: 'pri', onClick: async () => {
        const name = $('#cn').value.trim(); if (!name) { $('#cn').focus(); return false; }
        const c = { id: uid(), name, fach: $('#cf').value.trim(), students: [], cols: [], scores: {}, created: Date.now() };
        S.classes.push(c); await saveClass(c); go({ t: 'class', id: c.id }); setTimeout(() => studentsDialog(c), 50);
      } }] });
  }
  function editClassDialog(c) {
    modal({ title: 'Klasse bearbeiten', body: `<div class="field"><label>Klasse</label><input type="text" id="cn" value="${esc(c.name)}"></div><div class="field"><label>Fach / Bemerkung</label><input type="text" id="cf" value="${esc(c.fach || '')}"></div>`,
      buttons: [{ label: 'Klasse löschen', cls: 'warn', onClick: async () => {
        if (!await ask('Klasse löschen?', `„${esc(c.name)}“ mit allen Schülern und Noten endgültig löschen? Tipp: vorher als Excel exportieren.`, 'Löschen', true)) return false;
        await DB.del('class:' + c.id); S.classes = S.classes.filter(x => x !== c); go({ t: 'classes' });
      } }, { label: 'Abbrechen' }, { label: 'Speichern', cls: 'pri', onClick: async () => {
        const n = $('#cn').value.trim(); if (!n) return false; c.name = n; c.fach = $('#cf').value.trim(); await saveClass(c); viewClass();
      } }] });
  }
  function studentsDialog(c) {
    const row = s => `<tr data-id="${s.id || ''}"><td><input type="text" class="sn" value="${esc(s.nachname)}" placeholder="Nachname"></td><td><input type="text" class="sv" value="${esc(s.vorname)}" placeholder="Vorname"></td><td style="width:50px"><button class="btn sm ic warn" data-del aria-label="Entfernen">×</button></td></tr>`;
    modal({ title: `Schüler – ${esc(c.name)}`, wide: true,
      body: `<table class="tbl"><thead><tr><th>Nachname</th><th>Vorname</th><th></th></tr></thead><tbody id="srows">${c.students.map(row).join('')}</tbody></table>
        <div class="row" style="margin:10px 0"><button class="btn sm" id="sadd">${ic('plus')} Zeile</button><button class="btn sm" id="ssort">A–Z sortieren</button></div>
        <div class="field"><label>Liste einfügen (eine Zeile pro Person: „Nachname, Vorname“ – auch direkt aus Excel kopierbar)</label><textarea id="sbulk" placeholder="Müller, Anna&#10;Schmidt, Ben"></textarea></div>
        <button class="btn sm" id="sbulkadd">Zur Liste hinzufügen</button>`,
      buttons: [{ label: 'Abbrechen' }, { label: 'Speichern', cls: 'pri', onClick: async ov => {
        const rows = $$('#srows tr', ov).map(tr => ({ id: tr.dataset.id, nachname: $('.sn', tr).value.trim(), vorname: $('.sv', tr).value.trim() })).filter(r => r.nachname || r.vorname);
        const keep = new Set(rows.map(r => r.id).filter(Boolean));
        const removed = c.students.filter(s => !keep.has(s.id));
        const hasScores = removed.some(s => c.scores[s.id] && Object.keys(c.scores[s.id]).length);
        if (hasScores && !await ask('Schüler entfernen?', 'Entfernte Schüler haben bereits Noten. Diese gehen verloren. Fortfahren?', 'Ja, entfernen', true)) return false;
        removed.forEach(s => delete c.scores[s.id]);
        c.students = rows.map(r => ({ id: r.id || uid(), nachname: r.nachname, vorname: r.vorname }));
        await saveClass(c); viewClass();
      } }],
      onOpen: ov => {
        const tb = $('#srows', ov);
        const add = (s = { nachname: '', vorname: '' }) => { tb.insertAdjacentHTML('beforeend', row(s)); const l = tb.lastElementChild; $('.sn', l).focus(); l.scrollIntoView({ block: 'nearest' }); };
        $('#sadd', ov).onclick = () => add();
        $('#ssort', ov).onclick = () => { const rs = $$('tr', tb).sort((a, b) => ($('.sn', a).value + $('.sv', a).value).localeCompare($('.sn', b).value + $('.sv', b).value, 'de')); rs.forEach(r => tb.appendChild(r)); };
        tb.addEventListener('click', e => { if (e.target.closest('[data-del]')) e.target.closest('tr').remove(); });
        $('#sbulkadd', ov).onclick = () => {
          const lines = $('#sbulk', ov).value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          lines.forEach(l => { let p = l.split(/\t|;|,/).map(x => x.trim()); if (p.length === 1) { const w = l.split(/\s+/); p = w.length > 1 ? [w.slice(1).join(' '), w[0]] : [l, '']; } tb.insertAdjacentHTML('beforeend', row({ nachname: p[0], vorname: p.slice(1).join(' ') })); });
          $('#sbulk', ov).value = ''; if (lines.length) toast(`${lines.length} Einträge ergänzt, mit „Speichern“ übernehmen`);
        };
        if (!c.students.length) $('#sbulk', ov).focus();
      } });
  }
  function colDialog(c, col) {
    const isNew = !col; col = col || { id: uid(), titel: 'Mitarbeit', datum: PL.iso(new Date()), typ: 'mündlich', gewicht: 1 };
    modal({ title: isNew ? 'Neue Bewertung' : 'Bewertung bearbeiten', body: `<div class="field"><label>Bezeichnung</label><input type="text" id="ct" value="${esc(col.titel)}"></div>
      <div class="row"><div class="field" style="flex:1"><label>Datum</label><input type="date" id="cd" value="${esc(col.datum)}"></div><div class="field" style="flex:1"><label>Gewichtung</label><input type="number" id="cg" value="${col.gewicht}" min="0" step="0.5" inputmode="decimal"></div></div>
      <div class="field"><label>Art</label><select id="cy">${PL.TYPEN.map(t => `<option ${t === col.typ ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`,
      buttons: [...(isNew ? [] : [{ label: 'Löschen', cls: 'warn', onClick: async () => {
        if (!await ask('Bewertung löschen?', `„${esc(col.titel)}“ samt eingetragener Prozentwerte löschen?`, 'Löschen', true)) return false;
        c.cols = c.cols.filter(x => x !== col); Object.values(c.scores).forEach(s => delete s[col.id]); await saveClass(c); viewClass();
      } }]), { label: 'Abbrechen' }, { label: 'Speichern', cls: 'pri', onClick: async () => {
        col.titel = $('#ct').value.trim() || 'Bewertung'; col.datum = $('#cd').value; col.typ = $('#cy').value;
        const w = parseFloat(String($('#cg').value).replace(',', '.')); col.gewicht = isFinite(w) && w >= 0 ? w : 1;
        if (isNew) c.cols.push(col); await saveClass(c); viewClass();
      } }] });
  }

  function viewClass() {
    const c = getClass(S.view.id); if (!c) { go({ t: 'classes' }, false); return; }
    const typ = S.classFilter[c.id] || 'alle';
    setSub(`<div class="grp"><button class="btn gh" data-act="nav-classes">${ic('left')} Klassen</button><div class="ttl l">${esc(c.name)}${c.fach ? `<small>${esc(c.fach)}</small>` : ''}</div></div>
      <div class="grp"><button class="btn pri" data-act="col-new">${ic('plus')} Bewertung</button><button class="btn" data-act="students">${ic('users')} Schüler</button><button class="btn" data-act="class-edit">Klasse bearbeiten</button><button class="btn" data-act="export-class" ${c.students.length ? '' : 'disabled'}>${ic('download')} Excel</button></div>`);
    const used = PL.TYPEN.filter(t => c.cols.some(x => x.typ === t));
    const cols = c.cols.filter(x => typ === 'alle' || x.typ === typ);
    let body = '';
    if (used.length > 1) body += `<div class="chips" style="margin-bottom:12px">${['alle', ...used].map(t => `<button class="chip ${t === typ ? 'on' : ''}" data-act="filter:${t}">${t === 'alle' ? 'Alle' : t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>`;
    if (!c.students.length) body += `<div class="card"><b>Noch keine Schüler.</b><p class="muted">Füge die Klassenliste hinzu – du kannst sie auch aus Excel kopieren und einfügen.</p><button class="btn pri" data-act="students">${ic('users')} Schüler hinzufügen</button></div>`;
    else if (!c.cols.length) body += `<div class="card"><b>Noch keine Bewertung.</b><p class="muted">Lege eine Bewertung an (z. B. „Mitarbeit“, „Vokabeltest“) und trage dann Prozentwerte ein.</p><button class="btn pri" data-act="col-new">${ic('plus')} Bewertung anlegen</button></div>`;
    else {
      body += `<div class="gridwrap"><table class="g"><thead><tr><th class="sticky nr" style="left:0;min-width:40px">Nr.</th><th class="sticky nm" style="left:40px;text-align:left;min-width:190px">Name</th>
        ${cols.map(x => `<th class="col" data-act="col-edit:${x.id}"><span class="ct">${esc(x.titel)}</span><span class="cm">${x.datum ? PL.deShort(PL.parseISO(x.datum)) : ''} · ${esc(x.typ)}${x.gewicht !== 1 ? ' · ×' + fmt(x.gewicht) : ''}</span></th>`).join('')}
        <th class="rt" style="right:76px">Ø %</th><th class="rt" style="right:0">Note</th></tr></thead><tbody>
        ${c.students.map((s, i) => `<tr><td class="sticky nr" style="left:0">${i + 1}</td><td class="sticky nm" style="left:40px">${esc(s.nachname)}${s.vorname ? ', ' + esc(s.vorname) : ''}</td>
          ${cols.map(x => { const v = (c.scores[s.id] || {})[x.id], n = PL.noteFromPercent(v, S.settings.key); return `<td><input class="cell${n ? ' n' + n : ''}" inputmode="decimal" enterkeyhint="next" autocomplete="off" data-s="${s.id}" data-c="${x.id}" value="${fmt(v)}" aria-label="${esc(s.nachname)} – ${esc(x.titel)}"></td>`; }).join('')}
          <td class="rt" id="avg-${s.id}" style="right:76px"></td><td class="rt" id="nt-${s.id}" style="right:0"></td></tr>`).join('')}
        <tr class="avg"><td class="sticky nr" style="left:0"></td><td class="sticky nm" style="left:40px">Klassenschnitt</td>${cols.map(x => `<td id="cavg-${x.id}"></td>`).join('')}<td class="rt" id="cavg-all" style="right:76px"></td><td class="rt" id="cavg-note" style="right:0"></td></tr>
        </tbody></table></div><div class="spiegel" id="spiegel"></div>`;
    }
    $('#main').innerHTML = `<div class="scroll">${body}</div>`;
    refreshDerived(c);
  }
  function refreshDerived(c) {
    const typ = S.classFilter[c.id] || 'alle', key = S.settings.key, cnt = [0, 0, 0, 0, 0, 0, 0], pcts = [];
    c.students.forEach(s => {
      const st = PL.studentStats(c, s.id, key, typ), a = $('#avg-' + s.id), n = $('#nt-' + s.id);
      if (!a) return;
      a.textContent = st ? fmt(st.pct) : ''; n.textContent = st ? st.note : ''; n.className = 'rt' + (st ? ' n' + st.note : '');
      if (st) { cnt[st.note]++; pcts.push(st.pct); }
    });
    $$('input.cell').forEach(inp => { const v = ((c.scores[inp.dataset.s] || {})[inp.dataset.c]); const n = PL.noteFromPercent(v, key); inp.className = 'cell' + (n ? ' n' + n : ''); });
    c.cols.forEach(x => { const el = $('#cavg-' + x.id); if (el) { const v = PL.columnAvg(c, x.id); el.textContent = v == null ? '' : fmt(v); } });
    const avg = pcts.length ? PL.round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null, ca = $('#cavg-all'), cn = $('#cavg-note');
    if (ca) { ca.textContent = avg == null ? '' : fmt(avg); const n = PL.noteFromPercent(avg, key); cn.textContent = n || ''; cn.className = 'rt' + (n ? ' n' + n : ''); }
    const sp = $('#spiegel');
    if (sp) sp.innerHTML = [1, 2, 3, 4, 5, 6].map(k => `<div><b>${cnt[k]}</b><span>Note ${k}</span></div>`).join('') + `<div><b>${pcts.length}/${c.students.length}</b><span>bewertet</span></div>`;
  }
  function onCellChange(inp) {
    const c = getClass(S.view.id); if (!c) return;
    const v = PL.parsePercent(inp.value);
    if (Number.isNaN(v)) { inp.classList.add('bad'); toast('Bitte einen Wert von 0 bis 100 eingeben.'); return; }
    inp.classList.remove('bad');
    const sid = inp.dataset.s, cid = inp.dataset.c; c.scores[sid] = c.scores[sid] || {};
    if (v == null) delete c.scores[sid][cid]; else c.scores[sid][cid] = v;
    inp.value = fmt(v); saveClass(c); refreshDerived(c);
  }
  function exportClasses(list) {
    const bytes = PL.buildClassWorkbook(list, S.settings.key);
    const name = list.length === 1 ? `Noten_${safe(list[0].name)}_${PL.iso(new Date())}.xlsx` : `Noten_alle_Klassen_${PL.iso(new Date())}.xlsx`;
    download(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name);
    toast('Excel-Datei gespeichert (Ordner „Downloads“).');
  }

  /* ---------- Einstellungen ---------- */
  function viewSettings() {
    setSub('');
    const s = S.settings, k = s.key;
    const backup = s.lastBackup ? new Date(s.lastBackup).toLocaleDateString('de-DE') : 'noch nie';
    $('#main').innerHTML = `<div class="scroll"><div class="wrap">
      <h2 class="h">Einstellungen</h2>
      <div class="card"><b>Ferien &amp; Feiertage (Niedersachsen)</b>
        <p class="muted">Gesetzliche Feiertage werden automatisch berechnet. Ferientermine sind vorbelegt, bitte mit dem offiziellen Schulkalender abgleichen und bei Bedarf anpassen.</p>
        <table class="tbl"><thead><tr><th>Bezeichnung</th><th>Von</th><th>Bis</th><th></th></tr></thead><tbody id="frows">
        ${s.ferien.slice().sort((a, b) => a.von.localeCompare(b.von)).map(f => `<tr><td><input type="text" data-f="${f.id}" data-k="name" value="${esc(f.name)}"></td><td><input type="date" data-f="${f.id}" data-k="von" value="${f.von}"></td><td><input type="date" data-f="${f.id}" data-k="bis" value="${f.bis}"></td><td style="width:50px"><button class="btn sm ic warn" data-act="ferien-del:${f.id}" aria-label="Löschen">×</button></td></tr>`).join('')}</tbody></table>
        <div class="row" style="margin-top:10px"><button class="btn sm" data-act="ferien-add">${ic('plus')} Termin</button><button class="btn sm" data-act="ferien-std">Standardtermine ergänzen</button></div></div>
      <div class="card"><b>Wichtige Termine</b><p class="muted">Erscheinen im Kalender (Monat/Woche) und auf der Ferienübersicht.</p><table class="tbl"><tbody>
        ${(s.termine || []).slice().sort((a, b) => a.datum.localeCompare(b.datum)).map(t => `<tr><td><input type="text" data-t="${t.id}" data-k="name" value="${esc(t.name)}"></td><td><input type="date" data-t="${t.id}" data-k="datum" value="${t.datum}"></td><td style="width:50px"><button class="btn sm ic warn" data-act="termin-del:${t.id}" aria-label="Löschen">×</button></td></tr>`).join('')}</tbody></table>
        <div class="row" style="margin-top:10px"><button class="btn sm" data-act="termin-add">${ic('plus')} Termin</button></div></div>
      <div class="card"><b>Notenschlüssel (Prozent)</b>
        <p class="muted">Voreingestellt: IHK-Schlüssel (92 / 81 / 67 / 50 / 30). Note 6 gilt darunter.</p>
        <div class="row">${[1, 2, 3, 4, 5].map(i => `<div class="field" style="width:110px"><label>Note ${i} ab %</label><input type="number" inputmode="decimal" data-key="${i - 1}" value="${k[i - 1]}" min="0" max="100" step="1"></div>`).join('')}</div>
        <button class="btn sm" data-act="key-reset">Auf IHK-Standard zurücksetzen</button></div>
      <div class="card"><b>S Pen</b><p class="muted">Seitentaste gedrückt halten und über einen Strich fahren: radiert. Die Diagnose zeigt unten links, welche Signale der Stift sendet.</p>
        <button class="btn sm" data-act="pendebug">${(() => { try { return localStorage.getItem('pendebug') === '1'; } catch (_) { return false; } })() ? 'Stift-Diagnose ausblenden' : 'Stift-Diagnose einblenden'}</button></div>
      <div class="card" id="lockcard">${lockCardHtml()}</div>
      <div class="card"><b>Datensicherung</b>
        <p class="muted">Alle Daten (Klassen, Noten, Handschrift, PDFs) liegen nur auf diesem Tablet. Sichere sie regelmäßig – z. B. in OneDrive/Google Drive. Letztes Backup: <b>${backup}</b>.</p>
        <p class="muted">${S.persisted ? 'Der Browser schützt den Speicher dauerhaft vor automatischem Löschen.' : 'Hinweis: Installiere die App über das Browser-Menü („Zum Startbildschirm hinzufügen“), damit der Speicher dauerhaft geschützt wird.'}</p>
        <div class="row"><button class="btn pri" data-act="backup-export">${ic('download')} Backup erstellen</button><button class="btn" data-act="backup-import">${ic('upload')} Backup einspielen</button></div>
        <input type="file" id="backupIn" hidden accept="application/json,.json"></div>
      </div></div>`;
    $('#backupIn').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); };
  }
  const blobToDataURL = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
  async function exportBackup() {
    toast('Backup wird erstellt …', 0);
    const kv = await DB.all(), data = {}, blobs = {};
    for (const key of Object.keys(kv)) { if (key.startsWith('meta:')) continue; if (kv[key] instanceof Blob) blobs[key] = await blobToDataURL(kv[key]); else data[key] = kv[key]; }
    S.settings.lastBackup = Date.now(); await saveSettings();
    data.settings = S.settings;
    let out = { format: 'lehrerplaner-backup', version: 1, created: new Date().toISOString(), data, blobs };
    if (S.lockMeta && S.dek) {
      const e = await LK.enc(S.dek, LK.te.encode(JSON.stringify({ data, blobs })));
      out = { format: 'lehrerplaner-backup', version: 2, enc: 1, created: out.created, lock: LK.plainMeta(S.lockMeta), iv: LK.b64(e.iv), ct: LK.b64(e.ct) };
    }
    download(new Blob([JSON.stringify(out)], { type: 'application/json' }), `Lehrerplaner-Backup-${PL.iso(new Date())}${out.enc ? '-verschluesselt' : ''}.json`);
    toast(out.enc ? 'Verschlüsseltes Backup gespeichert (Ordner „Downloads“).' : 'Backup gespeichert (Ordner „Downloads“).'); if (S.view.t === 'settings') viewSettings();
  }
  async function importBackup(file) {
    let j; try { j = JSON.parse(await file.text()); } catch (e) { return toast('Datei konnte nicht gelesen werden.'); }
    if (!j || j.format !== 'lehrerplaner-backup') return toast('Das ist keine Lehrerplaner-Sicherung.');
    if (j.enc) {
      const pw = await askPassword('Verschlüsseltes Backup', 'Passwort, mit dem dieses Backup erstellt wurde (das App-Passwort zum Zeitpunkt des Backups):');
      if (pw === null) return;
      try { const dek = await LK.openPw(j.lock, pw); const inner = JSON.parse(LK.td.decode(await LK.dec(dek, LK.unb64(j.iv), LK.unb64(j.ct)))); j = { data: inner.data, blobs: inner.blobs }; }
      catch (e) { return toast('Passwort falsch oder Datei beschädigt.'); }
    }
    if (!await ask('Backup einspielen?', 'Alle aktuellen Daten auf diesem Gerät werden durch das Backup ersetzt.', 'Ersetzen', true)) return;
    toast('Backup wird eingespielt …', 0);
    const keep = {}; for (const k of ['meta:lock', 'meta:devkey', 'meta:lockopts']) keep[k] = await DB.rawGet(k);
    await DB.clear();
    for (const [k, v] of Object.entries(keep)) if (v !== undefined) await DB.rawPut(k, v);
    for (const [key, v] of Object.entries(j.data || {})) if (!key.startsWith('meta:')) await DB.put(key, v);
    for (const [key, v] of Object.entries(j.blobs || {})) if (!key.startsWith('meta:')) await DB.put(key, await (await fetch(v)).blob());
    await loadState(); toast('Backup eingespielt.'); go(todayView());
  }

  /* ---------- Sperre & Verschlüsselung (optional) ---------- */
  const LOCK_MINS = [1, 5, 15, 30];
  function askPassword(title, text) {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      modal({ title, body: `<p>${text}</p><div class="field"><input type="password" id="apw" autocomplete="current-password" placeholder="Passwort"></div>`,
        buttons: [{ label: 'Abbrechen', onClick: () => fin(null) }, { label: 'OK', cls: 'pri', onClick: ov => { fin($('#apw', ov).value); } }], onOpen: ov => setTimeout(() => $('#apw', ov).focus(), 50) });
    });
  }
  function lockCardHtml() {
    const on = !!S.lockMeta, bio = on && S.lockMeta.bio;
    if (!on) return `<b>Sperre &amp; Verschlüsselung</b>
      <p class="muted">Optional. Schützt die App mit einem Passwort und verschlüsselt alle Daten auf dem Tablet (AES-256). Danach kannst du zusätzlich den Fingerabdruck als Abkürzung einschalten.</p>
      <button class="btn pri" data-act="lock-enable">${ic('lock')} Sperre einschalten</button>`;
    return `<b>Sperre &amp; Verschlüsselung: <span style="color:var(--ok)">eingeschaltet</span></b>
      <p class="muted">Alle Daten sind mit AES-256 verschlüsselt. Ohne Passwort sind sie nicht lesbar – auch nicht für mich oder den Browser-Hersteller.</p>
      <div class="row" style="align-items:flex-end"><div class="field" style="width:230px"><label>Automatisch sperren nach</label><select data-lockmin>${LOCK_MINS.map(m => `<option value="${m}" ${S.lockOpts.min === m ? 'selected' : ''}>${m} Minute${m > 1 ? 'n' : ''} Inaktivität</option>`).join('')}</select></div>
        <button class="btn" data-act="lock-now">${ic('lock')} Jetzt sperren</button><button class="btn" data-act="lock-pw">Passwort ändern</button></div>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="${bio ? 'bio-off' : 'bio-on'}" id="biobtn">${bio ? 'Fingerabdruck ausschalten' : 'Fingerabdruck einschalten'}</button><button class="btn warn" data-act="lock-disable">Sperre ausschalten</button></div>
      <p class="muted" style="margin-top:10px">Wichtig: Wer das Passwort vergisst, kommt nicht mehr an die Daten – es gibt keine Wiederherstellung. Mach deshalb regelmäßig ein Backup (wird bei eingeschalteter Sperre ebenfalls verschlüsselt).</p>`;
  }
  const refreshLockCard = () => { const c = $('#lockcard'); if (c) c.innerHTML = lockCardHtml(); };
  async function lockSetMeta(m) { S.lockMeta = m; await DB.put('meta:lock', m); }
  function pwDialog(title, extra) {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      modal({ title, body: `${extra || ''}<div class="field"><label>Neues Passwort (mind. 8 Zeichen)</label><input type="password" id="np1" autocomplete="new-password"></div><div class="field"><label>Wiederholen</label><input type="password" id="np2" autocomplete="new-password"></div><div class="muted" id="npe" style="color:#b3261e;min-height:20px"></div>`,
        buttons: [{ label: 'Abbrechen', onClick: () => fin(null) }, { label: 'Weiter', cls: 'pri', onClick: ov => {
          const a = $('#np1', ov).value, b = $('#np2', ov).value;
          if (a.length < 8) { $('#npe', ov).textContent = 'Das Passwort braucht mindestens 8 Zeichen.'; return false; }
          if (a !== b) { $('#npe', ov).textContent = 'Die beiden Eingaben stimmen nicht überein.'; return false; }
          fin(a);
        } }], onOpen: ov => setTimeout(() => $('#np1', ov).focus(), 50) });
    });
  }
  async function lockEnable() {
    const pw = await pwDialog('Sperre einschalten', '<p>Wähle ein Passwort, das du dir sicher merken kannst. <b>Es kann nicht zurückgesetzt werden.</b></p>');
    if (pw === null) return;
    toast('Verschlüssele …', 0);
    try {
      const { meta, dek } = await LK.create(pw);
      await DB.put('meta:lock', meta); await DB.put('meta:lockopts', { min: 5 });
      DB.setKey(dek, true); S.dek = dek; S.lockMeta = meta; S.lockOpts = { min: 5 };
      await DB.migrate('enc'); armIdle(); renderTop(); refreshLockCard();
      toast('Sperre eingeschaltet. Alle Daten sind jetzt verschlüsselt.');
    } catch (e) { console.error(e); toast('Fehler: ' + (e.message || e)); }
  }
  async function lockDisable() {
    if (!await ask('Sperre ausschalten?', 'Die Daten werden wieder unverschlüsselt gespeichert und die App ist nicht mehr passwortgeschützt.', 'Ausschalten', true)) return;
    toast('Entschlüssele …', 0);
    try {
      await DB.migrate('dec'); DB.setKey(null, false);
      await DB.del('meta:lock'); await DB.del('meta:devkey'); await DB.del('meta:lockopts');
      S.lockMeta = null; S.dek = null; clearInterval(S.idleT); renderTop(); refreshLockCard(); toast('Sperre ausgeschaltet.');
    } catch (e) { console.error(e); toast('Fehler: ' + (e.message || e)); }
  }
  async function lockChangePw() {
    const old = await askPassword('Passwort ändern', 'Aktuelles Passwort:'); if (old === null) return;
    try { await LK.openPw(S.lockMeta, old); } catch (e) { return toast('Aktuelles Passwort ist falsch.'); }
    const pw = await pwDialog('Neues Passwort'); if (pw === null) return;
    toast('Speichere …', 0); await lockSetMeta(await LK.rewrap(S.lockMeta, S.dek, pw)); toast('Passwort geändert.');
  }
  async function bioOn() {
    if (!await LK.bioSupported()) return toast('Fingerabdruck wird hier nicht unterstützt (nötig: https-Adresse und eingerichtete Bildschirmsperre/Fingerabdruck am Tablet).', 6000);
    try {
      const { devkey, bio } = await LK.bioEnroll(S.dek);
      await DB.put('meta:devkey', devkey); await lockSetMeta({ ...S.lockMeta, bio });
      refreshLockCard(); toast('Fingerabdruck eingeschaltet.');
    } catch (e) { toast('Fingerabdruck nicht eingerichtet: ' + (e.name === 'NotAllowedError' ? 'abgebrochen.' : (e.message || e))); }
  }
  async function bioOff() { const m = { ...S.lockMeta }; delete m.bio; await lockSetMeta(m); await DB.del('meta:devkey'); refreshLockCard(); toast('Fingerabdruck ausgeschaltet.'); }

  function lockScreen() {
    return new Promise(async resolve => {
      document.querySelectorAll('#lock').forEach(e => e.remove());
      const meta = S.lockMeta, devkey = meta.bio ? await DB.get('meta:devkey') : null, canBio = !!(meta.bio && devkey);
      const el = document.createElement('div'); el.id = 'lock';
      el.innerHTML = `<form class="lk" autocomplete="off"><img class="logo" src="icon-192.png" alt=""><h1>Lehrerplaner</h1><p>Gesperrt – bitte entsperren.</p>
        <input type="password" id="lkpw" placeholder="Passwort" autocomplete="current-password"><div class="err" id="lkerr" role="alert"></div>
        <button class="btn pri" id="lkgo" type="submit">Entsperren</button>${canBio ? '<button class="btn" id="lkbio" type="button">Mit Fingerabdruck entsperren</button>' : ''}</form>`;
      document.body.appendChild(el);
      const pw = $('#lkpw', el), err = $('#lkerr', el), go_ = $('#lkgo', el);
      let fails = 0, busy = false;
      const done = dek => { el.remove(); resolve(dek); };
      const wait = sec => { go_.disabled = true; const t = setInterval(() => { sec--; if (sec <= 0) { clearInterval(t); go_.disabled = false; err.textContent = ''; } else err.textContent = `Falsches Passwort. Bitte ${sec} s warten.`; }, 1000); err.textContent = `Falsches Passwort. Bitte ${sec} s warten.`; };
      el.firstElementChild.onsubmit = async ev => {
        ev.preventDefault(); if (busy || go_.disabled || !pw.value) return; busy = true; err.textContent = 'Prüfe …';
        try { const dek = await LK.openPw(meta, pw.value); pw.value = ''; done(dek); }
        catch (e) { fails++; pw.value = ''; if (fails >= 3) wait(Math.min(2 ** (fails - 2), 30)); else err.textContent = 'Falsches Passwort.'; }
        busy = false;
      };
      if (canBio) {
        const tryBio = async () => { if (busy) return; busy = true; try { done(await LK.bioOpen(meta.bio, devkey)); } catch (e) { err.textContent = 'Fingerabdruck nicht erkannt – bitte Passwort eingeben.'; } busy = false; };
        $('#lkbio', el).onclick = tryBio; setTimeout(tryBio, 350);
      }
      setTimeout(() => pw.focus(), 100);
    });
  }
  async function unlockFlow() { const dek = await lockScreen(); S.dek = dek; DB.setKey(dek, true); }
  async function lockNow() {
    if (!S.lockMeta || S.locked) return; S.locked = true; clearInterval(S.idleT);
    try { if (S.P) await flushInk(S.P); cleanupPage(); } catch (_) { }
    DB.setKey(null, true); S.dek = null; S.classes = []; S.pages = [];
    document.querySelectorAll('.ov').forEach(e => e.remove());
    $('#main').innerHTML = ''; $('#sub').innerHTML = ''; $('#nav').innerHTML = ''; $('#topr').innerHTML = '';
    await unlockFlow(); await loadState(); S.locked = false; render(); armIdle();
  }
  function armIdle() {
    clearInterval(S.idleT); if (!S.lockMeta) return; S.lastAct = Date.now();
    S.idleT = setInterval(() => { if (!S.locked && Date.now() - S.lastAct > S.lockOpts.min * 60000) lockNow(); }, 10000);
  }
  ['pointerdown', 'pointermove', 'keydown', 'touchstart'].forEach(t => document.addEventListener(t, () => { S.lastAct = Date.now(); }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (!S.lockMeta || S.locked) return;
    if (document.hidden) S.hiddenAt = Date.now();
    else if (S.hiddenAt && Date.now() - S.hiddenAt > S.lockOpts.min * 60000) lockNow();
  });
  document.addEventListener('change', e => { const t = e.target; if (t.matches && t.matches('[data-lockmin]')) { S.lockOpts = { min: +t.value }; DB.put('meta:lockopts', S.lockOpts); armIdle(); } });

  /* ---------- Klicks ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const i = el.dataset.act.indexOf(':'), name = i < 0 ? el.dataset.act : el.dataset.act.slice(0, i), arg = i < 0 ? '' : el.dataset.act.slice(i + 1);
    act(name, arg);
  });
  document.addEventListener('pointerdown', e => { if (S.popOpen && !e.target.closest('.popwrap')) { S.popOpen = false; if (S.P) renderSubInk(); } }, true);
  function act(name, arg) {
    const s = S.settings, P = S.P;
    switch (name) {
      case 'nav-cal': return go(S.lastCal || todayView());
      case 'nav-notes': return go({ t: 'notes' });
      case 'nav-classes': return go({ t: 'classes' });
      case 'nav-settings': return go({ t: 'settings' });
      case 'view-ov': case 'view-month': case 'view-week': return toView(name.slice(5));
      case 'prev': return stepCal(-1);
      case 'next': return stepCal(1);
      case 'today': return goToday();
      case 'tool': s.tool = arg; S.popOpen = false; saveSettings(); return renderSubInk();
      case 'pop': S.popOpen = !S.popOpen; return renderSubInk();
      case 'color': if (s.tool === 'hl') s.hlColor = arg; else s.penColor = arg; saveSettings(); return renderSubInk();
      case 'size': if (s.tool === 'hl') s.hlSize = +arg; else s.penSize = +arg; saveSettings(); return renderSubInk();
      case 'undo': return P && P.ink.undo();
      case 'redo': return P && P.ink.redo();
      case 'clear': S.popOpen = false; renderSubInk(); if (P && P.ink.strokes.length) ask('Seite leeren?', 'Alle Handschrift-Notizen auf dieser Seite entfernen? (Danach mit „Rückgängig“ wiederherstellbar, solange du die Seite nicht verlässt.)', 'Leeren', true).then(ok => ok && S.P === P && P.ink.clearAll()); return;
      case 'fit': if (!P) return; P.fit = P.fit === 'page' ? 'width' : 'page'; P.scale = fitScale(P.fit); applySize(); { const st = $('#stage'); st.scrollLeft = 0; st.scrollTop = 0; } return;
      case 'finger': s.fingerDraw = !s.fingerDraw; saveSettings(); return renderSubInk();
      case 'note-new': return newNoteDialog();
      case 'note-import': return $('#fileIn') && $('#fileIn').click();
      case 'note-open': return go({ t: 'note', id: arg });
      case 'note-go': return arg && go({ t: 'note', id: arg });
      case 'note-rename': return renameNote(arg);
      case 'note-del': return deleteNote(arg);
      case 'class-new': return newClassDialog();
      case 'class-open': return go({ t: 'class', id: arg });
      case 'class-edit': return editClassDialog(getClass(S.view.id));
      case 'students': return studentsDialog(getClass(S.view.id));
      case 'col-new': return colDialog(getClass(S.view.id));
      case 'col-edit': { const c = getClass(S.view.id); return colDialog(c, c.cols.find(x => x.id === arg)); }
      case 'filter': S.classFilter[S.view.id] = arg; return viewClass();
      case 'export-class': return exportClasses([getClass(S.view.id)]);
      case 'export-all': return exportClasses(S.classes);
      case 'lock-now': return lockNow();
      case 'lock-enable': return lockEnable();
      case 'lock-disable': return lockDisable();
      case 'lock-pw': return lockChangePw();
      case 'bio-on': return bioOn();
      case 'bio-off': return bioOff();
      case 'termin-add': (s.termine = s.termine || []).push({ id: uid(), name: 'Termin', datum: PL.iso(new Date()) }); saveSettings(); return viewSettings();
      case 'termin-del': s.termine = s.termine.filter(t => t.id !== arg); saveSettings(); return viewSettings();
      case 'ferien-add': s.ferien.push({ id: uid(), name: 'Ferien', von: PL.iso(new Date()), bis: PL.iso(new Date()) }); saveSettings(); return viewSettings();
      case 'ferien-del': s.ferien = s.ferien.filter(f => f.id !== arg); saveSettings(); return viewSettings();
      case 'ferien-std': { PL.STANDARD_FERIEN.forEach(f => { if (!s.ferien.some(x => x.name === f.name && x.von === f.von)) s.ferien.push({ id: uid(), ...f }); }); saveSettings(); toast('Standardtermine ergänzt.'); return viewSettings(); }
      case 'key-reset': s.key = PL.DEFAULT_KEY.slice(); saveSettings(); return viewSettings();
      case 'pendebug': { let on = false; try { on = localStorage.getItem('pendebug') === '1'; localStorage.setItem('pendebug', on ? '0' : '1'); } catch (_) { } if (on) { const d = $('#pdbg'); if (d) d.remove(); } else Ink.debug(); return viewSettings(); }
      case 'backup-export': return exportBackup();
      case 'backup-import': return $('#backupIn') && $('#backupIn').click();
    }
  }
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('input.cell')) return onCellChange(t);
    if (t.dataset && t.dataset.t) { const x = (S.settings.termine || []).find(q => q.id === t.dataset.t); if (x) { x[t.dataset.k] = t.value; saveSettings(); } return; }
    if (t.dataset && t.dataset.f) { const f = S.settings.ferien.find(x => x.id === t.dataset.f); if (f) { f[t.dataset.k] = t.value; saveSettings(); } return; }
    if (t.dataset && t.dataset.key !== undefined && t.closest('#main')) {
      const k = S.settings.key.slice(); k[+t.dataset.key] = clamp(parseFloat(String(t.value).replace(',', '.')) || 0, 0, 100);
      if (k.some((v, i) => i && v >= k[i - 1])) { toast('Die Werte müssen absteigend sein (Note 1 am höchsten).'); return viewSettings(); }
      S.settings.key = k; saveSettings(); toast('Notenschlüssel gespeichert.');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('input.cell')) {
      e.preventDefault();
      const all = $$(`input.cell[data-c="${e.target.dataset.c}"]`), i = all.indexOf(e.target), nx = all[i + 1];
      if (nx) nx.focus(); else e.target.blur();
    }
  });
  document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('input.cell')) e.target.select(); });

  /* ---------- Start ---------- */
  (async function init() {
    try {
      const ver = $('#ver'); if (ver) ver.textContent = 'v' + APP_VERSION;
      await DB.open();
      S.lockMeta = await DB.get('meta:lock'); S.lockOpts = (await DB.get('meta:lockopts')) || { min: 5 };
      if (S.lockMeta) { DB.setKey(null, true); await unlockFlow(); armIdle(); }
      await loadState();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(ok => { S.persisted = ok; });
      if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href)) navigator.serviceWorker.register('sw.js').catch(() => { });
      const v = (history.state && history.state.v) || todayView();
      history.replaceState({ v }, ''); S.view = v; if (CAL.includes(v.t)) S.lastCal = v; render();
    } catch (err) {
      console.error(err);
      $('#main').innerHTML = `<div class="scroll"><div class="card"><b>Der lokale Speicher ist nicht verfügbar.</b><p>${esc(err.message || err)}</p><p class="muted">Im privaten Modus oder bei gesperrten Website-Daten kann die App nicht speichern.</p></div></div>`;
    }
  })();
})();
