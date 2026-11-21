"""Ejercicios nuevos dibujados con el posador. Cada uno: postura + material + objeto."""
import math, json, sys, base64, re
sys.path.insert(0, '/home/claude/rig')
from rig import build, pose_transforms, joints, FLOOR
from equip import *

def dirv(fang): r = math.radians(fang); return (math.sin(r), math.cos(r))
def add(p, v, k=1): return (p[0] + v[0] * k, p[1] + v[1] * k)
def perp(fang, k):  # perpendicular hacia "atrás" del segmento (izquierda al mirar en su dirección)
    v = dirv(fang + 90); return (v[0] * k, v[1] * k)
def mid(a, b, t=.5): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
def svg_ang(fang): return math.degrees(math.atan2(math.cos(math.radians(fang)), math.sin(math.radians(fang))))

EX = {}
def ex(name, sp, gear=None, obj='none', view=None):
    EX[name] = (sp, gear, obj, view)

# ---------- utilidades de postura ----------
def sit_hip(seat_y=214): return seat_y - 9          # cadera sobre el asiento
def stand(**k):
    d = dict(hip=(178, 160), thorax=181.5, thigh=1.2, shin=-1.2, uarm=2, farm=6); d.update(k); return d

# ---------- MÁQUINAS ----------
def g_ext_cuad(J, sp):
    H = J['pelvis']; N = J['neck']; K = J['shin']; A = J['foot']
    s = base_plate(H[0] - 30, H[0] + 70) + tube([(H[0] - 20, 258), (H[0] - 20, H[1] + 15), (H[0] + 30, H[1] + 15)], 4.2)
    s += tube([(H[0] + 24, H[1] + 15), (H[0] + 24, 258)], 4)
    s += pad(H[0] + 8, H[1] + 11, 48, 8)                                         # asiento
    tf = sp['thorax']; bc = add(mid(H, N, .55), perp(tf, -8.5))
    s += pad(bc[0], bc[1], 44, 8, svg_ang(tf))                                   # respaldo
    s += tube([(H[0] - 14, H[1] + 10), add(bc, perp(tf, -5))], 3.4)
    s += tube([K, add(K, (0, 1))], 0) + '<circle cx="%s" cy="%s" r="3.2" fill="#3A404A"/>' % (f(K[0]), f(K[1]))
    rp = add(A, perp(sp['shin'], 6.5))
    s += tube([K, rp], 3.2) + roller(rp[0], rp[1], 4.6)
    s += stack(H[0] - 52, 258 - 44, 16, 44, 8) + tube([(H[0] - 54, 210), (H[0] - 54, 258)], 3) + tube([(H[0] - 34, 210), (H[0] - 34, 258)], 3)
    return s, ''
ex('Extensión de cuádriceps', dict(hip=(160, 205), thorax=186, thigh=90, shin=55, uarm=-8, farm=40), g_ext_cuad)
ex('Extensión de cuádriceps a una pierna', dict(hip=(160, 205), thorax=186, thigh=90, shin=55, uarm=-8, farm=40), g_ext_cuad)

def g_curl_fem_sent(J, sp):
    H = J['pelvis']; N = J['neck']; K = J['shin']; A = J['foot']
    s = base_plate(H[0] - 30, H[0] + 70) + tube([(H[0] - 20, 258), (H[0] - 20, H[1] + 15), (H[0] + 30, H[1] + 15)], 4.2)
    s += pad(H[0] + 8, H[1] + 11, 48, 8)
    tf = sp['thorax']; bc = add(mid(H, N, .55), perp(tf, -8.5)); s += pad(bc[0], bc[1], 44, 8, svg_ang(tf))
    s += tube([(H[0] - 14, H[1] + 10), add(bc, perp(tf, -5))], 3.4)
    rp = add(A, perp(sp['shin'], -6)); s += tube([K, rp], 3.2) + roller(rp[0], rp[1], 4.6)
    s += stack(H[0] - 52, 258 - 44, 16, 44, 8)
    fr = ''
    tp = add(mid(H, K, .78), perp(sp['thigh'], 7.5)); fr += pad(tp[0], tp[1], 18, 7, svg_ang(sp['thigh']))  # cojín sobre los muslos
    fr += tube([add(tp, (8, -3)), (tp[0] + 20, tp[1] - 3), (tp[0] + 20, H[1] + 15)], 3)
    return s, fr
