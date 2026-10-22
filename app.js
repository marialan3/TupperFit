'use strict';
/* TupperFit — diario de comidas, macros y ejercicio.
   Todo se guarda en el propio dispositivo (localStorage). Sin servidor, sin cuentas. */

// ───────── utilidades ─────────
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const KEY = 'tupperfit.v1';
const MEALS = [['desayuno', 'Desayuno', '🥣'], ['media', 'Media mañana', '🍎'], ['almuerzo', 'Almuerzo', '🍱'], ['merienda', 'Merienda', '🥛'], ['cena', 'Cena', '🌙'], ['otros', 'Otros', '🍫']];
const TYPES = { tupper: '🍱 Tupper', casero: '🍳 Casero', producto: '🏷️ Producto', base: '🥦 Básico' };
const ACTIVITY = [[1.2, 'Sedentario (poco o nada de ejercicio)'], [1.375, 'Ligero (1-3 días/semana)'], [1.55, 'Moderado (3-5 días/semana)'], [1.725, 'Intenso (6-7 días/semana)']];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ds(d); };
const mondayOf = s => { const d = parseD(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ds(d); };
const todayS = () => ds(new Date());
const r0 = n => Math.round(n || 0);
const r1 = n => Math.round((n || 0) * 10) / 10;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const fmtDate = (s, o) => parseD(s).toLocaleDateString('es-ES', o || { weekday: 'long', day: 'numeric', month: 'long' });
const calcKcal = (p, c, f) => 4 * p + 4 * c + 9 * f;
const sum = a => a.reduce((x, y) => x + y, 0);
const avg = a => (a.length ? sum(a) / a.length : 0);

// ───────── datos ─────────
// Valores por 100 g (estimaciones habituales; revisa las etiquetas de tus productos).
const BASE_FOODS = [
  ['Pechuga de pollo (cruda)', 110, 23, 0, 1.5], ['Pechuga de pavo (cruda)', 105, 24, 0, 1], ['Huevo entero', 143, 12.6, 0.7, 9.5], ['Clara de huevo', 52, 11, 0.7, 0.2],
  ['Atún al natural (lata)', 116, 26, 0, 1], ['Salmón', 208, 20, 0, 13], ['Merluza', 82, 17, 0, 1.5], ['Gambas', 85, 18, 0.2, 1],
  ['Pavo en lonchas (fiambre)', 105, 18, 2, 2.5], ['Jamón serrano', 241, 31, 0, 13], ['Ternera magra', 135, 21, 0, 5.5],
  ['Yogur griego 0%', 57, 10, 4, 0.2], ['Skyr natural', 63, 11, 4, 0.2], ['Queso fresco batido 0%', 46, 8, 4, 0.2], ['Queso fresco', 95, 8, 3, 6], ['Leche semidesnatada', 47, 3.3, 4.8, 1.6], ['Leche desnatada', 35, 3.4, 5, 0.1],
  ['Avena (copos)', 370, 13, 60, 7], ['Pan integral', 250, 9, 43, 3.5], ['Tortita de arroz', 387, 8, 81, 3], ['Arroz cocido', 130, 2.7, 28, 0.3], ['Pasta cocida', 158, 5.8, 31, 0.9], ['Patata cocida', 86, 1.7, 20, 0.1],
  ['Lentejas cocidas', 116, 9, 20, 0.4], ['Garbanzos cocidos', 164, 9, 27, 2.6],
  ['Plátano', 90, 1, 20, 0.3], ['Manzana', 52, 0.3, 14, 0.2], ['Naranja', 47, 0.9, 12, 0.1], ['Fresas', 32, 0.7, 7.7, 0.3], ['Kiwi', 61, 1.1, 15, 0.5], ['Arándanos', 57, 0.7, 14, 0.3], ['Uvas', 69, 0.7, 18, 0.2], ['Sandía', 30, 0.6, 7.6, 0.2],
  ['Tomate', 18, 0.9, 3.9, 0.2], ['Ensalada verde / lechuga', 15, 1.4, 2.2, 0.2], ['Brócoli', 34, 2.8, 7, 0.4], ['Zanahoria', 41, 0.9, 10, 0.2],
  ['Aguacate', 160, 2, 9, 15], ['Aceite de oliva', 884, 0, 0, 100], ['Almendras', 579, 21, 22, 50], ['Nueces', 654, 15, 14, 65], ['Chocolate negro 85%', 579, 9, 19, 46],
  ['Proteína whey (polvo)', 400, 80, 8, 6], ['Café con leche (taza ~200 ml semi)', 47, 3.3, 4.8, 1.6],
].map((a, i) => ({ id: 'base' + i, name: a[0], type: 'base', unit: '100g', kcal: a[1], p: a[2], c: a[3], f: a[4], fav: false, used: 0 }));

const DEF_PROFILE = { configured: false, sex: 'f', age: 35, height: 165, weight: 75, goalWeight: 0, activity: 1.375, goalKgWeek: 0.5, kcal: 1700, pP: 35, pC: 40, pF: 25, stepsGoal: 10000 };

let db = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { profile: { ...DEF_PROFILE, ...(d.profile || {}) }, foods: d.foods || [], log: d.log || {}, plan: d.plan || {} };
    }
  } catch (e) { console.warn('No se pudo leer', e); }
  return { profile: { ...DEF_PROFILE }, foods: BASE_FOODS.map(f => ({ ...f })), log: {}, plan: {} };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('⚠️ No se pudo guardar (almacenamiento lleno o bloqueado)'); }
}

const getDay = (date, create) => {
  if (!db.log[date] && create) db.log[date] = { entries: [], weight: null, steps: null, burned: null, water: null, note: '' };
  return db.log[date] || { entries: [], weight: null, steps: null, burned: null, water: null, note: '' };
};
const getPlan = (date, create) => { if (!db.plan[date] && create) db.plan[date] = []; return db.plan[date] || []; };

// ───────── cálculos ─────────
const scale = (b, unit, qty) => { const k = unit === '100g' ? qty / 100 : qty; return { kcal: b.kcal * k, p: b.p * k, c: b.c * k, f: b.f * k }; };
const eM = e => scale(e.base, e.unit, e.qty);
const totals = entries => entries.reduce((t, e) => { const m = eM(e); return { kcal: t.kcal + m.kcal, p: t.p + m.p, c: t.c + m.c, f: t.f + m.f }; }, { kcal: 0, p: 0, c: 0, f: 0 });
const qtyLabel = e => e.unit === '100g' ? `${r1(e.qty)} g` : `${r1(e.qty)} ${e.qty === 1 ? 'ración' : 'raciones'}`;

