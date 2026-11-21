"""Posador de la figura de la App 1%.
Coge el muñeco de la animación del curl (perfil) y lo coloca en posturas nuevas.
Ángulos 'f' en grados: 0 = hacia abajo, 90 = hacia delante (derecha), 180 = arriba, -90 = atrás.
"""
import xml.etree.ElementTree as ET, math, copy, re

NS = '{http://www.w3.org/2000/svg}'
XL = '{http://www.w3.org/1999/xlink}'
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

BASE = ET.parse('/home/claude/rig/curlMancuernas_perfil.svg').getroot()
P = 'curmpf_'
FLOOR = 262.2

def ptr(t):
    m = re.match(r'translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)(?: scale\(([-\d.]+) ([-\d.]+)\))?', t)
    x, y, a = float(m.group(1)), float(m.group(2)), float(m.group(3))
    sc = (m.group(4), m.group(5)) if m.group(4) else None
    return x, y, a, sc

defs = BASE.find(NS + 'defs')
PART = {g.get('id')[len(P):]: g for g in defs if g.get('id') and 'Gradient' not in g.tag}
B = {}
for k, g in PART.items():
    if g.get('transform'):
        B[k] = ptr(g.get('transform'))

def rot(v, a):
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)

def local(child, parent):
    cx, cy = B[child][:2]; px, py, pa = B[parent][:3]
    return rot((cx - px, cy - py), -pa)

# árbol: hijo -> padre (la posición del hijo se fija en el marco del padre)
TREE = {'thorax': 'pelvis', 'neck': 'thorax', 'head': 'neck', 'uarm': 'thorax', 'farm': 'uarm', 'hand': 'farm',
        'shin': 'thigh', 'foot': 'shin', 'd1': 'hand', 'd2': 'hand'}
LOC = {k: local(k, p) for k, p in TREE.items()}
LOC['delt'] = local('delt', 'thorax')
D1REL = (LOC['d1'], B['d1'][2] - B['hand'][2])

