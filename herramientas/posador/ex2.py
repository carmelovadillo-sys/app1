"""Segunda tanda: cardio, una pierna, cuadrupedia, cuerpo entero."""
from ex import *

def L(**k): return k   # atajo para el lado lejano

# ---------- material de cardio ----------
def treadmill(J, sp, incl=0):
    x0 = J['pelvis'][0] - 60; x1 = J['pelvis'][0] + 70
    s = ('<g transform="rotate(%s %s 255)">' % (f(-incl), f(x1))) + '<rect x="%s" y="250" width="%s" height="9" rx="4" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(x0), f(x1 - x0))
    s += '<rect x="%s" y="250.6" width="%s" height="1.6" rx=".8" fill="#0E1115"/><circle cx="%s" cy="254.5" r="3.4" fill="url(#curmpf_mt)"/><circle cx="%s" cy="254.5" r="3.4" fill="url(#curmpf_mt)"/></g>' % (f(x0 + 4), f(x1 - x0 - 8), f(x0 + 5), f(x1 - 5))
    s += tube([(x1 - 4, 252), (x1 + 6, 150)], 4.6) + tube([(x1 + 6, 150), (x1 - 18, 168)], 3.6)
    s += '<rect x="%s" y="138" width="22" height="13" rx="3" fill="url(#curmpf_pe)" stroke="#69717E" stroke-opacity=".6" stroke-width=".5" transform="rotate(-25 %s 144)"/>' % (f(x1 - 4), f(x1 + 6))
    return s, ''
def bike(J, sp, reclinada=False):
    H = J['pelvis']; G = J['grip']; TOE = J['toe']; F2 = sp.get('_crank', (H[0] + 30, 236))
    s = base_plate(H[0] - 30, H[0] + 70)
    s += tube([(H[0] - 6, H[1] + 12), (F2[0], F2[1]), (H[0] + 62, 258)], 5) + tube([(H[0] - 6, H[1] + 12), (H[0] - 22, 258)], 4.6)
    s += tube([(H[0] + 50, 220), (G[0] + 2, G[1] + 2)], 4.2)
    if reclinada:
        tf = sp['thorax']; N = J['neck']; bc = add(mid(H, N, .5), perp(tf, -9)); s += pad(bc[0], bc[1], 46, 9, svg_ang(tf)) + pad(H[0] + 2, H[1] + 10, 28, 8)
    else:
        s += pad(H[0] - 2, H[1] + 9, 22, 6, -4)
    s += '<circle cx="%s" cy="%s" r="9" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".8"/><circle cx="%s" cy="%s" r="2.6" fill="url(#curmpf_mt)"/>' % (f(F2[0]), f(F2[1]), f(F2[0]), f(F2[1]))
    s += '<circle cx="%s" cy="%s" r="20" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".9" opacity=".9"/>' % (f(H[0] + 58), f(232))
    return s, handle(G[0], G[1], 90, 9)
def stairs(J, sp):
    x = J['pelvis'][0] - 10; s = ''
    for i in range(4):
        s += '<rect x="%s" y="%s" width="30" height="7" rx="1.5" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(x + i * 16), f(252 - i * 15))
    s += tube([(x + 70, 258), (x + 80, 150)], 4.4) + tube([(x + 80, 150), (J['grip'][0], J['grip'][1] + 2)], 3.4)
    return s, ''
def stepbox(J, sp, h=22):
    T = J['toe']; return '<rect x="%s" y="%s" width="44" height="%s" rx="3" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(T[0] - 34), f(262 - h), f(h)), ''
def wall(x): return '<rect x="%s" y="40" width="10" height="223" fill="url(#curmpf_st)"/>' % f(x)
def rope_arc(J, sp):
    G = J['grip']; T = J['toe']
    return '<path d="M%s %s Q%s %s %s %s" fill="none" stroke="#1A1E24" stroke-width="2"/><path d="M%s %s Q%s %s %s %s" fill="none" stroke="#B3BAC4" stroke-width=".7"/>' % (f(G[0]), f(G[1]), f(G[0] - 70), f(300), f(G[0] - 4), f(G[1]), f(G[0]), f(G[1]), f(G[0] - 70), f(300), f(G[0] - 4), f(G[1])), ''
