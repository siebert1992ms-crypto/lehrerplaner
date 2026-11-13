/* Lehrerplaner – Handschrift-Ebene (S Pen: Druck, Radiergummi-Taste; Finger: scrollen/zoomen, Tippen = Navigation) */
(function (root) {
  'use strict';
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  class Ink {
    /* hooks: tool(), color(), size(), fingerDraw(), onChange(strokes), onTap(x,y), pan(dx,dy), zoomTo(s,cx,cy), getScale() */
    constructor(cv, hooks) {
      this.cv = cv; this.ctx = cv.getContext('2d'); this.h = hooks; // ohne „desynchronized“: sonst wird die durchsichtige Ebene auf Android schwarz
      this.W = 1000; this.H = 1000; this.scale = 1; this.dpr = 1;
      this.strokes = []; this.undoS = []; this.redoS = [];
      this.base = document.createElement('canvas'); this.bctx = this.base.getContext('2d');
      this.cur = null; this.erasing = null; this.eraserPos = null; this.active = null;
      this.touches = new Map(); this.gesture = null; this.pinch = null; this.lastPen = 0; this.raf = 0;
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', e => this._down(e));
      cv.addEventListener('pointermove', e => this._move(e));
      cv.addEventListener('pointerup', e => this._up(e, false));
      cv.addEventListener('pointercancel', e => this._up(e, true));
      cv.addEventListener('pointerout', e => { if (this.active && this.active.btn && this.active.id === e.pointerId) this._up(e, false); });
      cv.addEventListener('pointerleave', e => { if (!this.active && this.eraserPos) { this.eraserPos = null; this._sched(); } });
      cv.addEventListener('contextmenu', e => e.preventDefault());
      let dbg = false; try { dbg = localStorage.getItem('pendebug') === '1'; } catch (_) { }
      if (dbg || /[?#&]pendebug/.test(location.href)) Ink.debug();
    }

    /* ---- Größe/Zoom ---- */
    layout(W, H, scale) {
      let dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const px = W * scale * dpr, py = H * scale * dpr, max = 14e6;
      if (px * py > max) dpr *= Math.sqrt(max / (px * py));
      if (W === this.W && H === this.H && scale === this.scale && dpr === this.dpr && this.cv.width > 1) return; // nichts geändert: Leinwand nicht neu anlegen
      this.W = W; this.H = H; this.scale = scale;
      this.dpr = dpr;
      const w = Math.max(1, Math.round(W * scale * dpr)), h = Math.max(1, Math.round(H * scale * dpr));
      this.cv.width = w; this.cv.height = h; this.base.width = w; this.base.height = h;
      this.cv.style.width = W * scale + 'px'; this.cv.style.height = H * scale + 'px';
      this._renderBase(); this._full();
    }
    setStrokes(arr) { this.strokes = Array.isArray(arr) ? arr : []; this.undoS = []; this.redoS = []; this._renderBase(); this._full(); }

    /* ---- Zeichnen ---- */
    _k() { return this.scale * this.dpr; }
    _pt(e) {
      const r = this.cv.getBoundingClientRect();
      return [(e.clientX - r.left) / this.scale, (e.clientY - r.top) / this.scale, e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5];
    }
    _drawStroke(ctx, s) {
      const pts = s.p; if (!pts.length) return;
      const k = this._k();
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.lineJoin = 'round'; ctx.strokeStyle = s.c; ctx.fillStyle = s.c;
      if (s.t === 'hl') {
        ctx.globalAlpha = 0.33; ctx.lineCap = 'butt'; ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) { const m = mid(pts[i], pts[i + 1]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
        if (pts.length > 1) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        ctx.stroke(); ctx.globalAlpha = 1; return;
      }
      ctx.lineCap = 'round';
      if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], s.w * 0.55, 0, 7); ctx.fill(); return; }
      this._penSegs(ctx, s, 1);
    }
    _penSegs(ctx, s, from) {
      const pts = s.p, n = pts.length;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = s.c;
      for (let i = Math.max(1, from); i < n; i++) {
        const a = i === 1 ? pts[0] : mid(pts[i - 1], pts[i]);
        const b = i < n - 1 ? mid(pts[i], pts[i + 1]) : pts[i];
        ctx.lineWidth = s.w * (0.45 + 1.1 * pts[i][2]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], b[0], b[1]); ctx.stroke();
      }
    }
    _clear(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
    _renderBase() { this._clear(this.bctx); for (const s of this.strokes) this._drawStroke(this.bctx, s); }
    _full() {
      if (this.baseDirty) { this.baseDirty = false; this._renderBase(); }
      const c = this.ctx; this._clear(c); c.drawImage(this.base, 0, 0);
      if (this.cur) this._drawStroke(c, this.cur);
      if (this.eraserPos) {
        const k = this._k(); c.setTransform(k, 0, 0, k, 0, 0);
        c.beginPath(); c.arc(this.eraserPos[0], this.eraserPos[1], 10, 0, 7);
        c.lineWidth = 1.2; c.strokeStyle = 'rgba(30,40,50,.6)'; c.stroke();
      }
    }
    _sched() { if (this.raf) return; this.raf = requestAnimationFrame(() => { this.raf = 0; this._frame(); }); }
    _frame() {
      if (this.cur && this.cur.t === 'pen' && !this.eraserPos) {
        const c = this.ctx, k = this._k(); c.setTransform(k, 0, 0, k, 0, 0);
        if (this.cur.p.length === 1) { this._drawStroke(c, this.cur); return; }
        this._penSegs(c, this.cur, this.cur.drawn || 1);
        this.cur.drawn = this.cur.p.length - 1;
      } else this._full();
    }

    /* ---- Radierer (Strich-Radierer) ---- */
    _bb(s) {
      if (s._bb) return s._bb;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of s.p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      Object.defineProperty(s, '_bb', { value: [x0, y0, x1, y1], enumerable: false, writable: true });
      return s._bb;
    }
    _hit(s, p, r) {
      r += s.w / 2;
      const b = this._bb(s);
      if (p[0] < b[0] - r || p[0] > b[2] + r || p[1] < b[1] - r || p[1] > b[3] + r) return false;
      const pts = s.p;
      if (pts.length === 1) return Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) <= r;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], c = pts[i], dx = c[0] - a[0], dy = c[1] - a[1], l2 = dx * dx + dy * dy;
        let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
        if (Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)) <= r) return true;
      }
      return false;
    }
    _erase(p) {
      this.eraserPos = p;
      let changed = false;
      for (let i = this.strokes.length - 1; i >= 0; i--) {
        if (this._hit(this.strokes[i], p, 10)) { this.erasing.list.push(this.strokes[i]); this.strokes.splice(i, 1); changed = true; }
      }
      if (changed) this.baseDirty = true; // neu zeichnen erst im nächsten Bildaufbau, nicht bei jedem Stiftsignal
    }

    /* ---- Eingabe ---- */
    /* Seitentaste des S Pen: Chrome meldet sie als Taste 2 (rechts), das Radierende als Taste 5/32.
       Manche Geräte melden den Stift mit gedrückter Taste als Maus – auch das zählt als Radierer. */
    _btnErase(e) {
      // Stift: jede Taste außer der normalen Spitze (button 0 / buttons 1) gilt als Radierer
      if (e.pointerType === 'pen') return (e.button > 0) || ((e.buttons & ~1) !== 0);
      return e.button === 2 || e.button === 5 || !!(e.buttons & 2) || !!(e.buttons & 32);
    }
    _isDrawer(e) {
      if (e.pointerType === 'pen') return true;
      if (e.pointerType === 'mouse') return e.button === 0 || this._btnErase(e);
      if (e.pointerType === 'touch') return !!this.h.fingerDraw() && performance.now() - this.lastPen > 700;
      return false;
    }
    _down(e) {
      if (e.pointerType === 'pen') this.lastPen = performance.now();
      if (this._isDrawer(e)) {
        if (this.active) return;
        e.preventDefault();
        try { this.cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        this.active = { id: e.pointerId };
        let tool = this.h.tool();
        if ((e.pointerType === 'pen' || e.pointerType === 'mouse') && this._btnErase(e)) tool = 'eraser';
        const p = this._pt(e);
        if (tool === 'eraser') { this.erasing = { list: [] }; this._erase(p); }
        else this.cur = { cx: e.clientX, cy: e.clientY, c: this.h.color(tool), w: tool === 'hl' ? this.h.size(tool) : this.h.size(tool), t: tool === 'hl' ? 'hl' : 'pen', p: [p], drawn: 1 };
        this._full();
      } else if (e.pointerType === 'touch') {
        if (performance.now() - this.lastPen < 700) return; // Handballen-Schutz
        this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { this.cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        if (!this.gesture) this.gesture = { moved: 0, t0: performance.now(), n: 0, sx: e.clientX, sy: e.clientY, can: !!(this.h.canSwipe && this.h.canSwipe()) };
        this.gesture.n = Math.max(this.gesture.n, this.touches.size);
        if (this.touches.size === 2) {
          const [a, b] = [...this.touches.values()];
          this.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: this.h.getScale(), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
        }
      }
    }
    _move(e) {
      if (e.pointerType === 'pen') this.lastPen = performance.now();
      /* S Pen am Tab S9: Mit gedrückter Seitentaste schickt Chrome kein pointerdown, sondern nur
         Bewegungen mit buttons=1 (und am Ende ein contextmenu). Genau das ist hier das Radier-Signal. */
      if (e.pointerType === 'pen' && !this.active && (e.buttons & 1)) {
        this.active = { id: e.pointerId, btn: true }; this.erasing = { list: [] };
        try { this.cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
      if (this.active && this.active.btn && this.active.id === e.pointerId && !(e.buttons & 1)) { this._up(e, false); return; }
      if (this.active && this.active.id === e.pointerId) {
        if (this.cur && !this.erasing && e.pointerType !== 'touch' && this._btnErase(e)) {
          // Taste während des Schreibens gedrückt: Strich abschließen, ab hier radieren
          const s = this.cur; this.cur = null;
          if (s.p.length > 2) this._commit(s);
          this.erasing = { list: [] };
        }
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        for (const ev of (evs.length ? evs : [e])) {
          const p = this._pt(ev);
          if (this.erasing) this._erase(p);
          else {
            const l = this.cur.p[this.cur.p.length - 1];
            if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= 0.6) this.cur.p.push(p);
          }
        }
        this._sched();
      } else if (e.pointerType === 'touch' && this.touches.has(e.pointerId)) {
        const t = this.touches.get(e.pointerId), dx = e.clientX - t.x, dy = e.clientY - t.y;
        t.x = e.clientX; t.y = e.clientY; this.gesture.moved += Math.abs(dx) + Math.abs(dy);
        if (this.touches.size === 1) this.h.pan(-dx, -dy);
        else if (this.touches.size === 2 && this.pinch) {
          const [a, b] = [...this.touches.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
          this.h.zoomTo(this.pinch.s0 * d / this.pinch.d0, cx, cy);
          this.h.pan(-(cx - this.pinch.cx), -(cy - this.pinch.cy));
          this.pinch.cx = cx; this.pinch.cy = cy;
        }
      } else if (e.pointerType === 'pen' && !this.active && (this.h.tool() === 'eraser' || this._btnErase(e))) {
        this.eraserPos = this._pt(e); this._sched();
      }
    }
    _up(e, cancel) {
      if (this.active && this.active.id === e.pointerId) {
        this.active = null;
        if (this.erasing) {
          const list = this.erasing.list; this.erasing = null; this.eraserPos = null;
          if (list.length) { this.undoS.push({ t: 'del', list }); this.redoS = []; this.h.onChange(this.strokes); }
          this._full();
        } else if (this.cur) {
          const s = this.cur; this.cur = null;
          if (!cancel && s.p.length <= 4 && this.h.onPenTap && s.cx !== undefined && Math.hypot(s.p[s.p.length - 1][0] - s.p[0][0], s.p[s.p.length - 1][1] - s.p[0][1]) < 6 && this.h.onPenTap(s.cx, s.cy)) { this._full(); return; }
          if (!cancel) this._commit(s);
          this._full();
        }
      } else if (this.touches.has(e.pointerId)) {
        this.touches.delete(e.pointerId);
        const g = this.gesture;
        if (!this.touches.size && g) {
          const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
          if (!cancel && g.n === 1 && g.can && this.h.onSwipe && Math.abs(dx) > 70 && Math.abs(dx) > 1.8 * Math.abs(dy) && performance.now() - g.t0 < 900) this.h.onSwipe(dx < 0 ? 1 : -1);
          else if (!cancel && g.n === 1 && g.moved < 10 && performance.now() - g.t0 < 450) this.h.onTap(e.clientX, e.clientY);
          this.gesture = null;
        }
        if (this.touches.size < 2) this.pinch = null;
      }
    }

    _commit(s) {
      if (s.p.length === 1) s.p.push([s.p[0][0] + 0.01, s.p[0][1], s.p[0][2]]);
      s.p = s.p.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10, Math.round(p[2] * 100) / 100]);
      delete s.drawn;
      this.strokes.push(s); this.undoS.push({ t: 'add', s }); this.redoS = [];
      this._drawStroke(this.bctx, s); this.h.onChange(this.strokes);
    }

    /* ---- Aktionen ---- */
    undo() {
      const a = this.undoS.pop(); if (!a) return;
      if (a.t === 'add') { const i = this.strokes.indexOf(a.s); if (i >= 0) this.strokes.splice(i, 1); }
      else this.strokes.push(...a.list);
      this.redoS.push(a); this._renderBase(); this._full(); this.h.onChange(this.strokes);
    }
    redo() {
      const a = this.redoS.pop(); if (!a) return;
      if (a.t === 'add') this.strokes.push(a.s);
      else a.list.forEach(s => { const i = this.strokes.indexOf(s); if (i >= 0) this.strokes.splice(i, 1); });
      this.undoS.push(a); this._renderBase(); this._full(); this.h.onChange(this.strokes);
    }
    clearAll() {
      if (!this.strokes.length) return;
      const list = this.strokes.splice(0); this.undoS.push({ t: 'del', list }); this.redoS = [];
      this._renderBase(); this._full(); this.h.onChange(this.strokes);
    }
    canUndo() { return this.undoS.length > 0; }
    canRedo() { return this.redoS.length > 0; }
  }
  /* Diagnose: App mit …/lehrerplaner/?pendebug öffnen, zeigt die letzten Stift-Ereignisse */
  Ink.debug = () => {
    if (document.getElementById('pdbg')) return;
    const box = document.createElement('div'); box.id = 'pdbg';
    box.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99;background:#1d242b;color:#fff;font:12px/1.4 monospace;padding:8px 12px;border-radius:8px;pointer-events:none;max-width:60vw;white-space:pre';
    document.body.appendChild(box);
    const log = [];
    const add = t => { log.unshift(t); log.length = 8; box.textContent = log.filter(Boolean).join('\n'); };
    ['pointerdown', 'pointerup', 'pointercancel', 'contextmenu', 'auxclick', 'lostpointercapture'].forEach(type => window.addEventListener(type, e => add(`${type} typ=${e.pointerType || '-'} button=${e.button} buttons=${e.buttons} druck=${e.pressure != null ? e.pressure.toFixed(2) : '-'}`), true));
    let lastB = -1;
    window.addEventListener('pointermove', e => { if (e.buttons !== lastB) { lastB = e.buttons; add(`pointermove typ=${e.pointerType} button=${e.button} buttons=${e.buttons}`); } }, true);
    window.addEventListener('keydown', e => add(`keydown ${e.key}`), true);
  };
  root.Ink = Ink;
})(window);