function latestWeight(upTo) {
  const ks = Object.keys(db.log).filter(k => (!upTo || k <= upTo) && db.log[k].weight).sort();
  return ks.length ? db.log[ks[ks.length - 1]].weight : db.profile.weight;
}
function bmr(upTo) {
  const p = db.profile;
  return 10 * latestWeight(upTo) + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
}
const tdee = upTo => bmr(upTo) * db.profile.activity;
function targets() {
  const p = db.profile;
  return { kcal: p.kcal, p: p.kcal * p.pP / 100 / 4, c: p.kcal * p.pC / 100 / 4, f: p.kcal * p.pF / 100 / 9 };
}
// Gasto del día: si has anotado las calorías activas del reloj, se usa metabolismo basal ×1,2 + activas; si no, el gasto medio según tu nivel de actividad.
function expenditure(date) {
  const d = getDay(date);
  return d.burned > 0 ? bmr(date) * 1.2 + d.burned : tdee(date);
}
const mismatch = f => { const k = calcKcal(f.p, f.c, f.f); return f.kcal > 0 && Math.abs(f.kcal - k) > 15 && Math.abs(f.kcal - k) / Math.max(k, 1) > 0.12; };

function weekStats(mon) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i), d = getDay(date), t = totals(d.entries);
    const logged = d.entries.length > 0;
    days.push({ date, d, t, logged, exp: expenditure(date), def: logged ? expenditure(date) - t.kcal : 0 });
  }
  const L = days.filter(x => x.logged), tg = targets();
  const kcal = avg(L.map(x => x.t.kcal)), p = avg(L.map(x => x.t.p)), c = avg(L.map(x => x.t.c)), f = avg(L.map(x => x.t.f));
  const ws = days.filter(x => x.d.weight).map(x => x.d.weight);
  const st = days.filter(x => x.d.steps).map(x => x.d.steps);
  const kc = p * 4 + c * 4 + f * 9 || 1;
  return {
    days, L, n: L.length, kcal, p, c, f, pctP: p * 4 / kc * 100, pctC: c * 4 / kc * 100, pctF: f * 9 / kc * 100,
    deficit: avg(L.map(x => x.def)), totalDef: sum(L.map(x => x.def)),
    inRange: L.filter(x => Math.abs(x.t.kcal - tg.kcal) <= tg.kcal * 0.05).length,
    wAvg: ws.length ? avg(ws) : null, wFirst: ws[0] ?? null, wLast: ws.length ? ws[ws.length - 1] : null, wN: ws.length,
    steps: st.length ? avg(st) : null, burned: avg(days.filter(x => x.d.burned).map(x => x.d.burned)),
  };
}

// ───────── gráficos SVG ─────────
function barChart(items, { target, color = 'var(--kcal)', fmt = r0 } = {}) {
  const W = 340, H = 170, pl = 34, pr = 8, pt = 16, pb = 24;
  const max = Math.max(target || 0, ...items.map(i => i.v || 0), 1) * 1.15;
  const bw = (W - pl - pr) / items.length, y = v => pt + (H - pt - pb) * (1 - v / max);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">`;
  for (let i = 0; i <= 3; i++) { const v = max * i / 3; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="ax" text-anchor="end">${r0(v)}</text>`; }
  items.forEach((it, i) => {
    const x = pl + i * bw + bw * 0.16, w = bw * 0.68;
    if (it.v > 0) s += `<rect x="${x}" y="${y(it.v)}" width="${w}" height="${y(0) - y(it.v)}" rx="3" fill="${it.color || color}"/><text x="${x + w / 2}" y="${y(it.v) - 3}" class="val">${fmt(it.v)}</text>`;
    s += `<text x="${x + w / 2}" y="${H - 8}" class="ax" text-anchor="middle">${esc(it.l)}</text>`;
  });
  if (target) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(target)}" y2="${y(target)}" class="tgt"/>`;
  return s + '</svg>';
}
function lineChart(items, { color = 'var(--p)', unit = '' } = {}) {
  const pts = items.map((it, i) => ({ ...it, i })).filter(it => it.v != null);
  if (pts.length < 1) return '<p class="empty">Anota tu peso en "Hoy" para ver la evolución.</p>';
  const W = 340, H = 150, pl = 36, pr = 12, pt = 16, pb = 24;
  let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const span = hi - lo; lo -= span * 0.15; hi += span * 0.15;
  const x = i => pl + (W - pl - pr) * (items.length === 1 ? 0.5 : i / (items.length - 1)), y = v => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">`;
  for (let i = 0; i <= 3; i++) { const v = lo + (hi - lo) * i / 3; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="ax" text-anchor="end">${r1(v)}</text>`; }
  s += `<polyline fill="none" stroke="${color}" stroke-width="2.2" points="${pts.map(p => `${x(p.i)},${y(p.v)}`).join(' ')}"/>`;
  pts.forEach(p => { s += `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="3.5" fill="${color}"/><text x="${x(p.i)}" y="${y(p.v) - 7}" class="val">${r1(p.v)}${unit}</text>`; });
  items.forEach((it, i) => { s += `<text x="${x(i)}" y="${H - 8}" class="ax" text-anchor="middle">${esc(it.l)}</text>`; });
  return s + '</svg>';
}
function ring(pct, color, big, small) {
  const R = 62, C = 2 * Math.PI * R, v = Math.max(0, Math.min(1, pct));
  return `<div class="ring"><svg viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--line)" stroke-width="14"/><circle cx="75" cy="75" r="${R}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C * v} ${C}" transform="rotate(-90 75 75)"/></svg><div class="mid"><span class="big">${big}</span><span class="muted">${small}</span></div></div>`;
}
const macroRow = (label, color, v, t) => {
  const pct = t ? v / t * 100 : 0;
  return `<div class="macro"><div class="h"><span><span class="dot" style="background:${color}"></span>${label}</span><span><b>${r0(v)}</b> / ${r0(t)} g</span></div><div class="bar"><i style="width:${Math.min(100, pct)}%;background:${pct > 110 ? 'var(--bad)' : color}"></i></div></div>`;
};

// ───────── estado de la interfaz ─────────
const S = { tab: 'hoy', date: todayS(), planWeek: mondayOf(todayS()), weekStart: mondayOf(todayS()), q: '', filter: 'all' };
let M = null; // estado de la ventana "añadir"

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; M = null; }

// ───────── vistas ─────────
function render() {
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#topinfo').textContent = `Objetivo ${r0(db.profile.kcal)} kcal`;
  const v = { hoy: viewHoy, alimentos: viewAlimentos, plan: viewPlan, semana: viewSemana, ajustes: viewAjustes }[S.tab];
  $('#view').innerHTML = v();
}