ex('Curl femoral sentado', dict(hip=(160, 205), thorax=184, thigh=90, shin=-25, uarm=8, farm=60), g_curl_fem_sent)

def g_curl_fem_tumb(J, sp):
    H = J['pelvis']; K = J['shin']; A = J['foot']
    y = H[1] + 12
    s = tube([(H[0] - 40, y + 4), (H[0] - 40, 258)], 3.6) + tube([(H[0] + 60, y + 4), (H[0] + 60, 258)], 3.6) + base_plate(H[0] - 48, H[0] + 70)
    s += pad(H[0] + 20, y, 96, 8, -6)
    rp = add(A, perp(sp['shin'], 5.5)); s += tube([K, (K[0] - 2, y + 4)], 3.2) + tube([K, rp], 3.2) + roller(rp[0], rp[1], 4.6)
    s += stack(H[0] - 75, 258 - 40, 14, 40, 7)
    return s, ''
ex('Curl femoral tumbado', dict(hip=(176, 196), thorax=96, thigh=-86, shin=-150, foot=-60, uarm=40, farm=80, neck=104, mirar=10), g_curl_fem_tumb)

def g_press_pecho(J, sp):
    H = J['pelvis']; N = J['neck']; G = J['grip']; S = J['uarm']
    s = base_plate(H[0] - 40, H[0] + 40) + tube([(H[0] - 6, 258), (H[0] - 6, H[1] + 15)], 4.2) + pad(H[0] + 6, H[1] + 11, 40, 8)
    tf = sp['thorax']; bc = add(mid(H, N, .6), perp(tf, -8.5)); s += pad(bc[0], bc[1], 50, 8, svg_ang(tf))
    s += tube([add(bc, perp(tf, -5)), add(bc, perp(tf, -18)), (bc[0] - 18, 258)], 4)
    top = (bc[0] - 16, N[1] - 30)
    s += tube([(bc[0] - 18, N[1] + 20), top, (G[0] + 2, top[1] + 4), (G[0] + 2, G[1] - 3)], 3.6)  # brazo de la máquina
    s += stack(H[0] - 62, 258 - 46, 16, 46, 8)
    fr = handle(G[0], G[1], 90, 11)
    return s, fr
ex('Press de pecho en máquina', dict(hip=(164, 205), thorax=186, thigh=86, shin=8, uarm=78, farm=90, hand=95), g_press_pecho)
ex('Press inclinado en máquina', dict(hip=(164, 205), thorax=196, thigh=86, shin=8, uarm=108, farm=125, hand=125), g_press_pecho)
ex('Press declinado en máquina', dict(hip=(164, 205), thorax=180, thigh=86, shin=8, uarm=62, farm=72, hand=75), g_press_pecho)

def g_press_hombro(J, sp):
    H = J['pelvis']; N = J['neck']; G = J['grip']
    s = base_plate(H[0] - 40, H[0] + 40) + tube([(H[0] - 6, 258), (H[0] - 6, H[1] + 15)], 4.2) + pad(H[0] + 6, H[1] + 11, 40, 8)
    tf = sp['thorax']; bc = add(mid(H, N, .6), perp(tf, -8.5)); s += pad(bc[0], bc[1], 52, 8, svg_ang(tf))
    s += tube([add(bc, perp(tf, -5)), add(bc, perp(tf, -16)), (bc[0] - 16, 258)], 4)
    s += tube([(bc[0] - 16, N[1] - 6), (bc[0] - 16, G[1] - 14), (G[0], G[1] - 14), (G[0], G[1] - 2)], 3.6)
    s += stack(H[0] - 62, 258 - 46, 16, 46, 8)
    return s, handle(G[0], G[1], 90, 11)
ex('Press de hombros en máquina', dict(hip=(164, 205), thorax=184, thigh=86, shin=8, uarm=150, farm=178, hand=178), g_press_hombro)

