'use strict';
/* TupperFit — extras: medidas corporales, escáner de códigos de barras y dictado por voz.
   Se carga después de app.js y reutiliza sus funciones. */

// ───────── 1) MEDIDAS CORPORALES ─────────
// [clave, nombre, x, y en la silueta, ancho de la línea de medición, cómo medir]
const BODY = [
  ['cuello', 'Cuello', 100, 66, 34, 'Justo debajo de la nuez, con la cinta horizontal.'],
  ['pecho', 'Pecho / busto', 100, 108, 92, 'Por la zona más ancha del pecho, bajo las axilas, con los brazos relajados.'],
  ['brazo', 'Brazo', 157, 126, 24, 'A mitad de camino entre el hombro y el codo, con el brazo relajado.'],
  ['cintura', 'Cintura', 100, 160, 78, 'Parte más estrecha del tronco (o a media altura entre las costillas y la cadera).'],
  ['abdomen', 'Abdomen (ombligo)', 100, 184, 82, 'A la altura del ombligo, sin meter tripa.'],
  ['cadera', 'Cadera', 100, 212, 94, 'Por la parte más ancha de glúteos y cadera.'],
  ['muslo', 'Muslo', 118, 262, 34, 'Por la parte más ancha del muslo, justo debajo del glúteo.'],
  ['gemelo', 'Gemelo', 119, 350, 28, 'Por la parte más ancha de la pantorrilla.'],
];
const BS = { date: todayS(), key: 'cintura', sel: 'cintura' };
const bdDates = k => Object.keys(db.body).filter(d => db.body[d][k] != null).sort();
const bdSeries = k => bdDates(k).map(d => ({ d, v: db.body[d][k] }));
const bdBefore = (k, date) => { const ds = bdDates(k).filter(d => d < date); return ds.length ? { d: ds[ds.length - 1], v: db.body[ds[ds.length - 1]][k] } : null; };
const dShort = d => fmtDate(d, { day: 'numeric', month: 'short' });

