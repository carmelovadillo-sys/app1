"""Material del gimnasio con el mismo estilo que las animaciones (perfil)."""
import math
X = 'curmpf_'   # se renombra junto con el resto de ids
GRADS = ('<defs>'
 '<linearGradient id="%(x)spe" x2="1" y2="0"><stop offset="0" stop-color="#454C58"/><stop offset=".45" stop-color="#2C313A"/><stop offset="1" stop-color="#1C2027"/></linearGradient>'
 '<linearGradient id="%(x)sbn" x2="0" y2="1"><stop offset="0" stop-color="#4A505C"/><stop offset="1" stop-color="#22262D"/></linearGradient>'
 '<linearGradient id="%(x)smt" x2="0" y2="1"><stop offset="0" stop-color="#F2F4F7"/><stop offset=".45" stop-color="#B9C0C9"/><stop offset="1" stop-color="#6F7783"/></linearGradient>'
 '<radialGradient id="%(x)shb" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#E4E8ED"/><stop offset="1" stop-color="#7F8794"/></radialGradient>'
 '<linearGradient id="%(x)spl" x2="1" y2="1"><stop offset="0" stop-color="#4E5562"/><stop offset=".5" stop-color="#2E333C"/><stop offset="1" stop-color="#1C2027"/></linearGradient>'
 '<linearGradient id="%(x)sst" x2="1" y2="0"><stop offset="0" stop-color="#58606C"/><stop offset=".5" stop-color="#434A55"/><stop offset="1" stop-color="#2E343D"/></linearGradient>'
 '</defs>') % {'x': X}

def f(n): return ('%.1f' % n).rstrip('0').rstrip('.')

def tube(pts, w=3.6, col='#3A404A', cap='round'):
    d = 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in pts)
    hl = 'M' + ' L'.join('%s %s' % (f(x - .5), f(y - .6)) for x, y in pts)
    return ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="%s" stroke-linejoin="round"/>'
            '<path d="%s" fill="none" stroke="#FFF" stroke-opacity=".09" stroke-width="%s" stroke-linecap="%s"/>') % (d, col, f(w), cap, hl, f(max(.6, w * .25)), cap)

def post(x, y1, y2, w=3.8):
    return ('<rect x="%s" y="%s" width="%s" height="%s" fill="#4A515C"/><rect x="%s" y="%s" width=".9" height="%s" fill="#FFF" fill-opacity=".1"/>'
            % (f(x - w / 2), f(y1), f(w), f(y2 - y1), f(x - w / 2 + .5), f(y1 + 2), f(max(0, y2 - y1 - 4))))

def base_plate(x1, x2, y=258.6, h=3.6):
    return '<rect x="%s" y="%s" width="%s" height="%s" rx="1" fill="#3A404A"/>' % (f(x1), f(y), f(x2 - x1), f(h))

def pad(cx, cy, w, h, ang=0, rx=3):
    """cojín centrado en (cx, cy), girado ang grados"""
    return ('<g transform="translate(%s %s) rotate(%s)"><rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="url(#%sbn)" stroke="#14171C" stroke-opacity=".7" stroke-width=".6"/>'
            '<rect x="%s" y="%s" width="%s" height=".9" rx=".45" fill="#FFF" fill-opacity=".12"/></g>'
            % (f(cx), f(cy), f(ang), f(-w / 2), f(-h / 2), f(w), f(h), f(rx), X, f(-w / 2 + 2.4), f(-h / 2 + .9), f(max(0, w - 4.8))))

def roller(cx, cy, r=4.2):
    return ('<circle cx="%s" cy="%s" r="%s" fill="url(#%sbn)" stroke="#14171C" stroke-opacity=".8" stroke-width=".6"/><circle cx="%s" cy="%s" r="%s" fill="#5A616D"/>'
            % (f(cx), f(cy), f(r), X, f(cx), f(cy), f(r * .32)))

def stack(x, y, w=19, h=40, n=8):
    s = '<rect x="%s" y="%s" width="%s" height="%s" rx="1" fill="url(#%spe)" stroke="#69717E" stroke-opacity=".7" stroke-width=".5"/>' % (f(x), f(y), f(w), f(h), X)
    for i in range(1, n):
        yy = y + h * i / n
        s += '<path d="M%s %sh%s" stroke="#0E1115" stroke-width=".9"/><path d="M%s %sh%s" stroke="#FFF" stroke-opacity=".16" stroke-width=".6"/>' % (f(x + .4), f(yy), f(w - .8), f(x + 1), f(yy + .8), f(w - 2))
    s += '<circle cx="%s" cy="%s" r="1.3" fill="#C9CFD7" stroke="#2A2F37" stroke-width=".4"/>' % (f(x + w - 2.6), f(y + h * .62))
    return s

