"""Genera la fuente «Bermejo Mayúscula» a partir de DejaVu Sans.

Cada letra minúscula se dibuja con el glifo de su mayúscula (a→A, ñ→Ñ, á→Á…).
El texto de la página NO cambia: solo cambia cómo se ve. Así, los lectores de
pantalla, la búsqueda, el copiado y la lectura en voz alta reciben el texto
original con sus mayúsculas y minúsculas.

Uso: python3 _partes/fuente_mayuscula.py
Necesita fontTools y DejaVu Sans instalada (en Debian/Ubuntu: fonts-dejavu-core).
La licencia de DejaVu (Bitstream Vera) permite modificarla si se le cambia el nombre.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

raiz = Path(__file__).resolve().parent.parent
origenes = {
    'regular': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'negrita': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
}
# Latín básico, Latín-1 y signos tipográficos que usa el sitio.
rangos = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [
    0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x20AC, 0x2192, 0x2190, 0x2713, 0x00B7]

for peso, ruta in origenes.items():
    f = TTFont(ruta)
    opciones = subset.Options()
    opciones.layout_features = ['kern']        # sin ligaduras: evitan mezclar glifos
    opciones.name_IDs = ['*']
    opciones.notdef_outline = True
    sub = subset.Subsetter(opciones)
    # Se incluyen también las mayúsculas de cada minúscula para poder reasignarlas.
    sub.populate(unicodes=rangos)
    sub.subset(f)
    cmap_ref = f.getBestCmap()
    for tabla in f['cmap'].tables:
        if not tabla.isUnicode():
            continue
        for cp in list(tabla.cmap):
            car = chr(cp)
            may = car.upper()
            # Solo letras con una mayúscula de un único carácter (ß y similares quedan igual).
            if car != may and len(may) == 1 and ord(may) in cmap_ref:
                tabla.cmap[cp] = cmap_ref[ord(may)]
    nombre_familia = 'Bermejo Mayuscula'
    estilo = 'Regular' if peso == 'regular' else 'Bold'
    for rec in f['name'].names:
        if rec.nameID in (1, 16):
            rec.string = nombre_familia
        elif rec.nameID in (4,):
            rec.string = f'{nombre_familia} {estilo}'
        elif rec.nameID in (6,):
            rec.string = f'BermejoMayuscula-{estilo}'
        elif rec.nameID == 3:
            rec.string = f'Bermejo Accesible: {nombre_familia} {estilo}'
    f.flavor = 'woff'
    destino = raiz / 'fuentes' / f'bermejo-mayuscula-{peso}.woff'
    f.save(destino)
    print('ok', destino.name, destino.stat().st_size, 'bytes')