def g_remo_maq(J, sp):
    H = J['pelvis']; T = J['thorax']; N = J['neck']; G = J['grip']
    s = base_plate(H[0] - 20, H[0] + 60) + tube([(H[0] + 2, 258), (H[0] + 2, H[1] + 15)], 4.2) + pad(H[0] + 4, H[1] + 11, 34, 8)
    tf = sp['thorax']; cc = add(mid(H, N, .7), perp(tf, 10)); s += pad(cc[0], cc[1], 30, 8, svg_ang(tf))   # pecho
    s += tube([add(cc, perp(tf, 5)), (cc[0] + 30, cc[1] + 4), (cc[0] + 30, 258)], 4)
    s += tube([(cc[0] + 30, G[1] - 2), (G[0] + 2, G[1] - 2)], 3) + post(cc[0] + 46, 120, 258) + stack(cc[0] + 52, 258 - 46, 16, 46, 8)
    return s, handle(G[0], G[1], 90, 10)
ex('Remo en máquina', dict(hip=(150, 205), thorax=172, thigh=88, shin=10, uarm=-38, farm=88, hand=88), g_remo_maq)
ex('Remo unilateral en máquina', dict(hip=(150, 205), thorax=172, thigh=88, shin=10, uarm=-38, farm=88, hand=88), g_remo_maq)
ex('Remo alto en máquina', dict(hip=(150, 205), thorax=172, thigh=88, shin=10, uarm=-60, farm=110, hand=110), g_remo_maq)

def g_prensa(J, sp):
    H = J['pelvis']; N = J['neck']; A = J['foot']; TOE = J['toe']
    s = base_plate(H[0] - 50, H[0] + 110)
    tf = sp['thorax']; bc = add(mid(H, N, .5), perp(tf, -9)); s += pad(bc[0], bc[1], 56, 9, svg_ang(tf))
    sc = add(H, perp(tf, -2)); sc = (H[0] + 2, H[1] + 11); s += pad(sc[0], sc[1], 26, 8, -20)
    s += tube([(bc[0] - 10, bc[1] + 20), (H[0] - 30, 258)], 4.2) + tube([(H[0] + 10, H[1] + 16), (H[0] + 10, 258)], 4.2)
    # carril en diagonal y plataforma
    pf = add(TOE, dirv(sp['shin']), 1.5)
    s += tube([(H[0] + 20, 250), (pf[0] + 30, pf[1] - 34)], 5) + tube([(H[0] + 20, 254), (H[0] + 20, 258)], 4)
    ang = svg_ang(sp['shin']) + 90
    fr = ('<g transform="translate(%s %s) rotate(%s)"><rect x="-22" y="-2.4" width="44" height="6" rx="1.5" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>'
          '<rect x="-20" y="-1.8" width="40" height=".9" fill="#FFF" fill-opacity=".14"/></g>') % (f(pf[0] + 2), f(pf[1] + 1), f(ang))
    s += plate(pf[0] + 14, pf[1] - 12, 15)
    return s, fr
ex('Prensa de piernas', dict(hip=(132, 214), thorax=232, thigh=138, shin=95, foot=180, uarm=-30, farm=40, neck=222), g_prensa)
ex('Prensa a una pierna', dict(hip=(132, 214), thorax=232, thigh=138, shin=95, foot=180, uarm=-30, farm=40, neck=222), g_prensa)

def g_prensa_h(J, sp):
    H = J['pelvis']; N = J['neck']; TOE = J['toe']
    s = base_plate(H[0] - 40, TOE[0] + 30)
    tf = sp['thorax']; bc = add(mid(H, N, .5), perp(tf, -9)); s += pad(bc[0], bc[1], 54, 9, svg_ang(tf))
    s += pad(H[0] + 2, H[1] + 11, 30, 8) + tube([(H[0], H[1] + 15), (H[0], 258)], 4.2) + tube([(bc[0] - 8, bc[1]), (bc[0] - 20, 258)], 4)
    s += tube([(H[0] + 16, 252), (TOE[0] + 10, 252)], 4.6)
    pf = (TOE[0] + 4, TOE[1])
    fr = '<rect x="%s" y="%s" width="6" height="46" rx="1.5" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(pf[0]), f(pf[1] - 26))
    s += tube([(pf[0] + 6, 252), (pf[0] + 6, pf[1] - 10)], 4) + stack(TOE[0] + 16, 258 - 50, 16, 50, 9)
    return s, fr