function viewHoy() {
  const date = S.date, day = getDay(date), t = targets(), tot = totals(day.entries);
  const rem = t.kcal - tot.kcal, over = rem < 0;
  const kc = tot.p * 4 + tot.c * 4 + tot.f * 9 || 1;
  const exp = expenditure(date), def = exp - tot.kcal;
  const plan = getPlan(date).filter(e => !e.done);
  const isToday = date === todayS();
  let h = `<div class="daynav"><button data-act="day" data-n="-1">‹</button><div class="t">${isToday ? 'Hoy · ' : ''}${fmtDate(date)}</div><button data-act="day" data-n="1">›</button></div>`;
  if (!isToday) h += `<div class="center" style="margin:-4px 0 10px"><button class="btn sm sec" data-act="today">Ir a hoy</button></div>`;
  if (!db.profile.configured) h += `<div class="card"><b>👋 ¡Bienvenida!</b><p class="muted">Empieza configurando tu perfil para calcular tus calorías y macros objetivo.</p><button class="btn" data-act="tab" data-tab="ajustes">Configurar perfil</button></div>`;

  h += `<div class="card"><div class="row" style="gap:14px">${ring(tot.kcal / t.kcal, over ? 'var(--bad)' : 'var(--kcal)', r0(Math.abs(rem)), over ? 'kcal de más' : 'kcal restantes')}
    <div class="grow"><div class="muted">Comido</div><b style="font-size:1.3rem">${r0(tot.kcal)}</b> <span class="muted">/ ${r0(t.kcal)} kcal</span>
    <div class="muted mt">Reparto actual</div><div style="font-size:.85rem">P ${r0(tot.p * 4 / kc * 100)}% · C ${r0(tot.c * 4 / kc * 100)}% · G ${r0(tot.f * 9 / kc * 100)}%</div>
    <div class="muted">Objetivo: P ${db.profile.pP}% · C ${db.profile.pC}% · G ${db.profile.pF}%</div></div></div>
    <div class="mt">${macroRow('Proteínas', 'var(--p)', tot.p, t.p)}${macroRow('Hidratos', 'var(--c)', tot.c, t.c)}${macroRow('Grasas', 'var(--f)', tot.f, t.f)}</div>
    ${day.entries.length ? `<div class="row between wrap" style="font-size:.85rem"><span class="muted">Gasto estimado ${r0(exp)} kcal${day.burned > 0 ? ' (con tu reloj)' : ''}</span><span class="${def >= 0 ? 'good' : 'badc'}"><b>${def >= 0 ? 'Déficit' : 'Superávit'} ${r0(Math.abs(def))} kcal</b></span></div>` : ''}</div>`;

  if (plan.length) {
    h += `<div class="card plancard"><div class="row between"><h3>🗓️ Planificado para hoy</h3><button class="btn sm" data-act="plan-reg-all">Registrar todo</button></div>`;
    plan.forEach(e => { const m = eM(e); h += `<div class="entry"><div class="grow"><div class="n">${esc(e.name)}</div><div class="s">${MEALS.find(x => x[0] === e.meal)[1]} · ${qtyLabel(e)}</div></div><span class="k">${r0(m.kcal)}</span><button class="icon" data-act="plan-reg" data-id="${e.id}" title="Registrar">✅</button></div>`; });
    h += '</div>';
  }

  MEALS.forEach(([key, name, ic]) => {
    const es = day.entries.filter(e => e.meal === key), st = totals(es);
    if (key === 'otros' && !es.length) return;
    h += `<div class="card meal"><h3><span>${ic} ${name}</span><span class="muted">${es.length ? r0(st.kcal) + ' kcal' : ''}</span></h3>`;
    if (!es.length) h += '<div class="empty">Nada registrado</div>';
    es.forEach(e => {
      const m = eM(e);
      h += `<div class="entry" data-act="edit-entry" data-id="${e.id}" data-where="log"><div class="grow"><div class="n">${esc(e.name)}</div><div class="s">${qtyLabel(e)} · P ${r0(m.p)} · C ${r0(m.c)} · G ${r0(m.f)}</div></div><span class="k">${r0(m.kcal)}</span><button class="icon" data-act="del-entry" data-id="${e.id}" data-where="log" title="Quitar">🗑️</button></div>`;
    });
    h += `<button class="btn sm sec mt" data-act="add" data-target="log" data-meal="${key}">＋ Añadir</button></div>`;
  });
  if (!day.entries.some(e => e.meal === 'otros')) h += `<button class="btn sm ghost" data-act="add" data-target="log" data-meal="otros">＋ Añadir otro (picoteo, bebida…)</button>`;

  h += `<div class="card mt"><h3>🏃 Cuerpo y actividad</h3><div class="grid2">
    <div class="field"><label>Peso (kg)</label><input type="number" inputmode="decimal" step="0.1" data-day="weight" value="${day.weight ?? ''}" placeholder="${latestWeight(date)}"></div>
    <div class="field"><label>Pasos</label><input type="number" inputmode="numeric" data-day="steps" value="${day.steps ?? ''}" placeholder="${db.profile.stepsGoal}"></div>
    <div class="field"><label>Calorías activas (Amazfit)</label><input type="number" inputmode="numeric" data-day="burned" value="${day.burned ?? ''}" placeholder="p. ej. 350"></div>
    <div class="field"><label>Agua (litros)</label><input type="number" inputmode="decimal" step="0.25" data-day="water" value="${day.water ?? ''}" placeholder="2"></div></div>
    <div class="field"><label>Nota del día</label><input type="text" data-day="note" value="${esc(day.note)}" placeholder="Cómo te has sentido, hambre, sueño…"></div>
    <p class="muted">Copia estos datos desde Zepp (pasos y calorías activas). Con las calorías activas el déficit es más preciso.</p></div>`;
  return h;
}

function foodListHtml(selId) {
  const q = S.q.trim().toLowerCase();
  let list = db.foods.filter(f => (S.filter === 'all' || (S.filter === 'fav' ? f.fav : f.type === S.filter)) && (!q || f.name.toLowerCase().includes(q)));
  list.sort((a, b) => (b.fav - a.fav) || ((b.used || 0) - (a.used || 0)) || a.name.localeCompare(b.name));
  if (!list.length) return '<p class="empty">No hay alimentos que coincidan. Crea uno nuevo con el botón de arriba.</p>';
  return list.map(f => `<div class="food ${f.id === selId ? 'sel' : ''}" data-act="${M ? 'pick' : 'edit-food'}" data-id="${f.id}">
    <button class="star" data-act="fav" data-id="${f.id}" title="Favorito">${f.fav ? '⭐' : '☆'}</button>
    <div class="grow"><div class="n">${esc(f.name)} ${mismatch(f) ? '<span class="tag warn" title="Las kcal no cuadran con las macros">⚠️ revisar</span>' : ''}</div>
    <div class="s muted">${TYPES[f.type] || ''} · ${f.unit === '100g' ? 'por 100 g' : 'por ración'} · P ${r1(f.p)} C ${r1(f.c)} G ${r1(f.f)}</div></div><b>${r0(f.kcal)}</b></div>`).join('');
}
const chipsHtml = () => `<div class="chips">${[['all', 'Todos'], ['fav', '⭐ Favoritos'], ['tupper', '🍱 Tuppers'], ['casero', '🍳 Caseros'], ['producto', '🏷️ Productos'], ['base', '🥦 Básicos']].map(([k, l]) => `<button class="chip ${S.filter === k ? 'on' : ''}" data-act="filter" data-k="${k}">${l}</button>`).join('')}</div>`;

