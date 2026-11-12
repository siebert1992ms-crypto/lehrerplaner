/* Lehrerplaner – reine Logik (Datum, Feiertage, Noten, XLSX). Läuft im Browser und in Node (Tests). */
(function (root) {
  'use strict';
  const PL = {};

  /* ---------- Datum ---------- */
  const pad = n => String(n).padStart(2, '0');
  PL.pad = pad;
  PL.MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  PL.WD = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  PL.WD2 = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  PL.iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  PL.parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  PL.addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  PL.de = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  PL.deShort = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
  PL.mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  PL.isoWeek = d => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dayNum);
    const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { week: Math.ceil(((t - ys) / 86400000 + 1) / 7), year: t.getUTCFullYear() };
  };
  PL.schuljahrOf = d => (d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1);

  PL.easter = y => {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  };

  /** Gesetzliche Feiertage Niedersachsen → { 'YYYY-MM-DD': Name } */
  PL.feiertage = y => {
    const E = PL.easter(y), out = {};
    const add = (d, n) => { out[PL.iso(d)] = n; };
    add(new Date(y, 0, 1), 'Neujahr');
    add(PL.addDays(E, -2), 'Karfreitag');
    add(PL.addDays(E, 1), 'Ostermontag');
    add(new Date(y, 4, 1), 'Tag der Arbeit');
    add(PL.addDays(E, 39), 'Christi Himmelfahrt');
    add(PL.addDays(E, 50), 'Pfingstmontag');
    add(new Date(y, 9, 3), 'Tag der Dt. Einheit');
    add(new Date(y, 9, 31), 'Reformationstag');
    add(new Date(y, 11, 25), '1. Weihnachtstag');
    add(new Date(y, 11, 26), '2. Weihnachtstag');
    return out;
  };

  /* Standard-Ferientermine Niedersachsen Schuljahr 2026/27 (wie in deinem Schuljahresplaner; ohne Gewähr, bitte in den Einstellungen prüfen) */
  PL.STANDARD_FERIEN = [
    { name: 'Sommerferien 2026', von: '2026-07-02', bis: '2026-08-12' },
    { name: 'Herbstferien', von: '2026-10-12', bis: '2026-10-24' },
    { name: 'Weihnachtsferien', von: '2026-12-23', bis: '2027-01-09' },
    { name: 'Halbjahresferien', von: '2027-02-01', bis: '2027-02-02' },
    { name: 'Osterferien', von: '2027-03-22', bis: '2027-04-03' },
    { name: 'Beweglicher Ferientag (nach Christi Himmelfahrt)', von: '2027-05-07', bis: '2027-05-07' },
    { name: 'Beweglicher Ferientag (Pfingsten)', von: '2027-05-18', bis: '2027-05-18' },
    { name: 'Sommerferien 2027', von: '2027-07-08', bis: '2027-08-18' }
  ];
  PL.STANDARD_TERMINE = [
    { name: '1. Schultag', datum: '2026-08-13' },
    { name: 'Letzter Schultag vor den Sommerferien', datum: '2027-07-07' }
  ];
  /** Wochen (Montage), deren Donnerstag im Monat liegt – so ordnet der Schuljahresplaner Wochen den Monaten zu */
  PL.weeksOfMonth = (y, m) => {
    const out = []; let d = PL.addDays(PL.mondayOf(new Date(y, m, 1)), -7);
    for (let i = 0; i < 8; i++) { const th = PL.addDays(d, 3); if (th.getFullYear() === y && th.getMonth() === m) out.push(d); d = PL.addDays(d, 7); }
    return out;
  };
  PL.schuljahrMonths = sy => Array.from({ length: 12 }, (_, k) => ({ y: sy + (k >= 5 ? 1 : 0), m: (7 + k) % 12 }));
  PL.daysBetween = (a, b) => Math.round((PL.parseISO(b) - PL.parseISO(a)) / 86400000) + 1;

  PL.makeDayInfo = ferien => {
    const cache = {};
    const hol = y => cache[y] || (cache[y] = PL.feiertage(y));
    const list = (ferien || []).filter(f => f.von && f.bis);
    return d => {
      const iso = PL.iso(d);
      return {
        iso,
        hol: hol(d.getFullYear())[iso] || null,
        fer: list.find(f => iso >= f.von && iso <= f.bis) || null,
        we: d.getDay() === 0 || d.getDay() === 6
      };
    };
  };

  /* ---------- Noten (Prozent, IHK-Schlüssel) ---------- */
  PL.DEFAULT_KEY = [92, 81, 67, 50, 30]; // ab diesem Prozentwert Note 1,2,3,4,5; darunter 6
  PL.NOTE_TEXT = { 1: 'sehr gut', 2: 'gut', 3: 'befriedigend', 4: 'ausreichend', 5: 'mangelhaft', 6: 'ungenügend' };
  PL.TYPEN = ['mündlich', 'schriftlich', 'praktisch', 'sonstige'];

  PL.noteFromPercent = (p, key) => {
    if (p == null || isNaN(p)) return null;
    key = key || PL.DEFAULT_KEY;
    for (let i = 0; i < 5; i++) if (p >= key[i]) return i + 1;
    return 6;
  };
  /** Eingabe → Zahl 0..100, null (leer) oder NaN (ungültig) */
  PL.parsePercent = s => {
    if (s == null) return null;
    s = String(s).trim().replace(',', '.').replace('%', '').trim();
    if (s === '') return null;
    const v = Number(s);
    if (!isFinite(v) || v < 0 || v > 100) return NaN;
    return Math.round(v * 10) / 10;
  };
  PL.round1 = x => Math.round(x * 10) / 10;
  const weightOf = c => { const w = Number(c.gewicht); return isFinite(w) ? w : 1; };
  /** gewichteter Durchschnitt eines Schülers */
  PL.studentStats = (cls, sid, key, typ) => {
    let sw = 0, s = 0, n = 0;
    for (const c of cls.cols) {
      if (typ && typ !== 'alle' && c.typ !== typ) continue;
      const v = cls.scores && cls.scores[sid] ? cls.scores[sid][c.id] : null;
      if (v == null) continue;
      const w = weightOf(c);
      if (w <= 0) continue;
      s += v * w; sw += w; n++;
    }
    if (!sw) return null;
    const pct = PL.round1(s / sw);
    return { pct, note: PL.noteFromPercent(pct, key), n };
  };
  PL.columnAvg = (cls, cid) => {
    let s = 0, n = 0;
    for (const st of cls.students) { const v = cls.scores && cls.scores[st.id] ? cls.scores[st.id][cid] : null; if (v != null) { s += v; n++; } }
    return n ? PL.round1(s / n) : null;
  };

  /* ---------- ZIP (ohne Kompression) ---------- */
  const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const concat = arrs => { let len = 0; arrs.forEach(a => len += a.length); const out = new Uint8Array(len); let o = 0; arrs.forEach(a => { out.set(a, o); o += a.length; }); return out; };
  PL.zip = files => {
    const enc = new TextEncoder(), chunks = [], central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const f of files) {
      const nameB = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data), size = data.length;
      const lh = new Uint8Array(30 + nameB.length), dv = new DataView(lh.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true); dv.setUint16(8, 0, true);
      dv.setUint16(10, dosTime, true); dv.setUint16(12, dosDate, true); dv.setUint32(14, crc, true);
      dv.setUint32(18, size, true); dv.setUint32(22, size, true); dv.setUint16(26, nameB.length, true); dv.setUint16(28, 0, true);
      lh.set(nameB, 30);
      chunks.push(lh, data);
      const ch = new Uint8Array(46 + nameB.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true); cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true); cv.setUint32(24, size, true); cv.setUint16(28, nameB.length, true);
      cv.setUint32(42, offset, true); ch.set(nameB, 46);
      central.push(ch);
      offset += lh.length + size;
    }
    let cdSize = 0; central.forEach(c => cdSize += c.length);
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    return concat([...chunks, ...central, end]);
  };

  /* ---------- XLSX ---------- */
  const colName = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  PL.colName = colName;
  const esc = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Stil-Indizes: 0 Standard | 1 Kopf | 2 Zahl 0.0 | 3 zentriert | 4 fett | 5 grau zentriert | 6 Note fett | 7 Text mit Rahmen | 8 grau Label
  const XF = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
  ];
  const stylesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3A4D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEFF2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFC8CDD3"/></left><right style="thin"><color rgb="FFC8CDD3"/></right><top style="thin"><color rgb="FFC8CDD3"/></top><bottom style="thin"><color rgb="FFC8CDD3"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${XF.length}">${XF.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const cellXml = (c, r, ci) => {
    if (c == null) return '';
    if (typeof c !== 'object') c = { v: c };
    const ref = colName(ci) + r, s = c.s ? ` s="${c.s}"` : '';
    const hasV = c.v !== undefined && c.v !== null;
    if (c.f) {
      if (typeof c.v === 'number') return `<c r="${ref}"${s}><f>${esc(c.f)}</f><v>${c.v}</v></c>`;
      return `<c r="${ref}"${s} t="str"><f>${esc(c.f)}</f><v>${esc(hasV ? c.v : '')}</v></c>`;
    }
    if (!hasV) return `<c r="${ref}"${s}/>`;
    if (typeof c.v === 'number') return `<c r="${ref}"${s}><v>${c.v}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`;
  };
  const sheetXml = sh => {
    const rows = sh.rows.map((row, ri) => {
      const cells = row.map((c, ci) => cellXml(c, ri + 1, ci)).join('');
      return cells ? `<row r="${ri + 1}">${cells}</row>` : '';
    }).join('');
    const cols = sh.cols ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
    let pane = '';
    if (sh.freeze) {
      const { col, row } = sh.freeze;
      pane = `<pane${col ? ` xSplit="${col}"` : ''}${row ? ` ySplit="${row}"` : ''} topLeftCell="${colName(col)}${row + 1}" activePane="${col && row ? 'bottomRight' : (row ? 'bottomLeft' : 'topRight')}" state="frozen"/>`;
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>${cols}<sheetData>${rows}</sheetData><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToHeight="0"/></worksheet>`;
  };
  PL.buildXlsx = sheets => {
    const files = [];
    files.push({ name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` });
    files.push({ name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` });
    files.push({ name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>` });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` });
    files.push({ name: 'xl/styles.xml', data: stylesXml() });
    sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) }));
    return PL.zip(files);
  };

  const sheetName = (name, used) => {
    let n = String(name || 'Klasse').replace(/[:\\/?*\[\]]/g, '').trim().slice(0, 31) || 'Klasse';
    let base = n, i = 2;
    while (used.has(n.toLowerCase())) { const suf = ' (' + i++ + ')'; n = base.slice(0, 31 - suf.length) + suf; }
    used.add(n.toLowerCase());
    return n;
  };

  /** Tabellenblatt für eine Klasse (mit lebendigen Excel-Formeln und zwischengespeicherten Werten) */
  PL.buildClassSheet = (cls, key, name) => {
    key = key || PL.DEFAULT_KEY;
    const cols = cls.cols, n = cols.length, studs = cls.students, m = studs.length;
    const rows = [];
    rows.push([{ v: 'Klasse ' + cls.name, s: 4 }]);
    rows.push([cls.fach ? { v: 'Fach/Bemerkung: ' + cls.fach } : null]);
    rows.push([{ v: 'Stand: ' + PL.de(new Date()) }]);
    const hdr = [{ v: 'Nr.', s: 1 }, { v: 'Nachname', s: 1 }, { v: 'Vorname', s: 1 }];
    cols.forEach(c => hdr.push({ v: c.titel || 'Bewertung', s: 1 }));
    hdr.push({ v: 'Ø %', s: 1 }, { v: 'Note', s: 1 });
    rows.push(hdr);
    rows.push([null, null, { v: 'Datum', s: 8 }, ...cols.map(c => ({ v: c.datum ? PL.de(PL.parseISO(c.datum)) : '', s: 5 })), null, null]);
    rows.push([null, null, { v: 'Art', s: 8 }, ...cols.map(c => ({ v: c.typ || '', s: 5 })), null, null]);
    rows.push([null, null, { v: 'Gewichtung', s: 8 }, ...cols.map(c => ({ v: weightOf(c), s: 5 })), null, null]);
    const first = 8, last = first + m - 1;
    const L0 = colName(3), L1 = colName(2 + Math.max(n, 1));
    const avgCol = colName(3 + n), noteCol = colName(4 + n);
    const wRange = `$${L0}$7:$${L1}$7`;
    studs.forEach((st, i) => {
      const r = first + i, row = [{ v: i + 1, s: 3 }, { v: st.nachname || '', s: 7 }, { v: st.vorname || '', s: 7 }];
      cols.forEach(c => { const v = cls.scores && cls.scores[st.id] ? cls.scores[st.id][c.id] : null; row.push(v == null ? { s: 2 } : { v, s: 2 }); });
      const stats = PL.studentStats(cls, st.id, key);
      if (n) {
        const rg = `${L0}${r}:${L1}${r}`;
        row.push({ f: `IF(SUMPRODUCT(--(${rg}<>""),${wRange})=0,"",ROUND(SUMPRODUCT(${rg},${wRange})/SUMPRODUCT(--(${rg}<>""),${wRange}),1))`, v: stats ? stats.pct : '', s: 2 });
        const a = `${avgCol}${r}`;
        row.push({ f: `IF(${a}="","",IF(${a}>=${key[0]},1,IF(${a}>=${key[1]},2,IF(${a}>=${key[2]},3,IF(${a}>=${key[3]},4,IF(${a}>=${key[4]},5,6))))))`, v: stats ? stats.note : '', s: 6 });
      } else { row.push({ s: 2 }, { s: 6 }); }
      rows.push(row);
    });
    if (m && n) {
      const avgRow = [null, null, { v: 'Klassenschnitt', s: 8 }];
      cols.forEach((c, i) => { const L = colName(3 + i); const v = PL.columnAvg(cls, c.id); avgRow.push({ f: `IFERROR(AVERAGE(${L}${first}:${L}${last}),"")`, v: v == null ? '' : v, s: 2 }); });
      const pcts = studs.map(s => PL.studentStats(cls, s.id, key)).filter(Boolean).map(s => s.pct);
      const clsAvg = pcts.length ? PL.round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
      avgRow.push({ f: `IFERROR(ROUND(AVERAGE(${avgCol}${first}:${avgCol}${last}),1),"")`, v: clsAvg == null ? '' : clsAvg, s: 2 });
      avgRow.push({ s: 6 });
      rows.push(avgRow);
      rows.push([]);
      rows.push([null, { v: 'Notenspiegel', s: 1 }, { v: 'Anzahl', s: 1 }]);
      const notes = studs.map(s => { const t = PL.studentStats(cls, s.id, key); return t ? t.note : null; });
      for (let k = 1; k <= 6; k++) {
        rows.push([null, { v: `Note ${k} (${PL.NOTE_TEXT[k]})`, s: 7 }, { f: `COUNTIF($${noteCol}$${first}:$${noteCol}$${last},${k})`, v: notes.filter(x => x === k).length, s: 3 }]);
      }
    }
    const widths = [6, 18, 16, ...cols.map(() => 14), 9, 8];
    return { name, rows, cols: widths, freeze: { col: 3, row: 7 } };
  };
  PL.buildKeySheet = (key, name) => {
    key = key || PL.DEFAULT_KEY;
    const rows = [[{ v: 'Notenschlüssel (Prozent)', s: 4 }], [], [{ v: 'Note', s: 1 }, { v: 'Bezeichnung', s: 1 }, { v: 'ab Prozent', s: 1 }]];
    for (let k = 1; k <= 6; k++) rows.push([{ v: k, s: 6 }, { v: PL.NOTE_TEXT[k], s: 7 }, { v: k <= 5 ? key[k - 1] : 0, s: 3 }]);
    return { name, rows, cols: [8, 18, 12] };
  };
  PL.buildClassWorkbook = (classes, key) => {
    const used = new Set();
    const sheets = classes.map(c => PL.buildClassSheet(c, key, sheetName(c.name, used)));
    sheets.push(PL.buildKeySheet(key, sheetName('Notenschlüssel', used)));
    return PL.buildXlsx(sheets);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PL;
  root.PL = PL;
})(typeof window !== 'undefined' ? window : globalThis);