ex('Prensa horizontal', dict(hip=(140, 214), thorax=205, thigh=110, shin=70, foot=160, uarm=-10, farm=40), g_prensa_h)

def g_gem_pie(J, sp):
    H = J['pelvis']; S = J['uarm']; TOE = J['toe']; A = J['foot']
    s = base_plate(H[0] - 40, H[0] + 40) + '<rect x="%s" y="%s" width="28" height="9" rx="1.5" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(TOE[0] - 14), f(258 - 9 - 0))
    s += post(H[0] - 26, 70, 258) + stack(H[0] - 50, 258 - 48, 16, 48, 9)
    fr = pad(S[0] + 2, S[1] - 6, 22, 7, 0) + tube([(S[0] - 8, S[1] - 6), (H[0] - 26, S[1] - 6)], 3.4)
    return s, fr
ex('Elevación de gemelos de pie', stand(hip=(178, 150), foot=25, thorax=181, uarm=-25, farm=150, hand=150), g_gem_pie)

def g_gem_sent(J, sp):
    H = J['pelvis']; K = J['shin']; TOE = J['toe']
    s = base_plate(H[0] - 30, H[0] + 70) + pad(H[0] + 6, H[1] + 11, 36, 8) + tube([(H[0] + 4, H[1] + 15), (H[0] + 4, 258)], 4.2)
    s += '<rect x="%s" y="%s" width="20" height="8" rx="1.5" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(TOE[0] - 10), f(250))
    fr = pad(K[0] - 6, K[1] - 9, 24, 7, 0) + tube([(K[0] + 6, K[1] - 9), (K[0] + 26, K[1] - 9), (K[0] + 26, 258)], 3.6) + plate(K[0] + 26, K[1] - 3, 13)
    return s, fr
ex('Elevación de gemelos sentado', dict(hip=(150, 205), thorax=186, thigh=90, shin=0, foot=30, uarm=30, farm=80), g_gem_sent)

def g_hack(J, sp):
    H = J['pelvis']; N = J['neck']; S = J['uarm']; TOE = J['toe']
    tf = sp['thorax']
    s = base_plate(H[0] - 60, TOE[0] + 30)
    bc = add(mid(H, N, .5), perp(tf, -9)); s += pad(bc[0], bc[1], 60, 9, svg_ang(tf))
    s += tube([(bc[0] - 40, bc[1] - 50), (bc[0] - 10, 252)], 5) + tube([(bc[0] - 40, bc[1] - 50), (bc[0] - 40, 258)], 4)
    s += '<rect x="%s" y="%s" width="40" height="8" rx="1.5" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6" transform="rotate(-12 %s %s)"/>' % (f(TOE[0] - 30), f(252), f(TOE[0]), f(255))
    fr = pad(S[0] + 2, S[1] - 7, 18, 7, svg_ang(tf) + 90)
    return s, fr
ex('Sentadilla hack', dict(hip=(150, 200), thorax=200, thigh=95, shin=-28, uarm=-20, farm=150, hand=150), g_hack)
ex('Sentadilla en máquina péndulo', dict(hip=(150, 200), thorax=200, thigh=95, shin=-28, uarm=-20, farm=150, hand=150), g_hack)

def g_abduc(J, sp):
    H = J['pelvis']; N = J['neck']; K = J['shin']
    s = base_plate(H[0] - 40, H[0] + 60) + tube([(H[0] - 2, 258), (H[0] - 2, H[1] + 15)], 4.2) + pad(H[0] + 8, H[1] + 11, 40, 8)
    tf = sp['thorax']; bc = add(mid(H, N, .55), perp(tf, -8.5)); s += pad(bc[0], bc[1], 46, 8, svg_ang(tf))
    s += tube([add(bc, perp(tf, -5)), (bc[0] - 14, 258)], 4) + stack(H[0] - 58, 258 - 44, 16, 44, 8)
    fr = pad(K[0] - 8, K[1] - 1, 7, 18, 0) + tube([(K[0] - 8, K[1] + 8), (K[0] - 8, 258)], 3)
    return s, fr