function viewAlimentos() {
  return `<div class="card"><h2>🍱 Mis alimentos y tuppers</h2><p class="muted">Guarda aquí tus platos favoritos con su información nutricional y añádelos a cualquier día con un toque.</p>
    <div class="row wrap"><button class="btn" data-act="new-food">＋ Nuevo alimento</button><button class="btn sec" data-act="import">📋 Importar varios</button></div>
    <div class="field mt"><input type="search" id="q" placeholder="Buscar…" value="${esc(S.q)}"></div>${chipsHtml()}<div id="foodlist">${foodListHtml()}</div></div>`;
}

function viewPlan() {
  const mon = S.planWeek, t = targets(), today = todayS();
  let h = `<div class="daynav"><button data-act="pweek" data-n="-1">‹</button><div class="t">Semana del ${fmtDate(mon, { day: 'numeric', month: 'short' })}</div><button data-act="pweek" data-n="1">›</button></div>
    <div class="row wrap" style="margin-bottom:10px"><button class="btn sm sec" data-act="plan-copy-prev">📋 Copiar plan de la semana anterior</button><button class="btn sm sec" data-act="plan-from-log">⏪ Usar lo que comí la semana anterior</button></div>`;
  const orders = {};
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i), es = getPlan(date), tot = totals(es), off = tot.kcal - t.kcal;
    const cls = !es.length ? '' : Math.abs(off) <= t.kcal * 0.05 ? 'good' : off > 0 ? 'badc' : 'warnc';
    h += `<div class="card pday ${date === today ? 'today' : ''}"><h3><span style="text-transform:capitalize">${fmtDate(date, { weekday: 'long', day: 'numeric' })}</span><span class="${cls}">${es.length ? `${r0(tot.kcal)} kcal · P ${r0(tot.p)}g` : ''}</span></h3>`;
    if (!es.length) h += '<div class="empty">Sin planificar</div>';
    MEALS.forEach(([key, name, ic]) => es.filter(e => e.meal === key).forEach(e => {
      const m = eM(e);
      if (db.foods.find(f => f.id === e.foodId)?.type === 'tupper') orders[e.name] = (orders[e.name] || 0) + e.qty;
      h += `<div class="entry" data-act="edit-entry" data-id="${e.id}" data-where="plan" data-date="${date}"><span>${ic}</span><div class="grow"><div class="n">${esc(e.name)}</div><div class="s">${qtyLabel(e)} · P ${r0(m.p)}</div></div><span class="k">${r0(m.kcal)}</span><button class="icon" data-act="del-entry" data-id="${e.id}" data-where="plan" data-date="${date}">🗑️</button></div>`;
    }));
    h += `<div class="row wrap mt"><button class="btn sm sec" data-act="add" data-target="plan" data-date="${date}" data-meal="almuerzo">＋ Añadir</button>${es.length ? `<button class="btn sm ghost" data-act="plan-dup" data-date="${date}">Duplicar al día siguiente</button>` : ''}</div></div>`;
  }
  const names = Object.keys(orders);
  h += `<div class="card"><h3>🛒 Pedido de tuppers de la semana</h3>${names.length ? names.sort().map(n => `<div class="row between entry"><span>${esc(n)}</span><b>× ${r1(orders[n])}</b></div>`).join('') + `<p class="muted">Total: ${r0(sum(Object.values(orders)))} tuppers</p>` : '<p class="empty">Planifica tuppers (alimentos de tipo "Tupper") y aquí verás cuántos pedir.</p>'}</div>`;
  return h;
}