function silhouette() {
  const vals = db.body[BS.date] || {};
  let s = `<svg viewBox="0 0 200 420" class="chart" style="max-width:260px;margin:0 auto" role="img" aria-label="Silueta con los puntos de medida">
    <g fill="var(--muted)" opacity=".28"><circle cx="100" cy="34" r="22"/><rect x="91" y="52" width="18" height="18" rx="6"/><path d="M58 80 Q100 66 142 80 L150 150 Q148 190 144 224 Q100 238 56 224 Q52 190 50 150 Z"/></g>
    <g fill="none" stroke="var(--muted)" opacity=".28" stroke-linecap="round"><path d="M58 84 Q38 92 36 140 L30 205" stroke-width="17"/><path d="M142 84 Q162 92 164 140 L170 205" stroke-width="17"/><path d="M84 228 L80 392" stroke-width="30"/><path d="M116 228 L120 392" stroke-width="30"/></g>`;
  BODY.forEach(([k, , x, y, w], i) => {
    const on = k === BS.sel, col = on ? 'var(--ex)' : vals[k] != null ? 'var(--brand)' : 'var(--muted)';
    s += `<g data-act="bd-sel" data-k="${k}" style="cursor:pointer"><line x1="${x - w / 2}" x2="${x + w / 2}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="2" stroke-dasharray="4 3"/><circle cx="${x}" cy="${y}" r="11" fill="${col}"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${i + 1}</text></g>`;
  });
  return s + '</svg>';
}
function bdInfo(k, date, v) {
  const pv = bdBefore(k, date);
  if (v == null || v === '') return pv ? `Anterior: ${r1(pv.v)} cm (${dShort(pv.d)})` : 'Sin medida anterior';
  const d = pv ? num(v) - pv.v : null;
  return pv ? `Anterior: ${r1(pv.v)} cm (${dShort(pv.d)}) · <b class="${d <= 0 ? 'good' : 'warnc'}">${d > 0 ? '+' : ''}${r1(d)} cm</b>` : 'Primera medida 👍';
}
function bdFormHtml() {
  const vals = db.body[BS.date] || {}, sel = BODY.find(b => b[0] === BS.sel);
  return `<div class="field"><label>Fecha de la medición</label><input type="date" id="bd-date" value="${BS.date}" max="${todayS()}"></div>
    <div id="bd-sil">${silhouette()}</div>
    <div class="preview" id="bd-hint"><b>${BODY.indexOf(sel) + 1}. ${sel[1]}:</b> ${sel[5]}</div>
    ${BODY.map(([k, name], i) => `<div class="mrow ${k === BS.sel ? 'sel' : ''}" id="bd-row-${k}"><span class="num ${k === BS.sel ? 'on' : ''}">${i + 1}</span><div class="grow"><b>${name}</b><div class="muted" id="bd-info-${k}" style="font-size:.78rem">${bdInfo(k, BS.date, vals[k])}</div></div><input type="number" inputmode="decimal" step="0.1" id="bd-in-${k}" data-bd="${k}" value="${vals[k] ?? ''}" placeholder="cm"></div>`).join('')}
    <p class="muted">Todo es opcional: mide solo lo que quieras. Usa una cinta flexible, sin apretar, siempre en los mismos puntos y a la misma hora (mejor por la mañana).</p>`;
}
function bdRestHtml() {
  const keys = BODY.filter(b => bdDates(b[0]).length), pts = bdSeries(BS.key);
  if (!keys.length) return '<div class="card"><p class="empty">Cuando guardes tus primeras medidas, aquí verás la evolución de cada contorno y el resumen de cambios.</p></div>';
  let h = `<div class="card"><h2>📈 Evolución</h2><div class="chips">${BODY.map(([k, n]) => `<button class="chip ${BS.key === k ? 'on' : ''}" data-act="bd-key" data-k="${k}">${n.split(' ')[0]}</button>`).join('')}</div>`;
  if (!pts.length) h += `<p class="empty">Aún no hay medidas de ${BODY.find(b => b[0] === BS.key)[1].toLowerCase()}.</p>`;
  else {
    const first = pts[0], last = pts[pts.length - 1], d = last.v - first.v;
    h += pts.length > 1 ? weightChart(pts, 0) : '<p class="muted">Con una segunda medida verás la línea de evolución.</p>';
    h += `<div class="grid3"><div class="stat"><b>${r1(first.v)}</b><span>inicio (${dShort(first.d)})</span></div><div class="stat"><b>${r1(last.v)}</b><span>última (${dShort(last.d)})</span></div><div class="stat"><b class="${d <= 0 ? 'good' : 'warnc'}">${d > 0 ? '+' : '−'}${r1(Math.abs(d))} cm</b><span>cambio total</span></div></div>`;
  }
  h += '</div>';
  let tot = 0, n = 0;
  const rows = keys.map(([k, name]) => {
    const s = bdSeries(k), a = s[0], b = s[s.length - 1], d = b.v - a.v; if (s.length > 1) { tot += d; n++; }
    return `<span>${name}</span><span>${r1(a.v)}</span><span>${r1(b.v)}</span><b class="${s.length < 2 ? 'muted' : d <= 0 ? 'good' : 'warnc'}">${s.length < 2 ? '—' : (d > 0 ? '+' : '') + r1(d) + ' cm'}</b>`;
  }).join('');
  h += `<div class="card"><h2>📋 Resumen de cambios</h2><div class="tbl"><span class="h">Medida</span><span class="h">Inicio</span><span class="h">Última</span><span class="h">Cambio</span>${rows}</div>${n ? `<p class="mt">Suma de cambios: <b class="${tot <= 0 ? 'good' : 'warnc'}">${tot > 0 ? '+' : '−'}${r1(Math.abs(tot))} cm</b> entre ${n} contornos.</p>` : ''}`;
  const cw = bdSeries('cintura'), ht = db.profile.height;
  if (cw.length && ht > 0) {
    const r = cw[cw.length - 1].v / ht;
    h += `<p class="muted">Cintura / altura: <b>${r.toFixed(2)}</b> ${r < 0.5 ? '✅ por debajo de 0,5 (objetivo habitual)' : r < 0.6 ? '· por encima de 0,5; baja a medida que reduces cintura' : '· elevado; el objetivo habitual es menos de 0,5'}. Es solo orientativo.</p>`;
  }
  h += '</div>';
  const dates = Object.keys(db.body).filter(d => Object.keys(db.body[d]).length).sort().reverse();
  h += `<div class="card"><h3>🗂️ Registros</h3>${dates.map(d => `<div class="entry" data-act="bd-edit" data-d="${d}"><div class="grow"><div class="n">${fmtDate(d, { day: 'numeric', month: 'long', year: 'numeric' })}</div><div class="s">${BODY.filter(b => db.body[d][b[0]] != null).map(b => `${b[1].split(' ')[0]} ${r1(db.body[d][b[0]])}`).join(' · ')}</div></div><button class="icon" data-act="bd-del" data-d="${d}" title="Borrar">🗑️</button></div>`).join('')}</div>`;
  return h;
}
VIEWS.medidas = () => `<div class="card"><h2>📏 Medidas del cuerpo</h2><p class="muted">Toca un punto de la silueta o un campo para medir. Se guardan por fecha para ver tu evolución.</p><div id="bd-form">${bdFormHtml()}</div></div><div id="bd-rest">${bdRestHtml()}</div>`;

