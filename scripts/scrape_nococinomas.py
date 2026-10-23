#!/usr/bin/env python3
"""Recoge el catálogo público de nococinomas.es (nombre, peso y ficha nutricional por 100 g)
y lo guarda en data/nococinomas.json para que TupperFit lo lea. Solo usa la librería estándar.
Es educado con la web: 1 petición cada 0,6 s, y respeta robots.txt (solo lee categorías y fichas)."""
import html, json, re, sys, time, urllib.request
from datetime import date

BASE = 'https://www.nococinomas.es'
UA = 'Mozilla/5.0 (compatible; TupperFit personal catalogue sync)'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'data/nococinomas.json'

def get(url, tries=3):
    for i in range(tries):
        try:
            time.sleep(0.6)
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40) as r:
                return r.read().decode('utf-8', 'ignore')
        except Exception as e:
            if i == tries - 1:
                print('  ! fallo', url, e, file=sys.stderr); return ''
            time.sleep(3)

def text(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S)
    s = html.unescape(re.sub(r'<[^>]+>', '\n', s))
    return re.sub(r'\n\s*\n+', '\n', s)

def num(v):
    try: return float(v.replace(',', '.'))
    except Exception: return None

home = get(BASE + '/')
cats = sorted(set(re.findall(r'href="' + re.escape(BASE) + r'/(\d+-[a-z0-9-]+)"', home)))
# Categorías con platos (se omiten packs, rebajados, etc. que repiten los mismos productos)
print(f'{len(cats)} categorías'); products = {}
for c in cats:
    for page in range(1, 40):
        h = get(f'{BASE}/{c}' + (f'?page={page}' if page > 1 else ''))
        links = set(re.findall(r'href="(' + re.escape(BASE) + r'/[a-z0-9-]+/(\d+)-[^"]+\.html)"', h))
        new = [(u, i) for u, i in links if i not in products]
        for u, i in new: products[i] = {'url': u, 'cats': []}
        for u, i in links:
            if c not in products[i]['cats']: products[i]['cats'].append(c)
        if not new: break
    print(f'  {c}: total {len(products)}')
print(f'{len(products)} productos; leyendo fichas…')

# Tipo de plato: primera categoría "de comida" en la que aparece (las demás son selecciones como veganos, packs…)
TIPOS = {'44': 'pescados', '47': 'sopas y cremas', '48': 'carnes', '49': 'legumbres y guisos', '50': 'arroces', '54': 'pastas y hojaldres', '56': 'verduras', '58': 'ensaladas y tortilla', '63': 'postres'}
def tipo(cats):
    for c in cats:
        if c.split('-')[0] in TIPOS: return TIPOS[c.split('-')[0]]
    return 'otros'

items = []
for n, (pid, p) in enumerate(products.items(), 1):
    h = get(p['url'])
    if not h: continue
    t = text(h)
    m = re.search(r'Peso:\s*([\d.,]+)\s*gr', t)
    f = {k: num(v) for k, v in re.findall(r'(Energía \(Kcal\)|Hidratos \(g\)|Fibra \(g\)|Proteínas \(g\)|Grasas \(g\))\n([\d.,]+)', t)}
    title = re.search(r'<meta property="og:title" content="([^"]+)"', h)
    name = html.unescape(title.group(1)).strip() if title else ''
    if re.search(r'familiar|\+\s*grandes?\b', name, re.I): continue  # formatos familiar y +grande: no los queremos
    price = re.search(r'"price":\s*"?([\d.]+)', h)
    if not (m and name and f.get('Energía (Kcal)') is not None and f.get('Proteínas (g)') is not None):
        continue
    items.append({'id': int(pid), 'name': name, 'url': p['url'], 'cat': tipo(p['cats']), 'weight': num(m.group(1)),
                  'kcal': f['Energía (Kcal)'], 'c': f.get('Hidratos (g)', 0), 'p': f['Proteínas (g)'], 'f': f.get('Grasas (g)', 0),
                  'fiber': f.get('Fibra (g)', 0), 'price': num(price.group(1)) if price else None})
    if n % 25 == 0: print(f'  {n}/{len(products)}')

if len(items) < 20:
    sys.exit('Muy pocos productos leídos: la web puede haber cambiado. No se sobrescribe el archivo.')
items.sort(key=lambda x: x['name'].lower())
json.dump({'source': BASE, 'updated': date.today().isoformat(), 'per': '100g', 'count': len(items), 'items': items}, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'OK: {len(items)} tuppers guardados en {OUT}')