ex('Abducción de cadera en máquina', dict(hip=(160, 205), thorax=196, thigh=90, shin=0, uarm=-10, farm=40), g_abduc)
ex('Aducción de cadera en máquina', dict(hip=(160, 205), thorax=196, thigh=90, shin=0, uarm=-10, farm=40), g_abduc)

def g_pecdeck(J, sp):
    H = J['pelvis']; N = J['neck']; E = J['farm']; G = J['grip']
    s = base_plate(H[0] - 40, H[0] + 40) + tube([(H[0] - 6, 258), (H[0] - 6, H[1] + 15)], 4.2) + pad(H[0] + 6, H[1] + 11, 40, 8)
    tf = sp['thorax']; bc = add(mid(H, N, .6), perp(tf, -8.5)); s += pad(bc[0], bc[1], 54, 8, svg_ang(tf))
    s += tube([add(bc, perp(tf, -5)), add(bc, perp(tf, -16)), (bc[0] - 16, 258)], 4) + stack(H[0] - 62, 258 - 46, 16, 46, 8)
    s += tube([(bc[0] - 16, N[1] - 20), (G[0], N[1] - 20), (G[0], G[1])], 3.4)
    return s, handle(G[0], G[1], 90, 12)
ex('Aperturas en máquina', dict(hip=(164, 205), thorax=184, thigh=86, shin=8, uarm=88, farm=88, hand=95), g_pecdeck)
ex('Pájaros en máquina', dict(hip=(140, 205), thorax=172, thigh=86, shin=8, uarm=80, farm=80, hand=85), g_remo_maq)

# ---------- CON BARRA / MANCUERNAS / CUERPO ----------
def g_db_sides(J, sp): return '', ''
def g_squat_front(J, sp):
    G = J['grip']; S = J['uarm']
    bp = add(S, (6, -2))
    return plate(bp[0], bp[1], 20), ''
ex('Sentadilla frontal', dict(hip=(150, 214), thorax=160, thigh=82, shin=-30, uarm=95, farm=-150, hand=-150, neck=165), g_squat_front)
ex('Sentadilla sin peso', dict(hip=(150, 214), thorax=145, thigh=82, shin=-30, uarm=95, farm=95, neck=150), None)
ex('Sentadilla con salto', dict(hip=(150, 214), thorax=145, thigh=82, shin=-30, uarm=-40, farm=-30, neck=150), None)
ex('Sentadilla con mancuernas', dict(hip=(150, 214), thorax=150, thigh=82, shin=-30, uarm=-8, farm=-4, neck=158), None, 'db')
ex('Sentadilla goblet con kettlebell', dict(hip=(150, 214), thorax=155, thigh=82, shin=-30, uarm=30, farm=-160, hand=-160, neck=160), lambda J, sp: ('', kb(J['grip'][0] + 6, J['grip'][1] + 4, 6)))
ex('Sentadilla isométrica en pared', dict(hip=(150, 207), thorax=180, thigh=90, shin=0, uarm=5, farm=10), lambda J, sp: ('<rect x="%s" y="60" width="8" height="203" fill="url(#curmpf_st)"/>' % f(J['pelvis'][0] - 22), ''))
def g_bar_front(J, sp):
    G = J['grip']; return plate(G[0] + 2, G[1], 20), ''
ex('Thruster con barra', dict(hip=(150, 214), thorax=160, thigh=82, shin=-30, uarm=95, farm=-150, hand=-150, neck=165), g_squat_front)
ex('Thruster con mancuernas', dict(hip=(150, 214), thorax=160, thigh=82, shin=-30, uarm=95, farm=-150, hand=-150, neck=165), None, 'db')
def g_bar_back(J, sp):
    S = J['uarm']; return plate(S[0] - 6, S[1] - 3, 20), ''
