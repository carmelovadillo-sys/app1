"""Tercera tanda: los laterales, de frente (y dos de perfil)."""
import sys, json, base64, re
sys.path.insert(0, '/home/claude/rig')
import rigf
from equip import *
from ex import EX as EXP, EJM, dirv, add, mid, perp, svg_ang, ex as exP, stand
GR = GRADS.replace('curmpf_', 'latmfr_')
def F(s): return s.replace('curmpf_', 'latmfr_')
EXF = {}
def exf(name, sp, gear=None, obj='none', giro=None): EXF[name] = (sp, gear, obj, giro)
def bandline(a, b): return '<path d="M%s %sL%s %s" stroke="#D93A40" stroke-opacity=".85" stroke-width="2.4" stroke-linecap="round"/>' % (f(a[0]), f(a[1]), f(b[0]), f(b[1]))
def ankle(J, side=''): x, y = J['foot' + side]; return (x, y - 4)
def knee(J, side=''): x, y = J['shin' + side]; return (x, y + 2)

exf('Zancadas laterales', dict(hip=(198, 188), thorax=176, thigh=52, shin=-4, uarm=30, farm=60, L=dict(thigh=40, shin=40, uarm=30, farm=60)))
exf('Saltos de tijera', dict(hip=(180, 152), thigh=20, uarm=150, farm=160, foot=-10, L=dict(thigh=20, foot=-10)))
exf('Inclinaciones laterales con mancuerna', dict(hip=(180, 160), thorax=164, cuello=-6, uarm=-4, L=dict(uarm=150, farm=-150)), None, 'db1')
exf('Paso lateral con banda', dict(hip=(180, 178), thigh=26, shin=-4, uarm=40, farm=-60, L=dict(thigh=26, shin=-4)), lambda J: ('', bandline(ankle(J), ankle(J, 'L'))))
exf('Abducción de cadera con banda', dict(hip=(180, 172), thigh=22, shin=-6, uarm=30, farm=-80, L=dict(thigh=22, shin=-6)), lambda J: ('', bandline(knee(J), knee(J, 'L'))))
def g_cable_ankle(tx, J, side):
    a = ankle(J, side)
    return F(tower(tx) + pulley(tx + (24 if tx < 180 else 0), 250)) + cable((tx + (24 if tx < 180 else 0), 250), a), F(handle(a[0], a[1] + 2, 0, 9))
exf('Abducción de cadera en polea', dict(hip=(186, 160), thigh=34, shin=34, foot=20, uarm=10, farm=10, L=dict(uarm=60, farm=80)), lambda J: g_cable_ankle(80, J, ''))
exf('Aducción de cadera en polea', dict(hip=(178, 160), thigh=-10, shin=-10, foot=-10, uarm=10, farm=10, L=dict(uarm=60, farm=80)), lambda J: g_cable_ankle(270, J, ''))
exf('Leñador en polea', dict(hip=(180, 162), thorax=174, thigh=14, shin=-4, uarm=130, farm=130, L=dict(thigh=14, shin=-4, uarm=-128, farm=-128)),
    lambda J: (F(tower(268) + pulley(268, 52)) + cable((268, 52), J['grip']), F(handle(J['grip'][0], J['grip'][1], 45, 10))))
exf('Rotaciones con landmine', dict(hip=(180, 162), thorax=174, thigh=14, shin=-4, uarm=140, farm=150, L=dict(thigh=14, shin=-4, uarm=-135, farm=-145)),
    lambda J: ('', F(tube([(150, 258), (J['grip'][0] + 4, J['grip'][1] - 2)], 3)) + F(plate(J['grip'][0] + 8, J['grip'][1] - 4, 11)) + '<circle cx="150" cy="257" r="3" fill="#3A404A"/>'))
# tumbados de lado (de frente): el cuerpo entero girado, cabeza a la izquierda
LADO = 'translate(-6 84) rotate(-90 180 160)'
exf('Abducción de cadera tumbado', dict(hip=(180, 160), thigh=38, shin=38, uarm=20, farm=-60, L=dict(uarm=172, farm=-150)), lambda J: ('<rect x="40" y="252" width="270" height="9" rx="3" fill="#2A313C"/>', ''), 'none', LADO)
exf('Aducción de cadera tumbado', dict(hip=(180, 160), thigh=-4, shin=-4, uarm=20, farm=-60, L=dict(thigh=-14, shin=-14, uarm=172, farm=-150)), lambda J: ('<rect x="40" y="252" width="270" height="9" rx="3" fill="#2A313C"/>', ''), 'none', LADO)
exf('Almeja con banda', dict(hip=(180, 160), thigh=34, shin=-30, uarm=20, farm=-60, L=dict(thigh=8, shin=-8, uarm=172, farm=-150)), lambda J: ('<rect x="40" y="252" width="270" height="9" rx="3" fill="#2A313C"/>', ''), 'none', LADO)
exf('Flexión lateral en banco romano', dict(hip=(180, 160), thorax=160, uarm=150, farm=-140, L=dict(uarm=150, farm=-140)),
    lambda J: (F(pad(170, 239, 50, 9)) + F(tube([(168, 243), (168, 258)], 4)) + F(base_plate(140, 200)) + F(roller(258, 228, 4.4)) + F(tube([(258, 232), (258, 258)], 3.4)), ''), 'none', 'translate(-14 66) rotate(-90 180 160)')

# dos de perfil
exP('Sentadilla sissy', dict(hip=(176, 178), thorax=200, thigh=62, shin=-40, foot=30, uarm=100, farm=100, neck=196), None)
exP('Press Pallof', stand(thigh=10, shin=-6, uarm=88, farm=88, hand=88), lambda J, sp: (tower(J['grip'][0] - 150) + pulley(J['grip'][0] - 128, J['grip'][1]) + cable((J['grip'][0] - 128, J['grip'][1]), J['grip']), handle(J['grip'][0], J['grip'][1], 90, 9)))
PERFIL = ['Sentadilla sissy', 'Press Pallof']

def render(n, pre):
    sp, gear, obj, giro = EXF[n]
    s, T, TL = rigf.build(sp, EJM.get(n, ''), '', '', obj, pre, giro)
    J = rigf.joints(T, TL)
    back, front = gear(J) if gear else ('', '')
    s, T, TL = rigf.build(sp, EJM.get(n, ''), GR + back, front, obj, pre, giro)
    return s

if __name__ == '__main__':
    h = '<html><body style="margin:0;background:#101113;display:grid;grid-template-columns:repeat(5,240px);gap:6px;color:#ccc;font:11px sans-serif">'
    for n in EXF:
        s = render(n, 'p' + str(abs(hash(n)) % 999))
        h += '<div><img width=240 height=180 style="background:#23262A" src="data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode() + '"><br>' + n + '</div>'
    open('/home/claude/rig/ex.html', 'w').write(h)