function viewSemana() {
  const mon = S.weekStart, w = weekStats(mon), prev = weekStats(addDays(mon, -7)), t = targets(), p = db.profile;
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const delta = (a, b, u, inv) => (!prev.n || b == null || a == null) ? '' : `<span class="${(a - b) * (inv ? -1 : 1) >= 0 ? 'good' : 'badc'}">${a - b >= 0 ? '▲' : '▼'} ${Math.abs(r1(a - b))}${u}</span>`;
  let h = `<div class="daynav"><button data-act="wweek" data-n="-1">‹</button><div class="t">${fmtDate(mon, { day: 'numeric', month: 'short' })} – ${fmtDate(addDays(mon, 6), { day: 'numeric', month: 'short' })}</div><button data-act="wweek" data-n="1">›</button></div>`;
  if (!w.n) return h + '<div class="card"><p class="empty">No hay comidas registradas esta semana. Registra tus días en la pestaña "Hoy" y aquí verás el balance.</p></div>';

  const fat = w.totalDef / 7700;
  h += `<div class="card"><h2>Resumen</h2><div class="grid3">
    <div class="stat"><b>${r0(w.kcal)}</b><span>kcal/día (obj. ${r0(t.kcal)})</span>${delta(w.kcal, prev.kcal, '', true)}</div>
    <div class="stat"><b>${r0(w.p)} g</b><span>proteína/día (obj. ${r0(t.p)})</span>${delta(w.p, prev.p, '')}</div>
    <div class="stat"><b>${w.n}/7</b><span>días registrados</span></div>
    <div class="stat"><b class="${w.deficit >= 0 ? 'good' : 'badc'}">${r0(w.deficit)}</b><span>déficit medio kcal/día</span></div>
    <div class="stat"><b>${r1(fat)} kg</b><span>grasa estimada perdida</span></div>
    <div class="stat"><b>${w.inRange}/${w.n}</b><span>días en objetivo (±5%)</span></div></div></div>`;

  h += `<div class="card"><h3>Calorías por día</h3>${barChart(w.days.map((x, i) => ({ l: labels[i], v: x.logged ? x.t.kcal : 0, color: x.t.kcal > t.kcal * 1.05 ? 'var(--bad)' : 'var(--kcal)' })), { target: t.kcal })}<p class="muted">Línea roja = tu objetivo (${r0(t.kcal)} kcal).</p></div>`;
  h += `<div class="card"><h3>Proteína por día (g)</h3>${barChart(w.days.map((x, i) => ({ l: labels[i], v: x.logged ? x.t.p : 0 })), { target: t.p, color: 'var(--p)' })}</div>`;
  h += `<div class="card"><h3>Reparto de macros</h3>
    ${[['Proteínas', 'var(--p)', w.pctP, p.pP], ['Hidratos', 'var(--c)', w.pctC, p.pC], ['Grasas', 'var(--f)', w.pctF, p.pF]].map(([n, c, v, o]) => `<div class="macro"><div class="h"><span><span class="dot" style="background:${c}"></span>${n}</span><span><b>${r0(v)}%</b> (objetivo ${o}%)</span></div><div class="bar"><i style="width:${Math.min(100, v)}%;background:${c}"></i></div></div>`).join('')}
    <p class="muted">Media diaria: ${r0(w.p)} g P · ${r0(w.c)} g C · ${r0(w.f)} g G</p></div>`;
  h += `<div class="card"><h3>⚖️ Peso</h3>${lineChart(w.days.map((x, i) => ({ l: labels[i], v: x.d.weight })), { unit: '' })}${w.wAvg ? `<p class="muted">Media semanal ${r1(w.wAvg)} kg ${delta(w.wAvg, prev.wAvg, ' kg', true)}${w.wN > 1 ? ` · variación en la semana ${r1(w.wLast - w.wFirst) > 0 ? '+' : ''}${r1(w.wLast - w.wFirst)} kg` : ''}</p>` : ''}</div>`;
  h += `<div class="card"><h3>👣 Pasos</h3>${w.steps ? barChart(w.days.map((x, i) => ({ l: labels[i], v: x.d.steps || 0 })), { target: p.stepsGoal, color: 'var(--c)' }) + `<p class="muted">Media ${r0(w.steps)} pasos/día (objetivo ${p.stepsGoal}) ${delta(w.steps, prev.steps, '')}</p>` : '<p class="empty">Anota tus pasos en "Hoy".</p>'}</div>`;

  h += `<div class="card"><h2>💡 Qué corregir</h2>${advice(w, prev).map(a => `<div class="advice ${a[0]}">${a[1]}</div>`).join('')}</div>`;

  const bad = [];
  w.L.forEach(x => x.d.entries.forEach(e => { if (mismatch({ ...e.base })) bad.push(e); }));
  if (bad.length) h += `<div class="card"><h3>🔎 Revisión de datos</h3><p class="muted">Estos alimentos tienen kcal que no cuadran con sus macros (4·P + 4·C + 9·G). Puede ser por fibra, polioles, alcohol o un dato mal copiado:</p>${[...new Set(bad.map(e => e.name))].map(n => { const e = bad.find(b => b.name === n), k = calcKcal(e.base.p, e.base.c, e.base.f); return `<div class="entry"><span class="grow">${esc(n)}</span><span class="muted">dice ${r0(e.base.kcal)} · macros ${r0(k)}</span></div>`; }).join('')}</div>`;

  h += `<div class="card"><h3>Planificar la semana siguiente</h3><p class="muted">Copia lo que comiste esta semana como borrador del plan de la próxima y ajústalo.</p><button class="btn" data-act="plan-next-from-week">🗓️ Crear plan de la próxima semana</button></div>`;
  return h;
}

function advice(w, prev) {
  const a = [], t = targets(), p = db.profile, kg = latestWeight(addDays(w.days[6].date, 0));
  if (w.n < 5) a.push(['warn', `Solo has registrado ${w.n} días: cuantos más registres, más fiables son las conclusiones.`]);
  const dk = w.kcal - t.kcal;
  if (dk > t.kcal * 0.05) a.push(['bad', `Te has pasado una media de <b>${r0(dk)} kcal/día</b> sobre tu objetivo. Mira qué días se disparan (gráfico de calorías) y ajusta meriendas o cenas.`]);
  else if (dk < -t.kcal * 0.15) a.push(['warn', `Has comido <b>${r0(-dk)} kcal/día por debajo</b> del objetivo. Un déficit demasiado agresivo aumenta el hambre y puede hacerte perder músculo.`]);
  else a.push(['', `✅ Calorías en el objetivo (${r0(w.kcal)} de ${r0(t.kcal)} kcal/día de media).`]);
  if (w.kcal < bmr() && w.kcal > 0) a.push(['bad', `Tu media (${r0(w.kcal)} kcal) está por debajo de tu metabolismo basal (~${r0(bmr())} kcal). Conviene subir un poco las calorías.`]);
  const gkg = w.p / kg;
  if (w.p < t.p * 0.9) a.push(['warn', `Proteína baja: <b>${r0(w.p)} g/día</b> frente a ${r0(t.p)} g objetivo (${r1(gkg)} g/kg). Añade yogur griego/skyr, claras, atún o un tupper más proteico.`]);
  else a.push(['', `✅ Proteína correcta: ${r0(w.p)} g/día (${r1(gkg)} g/kg de peso).`]);
  if (w.pctF > p.pF + 4) a.push(['warn', `Grasas altas: <b>${r0(w.pctF)}%</b> frente al ${p.pF}% objetivo. Revisa aceite, frutos secos y tuppers con más grasa.`]);
  if (w.pctC > p.pC + 6) a.push(['warn', `Hidratos por encima del objetivo (${r0(w.pctC)}% vs ${p.pC}%).`]);
  if (w.wN >= 2 && w.n >= 4) {
    const exp = -w.totalDef / 7700, real = w.wLast - w.wFirst;
    if (real > exp + 0.6) a.push(['warn', `El peso ha bajado menos de lo estimado (${r1(real)} kg real vs ${r1(exp)} kg esperado). Puede ser retención de líquidos o que estés infraestimando raciones; observa otra semana antes de bajar calorías.`]);
  }
  if (prev.wAvg && w.wAvg) { const d = w.wAvg - prev.wAvg; a.push([d <= 0 ? '' : 'warn', `Peso medio ${d <= 0 ? 'bajando' : 'subiendo'}: ${d > 0 ? '+' : ''}${r1(d)} kg respecto a la semana anterior.`]); }
  if (w.steps != null) a.push([w.steps >= p.stepsGoal ? '' : 'warn', w.steps >= p.stepsGoal ? `✅ Pasos: media de ${r0(w.steps)}/día, objetivo cumplido.` : `Pasos por debajo del objetivo (${r0(w.steps)} de ${p.stepsGoal}). Un paseo de 20 min suma ~2.000 pasos.`]);
  return a;
}