Object.assign(A, {
  'bd-sel': el => {
    BS.sel = el.dataset.k; BS.key = BS.sel; $('#bd-form').innerHTML = bdFormHtml(); $('#bd-rest').innerHTML = bdRestHtml();
    const i = $(`#bd-in-${BS.sel}`); if (i) { i.focus(); i.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  },
  'bd-key': el => { BS.key = el.dataset.k; $('#bd-rest').innerHTML = bdRestHtml(); },
  'bd-edit': el => { BS.date = el.dataset.d; render(); window.scrollTo(0, 0); },
  'bd-del': (el, ev) => {
    ev.stopPropagation(); const d = el.dataset.d;
    if (confirm(`¿Borrar las medidas del ${fmtDate(d, { day: 'numeric', month: 'long' })}?`)) { delete db.body[d]; save(); render(); }
  },
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'bd-date' && t.value) { BS.date = t.value; render(); }
  else if (t.dataset.bd) {
    const k = t.dataset.bd, day = db.body[BS.date] || (db.body[BS.date] = {});
    if (t.value === '' || num(t.value) <= 0) delete day[k]; else day[k] = r1(num(t.value));
    if (!Object.keys(day).length) delete db.body[BS.date];
    save(); BS.key = k; BS.sel = k;
    $(`#bd-info-${k}`).innerHTML = bdInfo(k, BS.date, day[k]); $('#bd-rest').innerHTML = bdRestHtml(); $('#bd-sil').innerHTML = silhouette();
  }
});
document.addEventListener('focusin', ev => {
  const k = ev.target.dataset?.bd; if (!k || k === BS.sel) return;
  BS.sel = k; $('#bd-sil').innerHTML = silhouette(); const sel = BODY.find(b => b[0] === k);
  $('#bd-hint').innerHTML = `<b>${BODY.indexOf(sel) + 1}. ${sel[1]}:</b> ${sel[5]}`;
  $$('.mrow').forEach(r => { r.classList.toggle('sel', r.id === `bd-row-${k}`); r.querySelector('.num').classList.toggle('on', r.id === `bd-row-${k}`); });
});

