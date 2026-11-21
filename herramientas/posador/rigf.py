"""Posador de frente: el muñeco de las elevaciones laterales (vista frontal).
Lado derecho de la pantalla = lado dibujado; el otro es su espejo (x = 360 - x).
Ángulos f: 0 = abajo, 90 = hacia fuera (derecha de la pantalla), 180 = arriba.
'L' da la postura del otro lado, en sus propios términos (90 = hacia fuera, a la izquierda de la pantalla).
"""
import xml.etree.ElementTree as ET, math, copy, re
NS = '{http://www.w3.org/2000/svg}'
ET.register_namespace('', 'http://www.w3.org/2000/svg')
BASE = ET.parse('/home/claude/rig/lat_frente.svg').getroot()
P = 'latmfr_'
def ptr(t):
    m = re.match(r'translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)(?: scale\(([-\d.]+) ([-\d.]+)\))?', t)
    return float(m.group(1)), float(m.group(2)), float(m.group(3)), ((m.group(4), m.group(5)) if m.group(4) else None)
defs = BASE.find(NS + 'defs')
PART = {g.get('id')[len(P):]: g for g in defs if g.get('id') and 'Gradient' not in g.tag}
B = {k: ptr(g.get('transform')) for k, g in PART.items() if g.get('transform')}
def rot(v, a):
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a)); return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)
def local(ch, pa):
    cx, cy = B[ch][:2]; px, py, pang = B[pa][:3]; return rot((cx - px, cy - py), -pang)
TREE = {'thorax': 'pelvis', 'neck': 'thorax', 'head': 'neck', 'uarm': 'thorax', 'farm': 'uarm', 'hand': 'farm', 'thigh': 'pelvis', 'shin': 'thigh', 'foot': 'shin', 'd1': 'hand'}
LOC = {k: local(k, p) for k, p in TREE.items()}
DELT_OFF = B['delt'][2] - B['uarm'][2]
def fmt(n):
    s = ('%.1f' % n).rstrip('0').rstrip('.'); return s if s != '-0' else '0'

def fk(sp, mirror=False):
    th = sp.get('thorax', 180); A = {}
    if mirror: th = -th
    g = lambda k, d: -sp.get(k, d)
    pf = sp.get('pelvis', 180)
    A['pelvis'] = -(-pf if mirror else pf)
    A['thorax'] = -th; A['neck'] = -(th + (-sp.get('cuello', 0) if mirror else sp.get('cuello', 0))); A['head'] = A['neck']
    A['thigh'] = g('thigh', 0.6 * 0 - 0.6); A['shin'] = g('shin', sp.get('thigh', -0.6)); A['foot'] = g('foot', 0)
    A['uarm'] = g('uarm', 10.5); A['farm'] = g('farm', sp.get('uarm', 10.5)); A['hand'] = g('hand', sp.get('farm', sp.get('uarm', 10.5)))
    hx, hy = sp['hip']
    if mirror: hx = 360 - hx
    T = {'pelvis': (hx, hy, A['pelvis'])}
    for k in ['thorax', 'neck', 'head', 'uarm', 'farm', 'hand', 'thigh', 'shin', 'foot']:
        px, py, pa = T[TREE[k]]; v = rot(LOC[k], pa); T[k] = (px + v[0], py + v[1], A[k])
    T['delt'] = (T['uarm'][0], T['uarm'][1], A['uarm'] + DELT_OFF)
    hx2, hy2, ha = T['hand']; v = rot(LOC['d1'], ha); T['d1'] = (hx2 + v[0], hy2 + v[1], ha + (B['d1'][2] - B['hand'][2]))
    return T

MUSC = {'Abdomen': [('pelvis', 0), ('pelvis', 1)] + [('thorax', i) for i in range(8, 14)], 'Oblicuos': [('thorax', 2), ('thorax', 3), ('pelvis', 2), ('pelvis', 3)],
        'Pectoral': [('thorax', 16), ('thorax', 17)], 'Trapecio': [('thorax', 14), ('thorax', 15), ('neck', 0), ('neck', 1)],
        'Glúteo medio': [('thigh', 1)], 'Glúteo': [('thigh', 1)], 'Aductores': [('thigh', 0), ('thigh', 4)], 'Cuádriceps': [('thigh', 2), ('thigh', 3)],
        'Gemelos': [('shin', 0), ('shin', 1)], 'Tibial anterior': [('shin', 2)], 'Bíceps': [('uarm', 2)], 'Tríceps': [('uarm', 0)],
        'Hombro lateral': [('delt', 0)], 'Hombro anterior': [('delt', 1)], 'Antebrazo': [('farm', 0), ('farm', 1)], 'Lumbar': [('pelvis', 2)], 'Flexores de cadera': [('pelvis', 3)]}
