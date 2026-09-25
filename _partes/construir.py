"""Arma las páginas finales insertando la cabecera y el pie comunes."""
from pathlib import Path
raiz = Path(__file__).resolve().parent.parent
cab = (raiz/'_partes/cabecera.html').read_text(encoding='utf-8')
pie = (raiz/'_partes/pie.html').read_text(encoding='utf-8')
for nombre in ['index', 'material', 'docente', 'qom']:
    c = cab
    for clave, pag in [('ACT_INICIO','index'),('ACT_MATERIAL','material'),('ACT_DOCENTE','docente'),('ACT_QOM','qom')]:
        c = c.replace('{{%s}}' % clave, ' aria-current="page"' if pag == nombre else '')
    src = (raiz/f'_partes/{nombre}.src.html').read_text(encoding='utf-8')
    (raiz/f'{nombre}.html').write_text(src.replace('{{CABECERA}}', c).replace('{{PIE}}', pie), encoding='utf-8')
    print('ok', nombre)