def battle(J, sp):
    G = J['grip']; d = 'M%s %s q15 -14 30 0 t30 0 t30 0 t24 6' % (f(G[0]), f(G[1]))
    return '', '<path d="%s" fill="none" stroke="#2A2F37" stroke-width="4.5" stroke-linecap="round"/><path d="%s" fill="none" stroke="#5A616D" stroke-width="1.4"/>' % (d, d)
def heavybag(J, sp):
    G = J['grip']; x = G[0] + 18
    return '<path d="M%s 40V70" stroke="#2A2F37" stroke-width="1.6"/><rect x="%s" y="70" width="34" height="120" rx="14" fill="url(#curmpf_pe)" stroke="#0E1115" stroke-width=".8"/>' % (f(x + 17), f(x)), ''
def sled(J, sp, pull=False):
    G = J['grip']
    if not pull:
        return tube([(G[0], G[1]), (G[0] + 16, 252)], 4) + '<rect x="%s" y="236" width="44" height="18" rx="3" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % f(G[0] + 4) + plate(G[0] + 26, 226, 13) + base_plate(G[0], G[0] + 52, 254, 4), ''
    return cable(G, (G[0] + 90, 248)) + '<rect x="%s" y="236" width="44" height="18" rx="3" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % f(G[0] + 80) + plate(G[0] + 102, 226, 13), ''
def ball(J, sp, r=11, dx=4, dy=0):
    G = J['grip']; return '', '<circle cx="%s" cy="%s" r="%s" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".8"/><path d="M%s %sq%s %s 0 %s" fill="none" stroke="#FFF" stroke-opacity=".12"/>' % (f(G[0] + dx), f(G[1] + dy), f(r), f(G[0] + dx - r * .3), f(G[1] + dy - r), f(r * .8), f(r), f(r * 2))
def fitball(cx, cy, r=18): return '<circle cx="%s" cy="%s" r="%s" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".8"/><circle cx="%s" cy="%s" r="%s" fill="none" stroke="#FFF" stroke-opacity=".08" stroke-width="3"/>' % (f(cx), f(cy), f(r), f(cx - 4), f(cy - 4), f(r * .6))
def trx(J, sp):
    G = J['grip']; return cable((G[0] + 40, 30), G), ''
def landmine(J, sp):
    G = J['grip']; p0 = (G[0] - 120, 258)
    return '<circle cx="%s" cy="257" r="3" fill="#3A404A"/>' % f(p0[0]) + tube([p0, (G[0] + 6, G[1] + 2)], 3), plate(G[0] + 10, G[1], 13)
def band(J, sp, anchor):
    G = J['grip']; return '<path d="M%s %sL%s %s" stroke="#D93A40" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>' % (f(anchor[0]), f(anchor[1]), f(G[0]), f(G[1])), ''

