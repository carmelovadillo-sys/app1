# Posador de figuras (App 1%)

Genera `fotos.js` (dibujos estáticos de ejercicios) moviendo el muñeco de la animación del curl (`curlMancuernas_perfil.svg`) a posturas nuevas y dibujando el material en el mismo estilo.

- `rig.py`: el posador. Ángulos en grados: 0 = abajo, 90 = delante (derecha), 180 = arriba, -90 = atrás. `far=` mueve la pierna/brazo del otro lado.
- `equip.py`: bancos, máquinas, poleas, discos, kettlebell…
- `ex.py` y `ex2.py`: cada ejercicio (postura + material + objeto).
- `export.py`: encuadra cada dibujo y escribe `fotos.js` (con las piezas repetidas compartidas).

Uso: copiar `datos.js` a mano no hace falta; `ej.json` (músculos de cada ejercicio) se saca de `datos.js` con node. Rutas absolutas dentro de los scripts: ajustar si se cambia de carpeta.