// ───────── 2) ESCÁNER DE CÓDIGOS DE BARRAS ─────────
let SC = null;
const loadScript = src => new Promise((ok, ko) => {
  if (loadScript.done?.[src]) return ok();
  const s = document.createElement('script'); s.src = src; s.onload = () => { (loadScript.done = loadScript.done || {})[src] = 1; ok(); }; s.onerror = ko; document.head.appendChild(s);
});
function stopScan() {
  if (!SC) return; const sc = SC; SC = null; clearTimeout(sc.timer);
  try { sc.reader?.reset(); } catch (e) { /* nada */ }
  try { sc.stream?.getTracks().forEach(t => t.stop()); } catch (e) { /* nada */ }
}
function zxHints() {
  const h = new Map(); h.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]); return h;
}
function openScan(ctx) {
  stopScan(); SC = { ctx };
  openModal(`<div class="hd"><h2>📷 Escanear código de barras</h2><button class="icon" data-act="close">✕</button></div>
    <video id="sc-video" playsinline muted autoplay style="width:100%;max-height:46vh;border-radius:12px;background:#000"></video>
    <p class="muted" id="sc-status">Iniciando cámara…</p>
    <div class="field"><label>¿No lo lee? Escribe el número del código</label><div class="row"><input type="text" inputmode="numeric" id="sc-code" placeholder="p. ej. 8410000000000"><button class="btn sec" data-act="sc-manual">Buscar</button></div></div>
    <label class="btn sec block" style="text-align:center">📷 Hacer una foto del código<input type="file" id="sc-file" accept="image/*" capture="environment" hidden></label>
    <p class="muted">Los datos vienen de Open Food Facts (base de datos colaborativa): revísalos con la etiqueta antes de guardar.</p>`);
  startScan();
}
async function startScan() {
  const sc = SC, st = $('#sc-status');
  if (!navigator.mediaDevices?.getUserMedia) { st.textContent = 'Este navegador no deja usar la cámara aquí: escribe el código o haz una foto.'; return; }
  try {
    if ('BarcodeDetector' in window) {
      const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      sc.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (SC !== sc) { sc.stream.getTracks().forEach(t => t.stop()); return; }
      const v = $('#sc-video'); v.srcObject = sc.stream; await v.play(); st.textContent = 'Apunta al código de barras…';
      const tick = async () => {
        if (SC !== sc) return;
        try { const r = await det.detect(v); if (r.length) return onCode(r[0].rawValue); } catch (e) { /* sigue */ }
        sc.timer = setTimeout(tick, 250);
      }; tick();
    } else {
      await loadScript('vendor/zxing.min.js'); if (SC !== sc) return;
      sc.reader = new ZXing.BrowserMultiFormatReader(zxHints(), 250); st.textContent = 'Apunta al código de barras…';
      sc.reader.decodeFromVideoDevice(undefined, 'sc-video', res => { if (res && SC === sc) onCode(res.getText()); });
    }
  } catch (e) {
    if (SC === sc) st.textContent = e && e.name === 'NotAllowedError' ? 'Permiso de cámara denegado: actívalo en los ajustes del navegador, o escribe el código.' : 'No se pudo abrir la cámara: escribe el código o haz una foto.';
  }
}
async function scanFile(file) {
  const url = URL.createObjectURL(file);
  try {
    let code = null;
    if ('BarcodeDetector' in window) code = (await new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }).detect(await createImageBitmap(file)))[0]?.rawValue;
    else { await loadScript('vendor/zxing.min.js'); code = (await new ZXing.BrowserMultiFormatReader(zxHints()).decodeFromImageUrl(url)).getText(); }
    if (code) onCode(code); else toast('No se ha detectado ningún código en la foto');
  } catch (e) { toast('No se ha detectado ningún código en la foto'); } finally { URL.revokeObjectURL(url); }
}
function onCode(raw) {
  const code = String(raw).replace(/\D/g, ''); if (!code) return;
  const ctx = SC?.ctx || null; stopScan(); lookupBarcode(code, ctx);
}
function openFoodPrefill(pre, ctx) {
  if (ctx) { M = { ...ctx, tab: 'new', pre }; renderAdd(); }
  else { M = null; openModal(`<div class="hd"><h2>Nuevo alimento</h2><button class="icon" data-act="close">✕</button></div>${foodForm(pre, false)}<button class="btn block mt" data-act="food-save">Guardar</button>`); updateFormPreview(); }
}
async function lookupBarcode(code, ctx) {
  const st = $('#sc-status'); if (st) st.textContent = `Código ${code}: buscando…`;
  const local = db.foods.find(f => f.barcode === code);
  if (local) {
    if (ctx) { M = { ...ctx, tab: 'lib', selId: local.id }; M.mode = defMode(local); M.qty = defQty(local, M.mode); renderAdd(); }
    else { A['edit-food']({ dataset: { id: local.id } }); }
    return toast('Ya lo tenías guardado ✔');
  }
  let j = null;
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_es,brands,serving_quantity,nutriments`);
    j = await r.json();
  } catch (e) { openFoodPrefill({ name: '', type: 'producto', unit: '100g', kcal: '', p: '', c: '', f: '', barcode: code }, ctx); return toast('Sin conexión con la base de datos: rellénalo a mano'); }
  if (!j || j.status !== 1) { openFoodPrefill({ name: '', type: 'producto', unit: '100g', kcal: '', p: '', c: '', f: '', barcode: code }, ctx); return toast('No está en Open Food Facts: rellénalo a mano (guardaremos el código)'); }
  const pr = j.product, n = pr.nutriments || {}, brand = (pr.brands || '').split(',')[0].trim();
  const kcal = n['energy-kcal_100g'] ?? (n.energy_100g != null ? n.energy_100g / 4.184 : null);
  const pre = { name: `${pr.product_name_es || pr.product_name || ''}${brand ? ` (${brand})` : ''}`.trim(), type: 'producto', unit: '100g', kcal: kcal != null ? r1(kcal) : '', p: n.proteins_100g ?? '', c: n.carbohydrates_100g ?? '', f: n.fat_100g ?? '', serv: num(pr.serving_quantity) || 0, barcode: code };
  openFoodPrefill(pre, ctx);
  toast(kcal != null ? 'Producto encontrado: revisa los datos 👀' : 'Producto encontrado, pero sin datos nutricionales: complétalos');
}
Object.assign(A, {
  scan: () => openScan(M && M.target ? { target: M.target, date: M.date, meal: M.meal } : null),
  'sc-manual': () => { const c = $('#sc-code').value.replace(/\D/g, ''); if (c.length < 6) return toast('Escribe el número completo del código'); const ctx = SC?.ctx || null; stopScan(); lookupBarcode(c, ctx); },
});
document.addEventListener('change', ev => { if (ev.target.id === 'sc-file' && ev.target.files[0]) scanFile(ev.target.files[0]); });

// ───────── 3) DICTADO POR VOZ ─────────
const SRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let V = null, REC = null;
const defaultMeal = () => { const h = new Date().getHours(); return h < 11 ? 'desayuno' : h < 13 ? 'media' : h < 16 ? 'almuerzo' : h < 19 ? 'merienda' : 'cena'; };
function stopListen() { try { REC?.stop(); } catch (e) { /* nada */ } REC = null; }
function extrasClose() { stopScan(); stopListen(); V = null; }

const NUMW = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, medio: 0.5, media: 0.5, cuarto: 0.25, cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500 };
const UNITW = { g: 'g', gr: 'g', grs: 'g', gramo: 'g', gramos: 'g', kg: 'kg', kilo: 'kg', kilos: 'kg', ml: 'ml', mililitro: 'ml', mililitros: 'ml', cucharada: 'cucharada', cucharadas: 'cucharada', cucharadita: 'cucharadita', cucharaditas: 'cucharadita', vaso: 'vaso', vasos: 'vaso', taza: 'taza', tazas: 'taza', punado: 'punado', punados: 'punado', tupper: 'tupper', tuppers: 'tupper', racion: 'racion', raciones: 'racion', unidad: 'ud', unidades: 'ud', ud: 'ud', uds: 'ud' };
const UG = { cucharada: 15, cucharadita: 5, vaso: 200, taza: 250, punado: 30 };
const STOPW = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'al', 'en', 'y', 'a', 'un', 'una', 'unos', 'unas', 'mi', 'para']);
const LEADW = new Set(['he', 'me', 'hemos', 'has', 'ha', 'tomado', 'tome', 'comido', 'comi', 'bebido', 'bebi', 'tambien', 'luego', 'despues', 'ademas', 'hoy', 'y', 'e', 'de', 'para', 'a', 'mi', 'mis', 'esta', 'este', 'unos', 'unas', 'pues', 'pero', 'que', 'como', 'con', 'el', 'la', 'los', 'las', 'tomar', 'comer', 'beber']);
const nrm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)(g|gr|grs|kg|ml)\b/g, '$1 $2').replace(/[^a-z0-9.%,;| ]/g, ' ').replace(/\s+/g, ' ').trim();
const stem = w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
const tokEq = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2);
const toks = s => nrm(String(s).replace(/\([^)]*\)/g, ' ')).split(' ').filter(w => w && !STOPW.has(w)).map(stem);
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

function matchFoods(phrase) {
  const P = toks(phrase); if (!P.length) return [];
  return db.foods.map(f => {
    const F = toks(f.name), used = new Set(); let inter = 0;
    P.forEach(p => { const k = F.findIndex((q, i) => !used.has(i) && tokEq(p, q)); if (k >= 0) { used.add(k); inter++; } });
    if (!inter) return null;
    const cov = inter / P.length, dice = 2 * inter / (P.length + F.length);
    return { f, score: cov * 0.7 + dice * 0.3 + (f.fav ? 0.02 : 0) + (f.used ? 0.01 : 0) + (f.type !== 'base' ? 0.03 : 0), cov };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}
// Convierte "dos" / "200 g" / "una cucharada" en una cantidad válida para ese alimento.
function resolveQty(f, qi) {
  const n = qi.n, u = qi.u;
  if (f.unit === '100g') {
    if (u === 'g' || u === 'ml') return { qty: n ?? 100, mode: 'g' };
    if (u === 'kg') return { qty: (n ?? 1) * 1000, mode: 'g' };
    if (UG[u]) return { qty: (n ?? 1) * UG[u], mode: 'g' };
    if (f.serv > 0) return { qty: n ?? 1, mode: 'ud' };
    return { qty: (n ?? 1) * 100, mode: 'g', warn: true };
  }
  if (u === 'g' && f.serv > 0) return { qty: n ?? 100, mode: 'g' };
  if (u === 'g' || u === 'kg' || u === 'ml' || UG[u]) return { qty: n && u === 'tupper' ? n : 1, mode: 'rac', warn: true };
  return { qty: n ?? 1, mode: 'rac' };
}
function stripLead(s) {
  const w = s.split(' ').filter(Boolean);
  while (w.length && LEADW.has(w[0])) w.shift();
  while (w.length && LEADW.has(w[w.length - 1])) w.pop();
  return w.join(' ');
}
function tryItem(pc, meal) {
  const w = pc.split(' '), qi = { n: null, u: null }; let i = 0;
  if (w[0] in NUMW || /^\d+(\.\d+)?$/.test(w[0])) {
    qi.n = w[0] in NUMW ? NUMW[w[0]] : parseFloat(w[0]); i = 1;
    if (w[i] === 'y' && (w[i + 1] === 'medio' || w[i + 1] === 'media')) { qi.n += 0.5; i += 2; }
  }
  if (i < w.length && UNITW[w[i]]) { qi.u = UNITW[w[i]]; i++; }
  while (i < w.length && (w[i] === 'de' || w[i] === 'del')) i++;
  const phrase = w.slice(i).join(' '); if (!phrase) return null;
  const c = matchFoods(phrase), best = c[0];
  const it = { raw: pc, phrase, meal, qi, inc: true, cands: c.slice(0, 6).map(x => x.f.id), score: best ? best.score : 0, food: null };
  if (best && best.cov >= 0.5 && best.score >= 0.5) { it.food = best.f.id; Object.assign(it, resolveQty(best.f, qi)); }
  else it.est = { name: cap(phrase), kcal: '', p: '', c: '', f: '', save: true };
  return it;
}
function parseSeg(seg, meal) {
  seg = stripLead(seg); if (!seg) return [];
  const whole = tryItem(seg, meal);
  if (whole && whole.food && whole.score >= 0.8 && /\b(y|con)\b/.test(seg)) return [whole]; // nombres como "pollo con arroz"
  const out = [];
  seg.split(/\s+(?:y|e|mas|luego|despues|tambien|ademas)\s+/).map(stripLead).filter(Boolean).forEach(pc => {
    const it = tryItem(pc, meal);
    if (it && !it.food && /\scon\s/.test(pc)) { // "tortitas con miel"
      const sub = pc.split(/\s+con\s+/).map(stripLead).filter(Boolean).map(x => tryItem(x, meal)).filter(Boolean);
      if (sub.length > 1 && sub.some(x => x.food)) { out.push(...sub); return; }
    }
    if (it) out.push(it);
  });
  return out;
}
function parseMeals(raw, defMeal) {
  let t = nrm(raw); const dateOff = /\bayer\b/.test(t) ? -1 : 0; t = t.replace(/\bayer\b/g, ' ');
  [[/\bmedia manana\b/g, 'media'], [/\bdesayun\w*/g, 'desayuno'], [/\balmuerz\w*|\balmorc\w*|\bde comer\b|\bpara comer\b|\bla comida\b|\bcomida\b/g, 'almuerzo'], [/\bmeriend\w*/g, 'merienda'], [/\b(?:cena|cene|cenar|cenado|cenando|cenamos)\b/g, 'cena']]
    .forEach(([re, m]) => { t = t.replace(re, ` ¦${m}¦ `); });
  const parts = t.split(/¦(\w+)¦/), items = [];
  const chunk = (p, meal) => { const its = []; p.trim().split(/[,;.|]+/).forEach(seg => its.push(...parseSeg(seg.trim(), meal))); return its; };
  // Dos formas de hablar: "de desayuno, dos huevos…" (la comida va antes) o "dos huevos de desayuno" (la comida va después).
  const suffix = chunk(parts[0], defMeal).length > 0 && parts.length > 1;
  let meal = defMeal;
  parts.forEach((p, k) => {
    if (k % 2) { if (!suffix) meal = p; return; }
    items.push(...chunk(p, suffix ? (parts[k + 1] || defMeal) : meal));
  });
  return { dateOff, items };
}
function parseNewFood(raw) {
  const orig = String(raw).trim(), t = nrm(orig);
  const grab = res => { for (const re of res) { const m = t.match(re); if (m) return parseFloat(m[1]); } return ''; };
  const N = '(\\d+(?:\\.\\d+)?)';
  const kcal = grab([new RegExp(`${N}\\s*(?:kcal|calorias|cal)\\b`), new RegExp(`(?:kcal|calorias)\\s*(?:de|son|:)?\\s*${N}`)]);
  const p = grab([new RegExp(`${N}\\s*(?:g|gramos)?\\s*(?:de\\s*)?proteina`), new RegExp(`proteinas?\\s*(?:de|son|:)?\\s*${N}`)]);
  const c = grab([new RegExp(`${N}\\s*(?:g|gramos)?\\s*(?:de\\s*)?(?:hidrato|carbohidrato)`), new RegExp(`(?:hidratos?|carbohidratos?)(?:\\s*de\\s*carbono)?\\s*(?:de|son|:)?\\s*${N}`)]);
  const f = grab([new RegExp(`${N}\\s*(?:g|gramos)?\\s*(?:de\\s*)?grasa`), new RegExp(`grasas?\\s*(?:de|son|:)?\\s*${N}`)]);
  const per100 = /\b(?:por|cada|en)\s*(?:100|cien)\b/.test(t) || /\b100\s*(?:g|gramos)\b/.test(t);
  const pesa = t.match(/\bpesa\s*(\d+(?:\.\d+)?)\s*(?:g|gramos)/);
  let name = (orig.match(/^(.*?)(?:[,.:;]|\s(?:tiene|lleva|llevan|son|por|cada|que)\s|\d)/i) || [0, orig])[1].trim();
  name = name.replace(/^(?:añade|añadir|crea|crear|quiero añadir|alimento nuevo|nuevo alimento|nuevo|el|la|un|una)\s+/i, '').replace(/^(?:alimento nuevo|nuevo alimento)\s+/i, '').trim();
  return { name: cap(name), type: 'casero', unit: per100 ? '100g' : 'racion', kcal, p, c, f, serv: pesa ? parseFloat(pesa[1]) : 0 };
}

function openVoice(ctx, mode) {
  V = { ctx: ctx || { target: 'log', date: S.date, meal: defaultMeal() }, mode: mode || 'eat', text: '', items: null };
  renderVoice();
}
function renderVoice() {
  const eat = V.mode === 'eat';
  openModal(`<div class="hd"><h2>🎤 Dictar</h2><button class="icon" data-act="close">✕</button></div>
    <div class="seg"><button class="${eat ? 'on' : ''}" data-act="v-mode" data-k="eat">Lo que he comido</button><button class="${eat ? '' : 'on'}" data-act="v-mode" data-k="new">Alimento nuevo</button></div>
    <p class="muted">${eat ? 'Di, por ejemplo: <i>"De desayuno dos tortitas de avena y un yogur griego, y de comer un tupper de pollo al curry"</i>. También vale <i>"200 gramos de pechuga de pollo"</i>.' : 'Di, por ejemplo: <i>"Tortitas de avena, 150 calorías, 12 de proteínas, 20 de hidratos y 3 de grasas por ración"</i>.'}</p>
    <div class="center">${SRec ? '<button class="mic" id="v-mic" data-act="v-mic" aria-label="Hablar">🎤</button><p class="muted" id="v-st">Toca para hablar</p>' : '<p class="muted">Tu navegador no ofrece reconocimiento de voz. Usa el micrófono del teclado del móvil, o escribe el texto.</p>'}</div>
    <div class="field"><label>Texto (puedes corregirlo)</label><textarea id="v-text" data-v="text" placeholder="${eat ? 'dos huevos y una manzana de desayuno…' : 'nombre del alimento, calorías, proteínas, hidratos y grasas…'}">${esc(V.text)}</textarea></div>
    <button class="btn block" data-act="v-parse">${eat ? 'Interpretar' : 'Crear alimento'}</button><div id="v-res" class="mt">${V.items ? voiceResHtml() : ''}</div>`);
}
function setMic(on) { const b = $('#v-mic'); if (!b) return; b.classList.toggle('rec', on); b.textContent = on ? '⏹' : '🎤'; const s = $('#v-st'); if (s) s.textContent = on ? 'Escuchando… habla ahora' : 'Toca para hablar'; }
function toggleListen() {
  if (REC) return stopListen();
  const r = new SRec(); r.lang = 'es-ES'; r.interimResults = true; r.continuous = false;
  const base = V.text ? V.text + ' ' : '';
  r.onresult = e => { V.text = base + [...e.results].map(x => x[0].transcript).join(' '); const ta = $('#v-text'); if (ta) ta.value = V.text; };
  r.onerror = e => toast(e.error === 'not-allowed' ? 'Permiso de micrófono denegado' : e.error === 'no-speech' ? 'No te he oído, prueba otra vez' : `No se pudo escuchar (${e.error})`);
  r.onend = () => { REC = null; setMic(false); if (V && V.text.trim()) parseVoice(); };
  REC = r; setMic(true); try { r.start(); } catch (e) { REC = null; setMic(false); }
}
function parseVoice() {
  if (!V.text.trim()) return toast('Primero di o escribe algo');
  if (V.mode === 'new') {
    const pre = parseNewFood(V.text), ctx = V.ctx.fromAdd ? { target: V.ctx.target, date: V.ctx.date, meal: V.ctx.meal } : null;
    stopListen(); openFoodPrefill(pre, ctx); return toast('Revisa los datos y guarda ✔');
  }
  const r = parseMeals(V.text, V.ctx.meal); V.date = r.dateOff ? addDays(V.ctx.date, r.dateOff) : V.ctx.date; V.items = r.items;
  if (!V.items.length) toast('No he entendido ningún alimento: prueba con otras palabras');
  $('#v-res').innerHTML = voiceResHtml();
}
const itemFood = it => it.food && db.foods.find(f => f.id === it.food);
function vPrev(it) {
  const f = itemFood(it); if (!f) return '';
  const m = scale(f, f.unit, toNative(f, num(it.qty), it.mode));
  return `<b>${r0(m.kcal)} kcal</b> · P ${r1(m.p)} · C ${r1(m.c)} · G ${r1(m.f)}`;
}
function voiceResHtml() {
  if (!V.items || !V.items.length) return '';
  const meals = sel => MEALS.map(([k, n]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${n}</option>`).join('');
  return `<h3>Esto es lo que he entendido${V.date !== V.ctx.date ? ` <span class="tag">${fmtDate(V.date, { day: 'numeric', month: 'short' })}</span>` : ''}</h3>` + V.items.map((it, i) => {
    const f = itemFood(it);
    return `<div class="card" style="padding:10px;margin-bottom:8px"><div class="row"><input type="checkbox" data-v="inc" data-i="${i}" ${it.inc ? 'checked' : ''} style="width:auto"><div class="grow muted">“${esc(it.raw)}”</div><select data-v="meal" data-i="${i}" style="width:auto">${meals(it.meal)}</select></div>
      <div class="field mt"><label>Alimento</label><select data-v="food" data-i="${i}">${it.cands.map(id => { const x = db.foods.find(y => y.id === id); return `<option value="${id}" ${it.food === id ? 'selected' : ''}>${esc(x.name)}</option>`; }).join('')}<option value="" ${it.food ? '' : 'selected'}>➕ No está: lo estimo yo</option></select></div>
      ${f ? `<div class="row"><input type="number" inputmode="decimal" step="any" data-v="qty" data-i="${i}" value="${it.qty}"><select data-v="mode" data-i="${i}" style="width:auto">${modeOpts(f).map(([k, l]) => `<option value="${k}" ${it.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="muted mt" id="v-prev-${i}">${vPrev(it)}</div>${it.warn ? '<span class="tag warn">⚠️ revisa la cantidad</span>' : ''}`
        : `<div class="field"><label>Nombre</label><input type="text" data-v="name" data-i="${i}" value="${esc(it.est.name)}"></div><div class="grid4"><div class="field"><label>kcal</label><input type="number" inputmode="decimal" data-v="kcal" data-i="${i}" value="${it.est.kcal}" step="any"></div><div class="field"><label>Prot.</label><input type="number" inputmode="decimal" data-v="p" data-i="${i}" value="${it.est.p}" step="any"></div><div class="field"><label>Hidr.</label><input type="number" inputmode="decimal" data-v="c" data-i="${i}" value="${it.est.c}" step="any"></div><div class="field"><label>Grasas</label><input type="number" inputmode="decimal" data-v="f" data-i="${i}" value="${it.est.f}" step="any"></div></div><label class="row" style="color:var(--text)"><input type="checkbox" data-v="save" data-i="${i}" ${it.est.save ? 'checked' : ''} style="width:auto"> Guardar en mis alimentos</label>`}</div>`;
  }).join('') + '<button class="btn block" data-act="v-add">Añadir lo marcado</button>';
}
Object.assign(A, {
  voice: () => openVoice(null, 'eat'),
  'voice-new': () => openVoice(null, 'new'),
  'voice-add': () => openVoice({ target: M.target, date: M.date, meal: M.meal, fromAdd: true }, 'eat'),
  'v-mode': el => { const t = V.text; V.mode = el.dataset.k; V.items = null; renderVoice(); V.text = t; $('#v-text').value = t; },
  'v-mic': () => toggleListen(),
  'v-parse': () => { V.text = $('#v-text').value; parseVoice(); },
  'v-add': () => {
    let n = 0, skipped = 0;
    V.items.filter(i => i.inc).forEach(it => {
      M = { target: V.ctx.target, date: V.date };
      const f = itemFood(it);
      if (f) { const q = toNative(f, num(it.qty), it.mode); if (q > 0) { f.used = Date.now(); pushEntry(f, q, it.meal, false); n++; } else skipped++; return; }
      const e = it.est, p = num(e.p), c = num(e.c), g = num(e.f), k = num(e.kcal) || calcKcal(p, c, g);
      if (!e.name.trim() || !k) { skipped++; return; }
      const food = { id: uid(), name: e.name.trim(), type: 'casero', unit: 'racion', kcal: r1(k), p, c, f: g, fav: false, used: Date.now() };
      if (e.save) db.foods.push(food); pushEntry(food, 1, it.meal, false); n++;
    });
    M = null; if (!n) return toast('Nada que añadir: marca alguno o indica sus calorías');
    save(); const d = V.date, tgt = V.ctx.target; closeModal(); if (tgt !== 'plan') S.date = d; render(); toast(`${n} ${n === 1 ? 'alimento añadido' : 'alimentos añadidos'} ✔${skipped ? ` (${skipped} sin datos, omitidos)` : ''}`);
  },
});
document.addEventListener('input', ev => {
  const t = ev.target; if (!V || !t.dataset.v) return;
  if (t.dataset.v === 'text') V.text = t.value;
  else if (t.dataset.v === 'qty') { const it = V.items[+t.dataset.i]; it.qty = num(t.value); const p = $(`#v-prev-${t.dataset.i}`); if (p) p.innerHTML = vPrev(it); }
});
document.addEventListener('change', ev => {
  const t = ev.target, k = t.dataset.v; if (!V || !k || k === 'text' || k === 'qty') return;
  const it = V.items[+t.dataset.i], e = it.est;
  if (k === 'inc') it.inc = t.checked;
  else if (k === 'meal') it.meal = t.value;
  else if (k === 'mode') { it.mode = t.value; $(`#v-prev-${t.dataset.i}`).innerHTML = vPrev(it); }
  else if (k === 'food') {
    it.food = t.value || null;
    if (it.food) Object.assign(it, resolveQty(itemFood(it), it.qi)); else it.est = it.est || { name: cap(it.phrase), kcal: '', p: '', c: '', f: '', save: true };
    $('#v-res').innerHTML = voiceResHtml();
  } else if (k === 'save') e.save = t.checked;
  else e[k] = k === 'name' ? t.value : t.value;
});