RUN = dict(hip=(178, 156), thorax=166, thigh=42, shin=-30, foot=62, uarm=-38, farm=72, far=L(thigh=-30, shin=-110, foot=-20, uarm=42, farm=110))
WALK = dict(hip=(178, 160), thorax=178, thigh=20, shin=10, foot=78, uarm=-18, farm=10, far=L(thigh=-18, shin=-28, foot=40, uarm=20, farm=40))
ex('Cinta de correr', dict(RUN, hip=(178, 150)), lambda J, sp: treadmill(J, sp))
ex('Caminar en cinta inclinada', dict(WALK, hip=(178, 151), thorax=172), lambda J, sp: treadmill(J, sp, 8))
ex('Cinta curva', dict(RUN, hip=(178, 150)), lambda J, sp: treadmill(J, sp))
ex('Carrera al aire libre', RUN)
ex('Series de sprint', dict(RUN, thorax=158, thigh=60, shin=-20, far=L(thigh=-38, shin=-120, foot=-30, uarm=60, farm=130)))
ex('Caminata', WALK)
BIKE = dict(hip=(160, 180), thorax=135, thigh=55, shin=10, foot=95, uarm=88, farm=88, hand=95, neck=140, far=L(thigh=100, shin=-10, foot=80))
ex('Bicicleta estática', BIKE, lambda J, sp: bike(J, sp))
ex('Bicicleta de spinning', dict(BIKE, thorax=125, neck=130), lambda J, sp: bike(J, sp))
ex('Bicicleta de aire', dict(BIKE, uarm=60, farm=80), lambda J, sp: bike(J, sp))
ex('Ciclismo', dict(BIKE, thorax=120, neck=125), lambda J, sp: bike(J, sp))
ex('Bicicleta reclinada', dict(hip=(150, 214), thorax=205, thigh=95, shin=60, foot=150, uarm=10, farm=60, hand=60, far=L(thigh=120, shin=30, foot=130), _crank=(205, 214)), lambda J, sp: bike(J, sp, True))
ELIP = dict(hip=(176, 150), thorax=176, thigh=18, shin=-6, foot=76, uarm=40, farm=120, hand=120, far=L(thigh=-14, shin=-20, foot=60, uarm=10, farm=80))
def eliptica(J, sp):
    x = J['pelvis'][0]; s = base_plate(x - 70, x + 70) + tube([(x - 60, 250), (x + 60, 250)], 5)
    s += '<rect x="%s" y="%s" width="24" height="5" rx="2" fill="url(#curmpf_st)"/>' % (f(J['toe'][0] - 20), f(J['toe'][1] + 1))
    s += tube([(x + 60, 252), (x + 50, 130)], 5) + tube([(x + 50, 140), (J['grip'][0], J['grip'][1])], 3.4)
    s += '<circle cx="%s" cy="236" r="16" fill="url(#curmpf_pl)" stroke="#0E1115" stroke-width=".8"/>' % f(x + 56)
    return s, ''
ex('Elíptica', dict(ELIP, hip=(176, 146)), eliptica)
STEP = dict(hip=(176, 150), thorax=168, thigh=62, shin=-14, foot=70, uarm=-10, farm=20, far=L(thigh=-4, shin=-4, foot=70, uarm=14, farm=40))
ex('Escaladora', dict(STEP, uarm=40, farm=90, hand=90), stairs)
ex('Máquina de escaleras', dict(STEP, uarm=40, farm=90, hand=90), stairs)
ex('Step aeróbico', dict(STEP, hip=(170, 155)), lambda J, sp: stepbox(J, sp, 16))
ex('Subidas al banco con mancuernas', dict(STEP, hip=(170, 146)), lambda J, sp: stepbox(J, sp, 26), 'db')
ex('Subidas al banco con barra', dict(STEP, hip=(170, 146), uarm=-150, farm=10, hand=10), lambda J, sp: (stepbox(J, sp, 26)[0] + plate(J['uarm'][0] - 6, J['uarm'][1] - 3, 20), ''))
ex('Ergómetro de esquí', dict(hip=(168, 165), thorax=135, thigh=-14, shin=18, uarm=40, farm=40, neck=140), lambda J, sp: (post(J['grip'][0] + 26, 50, 258) + base_plate(J['grip'][0] + 10, J['grip'][0] + 44) + cable((J['grip'][0] + 26, 60), J['grip']), handle(J['grip'][0], J['grip'][1], 0, 8)))
ex('Saltar a la comba', dict(hip=(178, 154), thorax=181, thigh=4, shin=-4, foot=30, uarm=-10, farm=60, hand=60), rope_arc)
ex('Dobles a la comba', dict(hip=(178, 140), thorax=178, thigh=24, shin=-30, foot=40, uarm=-10, farm=60, hand=60), rope_arc)
ex('Skipping', dict(hip=(178, 152), thorax=178, thigh=-2, shin=0, foot=40, uarm=-30, farm=80, far=L(thigh=95, shin=0, foot=100, uarm=40, farm=120)))
ex('Talones al glúteo', dict(hip=(178, 152), thorax=178, thigh=2, shin=0, foot=40, uarm=30, farm=110, far=L(thigh=-10, shin=-170, foot=-100, uarm=-30, farm=60)))
ex('Saltos con rodillas al pecho', dict(hip=(178, 120), thorax=170, thigh=110, shin=-10, foot=60, uarm=-40, farm=-10))
ex('Saltos de patinador', dict(hip=(176, 175), thorax=140, thigh=45, shin=-20, uarm=-40, farm=-20, neck=145, far=L(thigh=-45, shin=-60, foot=10, uarm=60, farm=80)))
ex('Cuerdas de batalla', dict(hip=(160, 186), thorax=155, thigh=60, shin=-20, uarm=60, farm=80, hand=90, neck=160), battle)
ex('Saco de boxeo', dict(hip=(170, 164), thorax=170, thigh=14, shin=-6, uarm=88, farm=88, hand=90, far=L(thigh=-14, shin=-10, uarm=30, farm=170, hand=170)), heavybag)
ex('Boxeo de sombra', dict(hip=(170, 164), thorax=170, thigh=14, shin=-6, uarm=88, farm=88, hand=90, far=L(thigh=-14, shin=-10, uarm=30, farm=170, hand=170)))
ex('Natación', dict(hip=(170, 200), thorax=94, thigh=-92, shin=-92, foot=-10, uarm=96, farm=96, neck=96, far=L(uarm=-60, farm=-60)), lambda J, sp: ('<path d="M40 196 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#5B8CFF" stroke-opacity=".5" stroke-width="1.4"/>', ''))