ex('Buenos días', dict(hip=(168, 160), thorax=100, thigh=-6, shin=6, uarm=-160, farm=10, hand=10, neck=88, mirar=-20), g_bar_back)
ex('Peso muerto con mancuernas', dict(hip=(165, 168), thorax=118, thigh=-18, shin=14, uarm=2, farm=2, neck=110), None, 'db')
ex('Peso muerto con kettlebell', dict(hip=(165, 168), thorax=118, thigh=-18, shin=14, uarm=2, farm=2, neck=110), lambda J, sp: ('', kb(J['grip'][0], J['grip'][1] + 8, 7)))
ex('Elevaciones frontales con mancuernas', stand(uarm=90, farm=90, hand=90), None, 'db')
ex('Elevaciones frontales con barra', stand(uarm=90, farm=90, hand=90), g_bar_front)
ex('Elevaciones frontales con disco', stand(uarm=90, farm=90, hand=90), lambda J, sp: ('', plate(J['grip'][0] + 3, J['grip'][1], 13)))
def g_remo_menton(J, sp): G = J['grip']; return '', plate(G[0] + 1, G[1], 20)
ex('Remo al mentón con barra', stand(uarm=112, farm=-130, hand=-130), g_remo_menton)
ex('Remo al mentón con mancuernas', stand(uarm=112, farm=-130, hand=-130), None, 'db')
ex('Remo al mentón con barra Z', stand(uarm=112, farm=-130, hand=-130), g_remo_menton)
ex('Paseo del granjero', stand(), None, 'db')
ex('Elevación de gemelos con mancuernas', stand(hip=(178, 151), foot=25), None, 'db')
ex('Elevación de gemelos en escalón', stand(hip=(178, 142), foot=25, uarm=10, farm=30), lambda J, sp: ('<rect x="%s" y="243" width="34" height="19" rx="2" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % f(J['toe'][0] - 26), ''))
ex('Press militar sentado con barra', dict(hip=(164, 205), thorax=181, thigh=86, shin=8, uarm=155, farm=180, hand=180), lambda J, sp: (bench(J['pelvis'][0] - 20, J['pelvis'][0] + 30, J['pelvis'][1] + 11) + pad(J['pelvis'][0] - 10, J['pelvis'][1] - 30, 9, 50, 0), plate(J['grip'][0], J['grip'][1] - 2, 20)))
ex('Push press', stand(uarm=165, farm=180, hand=180), lambda J, sp: ('', plate(J['grip'][0], J['grip'][1] - 2, 20)))
ex('Press de hombros con kettlebell', stand(uarm=150, farm=180, hand=180), lambda J, sp: ('', kb(J['grip'][0] + 4, J['grip'][1] - 6, 6)))
def g_concentrado(J, sp):
    H = J['pelvis']; return bench(H[0] - 30, H[0] + 20, H[1] + 11), ''
ex('Curl concentrado', dict(hip=(160, 205), thorax=130, thigh=86, shin=0, uarm=10, farm=150, hand=150, neck=120, mirar=-20), g_concentrado, 'db')
def g_scott(J, sp):
    H = J['pelvis']; E = J['farm']; S = J['uarm']
    s = pad(H[0] + 2, H[1] + 11, 32, 8) + tube([(H[0], H[1] + 15), (H[0], 258)], 4) + base_plate(H[0] - 20, H[0] + 50)
    pc = mid(S, E, .55); pc = add(pc, perp(sp['uarm'], 6))
    s2 = pad(pc[0], pc[1], 34, 8, svg_ang(sp['uarm'])) + tube([add(pc, (4, 6)), (pc[0] + 10, 258)], 4)
    return s, s2
ex('Curl en banco Scott', dict(hip=(150, 205), thorax=178, thigh=86, shin=10, uarm=135, farm=200, hand=200), lambda J, sp: (g_scott(J, sp)[0], g_scott(J, sp)[1] + plate(J['grip'][0], J['grip'][1], 13)))
ex('Curl en banco Scott con mancuerna', dict(hip=(150, 205), thorax=178, thigh=86, shin=10, uarm=135, farm=200, hand=200), g_scott, 'db')
ex('Extensión de tríceps tras nuca con mancuerna', stand(uarm=172, farm=-20, hand=-20), None, 'db')
ex('Extensión de tríceps tras nuca con barra Z', stand(uarm=172, farm=-20, hand=-20), lambda J, sp: ('', plate(J['grip'][0], J['grip'][1], 13)))
def g_overhead_cable(J, sp):
    G = J['grip']; x = G[0] - 70
    return tower(x - 10) + pulley(x + 2, 236) + cable((x + 2, 236), G), handle(G[0], G[1], 0, 8)
ex('Extensión de tríceps sobre la cabeza en polea', dict(hip=(186, 166), thorax=140, thigh=-14, shin=10, uarm=165, farm=110, hand=110, neck=145), g_overhead_cable)
def g_curl_polea(J, sp):
    G = J['grip']; x = G[0] + 40
    return tower(x) + pulley(x - 2, 248) + cable((x - 2, 248), G), handle(G[0], G[1], 90, 10)
ex('Curl de bíceps en polea baja', stand(uarm=6, farm=120, hand=120), g_curl_polea)
ex('Curl de bíceps a una mano en polea', stand(uarm=6, farm=120, hand=120), g_curl_polea)
def g_crunch_polea(J, sp):
    G = J['grip']; x = G[0] + 30
    return tower(x, 44) + pulley(x - 2, 52) + cable((x - 2, 52), G), ''
ex('Crunch en polea alta', dict(hip=(150, 208), thorax=78, thigh=2, shin=-90, foot=-170, uarm=150, farm=-60, hand=-60, neck=64, mirar=-20), g_crunch_polea)
def g_hiper(J, sp):
    H = J['pelvis']; A = J['foot']
    s = base_plate(H[0] - 60, H[0] + 30) + tube([(H[0] - 2, H[1] + 10), (H[0] - 40, 258)], 4.6) + tube([(H[0] - 40, 230), (A[0], A[1] + 2)], 4)
    s += pad(H[0] + 4, H[1] + 5, 20, 8, svg_ang(sp['thigh']) + 90) + roller(A[0] + 2, A[1] + 6, 4.4)
    return s, ''
ex('Hiperextensiones', dict(hip=(150, 190), thorax=125, thigh=-55, shin=-55, foot=40, uarm=40, farm=40, neck=125), g_hiper)
ex('Extensión lumbar en máquina', dict(hip=(150, 190), thorax=125, thigh=-55, shin=-55, foot=40, uarm=40, farm=40, neck=125), g_hiper)
ex('Superman', dict(hip=(176, 250), thorax=97, thigh=-84, shin=-84, foot=-170, uarm=95, farm=95, neck=100), None)
ex('Elevación de piernas tumbado', dict(hip=(190, 251), thorax=-90, thigh=150, shin=150, foot=230, uarm=-80, farm=-90, neck=-92), None)
ex('Crunch inverso', dict(hip=(190, 250), thorax=-88, thigh=170, shin=95, foot=160, uarm=-80, farm=-90, neck=-92), None)
ex('Abdominales completos', dict(hip=(178, 250), thorax=-140, thigh=125, shin=30, foot=110, uarm=-170, farm=-130, neck=-150), None)
ex('Crunch con piernas elevadas', dict(hip=(190, 251), thorax=-110, thigh=180, shin=90, foot=180, uarm=-150, farm=-110, neck=-130), None)
ex('Dead bug', dict(hip=(190, 251), thorax=-90, thigh=178, shin=90, foot=180, uarm=-178, farm=-178, neck=-92), None)
ex('Hollow hold', dict(hip=(190, 251), thorax=-104, thigh=104, shin=104, foot=190, uarm=-120, farm=-120, neck=-115), None)
ex('Giros rusos', dict(hip=(176, 252), thorax=215, thigh=120, shin=55, foot=140, uarm=60, farm=110, neck=200), None)
ex('Navajas', dict(hip=(180, 252), thorax=-145, thigh=145, shin=145, foot=220, uarm=-150, farm=-150, neck=-150), None)
ex('Flexiones con rodillas apoyadas', dict(hip=(176, 220), thorax=106, thigh=-42, shin=-90, foot=-170, uarm=0, farm=0, hand=60, neck=108), None)
ex('Rueda abdominal', dict(hip=(176, 212), thorax=98, thigh=-30, shin=-90, foot=-170, uarm=62, farm=62, hand=62, neck=100), lambda J, sp: ('', '<circle cx="%s" cy="%s" r="8.5" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".7"/><circle cx="%s" cy="%s" r="2.2" fill="url(#curmpf_mt)"/>' % (f(J['grip'][0] + 1), f(253.5), f(J['grip'][0] + 1), f(253.5))))
ex('Pullover con mancuerna', dict(hip=(214, 214), thorax=-92, thigh=60, shin=0, uarm=-150, farm=-150, hand=-150, neck=-94), lambda J, sp: (bench(J['thorax'][0] - 36, J['thorax'][0] + 14, J['thorax'][1] + 9), ''), 'db')
ex('Press en suelo con mancuernas', dict(hip=(200, 251), thorax=-90, thigh=135, shin=30, foot=110, uarm=-180, farm=-180, hand=-180, neck=-92), None, 'db')
ex('Press en suelo con barra', dict(hip=(200, 251), thorax=-90, thigh=135, shin=30, foot=110, uarm=-180, farm=-180, hand=-180, neck=-92), lambda J, sp: ('', plate(J['grip'][0], J['grip'][1] - 1, 20)))
def g_banco_incl_prono(J, sp):
    H = J['pelvis']; N = J['neck']; tf = sp['thorax']
    bc = add(mid(H, N, .5), perp(tf, 9))
    return pad(bc[0], bc[1], 60, 8, svg_ang(tf)) + tube([(bc[0] - 10, bc[1] + 4), (bc[0] - 10, 258)], 4) + tube([(bc[0] + 20, bc[1] - 10), (bc[0] + 24, 258)], 4) + base_plate(bc[0] - 24, bc[0] + 36), ''
ex('Remo con mancuernas en banco inclinado', dict(hip=(140, 214), thorax=128, thigh=-60, shin=6, uarm=-30, farm=10, hand=10, neck=124), g_banco_incl_prono, 'db')
def g_remo_inv(J, sp):
    G = J['grip']; return post(G[0] - 24, G[1] - 20, 258) + tube([(G[0] - 30, G[1] - 1), (G[0] + 20, G[1] - 1)], 3.4) + base_plate(G[0] - 34, G[0] - 14), ''
ex('Remo invertido', dict(hip=(176, 226), thorax=-106, thigh=76, shin=76, foot=160, uarm=-168, farm=-168, hand=-168, neck=-106), g_remo_inv)
def g_remo_ergo(J, sp):
    H = J['pelvis']; TOE = J['toe']; G = J['grip']
    s = tube([(H[0] - 40, 252), (TOE[0] + 50, 252)], 4.6) + base_plate(H[0] - 46, H[0] - 26) + base_plate(TOE[0] + 30, TOE[0] + 56)
    s += pad(H[0], H[1] + 10, 22, 6) + '<rect x="%s" y="%s" width="8" height="22" rx="2" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6" transform="rotate(-25 %s %s)"/>' % (f(TOE[0] - 2), f(TOE[1] - 16), f(TOE[0]), f(TOE[1]))
    s += '<circle cx="%s" cy="232" r="16" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".8"/><circle cx="%s" cy="232" r="5" fill="url(#curmpf_mt)"/>' % (f(TOE[0] + 40), f(TOE[0] + 40))
    s += cable((TOE[0] + 30, 230), G)
    return s, handle(G[0], G[1], 90, 10)
ex('Máquina de remo', dict(hip=(140, 238), thorax=150, thigh=130, shin=30, foot=110, uarm=82, farm=90, hand=90, neck=150), g_remo_ergo)
ex('Fondos asistidos en máquina', dict(), None)    # marcador: usa la figura de fondos (no se dibuja)
del EX['Fondos asistidos en máquina']

_PRIMEROS = list(EX)
EJM = json.load(open('/home/claude/rig/ej.json'))
if __name__ == '__main__':
    names = sys.argv[1:] or list(EX)
    html = '<html><body style="margin:0;background:#101113;color:#ccc;font:11px sans-serif;display:grid;grid-template-columns:repeat(4,300px);gap:6px">'
    out = {}
    for n in names:
        sp, gear, obj, view = EX[n]
        T = pose_transforms(sp); J = joints(T)
        back, front = gear(J, sp) if gear else ('', '')
        s, T = build(sp, EJM.get(n, ''), GRADS + back, front, view or '30 40 320 232', obj, 'tmp')
        out[n] = s
        html += '<div><img width=300 height=230 style="background:#23262A;border-radius:8px" src="data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode() + '"><br>' + n + '</div>'
    open('/home/claude/rig/ex.html', 'w').write(html)
    print(len(out))