TORSO = {'pelvis', 'thorax', 'neck', 'delt'}
LIMBS = ['thigh', 'shin', 'foot', 'uarm', 'delt', 'farm', 'hand']

def build(sp, mus='', back='', front='', obj='none', pre='x', giro=None):
    root = copy.deepcopy(BASE); d = root.find(NS + 'defs')
    parts = {g.get('id')[len(P):]: g for g in d if g.get('id') and 'Gradient' not in g.tag}
    T = fk(sp)
    for k, (x, y, a) in T.items():
        sc = B[k][3]; parts[k].set('transform', 'translate(%s %s) rotate(%s)%s' % (fmt(x), fmt(y), fmt(a), (' scale(%s %s)' % sc) if sc else ''))
    for el in list(root.iter()):
        for c in list(el):
            if c.get('data-an') == '18': el.remove(c)
    want = {}
    for i, n in enumerate([m.strip() for m in mus.split(',') if m.strip()]):
        for pt in MUSC.get(n, []):
            if pt not in want or i == 0: want[pt] = 'p' if i == 0 else want.get(pt, 's')
    for part, g in parts.items():
        idx = 0
        for mg in list(g.iter(NS + 'g')):
            fl = mg.get('fill')
            if mg is g or not fl or not fl.startswith('url(') or fl.endswith('_w)'): continue
            for c in list(mg):
                if c.tag != NS + 'path': continue
                kd = want.get((part, idx)); c.set('fill', 'url(#%s%s)' % (P, (kd + ('F' if part in TORSO else '')) if kd else ('gF' if part in TORSO else 'g'))); idx += 1
    # lado izquierdo (el espejo): copias con su propia postura
    spL = dict(sp); spL.update(sp.get('L', {}))
    if 'L' in sp:
        L = sp['L']
        if 'thigh' in L and 'shin' not in L: spL['shin'] = L['thigh']
        if 'uarm' in L and 'farm' not in L: spL['farm'] = L['uarm']
        if ('uarm' in L or 'farm' in L) and 'hand' not in L: spL['hand'] = spL['farm']
    TL = fk(spL, mirror=True)
    for k in LIMBS:
        cl = copy.deepcopy(parts[k]); cl.set('id', parts[k].get('id') + 'L'); x, y, a = TL[k]; sc = B[k][3]
        cl.set('transform', 'translate(%s %s) rotate(%s)%s' % (fmt(x), fmt(y), fmt(a), (' scale(%s %s)' % sc) if sc else ''))
        for el in cl.iter():
            if el.get('id') and el is not cl: el.set('id', el.get('id') + 'L')
            if el.tag == NS + 'use' and el.get('href'): el.set('href', el.get('href') + 'L')
        d.append(cl)
    for par in root.iter():
        for c in list(par):
            if c.tag == NS + 'use' and (c.get('transform') or '').startswith('matrix(-1'):
                k = (c.get('href') or '')[len('#' + P):]
                if k in LIMBS: c.set('href', c.get('href') + 'L')
    # mancuernas
    x, y, a = TL['d1']; parts['d2'].set('transform', 'translate(%s %s) rotate(%s)' % (fmt(360 - x), fmt(y), fmt(-a)))
    for par in root.iter():
        for c in list(par):
            h = c.get('href') or ''
            if c.tag == NS + 'use' and ((h.endswith('_d1') and obj not in ('db', 'db1')) or (h.endswith('_d2') and obj != 'db')): par.remove(c)
    s = ET.tostring(root, encoding='unicode')
    s = re.sub(r'(<ellipse [^>]*url\(#latmfr_sd\)[^>]*/>)', lambda m: m.group(1) + back + '<!--CUERPO-->', s, count=1)
    s = s.replace('</svg>', front + '</svg>')
    if giro:   # todo el cuerpo girado (tumbado de lado): se envuelve lo que va tras el suelo
        j = s.index('<!--CUERPO-->')
        k = s.rindex(front) if front else s.index('</svg>')
        s = s[:j] + '<g transform="%s">' % giro + s[j:k] + '</g>' + s[k:]
        s = re.sub(r'<ellipse [^>]*url\(#latmfr_sd\)[^>]*/>', '', s, count=1)
    s = s.replace(P, pre + '_')
    s = re.sub(r' aria-label="[^"]*"', '', s)
    return s, T, TL

def joints(T, TL):
    J = {k: (v[0], v[1]) for k, v in T.items()}
    for k, v in TL.items(): J[k + 'L'] = (360 - v[0], v[1])
    hx, hy, ha = T['hand']; v = rot((0, 8), ha); J['grip'] = (hx + v[0], hy + v[1])
    hx, hy, ha = TL['hand']; v = rot((0, 8), ha); J['gripL'] = (360 - (hx + v[0]), hy + v[1])
    return J