# ---------- una pierna / cuadrupedia ----------
QUAD = dict(hip=(176, 214), thorax=92, thigh=0, shin=-90, foot=-170, uarm=0, farm=0, hand=60, neck=96)
ex('Bird dog', dict(QUAD, uarm=96, farm=96, hand=96, far=L(thigh=-92, shin=-92, foot=-10, uarm=0, farm=0)))
ex('Patada de glúteo a cuatro patas', dict(QUAD, far=L(thigh=-150, shin=-60, foot=40)))
ex('Abducción a cuatro patas', dict(QUAD, far=L(thigh=-40, shin=-90, foot=-170)))
ex('Patada de glúteo en multipower', dict(QUAD, far=L(thigh=-150, shin=-60, foot=40)), lambda J, sp: ('', ''))
ex('Gateo de oso', dict(QUAD, hip=(176, 205), thigh=30, shin=-80, foot=-170, far=L(thigh=-20, shin=-70, uarm=10, farm=10)))
HIGHPLANK = dict(hip=(176, 214), thorax=104, thigh=-76, shin=-76, foot=-150, uarm=0, farm=0, hand=60, neck=106)
ex('Burpees', HIGHPLANK)
ex('Plancha con toque de hombro', dict(HIGHPLANK, far=L(uarm=40, farm=170, hand=170)))
ex('Plancha con subida a manos', dict(HIGHPLANK, uarm=0, farm=40, hand=40))
ex('Escaladores', dict(HIGHPLANK, thigh=60, shin=-40, foot=-120, far=L(thigh=-76, shin=-76, foot=-150)))
_x=('Rodillas al pecho en TRX', dict(HIGHPLANK, hip=(176, 200), thorax=110, thigh=60, shin=-90, foot=-160), lambda J, sp: (cable((J['toe'][0] - 10, 30), J['toe']), ''))
ex('Remo renegado', dict(HIGHPLANK, far=L(uarm=-40, farm=10)), None, 'db')
ex('Gusano', dict(hip=(176, 160), thorax=30, thigh=6, shin=0, uarm=-8, farm=0, hand=60, neck=20))
ex('Sentadilla pistol', dict(hip=(160, 216), thorax=135, thigh=82, shin=-30, uarm=92, farm=92, neck=140, far=L(thigh=92, shin=92, foot=170)))
ex('Peso muerto rumano a una pierna', dict(hip=(170, 160), thorax=96, thigh=4, shin=-4, uarm=4, farm=4, neck=92, far=L(thigh=-86, shin=-86, foot=-10)), None, 'db')
ex('Curl femoral de pie', dict(hip=(170, 160), thorax=178, thigh=0, shin=0, uarm=60, farm=80, far=L(thigh=-6, shin=-120, foot=-60)), lambda J, sp: (post(J['grip'][0] + 6, 120, 258) + base_plate(J['grip'][0] - 10, J['grip'][0] + 20) + stack(J['grip'][0] + 12, 210, 14, 48, 8), ''))
ex('Curl nórdico', dict(hip=(186, 216), thorax=140, thigh=-38, shin=-90, foot=-170, uarm=60, farm=80, neck=140), lambda J, sp: (roller(J['toe'][0] + 4, 248, 4.4), ''))
ex('Curl femoral con fitball', dict(hip=(176, 236), thorax=-110, thigh=72, shin=128, foot=200, uarm=-10, farm=-10, neck=-112), lambda J, sp: (fitball(J['toe'][0] + 12, 244), ''))
ex('Hip thrust a una pierna', dict(hip=(186, 222), thorax=-108, thigh=78, shin=-20, foot=70, uarm=-150, farm=-90, neck=-104, far=L(thigh=86, shin=86, foot=170)), lambda J, sp: (bench(J['thorax'][0] - 30, J['thorax'][0] + 6, 214, h=7), ''))
ex('Elevación de tibiales', dict(hip=(168, 160), thorax=183, thigh=6, shin=6, foot=110, uarm=0, farm=6), lambda J, sp: (wall(J['pelvis'][0] - 22), ''))
ex('Pull through en polea', dict(hip=(176, 168), thorax=118, thigh=-16, shin=16, uarm=-20, farm=-20, neck=112), lambda J, sp: (tower(J['pelvis'][0] - 110) + pulley(J['pelvis'][0] - 92, 248) + cable((J['pelvis'][0] - 92, 248), J['grip']), handle(J['grip'][0], J['grip'][1], 0, 8)))
ex('Saltos al cajón', dict(hip=(170, 188), thorax=140, thigh=80, shin=-20, uarm=-30, farm=-10, neck=145), lambda J, sp: ('<rect x="%s" y="%s" width="60" height="44" rx="3" fill="url(#curmpf_st)" stroke="#14171C" stroke-width=".6"/>' % (f(J['toe'][0] - 40), f(J['toe'][1] + 1)), ''))
ex('Salto de longitud', dict(hip=(178, 150), thorax=150, thigh=60, shin=-40, foot=40, uarm=-60, farm=-40, neck=155))
ex('Burpees con salto horizontal', dict(hip=(178, 150), thorax=150, thigh=60, shin=-40, foot=40, uarm=150, farm=160, neck=155))

