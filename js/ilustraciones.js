/* Bermejo Accesible · Colección de ilustraciones propias (SVG, sin conexión)
   Cada ilustración tiene:
   - palabras: formas en minúscula y sin tildes que la activan
   - nombre: la idea que representa
   - descripcion: texto alternativo del dibujo
   Si una idea no está en esta lista, no se inventa ninguna imagen. */
(function () {
  'use strict';

  function rayos(cx, cy, r1, r2, n, color, ancho) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n;
      s += '<line x1="' + (cx + Math.cos(a) * r1).toFixed(1) + '" y1="' + (cy + Math.sin(a) * r1).toFixed(1) +
        '" x2="' + (cx + Math.cos(a) * r2).toFixed(1) + '" y2="' + (cy + Math.sin(a) * r2).toFixed(1) +
        '" stroke="' + color + '" stroke-width="' + ancho + '" stroke-linecap="round"/>';
    }
    return s;
  }

  var NUBE = 'M30 82h58a18 18 0 0 0 1-36a25 25 0 0 0-47-7a21 21 0 0 0-12 43z';

  var ILUSTRACIONES = [
    {
      id: 'agua', nombre: 'agua',
      palabras: ['agua', 'aguas', 'gota', 'gotas', 'gotitas'],
      descripcion: 'Dibujo de una gota de agua azul.',
      svg: '<path d="M60 12C60 12 26 52 26 76a34 34 0 0 0 68 0C94 52 60 12 60 12z" fill="#2b7bb9"/>' +
        '<path d="M42 78a18 18 0 0 0 16 18" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>'
    },
    {
      id: 'sol', nombre: 'sol',
      palabras: ['sol', 'soles', 'solar', 'soleado'],
      descripcion: 'Dibujo de un sol amarillo con rayos.',
      svg: rayos(60, 60, 34, 50, 10, '#d98200', 7) + '<circle cx="60" cy="60" r="25" fill="#f2b705" stroke="#d98200" stroke-width="4"/>'
    },
    {
      id: 'nube', nombre: 'nube',
      palabras: ['nube', 'nubes', 'nublado', 'nubosidad', 'condensacion', 'condensa'],
      descripcion: 'Dibujo de una nube gris clara.',
      svg: '<path d="' + NUBE + '" fill="#dde6ec" stroke="#5e6e78" stroke-width="4" stroke-linejoin="round"/>'
    },
    {
      id: 'lluvia', nombre: 'lluvia',
      palabras: ['lluvia', 'lluvias', 'llueve', 'llover', 'lloviznas', 'llovizna', 'precipitacion', 'precipitaciones'],
      descripcion: 'Dibujo de una nube con gotas de lluvia que caen.',
      svg: '<g transform="translate(0 -18)"><path d="' + NUBE + '" fill="#b8c7d2" stroke="#5e6e78" stroke-width="4" stroke-linejoin="round"/></g>' +
        '<g stroke="#2b7bb9" stroke-width="6" stroke-linecap="round"><line x1="40" y1="78" x2="34" y2="96"/><line x1="60" y1="78" x2="54" y2="104"/><line x1="80" y1="78" x2="74" y2="96"/></g>'
    },
    {
      id: 'vapor', nombre: 'evaporación',
      palabras: ['vapor', 'evaporacion', 'evapora', 'evaporan', 'evaporarse'],
      descripcion: 'Dibujo de líneas onduladas que suben desde el agua, como vapor.',
      svg: '<path d="M8 100q13-9 26 0t26 0t26 0t26 0" fill="none" stroke="#2b7bb9" stroke-width="7" stroke-linecap="round"/>' +
        '<g fill="none" stroke="#7fa7c0" stroke-width="6" stroke-linecap="round"><path d="M38 86q-9-10 0-20t0-20t0-20"/><path d="M60 86q-9-10 0-20t0-20t0-20"/><path d="M82 86q-9-10 0-20t0-20t0-20"/></g>'
    },
    {
      id: 'rio', nombre: 'río',
      palabras: ['rio', 'rios', 'arroyo', 'arroyos', 'riacho', 'riachos', 'laguna', 'lagunas', 'banado', 'banados', 'estero', 'esteros'],
      descripcion: 'Dibujo de un río azul que pasa entre dos orillas verdes.',
      svg: '<rect x="4" y="4" width="112" height="112" rx="16" fill="#cfe3c3"/>' +
        '<path d="M4 38C40 26 52 70 116 56V84C52 98 40 56 4 66z" fill="#2b7bb9"/>' +
        '<path d="M20 48q8-4 16 0M70 76q8-4 16 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      id: 'planta', nombre: 'planta',
      palabras: ['planta', 'plantas', 'raiz', 'raices', 'semilla', 'semillas', 'brote', 'brotes', 'vegetal', 'vegetales'],
      descripcion: 'Dibujo de una planta pequeña con dos hojas que crece en la tierra.',
      svg: '<rect x="10" y="90" width="100" height="22" rx="6" fill="#8a5a2b"/>' +
        '<path d="M60 92V46" stroke="#2c6234" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M60 66C40 66 30 52 32 38C48 38 60 50 60 66z" fill="#3e8e47"/>' +
        '<path d="M60 56C80 56 90 42 88 28C72 28 60 40 60 56z" fill="#3e8e47"/>'
    },
    {
      id: 'arbol', nombre: 'árbol',
      palabras: ['arbol', 'arboles', 'bosque', 'bosques', 'selva'],
      descripcion: 'Dibujo de un árbol con tronco marrón y copa verde.',
      svg: '<rect x="52" y="64" width="16" height="44" rx="4" fill="#7a4a22"/>' +
        '<circle cx="60" cy="44" r="30" fill="#2f7d3a"/><circle cx="36" cy="60" r="18" fill="#2f7d3a"/><circle cx="84" cy="60" r="18" fill="#2f7d3a"/>'
    },
    {
      id: 'ave', nombre: 'pájaro',
      palabras: ['ave', 'aves', 'pajaro', 'pajaros', 'pajarito', 'pajaritos'],
      descripcion: 'Dibujo de un pájaro rojo con pico amarillo.',
      svg: '<polygon points="30,66 8,54 12,82" fill="#a5302a"/>' +
        '<ellipse cx="56" cy="70" rx="30" ry="20" fill="#d0463b"/>' +
        '<circle cx="84" cy="50" r="15" fill="#d0463b"/>' +
        '<polygon points="97,46 112,51 97,56" fill="#f2b705"/>' +
        '<circle cx="88" cy="47" r="3.5" fill="#15222c"/>' +
        '<path d="M38 66q18-6 32 8q-18 8-32-8z" fill="#a5302a"/>' +
        '<g stroke="#7a4a22" stroke-width="4" stroke-linecap="round"><line x1="50" y1="89" x2="46" y2="104"/><line x1="64" y1="89" x2="66" y2="104"/></g>'
    },
    {
      id: 'pez', nombre: 'pez',
      palabras: ['pez', 'peces', 'pescado', 'pescados'],
      descripcion: 'Dibujo de un pez naranja.',
      svg: '<polygon points="84,60 112,40 112,80" fill="#d9731a"/>' +
        '<ellipse cx="54" cy="60" rx="36" ry="22" fill="#f28c28"/>' +
        '<circle cx="36" cy="55" r="4.5" fill="#15222c"/>' +
        '<path d="M58 44q10 16 0 32" fill="none" stroke="#d9731a" stroke-width="4"/>'
    },
    {
      id: 'planeta', nombre: 'planeta Tierra',
      palabras: ['planeta', 'planetas', 'mundo', 'globo terraqueo'],
      descripcion: 'Dibujo del planeta Tierra, azul con continentes verdes.',
      svg: '<circle cx="60" cy="60" r="44" fill="#2b7bb9"/>' +
        '<path d="M40 30c10-4 20 2 18 12s-14 8-16 18 6 16-2 22-18-8-20-20 10-28 20-32z" fill="#3e8e47"/>' +
        '<path d="M74 56c8-6 20-2 22 8s-6 20-14 22-12-6-12-14 0-12 4-16z" fill="#3e8e47"/>'
    },
    {
      id: 'suelo', nombre: 'suelo',
      palabras: ['suelo', 'suelos', 'subsuelo'],
      descripcion: 'Dibujo de capas de suelo: pasto arriba y tierra marrón con piedras abajo.',
      svg: '<rect x="8" y="26" width="104" height="14" fill="#3e8e47"/>' +
        '<rect x="8" y="40" width="104" height="34" fill="#8a5a2b"/>' +
        '<rect x="8" y="74" width="104" height="32" fill="#6b4421"/>' +
        '<g fill="#c9b8a0"><circle cx="30" cy="88" r="6"/><circle cx="72" cy="92" r="8"/><circle cx="96" cy="58" r="5"/><circle cx="46" cy="56" r="4"/></g>'
    },
    {
      id: 'temperatura', nombre: 'temperatura',
      palabras: ['temperatura', 'temperaturas', 'calor', 'caliente', 'calienta', 'calientan', 'frio', 'fria', 'frios', 'frias', 'enfria', 'enfrian', 'termometro'],
      descripcion: 'Dibujo de un termómetro con líquido rojo.',
      svg: '<rect x="50" y="12" width="20" height="78" rx="10" fill="#ffffff" stroke="#5e6e78" stroke-width="4"/>' +
        '<circle cx="60" cy="94" r="16" fill="#d0463b" stroke="#5e6e78" stroke-width="4"/>' +
        '<rect x="55" y="40" width="10" height="56" rx="5" fill="#d0463b"/>' +
        '<g stroke="#5e6e78" stroke-width="3"><line x1="72" y1="28" x2="82" y2="28"/><line x1="72" y1="44" x2="82" y2="44"/><line x1="72" y1="60" x2="82" y2="60"/><line x1="72" y1="76" x2="82" y2="76"/></g>'
    },
    {
      id: 'escuela', nombre: 'escuela',
      palabras: ['escuela', 'escuelas', 'aula', 'aulas', 'colegio', 'colegios', 'grado'],
      descripcion: 'Dibujo de un edificio escolar con techo rojo, puerta, ventanas y una bandera celeste y blanca.',
      svg: '<line x1="60" y1="30" x2="60" y2="6" stroke="#5e6e78" stroke-width="3"/>' +
        '<rect x="61" y="6" width="22" height="5" fill="#74acdf"/><rect x="61" y="11" width="22" height="5" fill="#ffffff" stroke="#c3ced4" stroke-width="0.5"/><rect x="61" y="16" width="22" height="5" fill="#74acdf"/>' +
        '<rect x="20" y="52" width="80" height="54" fill="#f4e3c1" stroke="#7a4a22" stroke-width="3"/>' +
        '<polygon points="12,54 60,28 108,54" fill="#b5462e"/>' +
        '<rect x="51" y="76" width="18" height="30" fill="#7a4a22"/>' +
        '<g fill="#74acdf" stroke="#7a4a22" stroke-width="2"><rect x="28" y="62" width="16" height="14"/><rect x="76" y="62" width="16" height="14"/><rect x="28" y="84" width="16" height="14"/><rect x="76" y="84" width="16" height="14"/></g>'
    },
    {
      id: 'libro', nombre: 'libro',
      palabras: ['libro', 'libros', 'lectura', 'lecturas', 'leer', 'cuaderno', 'cuadernos', 'manual'],
      descripcion: 'Dibujo de un libro abierto con renglones.',
      svg: '<path d="M60 34C46 24 26 24 12 28v64c14-4 34-4 48 6z" fill="#ffffff" stroke="#0d4a66" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M60 34c14-10 34-10 48-6v64c-14-4-34-4-48 6z" fill="#ffffff" stroke="#0d4a66" stroke-width="4" stroke-linejoin="round"/>' +
        '<g stroke="#7fa7c0" stroke-width="3" stroke-linecap="round"><line x1="22" y1="44" x2="50" y2="46"/><line x1="22" y1="56" x2="50" y2="58"/><line x1="22" y1="68" x2="50" y2="70"/><line x1="70" y1="46" x2="98" y2="44"/><line x1="70" y1="58" x2="98" y2="56"/><line x1="70" y1="70" x2="98" y2="68"/></g>'
    },
    {
      id: 'personas', nombre: 'personas',
      palabras: ['persona', 'personas', 'gente', 'familia', 'familias', 'comunidad', 'vecinos', 'estudiantes', 'alumnos', 'ninos', 'ninas'],
      descripcion: 'Dibujo de tres personas juntas.',
      svg: '<g fill="#0d4a66"><circle cx="30" cy="44" r="12"/><path d="M12 100c0-24 8-38 18-38s18 14 18 38z"/></g>' +
        '<g fill="#961a55"><circle cx="90" cy="44" r="12"/><path d="M72 100c0-24 8-38 18-38s18 14 18 38z"/></g>' +
        '<g fill="#2c6234"><circle cx="60" cy="36" r="14"/><path d="M38 104c0-28 10-44 22-44s22 16 22 44z"/></g>'
    },
    {
      id: 'casa', nombre: 'casa',
      palabras: ['casa', 'casas', 'hogar', 'hogares', 'vivienda', 'viviendas'],
      descripcion: 'Dibujo de una casa con techo rojo y puerta.',
      svg: '<rect x="26" y="56" width="68" height="50" fill="#f4e3c1" stroke="#7a4a22" stroke-width="3"/>' +
        '<polygon points="16,60 60,22 104,60" fill="#b5462e"/>' +
        '<rect x="52" y="78" width="18" height="28" fill="#7a4a22"/>' +
        '<rect x="32" y="66" width="14" height="14" fill="#74acdf" stroke="#7a4a22" stroke-width="2"/>'
    },
    {
      id: 'comida', nombre: 'comida',
      palabras: ['comida', 'comidas', 'alimento', 'alimentos', 'alimentacion', 'comer', 'almuerzo', 'cena'],
      descripcion: 'Dibujo de un plato con comida, un tenedor y un cuchillo.',
      svg: '<circle cx="60" cy="62" r="38" fill="#ffffff" stroke="#5e6e78" stroke-width="4"/>' +
        '<circle cx="60" cy="62" r="24" fill="#f2b705"/><circle cx="52" cy="56" r="7" fill="#3e8e47"/><circle cx="68" cy="68" r="7" fill="#d0463b"/>' +
        '<g stroke="#5e6e78" stroke-width="4" stroke-linecap="round"><line x1="10" y1="30" x2="10" y2="100"/><line x1="112" y1="30" x2="112" y2="100"/></g>'
    },
    {
      id: 'ojo', nombre: 'observar',
      palabras: ['observar', 'observa', 'observas', 'observen', 'mirar', 'mira', 'miren', 'mirando', 'ver', 'ves'],
      descripcion: 'Dibujo de un ojo abierto.',
      svg: '<path d="M8 60C28 30 92 30 112 60C92 90 28 90 8 60z" fill="#ffffff" stroke="#15222c" stroke-width="4"/>' +
        '<circle cx="60" cy="60" r="18" fill="#2c6234"/><circle cx="60" cy="60" r="8" fill="#15222c"/><circle cx="66" cy="54" r="4" fill="#ffffff"/>'
    },
    {
      id: 'escribir', nombre: 'escribir',
      palabras: ['escribir', 'escribi', 'escribe', 'escriban', 'escriba', 'lapiz', 'lapices', 'oracion', 'oraciones', 'redacta', 'redactar'],
      descripcion: 'Dibujo de un lápiz amarillo escribiendo sobre una línea.',
      svg: '<line x1="10" y1="104" x2="110" y2="104" stroke="#5e6e78" stroke-width="3"/>' +
        '<g transform="rotate(-45 60 60)"><rect x="24" y="50" width="62" height="20" fill="#f2b705" stroke="#7a4a22" stroke-width="3"/>' +
        '<rect x="86" y="50" width="12" height="20" fill="#e98fa9" stroke="#7a4a22" stroke-width="3"/>' +
        '<polygon points="24,50 6,60 24,70" fill="#f4e3c1" stroke="#7a4a22" stroke-width="3"/><polygon points="12,57 6,60 12,63" fill="#15222c"/></g>'
    },
    {
      id: 'reloj', nombre: 'reloj',
      palabras: ['hora', 'horas', 'reloj', 'minuto', 'minutos', 'horario'],
      descripcion: 'Dibujo de un reloj redondo con agujas.',
      svg: '<circle cx="60" cy="60" r="44" fill="#ffffff" stroke="#15222c" stroke-width="5"/>' +
        '<g stroke="#15222c" stroke-width="6" stroke-linecap="round"><line x1="60" y1="60" x2="60" y2="30"/><line x1="60" y1="60" x2="80" y2="72"/></g>' +
        '<circle cx="60" cy="60" r="5" fill="#15222c"/>'
    },
    {
      id: 'salud', nombre: 'salud',
      palabras: ['salud', 'saludable', 'saludables', 'corazon', 'corazones'],
      descripcion: 'Dibujo de un corazón rojo.',
      svg: '<path d="M60 102C20 74 10 56 10 40a24 24 0 0 1 50-12a24 24 0 0 1 50 12c0 16-10 34-50 62z" fill="#d0463b"/>'
    }
  ];

  /* La búsqueda es por palabra completa: «ver» no coincide con «verano». */

  function normalizar(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  var contador = 0;

  function contar(texto) {
    var palabras = normalizar(texto).match(/[a-zñ]+/g) || [];
    var conteo = {};
    palabras.forEach(function (p) { conteo[p] = (conteo[p] || 0) + 1; });
    return conteo;
  }

  /** Devuelve hasta `maximo` ilustraciones para un texto. Solo se consideran
      dibujos cuya palabra clave aparece en el propio texto (nunca se inventa
      un apoyo). Opciones para ordenar mejor:
      - titulo: título de la sección; suma puntos si también aparece ahí.
      - evitar: ids usados en el párrafo anterior; restan puntos para que
        no se repita siempre el mismo dibujo.
      - usos: cantidad de veces que ya se usó cada id. */
  function buscar(texto, maximo, opciones) {
    opciones = opciones || {};
    var conteo = contar(texto);
    var conteoTitulo = opciones.titulo ? contar(opciones.titulo) : {};
    var evitar = opciones.evitar || {};
    var usos = opciones.usos || {};
    var encontradas = [];
    ILUSTRACIONES.forEach(function (il, orden) {
      var total = 0; var primera = null; var enTitulo = 0;
      il.palabras.forEach(function (w) {
        if (conteo[w]) { total += conteo[w]; if (!primera) primera = w; }
        if (conteoTitulo[w]) enTitulo += 1;
      });
      if (total > 0) {
        var puntaje = total + 3 * enTitulo - (evitar[il.id] ? 2.5 : 0) - 0.75 * (usos[il.id] || 0);
        encontradas.push({ ilustracion: il, total: total, puntaje: puntaje, palabra: primera, orden: orden });
      }
    });
    encontradas.sort(function (a, b) { return b.puntaje - a.puntaje || a.orden - b.orden; });
    return encontradas.slice(0, maximo || 2);
  }

  /** Recupera cómo aparece la palabra en el texto original (con tildes). */
  function palabraOriginal(texto, normal) {
    var lista = texto.match(/[\p{L}]+/gu) || [];
    for (var i = 0; i < lista.length; i++) {
      if (normalizar(lista[i]) === normal) return lista[i].toLowerCase();
    }
    return normal;
  }

  /** Crea una figura accesible con el dibujo y su descripción. */
  function crearFigura(coincidencia, textoFuente) {
    contador += 1;
    var il = coincidencia.ilustracion;
    var idTitulo = 'il-t-' + contador;
    var fig = document.createElement('figure');
    fig.className = 'apoyo';
    fig.innerHTML =
      '<svg viewBox="0 0 120 120" role="img" aria-labelledby="' + idTitulo + '" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      '<title id="' + idTitulo + '">' + il.descripcion + '</title>' + il.svg + '</svg>';
    var cap = document.createElement('figcaption');
    var palabra = palabraOriginal(textoFuente, coincidencia.palabra);
    cap.textContent = 'Apoyo visual: ' + il.nombre + (normalizar(il.nombre) !== coincidencia.palabra ? ' (por la palabra «' + palabra + '»)' : '');
    fig.appendChild(cap);
    return fig;
  }

  window.Ilustraciones = { buscar: buscar, crearFigura: crearFigura, normalizar: normalizar, lista: ILUSTRACIONES };
})();