function viewAjustes() {
  const p = db.profile, b = bmr(), td = tdee(), sug = Math.round(td - p.goalKgWeek * 1100), t = targets(), tot = p.pP + p.pC + p.pF, wt = latestWeight();
  const inp = (k, label, extra = '') => `<div class="field"><label>${label}</label><input type="number" inputmode="decimal" data-prof="${k}" value="${p[k]}" ${extra}></div>`;
  return `<div class="card"><h2>👤 Tu perfil</h2><div class="grid2">
    <div class="field"><label>Sexo</label><select data-prof="sex"><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Mujer</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Hombre</option></select></div>
    ${inp('age', 'Edad')}${inp('height', 'Altura (cm)')}${inp('weight', 'Peso inicial (kg)', 'step="0.1"')}${inp('goalWeight', 'Peso objetivo (kg)', 'step="0.1"')}${inp('stepsGoal', 'Objetivo de pasos')}</div>
    <div class="field"><label>Nivel de actividad</label><select data-prof="activity">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${p.activity === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label>Ritmo de pérdida deseado</label><select data-prof="goalKgWeek">${[[0.25, '0,25 kg/semana (suave)'], [0.5, '0,5 kg/semana (recomendado)'], [0.75, '0,75 kg/semana'], [1, '1 kg/semana (agresivo)']].map(([v, l]) => `<option value="${v}" ${p.goalKgWeek === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="preview">Metabolismo basal: <b>${r0(b)} kcal</b> · Gasto diario estimado: <b>${r0(td)} kcal</b><br>Para perder ${p.goalKgWeek} kg/semana: <b>${sug} kcal/día</b> ${sug < b ? '<span class="badc">⚠️ por debajo de tu basal</span>' : ''}</div></div>

  <div class="card"><h2>🎯 Objetivos diarios</h2>
    <div class="field"><label>Calorías objetivo (kcal/día)</label><input type="number" inputmode="numeric" data-prof="kcal" value="${p.kcal}"></div>
    <button class="btn sm sec" data-act="use-sug">Usar la sugerida (${sug} kcal)</button>
    <div class="grid3 mt">${inp('pP', '% Proteínas')}${inp('pC', '% Hidratos')}${inp('pF', '% Grasas')}</div>
    <div class="preview ${tot !== 100 ? 'badc' : ''}">Suma: <b>${tot}%</b> ${tot !== 100 ? '⚠️ debe sumar 100%' : '✅'}<br>
    Proteínas <b>${r0(t.p)} g</b> (${r1(t.p / wt)} g/kg) · Hidratos <b>${r0(t.c)} g</b> · Grasas <b>${r0(t.f)} g</b></div>
    <p class="muted">Las calorías se calculan con 4 kcal/g de proteínas e hidratos y 9 kcal/g de grasas. Con déficit se suele recomendar 1,6–2,2 g de proteína por kg.</p></div>

  <div class="card"><h2>💾 Copia de seguridad</h2><p class="muted">Tus datos viven solo en este dispositivo. Para pasarlos al móvil (o guardarlos), exporta un archivo e impórtalo en el otro dispositivo.</p>
    <div class="row wrap"><button class="btn" data-act="export">⬇️ Exportar datos</button><button class="btn sec" data-act="import-file">⬆️ Importar datos</button></div>
    <input type="file" id="file" accept=".json,application/json" hidden>
    <button class="btn danger sm mt" data-act="reset">Borrar todos los datos</button></div>
  <p class="muted center">TupperFit · v1.0 · Las estimaciones no sustituyen el consejo de un profesional sanitario.</p>`;
}

// ───────── ventana "añadir comida" ─────────
function openAdd(ctx) {
  M = { ...ctx, tab: 'lib', selId: null, qty: 1 };
  S.q = ''; S.filter = 'all';
  renderAdd();
}
const mealSelect = id => `<select id="${id}">${MEALS.map(([k, n]) => `<option value="${k}" ${M.meal === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;

function renderAdd() {
  const title = M.target === 'plan' ? `Planificar · ${fmtDate(M.date, { weekday: 'long', day: 'numeric' })}` : 'Añadir comida';
  let h = `<div class="hd"><h2>${title}</h2><button class="icon" data-act="close">✕</button></div>
    <div class="seg"><button class="${M.tab === 'lib' ? 'on' : ''}" data-act="mtab" data-k="lib">Mis alimentos</button><button class="${M.tab === 'new' ? 'on' : ''}" data-act="mtab" data-k="new">Nuevo / calculadora</button></div>`;
  if (M.tab === 'lib') {
    const f = db.foods.find(x => x.id === M.selId);
    h += `<div class="field"><input type="search" id="mq" placeholder="Buscar…" value="${esc(S.q)}"></div>${chipsHtml()}<div id="mlist" style="max-height:34vh;overflow-y:auto">${foodListHtml(M.selId)}</div>`;
    if (f) {
      h += `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b><div class="grid2 mt"><div class="field"><label>${f.unit === '100g' ? 'Cantidad (gramos)' : 'Raciones'}</label><input type="number" inputmode="decimal" id="m-qty" data-live="lib" value="${M.qty}" step="any"></div><div class="field"><label>Comida</label>${mealSelect('m-meal')}</div></div><div id="m-prev" class="preview"></div><button class="btn block" data-act="add-confirm">Añadir</button></div>`;
    }
  } else h += foodForm({ name: '', type: 'producto', unit: '100g', kcal: '', p: '', c: '', f: '' }, true);
  openModal(h);
  if (M.tab === 'lib') updatePreview(); else updateFormPreview();
}

function foodForm(f, withQty) {
  return `<p class="muted">Introduce la información nutricional de la etiqueta. Si dejas las kcal vacías, se calculan a partir de las macros.</p>
  <div class="field"><label>Nombre</label><input type="text" id="f-name" value="${esc(f.name)}" placeholder="p. ej. Pollo al curry con arroz"></div>
  <div class="grid2"><div class="field"><label>Tipo</label><select id="f-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label>Los valores son…</label><select id="f-unit" data-live="form"><option value="100g" ${f.unit === '100g' ? 'selected' : ''}>por 100 g</option><option value="racion" ${f.unit === 'racion' ? 'selected' : ''}>por ración / tupper</option></select></div></div>
  <div class="grid4"><div class="field"><label>kcal</label><input type="number" inputmode="decimal" id="f-kcal" data-live="form" value="${f.kcal}" step="any"></div><div class="field"><label>Prot. (g)</label><input type="number" inputmode="decimal" id="f-p" data-live="form" value="${f.p}" step="any"></div><div class="field"><label>Hidr. (g)</label><input type="number" inputmode="decimal" id="f-c" data-live="form" value="${f.c}" step="any"></div><div class="field"><label>Grasas (g)</label><input type="number" inputmode="decimal" id="f-f" data-live="form" value="${f.f}" step="any"></div></div>
  <div id="f-check" class="muted"></div>
  ${withQty ? `<div class="grid2 mt"><div class="field"><label id="f-qtylbl">Cantidad</label><input type="number" inputmode="decimal" id="f-qty" data-live="form" value="${f.unit === 'racion' ? 1 : 100}" step="any"></div><div class="field"><label>Comida</label>${mealSelect('m-meal')}</div></div><div id="m-prev" class="preview"></div>
  <label class="row" style="color:var(--text)"><input type="checkbox" id="f-save" style="width:auto" checked> Guardar en mis alimentos</label>
  <button class="btn block mt" data-act="new-confirm">Añadir a ${M.target === 'plan' ? 'plan' : 'hoy'}</button>` : `<label class="row" style="color:var(--text)"><input type="checkbox" id="f-fav" style="width:auto" ${f.fav ? 'checked' : ''}> ⭐ Favorito</label>`}`;
}
function readForm() {
  const p = num($('#f-p').value), c = num($('#f-c').value), f = num($('#f-f').value);
  let kcal = num($('#f-kcal').value); if (!kcal) kcal = calcKcal(p, c, f);
  return { name: $('#f-name').value.trim(), type: $('#f-type').value, unit: $('#f-unit').value, kcal: r1(kcal), p, c, f };
}
function updateFormPreview() {
  const f = readForm(), k = calcKcal(f.p, f.c, f.f), chk = $('#f-check');
  if (chk) chk.innerHTML = mismatch(f) ? `<span class="warnc">⚠️ Las macros suman ${r0(k)} kcal pero indicas ${r0(f.kcal)}. Revisa los datos (puede ser fibra o polioles).</span>` : (f.p || f.c || f.f) ? `Macros ≈ ${r0(k)} kcal` : '';
  const q = $('#f-qty'); if (!q) return;
  const lbl = $('#f-qtylbl'); if (lbl) lbl.textContent = f.unit === '100g' ? 'Cantidad (gramos)' : 'Raciones';
  const m = scale(f, f.unit, num(q.value));
  $('#m-prev').innerHTML = `<b>${r0(m.kcal)} kcal</b> · P ${r1(m.p)} g · C ${r1(m.c)} g · G ${r1(m.f)} g`;
}
function updatePreview() {
  const f = db.foods.find(x => x.id === M.selId), q = $('#m-qty'); if (!f || !q) return;
  const m = scale(f, f.unit, num(q.value));
  $('#m-prev').innerHTML = `<b>${r0(m.kcal)} kcal</b> · P ${r1(m.p)} g · C ${r1(m.c)} g · G ${r1(m.f)} g`;
}

function pushEntry(f, qty, meal) {
  const e = { id: uid(), meal, name: f.name, qty, unit: f.unit, base: { kcal: f.kcal, p: f.p, c: f.c, f: f.f }, foodId: f.id };
  if (M.target === 'plan') getPlan(M.date, true).push(e); else getDay(M.date, true).entries.push(e);
}

// ───────── acciones ─────────
const findEntry = (id, where, date) => (where === 'plan' ? getPlan(date || S.date) : getDay(S.date).entries).find(e => e.id === id);

const A = {
  tab: el => { S.tab = el.dataset.tab; render(); window.scrollTo(0, 0); },
  day: el => { S.date = addDays(S.date, +el.dataset.n); render(); },
  today: () => { S.date = todayS(); render(); },
  pweek: el => { S.planWeek = addDays(S.planWeek, 7 * el.dataset.n); render(); },
  wweek: el => { S.weekStart = addDays(S.weekStart, 7 * el.dataset.n); render(); },
  close: closeModal,
  add: el => openAdd({ target: el.dataset.target, date: el.dataset.date || S.date, meal: el.dataset.meal }),
  mtab: el => { M.tab = el.dataset.k; renderAdd(); },
  filter: el => { S.filter = el.dataset.k; if (M) renderAdd(); else render(); },
  pick: el => { M.selId = el.dataset.id; const f = db.foods.find(x => x.id === M.selId); M.qty = f.unit === '100g' ? 100 : 1; renderAdd(); },
  fav: el => { const f = db.foods.find(x => x.id === el.dataset.id); f.fav = !f.fav; save(); if (M) { const sc = $('#mlist').scrollTop; renderAdd(); $('#mlist').scrollTop = sc; } else render(); },
  'add-confirm': () => {
    const f = db.foods.find(x => x.id === M.selId), qty = num($('#m-qty').value); if (!f || qty <= 0) return toast('Indica una cantidad');
    f.used = Date.now(); pushEntry(f, qty, $('#m-meal').value); save(); closeModal(); render(); toast('Añadido ✔');
  },
  'new-confirm': () => {
    const f = readForm(), qty = num($('#f-qty').value);
    if (!f.name) return toast('Ponle un nombre'); if (qty <= 0) return toast('Indica una cantidad'); if (!f.kcal) return toast('Introduce kcal o macros');
    let food = { id: uid(), fav: false, used: Date.now(), ...f };
    if ($('#f-save').checked) db.foods.push(food);
    pushEntry(food, qty, $('#m-meal').value); save(); closeModal(); render(); toast('Añadido ✔');
  },
  'del-entry': (el, ev) => {
    ev.stopPropagation(); const { id, where, date } = el.dataset;
    if (where === 'plan') db.plan[date] = getPlan(date).filter(e => e.id !== id); else getDay(S.date, true).entries = getDay(S.date).entries.filter(e => e.id !== id);
    save(); render();
  },
  'edit-entry': el => {
    const { id, where, date } = el.dataset, e = findEntry(id, where, date); if (!e) return;
    M = { target: where, date: date || S.date, meal: e.meal, editId: id };
    openModal(`<div class="hd"><h2>${esc(e.name)}</h2><button class="icon" data-act="close">✕</button></div><div class="grid2"><div class="field"><label>${e.unit === '100g' ? 'Gramos' : 'Raciones'}</label><input type="number" inputmode="decimal" id="e-qty" value="${e.qty}" step="any"></div><div class="field"><label>Comida</label>${mealSelect('m-meal')}</div></div><button class="btn block" data-act="edit-save">Guardar</button>`);
  },
  'edit-save': () => {
    const e = findEntry(M.editId, M.target, M.date), q = num($('#e-qty').value); if (!e || q <= 0) return toast('Cantidad no válida');
    e.qty = q; e.meal = $('#m-meal').value; save(); closeModal(); render();
  },
  'plan-reg': el => { regPlan(getPlan(S.date).find(e => e.id === el.dataset.id)); save(); render(); },
  'plan-reg-all': () => { getPlan(S.date).filter(e => !e.done).forEach(regPlan); save(); render(); toast('Plan registrado ✔'); },
  'plan-dup': el => { const d = el.dataset.date; db.plan[addDays(d, 1)] = [...getPlan(addDays(d, 1)), ...getPlan(d).map(e => ({ ...e, id: uid(), done: false }))]; save(); render(); toast('Duplicado al día siguiente'); },
  'plan-copy-prev': () => {
    const prev = addDays(S.planWeek, -7); let n = 0;
    for (let i = 0; i < 7; i++) { const src = getPlan(addDays(prev, i)); if (src.length) { db.plan[addDays(S.planWeek, i)] = src.map(e => ({ ...e, id: uid(), done: false })); n++; } }
    save(); render(); toast(n ? 'Plan copiado ✔' : 'La semana anterior no tenía plan');
  },
  'plan-from-log': () => { copyLogToPlan(addDays(S.planWeek, -7), S.planWeek); },
  'plan-next-from-week': () => { const next = addDays(S.weekStart, 7); copyLogToPlan(S.weekStart, next); S.planWeek = next; S.tab = 'plan'; render(); },
  'new-food': () => { M = null; openModal(`<div class="hd"><h2>Nuevo alimento</h2><button class="icon" data-act="close">✕</button></div>${foodForm({ name: '', type: 'tupper', unit: 'racion', kcal: '', p: '', c: '', f: '' }, false)}<button class="btn block mt" data-act="food-save">Guardar</button>`); updateFormPreview(); },
  'edit-food': el => {
    const f = db.foods.find(x => x.id === el.dataset.id); M = { foodId: f.id };
    openModal(`<div class="hd"><h2>Editar alimento</h2><button class="icon" data-act="close">✕</button></div>${foodForm(f, false)}<div class="row mt"><button class="btn grow" data-act="food-save">Guardar</button><button class="btn danger" data-act="food-del">Eliminar</button></div>`); updateFormPreview();
  },
  'food-save': () => {
    const f = readForm(); if (!f.name) return toast('Ponle un nombre'); if (!f.kcal) return toast('Introduce kcal o macros');
    f.fav = $('#f-fav').checked;
    if (M?.foodId) Object.assign(db.foods.find(x => x.id === M.foodId), f); else db.foods.push({ id: uid(), used: 0, ...f });
    save(); closeModal(); render(); toast('Guardado ✔');
  },
  'food-del': () => { if (confirm('¿Eliminar este alimento? Los días ya registrados no cambian.')) { db.foods = db.foods.filter(x => x.id !== M.foodId); save(); closeModal(); render(); } },
  import: () => { M = null; openModal(`<div class="hd"><h2>Importar varios</h2><button class="icon" data-act="close">✕</button></div><p class="muted">Pega una línea por plato con este formato (separado por <b>;</b> o tabulador):<br><b>Nombre; kcal; proteínas; hidratos; grasas</b><br>Ejemplo: <i>Pollo al curry con arroz; 420; 38; 40; 11</i><br>Se guardan como "Tupper" por ración.</p><textarea id="imp" placeholder="Pollo al curry con arroz; 420; 38; 40; 11"></textarea><button class="btn block mt" data-act="import-go">Importar</button>`); },
  'import-go': () => {
    let n = 0;
    $('#imp').value.split('\n').forEach(line => {
      const x = line.split(/[;\t|]/).map(s => s.trim()); if (x.length < 5 || !x[0]) return;
      const [name, k, p, c, f] = [x[0], num(x[1]), num(x[2]), num(x[3]), num(x[4])]; if (!k && !p && !c && !f) return;
      const ex = db.foods.find(y => y.name.toLowerCase() === name.toLowerCase());
      if (ex) Object.assign(ex, { kcal: k, p, c, f }); else db.foods.push({ id: uid(), name, type: 'tupper', unit: 'racion', kcal: k, p, c, f, fav: false, used: 0 });
      n++;
    });
    save(); closeModal(); render(); toast(n ? `${n} alimentos importados ✔` : 'No se reconoció ninguna línea');
  },
  'use-sug': () => { db.profile.kcal = Math.round(tdee() - db.profile.goalKgWeek * 1100); db.profile.configured = true; save(); render(); },
  export: () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' }));
    a.download = `tupperfit-${todayS()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  'import-file': () => $('#file').click(),
  reset: () => { if (confirm('¿Borrar TODOS tus datos? No se puede deshacer.') && confirm('Seguro del todo. ¿Borrar?')) { localStorage.removeItem(KEY); db = load(); render(); toast('Datos borrados'); } },
};
function regPlan(e) {
  if (!e || e.done) return;
  getDay(S.date, true).entries.push({ ...e, id: uid(), done: undefined }); e.done = true;
}
function copyLogToPlan(fromMon, toMon) {
  let n = 0;
  for (let i = 0; i < 7; i++) { const src = getDay(addDays(fromMon, i)).entries; if (src.length) { db.plan[addDays(toMon, i)] = src.map(e => ({ ...e, id: uid(), done: false })); n++; } }
  save(); render(); toast(n ? 'Plan creado ✔ Ajústalo a tu gusto' : 'No había comidas registradas en esa semana');
}

// ───────── eventos ─────────
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (el && A[el.dataset.act]) A[el.dataset.act](el, ev);
  else if (ev.target.id === 'modal') closeModal();
});
$('#nav').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) A.tab(b); });
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'q') { S.q = t.value; $('#foodlist').innerHTML = foodListHtml(); }
  else if (t.id === 'mq') { S.q = t.value; $('#mlist').innerHTML = foodListHtml(M.selId); }
  else if (t.dataset.live === 'lib') { M.qty = num(t.value); updatePreview(); }
  else if (t.dataset.live === 'form') updateFormPreview();
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.day) {
    const d = getDay(S.date, true), k = t.dataset.day; d[k] = k === 'note' ? t.value : (t.value === '' ? null : num(t.value)); save(); render();
  } else if (t.dataset.prof) {
    const k = t.dataset.prof; db.profile[k] = k === 'sex' ? t.value : num(t.value); db.profile.configured = true; save(); render();
  } else if (t.id === 'file' && t.files[0]) {
    const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (!d.foods || !d.log) throw 0; if (confirm('Esto reemplazará los datos actuales por los del archivo. ¿Continuar?')) { localStorage.setItem(KEY, JSON.stringify(d)); db = load(); render(); toast('Datos importados ✔'); } } catch (e) { toast('Archivo no válido'); } };
    rd.readAsText(t.files[0]);
  }
});

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