# ---------- tren superior ----------
DECL = dict(hip=(200, 202), thorax=-74, thigh=110, shin=10, foot=90, uarm=-178, farm=-178, hand=-178, neck=-76)
def decline_bench(J, sp):
    H = J['pelvis']; N = J['neck']; tf = sp['thorax']; bc = add(mid(H, N, .5), perp(tf, 9)); bc = add(mid(H, N, .45), dirv(tf - 90), 9)
    return pad(bc[0], bc[1], 66, 8, svg_ang(tf)) + tube([(bc[0] - 14, bc[1] + 8), (bc[0] - 14, 258)], 4) + tube([(bc[0] + 26, bc[1] - 2), (bc[0] + 26, 258)], 4) + base_plate(bc[0] - 26, bc[0] + 38) + roller(J['shin'][0] + 2, J['shin'][1] + 6, 4), ''
ex('Press declinado con barra', DECL, lambda J, sp: (decline_bench(J, sp)[0], plate(J['grip'][0], J['grip'][1] - 1, 20)))
ex('Press declinado con mancuernas', DECL, decline_bench, 'db')
ex('Press declinado en multipower', DECL, lambda J, sp: (decline_bench(J, sp)[0] + post(J['grip'][0] - 30, 50, 258) + post(J['grip'][0] + 34, 50, 258), plate(J['grip'][0], J['grip'][1] - 1, 20)))
ex('Pullover en polea alta', dict(hip=(176, 166), thorax=135, thigh=-10, shin=14, uarm=130, farm=130, neck=140), lambda J, sp: (tower(J['grip'][0] + 30) + pulley(J['grip'][0] + 40, 52) + cable((J['grip'][0] + 40, 52), J['grip']), handle(J['grip'][0], J['grip'][1], 30, 12)))
ex('Press landmine', stand(thorax=172, uarm=120, farm=140, hand=140), landmine)
ex('Pino contra la pared', dict(hip=(180, 120), thorax=0, thigh=182, shin=182, foot=250, uarm=4, farm=4, hand=70, neck=-4, mirar=0), lambda J, sp: (wall(J['pelvis'][0] - 26), ''))
ex('Flexiones en pino', dict(hip=(180, 130), thorax=6, thigh=182, shin=182, foot=250, uarm=-30, farm=40, hand=70, neck=0), lambda J, sp: (wall(J['pelvis'][0] - 26), ''))
ex('Elevaciones en Y', stand(thorax=170, uarm=150, farm=150, hand=150), None, 'db')
ex('Rotación externa en polea', stand(uarm=2, farm=70, hand=70), lambda J, sp: (tower(J['grip'][0] + 34) + pulley(J['grip'][0] + 34, J['grip'][1]) + cable((J['grip'][0] + 34, J['grip'][1]), J['grip']), handle(J['grip'][0], J['grip'][1], 0, 7)))
ex('Rotación externa con banda', stand(uarm=2, farm=70, hand=70), lambda J, sp: band(J, sp, (J['grip'][0] + 50, J['grip'][1])))
_x=('Rotación externa con mancuerna', dict(hip=(200, 238), thorax=-92, thigh=60, shin=0, foot=80, uarm=-176, farm=-100, hand=-100, neck=-94), None, 'db')
ex('Curl inclinado con mancuernas', dict(hip=(160, 205), thorax=210, thigh=86, shin=8, uarm=-14, farm=40, hand=40, neck=205), lambda J, sp: (pad(*add(mid(J['pelvis'], J['neck'], .5), perp(sp['thorax'], -9)), 56, 8, svg_ang(sp['thorax'])) + pad(J['pelvis'][0] + 4, J['pelvis'][1] + 11, 32, 8) + tube([(J['pelvis'][0], J['pelvis'][1] + 15), (J['pelvis'][0], 258)], 4) + base_plate(J['pelvis'][0] - 24, J['pelvis'][0] + 24), ''), 'db')
ex('Curl araña', dict(hip=(140, 214), thorax=128, thigh=-60, shin=6, uarm=10, farm=130, hand=130, neck=124), g_banco_incl_prono, 'db')
ex('Curl de bíceps en TRX', dict(hip=(168, 200), thorax=210, thigh=40, shin=-20, uarm=110, farm=180, hand=180, neck=205), trx)
ex('Curl de muñeca con barra', dict(hip=(160, 205), thorax=135, thigh=88, shin=0, uarm=40, farm=92, hand=60, neck=130, mirar=-20), lambda J, sp: (bench(J['pelvis'][0] - 30, J['pelvis'][0] + 20, J['pelvis'][1] + 11), plate(J['grip'][0], J['grip'][1], 12)))
ex('Curl de muñeca con mancuernas', dict(hip=(160, 205), thorax=135, thigh=88, shin=0, uarm=40, farm=92, hand=60, neck=130, mirar=-20), lambda J, sp: (bench(J['pelvis'][0] - 30, J['pelvis'][0] + 20, J['pelvis'][1] + 11), ''), 'db')
ex('Curl de muñeca invertido', dict(hip=(160, 205), thorax=135, thigh=88, shin=0, uarm=40, farm=92, hand=120, neck=130, mirar=-20), lambda J, sp: (bench(J['pelvis'][0] - 30, J['pelvis'][0] + 20, J['pelvis'][1] + 11), plate(J['grip'][0], J['grip'][1], 12)))
ex('Rodillo de muñeca', stand(uarm=88, farm=88, hand=60), lambda J, sp: ('', tube([(J['grip'][0] - 3, J['grip'][1]), (J['grip'][0] + 6, J['grip'][1])], 3.4) + cable(J['grip'], (J['grip'][0], 238)) + plate(J['grip'][0], 246, 9)))
ex('Halo con kettlebell', stand(uarm=150, farm=-110, hand=-110), lambda J, sp: ('', kb(J['grip'][0] - 4, J['grip'][1] - 6, 6)))
ex('Levantamiento turco', dict(hip=(176, 214), thorax=160, thigh=80, shin=-90, foot=-170, uarm=178, farm=178, hand=178, neck=165, far=L(uarm=-10, farm=-10)), lambda J, sp: ('', kb(J['grip'][0], J['grip'][1] - 8, 6)))
ex('Arrancada con kettlebell', stand(uarm=178, farm=180, hand=180), lambda J, sp: ('', kb(J['grip'][0] - 2, J['grip'][1] - 6, 6)))
ex('Arrancada con mancuerna', stand(uarm=178, farm=180, hand=180), None, 'db')
ex('Cargada y press con kettlebell', stand(uarm=165, farm=180, hand=180), lambda J, sp: ('', kb(J['grip'][0] - 2, J['grip'][1] - 6, 6)))
ex('Cargada y press con mancuernas', stand(uarm=165, farm=180, hand=180), None, 'db')
ex('Cargada de potencia', dict(hip=(168, 176), thorax=168, thigh=30, shin=-20, uarm=95, farm=-150, hand=-150), g_squat_front)
ex('Lanzamiento de balón a la pared', dict(hip=(150, 214), thorax=150, thigh=82, shin=-30, uarm=60, farm=170, hand=170, neck=160), lambda J, sp: (wall(J['grip'][0] + 34)[0:0] + '<rect x="%s" y="40" width="10" height="223" fill="url(#curmpf_st)"/>' % f(J['grip'][0] + 40), ball(J, sp)[1]))
ex('Lanzamiento de balón al suelo', stand(uarm=176, farm=180, hand=180), lambda J, sp: ball(J, sp, 11, 0, -8))
ex('Empuje de trineo', dict(hip=(160, 180), thorax=125, thigh=60, shin=-20, foot=60, uarm=80, farm=90, neck=120, far=L(thigh=-30, shin=-60, foot=20)), sled)
ex('Arrastre de trineo', dict(hip=(176, 175), thorax=205, thigh=40, shin=-20, foot=60, uarm=70, farm=80, neck=200, far=L(thigh=-10, shin=-10)), lambda J, sp: sled(J, sp, True))
ex('Abdominales hipopresivos', stand(thorax=172, uarm=20, farm=40, hand=40))
ex('Crunch bicicleta', dict(hip=(190, 250), thorax=-112, thigh=150, shin=90, foot=180, uarm=-150, farm=-60, neck=-130, far=L(thigh=100, shin=100, foot=190)))
ex('Rotación de tronco en máquina', dict(hip=(164, 205), thorax=181, thigh=86, shin=8, uarm=60, farm=100), lambda J, sp: (pad(J['pelvis'][0] + 4, J['pelvis'][1] + 11, 34, 8) + tube([(J['pelvis'][0], J['pelvis'][1] + 15), (J['pelvis'][0], 258)], 4) + base_plate(J['pelvis'][0] - 24, J['pelvis'][0] + 24) + post(J['pelvis'][0] - 26, 90, 258) + stack(J['pelvis'][0] - 52, 210, 16, 48, 8), pad(J['farm'][0] + 4, J['farm'][1], 8, 20, 0)))

NUEVOS = [n for n in EX if n not in __import__('ex').__dict__.get('_PRIMEROS', [])]
if __name__ == '__main__':
    import ex as _e
    names = sys.argv[1:]
    html = '<html><body style="margin:0;background:#101113;color:#ccc;font:11px sans-serif;display:grid;grid-template-columns:repeat(6,200px);gap:6px">'
    for n in names:
        sp, gear, obj, view = EX[n]
        T = pose_transforms(sp); J = joints(T)
        back, front = gear(J, sp) if gear else ('', '')
        s, T = build(sp, EJM.get(n, ''), GRADS + back, front, view or '20 30 340 240', obj, 'tmp')
        html += '<div><img width=200 height=150 style="background:#23262A;border-radius:8px" src="data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode() + '"><br>' + n + '</div>'
    open('/home/claude/rig/ex.html', 'w').write(html)