def delt_angle(uarm_a, thorax_a):
    d = ((uarm_a - thorax_a) % 360) - 180          # 0 = brazo abajo
    flex = -d
    pts = [(-90, -98.8), (0, -98.8), (73, -98.0), (172, -182.1), (200, -200)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= flex <= x1:
            off = y0 + (y1 - y0) * (flex - x0) / (x1 - x0); break
    else:
        off = -98.8
    return thorax_a + 180 + d + off + 180

def pose_transforms(sp):
    """sp: dict con f-ángulos y 'hip'. Devuelve {parte: (x, y, a)}"""
    A = {}
    f = lambda k, dflt: -sp.get(k, dflt)
    thorax_f = sp.get('thorax', 180)
    A['pelvis'] = f('pelvis', thorax_f)
    A['thorax'] = -thorax_f
    A['neck'] = f('neck', thorax_f - 13.3)
    A['head'] = f('head', thorax_f + sp.get('mirar', 0))
    A['thigh'] = f('thigh', 0)
    A['shin'] = f('shin', sp.get('thigh', 0))
    A['foot'] = f('foot', 70)
    A['uarm'] = f('uarm', 0)
    A['farm'] = f('farm', sp.get('uarm', 0))
    A['hand'] = f('hand', sp.get('farm', sp.get('uarm', 0)))
    T = {}
    hx, hy = sp['hip']
    T['pelvis'] = (hx, hy, A['pelvis']); T['thigh'] = (hx, hy, A['thigh'])
    for k in ['thorax', 'neck', 'head', 'uarm', 'farm', 'hand', 'shin', 'foot']:
        p = TREE[k]; px, py, pa = T[p]; v = rot(LOC[k], pa)
        T[k] = (px + v[0], py + v[1], A[k])
    sx, sy, _ = T['uarm']
    T['delt'] = (sx, sy, delt_angle(A['uarm'], A['thorax']))
    hx2, hy2, ha = T['hand']; v = rot(D1REL[0], ha)
    T['d1'] = T['d2'] = (hx2 + v[0], hy2 + v[1], ha + D1REL[1])
    return T

def fmt(n):
    s = ('%.1f' % n).rstrip('0').rstrip('.')
    return s if s != '-0' else '0'

# músculos: (parte, índice entre los caminos de músculo de esa parte)
MUSC = {
    'Pectoral': [('thorax', 6)], 'Pectoral superior': [('thorax', 6)], 'Pectoral inferior': [('thorax', 6)],
    'Hombro anterior': [('delt', 2)], 'Hombro lateral': [('delt', 1)], 'Hombro posterior': [('delt', 0)], 'Manguito rotador': [('delt', 0)],
    'Trapecio': [('thorax', 8), ('neck', 0)], 'Tríceps': [('uarm', 0)], 'Bíceps': [('uarm', 2)], 'Braquial': [('uarm', 1)],
    'Antebrazo': [('farm', 0), ('farm', 1)], 'Dorsal': [('thorax', 0)], 'Romboides': [('thorax', 7)], 'Lumbar': [('thorax', 1), ('pelvis', 0)],
    'Abdomen': [('thorax', 5), ('thorax', 4), ('pelvis', 1)], 'Oblicuos': [('thorax', 2), ('thorax', 3)], 'Flexores de cadera': [('pelvis', 3)],
    'Glúteo': [('gluteS', 0)], 'Glúteo medio': [('pelvis', 2)], 'Cuádriceps': [('thigh', 1), ('thigh', 2)], 'Isquiotibiales': [('thigh', 0)],
    'Aductores': [('thigh', 1)], 'Gemelos': [('shin', 3)], 'Sóleo': [('shin', 2)], 'Tibial anterior': [('shin', 0), ('shin', 1)] }
TORSO = {'pelvis', 'thorax', 'neck'}

def muscle_paths(part):
    """caminos de músculo de una parte, en orden"""
    g = PART[part]; out = []
    if part == 'gluteS':
        return [u for u in g if u.tag == NS + 'use']
    for mg in g.iter(NS + 'g'):
        fl = mg.get('fill')
        if mg is not g and fl and fl.startswith('url(') and not fl.endswith('_w)'):
            for c in list(mg):
                if c.tag == NS + 'path':
                    out.append((mg, c))
    return out

def build(sp, mus='', equip_back='', equip_front='', view=None, obj='none', pre='x'):
    root = copy.deepcopy(BASE)
    d = root.find(NS + 'defs')
    parts = {g.get('id')[len(P):]: g for g in d if g.get('id') and 'Gradient' not in g.tag}
    T = pose_transforms(sp)
    for k, (x, y, a) in T.items():
        g = parts[k]; sc = B[k][3]
        g.set('transform', 'translate(%s %s) rotate(%s)%s' % (fmt(x), fmt(y), fmt(a), (' scale(%s %s)' % sc) if sc else ''))
    # glúteo (coordenadas absolutas) va con la pelvis
    ox, oy, oa = B['pelvis'][:3]; nx, ny, na = T['pelvis']
    gs = parts['gluteS']
    wrap = ET.Element(NS + 'g', {'transform': 'translate(%s %s) rotate(%s) rotate(%s) translate(%s %s)' % (fmt(nx), fmt(ny), fmt(na), fmt(-oa), fmt(-ox), fmt(-oy))})
    for c in list(gs): gs.remove(c); wrap.append(c)
    gs.append(wrap)
    # fuera el brillo animado
    for el in list(root.iter()):
        for c in list(el):
            if c.get('data-an') == '16': el.remove(c)
    # colores de los músculos
    want = {}
    names = [m.strip() for m in mus.split(',') if m.strip()]
    for i, n in enumerate(names):
        for pt in MUSC.get(n, []):
            if pt not in want or i == 0: want[pt] = 'p' if i == 0 else want.get(pt, 's')
    for part in parts:
        if part in ('gluteS',):
            uses = [u for u in parts[part].iter(NS + 'use')]
            for i, u in enumerate(uses):
                u.set('fill', 'url(#%s%s)' % (P, want.get((part, i), 'g')))
            continue
        g = parts[part]; idx = 0
        for mg in list(g.iter(NS + 'g')):
            fl = mg.get('fill')
            if mg is g or not fl or not fl.startswith('url(') or fl.endswith('_w)'): continue
            for c in list(mg):
                if c.tag != NS + 'path': continue
                kind = want.get((part, idx))
                c.set('fill', 'url(#%s%s)' % (P, kind if kind else ('gF' if part in TORSO else 'g')))
                idx += 1
    # pierna y brazo del otro lado, con su propia postura
    far = {}
    if sp.get('far'):
        sp2 = dict(sp); sp2.update(sp['far'])
        if 'thigh' in sp['far'] and 'shin' not in sp['far']: sp2['shin'] = sp['far']['thigh']
        if 'uarm' in sp['far'] and 'farm' not in sp['far']: sp2['farm'] = sp['far']['uarm']
        if ('farm' in sp['far'] or 'uarm' in sp['far']) and 'hand' not in sp['far']: sp2['hand'] = sp2['farm']
        T2 = pose_transforms(sp2)
        legs = any(k in sp['far'] for k in ('thigh', 'shin', 'foot')); arms = any(k in sp['far'] for k in ('uarm', 'farm', 'hand'))
        names = (['thigh', 'shin', 'foot'] if legs else []) + (['farm', 'hand', 'd1'] if arms else [])
        for k in names:
            src = parts[k]; cl = copy.deepcopy(src); cl.set('id', src.get('id') + 'B')
            x, y, a = T2[k]; sc = B[k][3]
            cl.set('transform', 'translate(%s %s) rotate(%s)%s' % (fmt(x), fmt(y), fmt(a), (' scale(%s %s)' % sc) if sc else ''))
            for el in cl.iter():
                if el.get('id') and el is not cl: el.set('id', el.get('id') + 'B')
                h = el.get('href')
                if h and el.tag == NS + 'use': el.set('href', h + 'B')
            d.append(cl); far[k] = True
        # los usos del lado lejano (desplazados -3.2 -1.6) apuntan a las copias
        for par in root.iter():
            for c in list(par):
                if c.tag != NS + 'use': continue
                h = c.get('href') or ''; k = h[len('#' + P):] if h.startswith('#' + P) else ''
                lejos = (c.get('transform') or '').startswith('translate(-3.2') or (par.get('transform') or '').startswith('translate(-3.2')
                if lejos and k in far: c.set('href', h + 'B')
    # objeto en la mano
    if obj != 'db':
        for el in list(root.iter()):
            for c in list(el):
                if c.tag == NS + 'use' and (c.get('href') or '').endswith(('_d1', '_d2', '_d1B', '_d2B')): el.remove(c)
    s = ET.tostring(root, encoding='unicode')
    # material: detrás del cuerpo (tras la sombra) y delante (al final)
    s = re.sub(r'(<ellipse [^>]*url\(#curmpf_sd\)[^>]*/>)', lambda m: m.group(1) + equip_back, s, count=1)
    s = s.replace('</svg>', equip_front + '</svg>')
    s = s.replace('curmpf_', pre + '_')
    if view:
        s = re.sub(r'viewBox="[^"]+"', 'viewBox="%s"' % view, s, count=1)
    s = re.sub(r' aria-label="[^"]*"', '', s)
    return s, T

def joints(T):
    """posiciones útiles para colocar el material"""
    J = {k: (v[0], v[1]) for k, v in T.items()}
    # punta de la mano (agarre) y del pie
    hx, hy, ha = T['hand']; v = rot((1.5, 8.5), ha); J['grip'] = (hx + v[0], hy + v[1])
    fx, fy, fa = T['foot']; v = rot((0, 9), fa); J['toe'] = (fx + v[0], fy + v[1])
    return J