def tower(x, top=44, w=24, stack_h=46):
    """torre de polea con su pila de discos"""
    s = post(x, top, 258) + post(x + w, top, 258)
    s += '<rect x="%s" y="%s" width="%s" height="5.5" rx="1.6" fill="#3A404A"/>' % (f(x - 1.5), f(top - 3), f(w + 3))
    s += '<rect x="%s" y="%s" width="1" height="%s" fill="#7F8896"/><rect x="%s" y="%s" width="1" height="%s" fill="#7F8896"/>' % (f(x + 7.8), f(258 - stack_h - 40), f(stack_h + 40), f(x + w - 7.8), f(258 - stack_h - 40), f(stack_h + 40))
    s += stack(x + 2.5, 258 - stack_h, w - 5, stack_h, max(4, int(stack_h / 5)))
    s += base_plate(x - 3, x + w + 3, 258, 4)
    return s

def pulley(cx, cy, r=4.4):
    return ('<circle cx="%s" cy="%s" r="%s" fill="#252A31"/><circle cx="%s" cy="%s" r="%s" fill="url(#%shb)" stroke="#1C2026" stroke-opacity=".8" stroke-width=".5"/><circle cx="%s" cy="%s" r="1.4" fill="#3A4049"/>'
            % (f(cx), f(cy), f(r + 1.1), f(cx), f(cy), f(r), X, f(cx), f(cy)))

def cable(p1, p2):
    d = 'M%s %sL%s %s' % (f(p1[0]), f(p1[1]), f(p2[0]), f(p2[1]))
    return '<path d="%s" stroke="#1A1E24" stroke-width="1.5"/><path d="%s" stroke="#B3BAC4" stroke-width=".6"/>' % (d, d)

def handle(cx, cy, ang=0, w=10):
    return ('<g transform="translate(%s %s) rotate(%s)"><rect x="%s" y="-1.6" width="%s" height="3.2" rx="1.6" fill="url(#%smt)" stroke="#2A2F37" stroke-width=".4"/></g>'
            % (f(cx), f(cy), f(ang), f(-w / 2), f(w), X))

def plate(cx, cy, r=20):
    """disco visto de frente (barra de lado)"""
    return ('<circle cx="%s" cy="%s" r="%s" fill="url(#%spl)" stroke="#0E1115" stroke-width=".8"/>'
            '<circle cx="%s" cy="%s" r="%s" fill="none" stroke="#FFF" stroke-opacity=".1" stroke-width=".8"/>'
            '<circle cx="%s" cy="%s" r="%s" fill="none" stroke="#0E1115" stroke-opacity=".7" stroke-width=".6"/>'
            '<circle cx="%s" cy="%s" r="3" fill="url(#%smt)" stroke="#2A2F37" stroke-width=".4"/>'
            % (f(cx), f(cy), f(r), X, f(cx), f(cy), f(r - 1.6), f(cx), f(cy), f(r * .55), f(cx), f(cy), X))

def bar_end(cx, cy):
    return '<circle cx="%s" cy="%s" r="2.4" fill="url(#%smt)" stroke="#2A2F37" stroke-width=".4"/>' % (f(cx), f(cy), X)

def bench(x1, x2, y=215, legs=True, h=7.5):
    s = ''
    if legs:
        s += tube([((x1 + 8), y + 3), ((x1 + 8), 259)], 3.6) + tube([((x2 - 8), y + 3), ((x2 - 8), 259)], 3.6)
        s += base_plate(x1 + 2, x1 + 14, 258.4, 3.4) + base_plate(x2 - 14, x2 - 2, 258.4, 3.4)
    s += pad((x1 + x2) / 2, y, x2 - x1, h, 0)
    return s

def kb(cx, cy, r=6):
    return ('<path d="M%s %sq0 -%s %s -%s q%s 0 %s %s" fill="none" stroke="#2A2F37" stroke-width="2.4"/>'
            '<circle cx="%s" cy="%s" r="%s" fill="url(#%spl)" stroke="#0E1115" stroke-width=".6"/>'
            % (f(cx - r * .6), f(cy - r * .6), f(r * .9), f(r * .6), f(r * .9), f(r * .6), f(r * .6), f(r * .9), f(cx), f(cy), f(r), X))
