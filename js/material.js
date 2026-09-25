/* Bermejo Accesible · Recorrido «Acceder a mi material»
   - Extrae texto de PDF con PDF.js y de imágenes con Tesseract.js, en el navegador.
   - No guarda materiales: todo vive en memoria mientras la pestaña está abierta.
   - Las bibliotecas se descargan de jsDelivr solo cuando se necesitan. */
(function () {
  'use strict';

  /* ---------------- Configuración ---------------- */
  var PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  var TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var MAX_PAGINAS = 40;
  var MAX_PDF_MB = 40;
  var MAX_FOTO_MB = 25;
  var TITULO_BASE = 'Acceder a mi material | Bermejo Accesible';

  var EJEMPLO = [
    'El ciclo del agua',
    '',
    'El agua del planeta se mueve todo el tiempo. Pasa por el cielo, por el suelo y por los ríos. A este recorrido lo llamamos ciclo del agua.',
    '',
    '1. Evaporación',
    '',
    'El sol calienta el agua de los ríos, las lagunas y los bañados. El agua se transforma en vapor y sube.',
    '',
    '2. Condensación',
    '',
    'Arriba hace más frío. El vapor se enfría y forma gotas muy pequeñas. Muchas gotas juntas forman las nubes.',
    '',
    '3. Precipitación',
    '',
    'Cuando las gotas de las nubes pesan mucho, caen como lluvia. La lluvia llega al suelo, a los ríos y a los bañados.',
    '',
    '4. Escurrimiento e infiltración',
    '',
    'Una parte del agua corre por los arroyos hasta el río Paraguay. Otra parte entra en el suelo. Las plantas y los árboles toman esa agua con sus raíces.',
    '',
    'Para recordar',
    '',
    'El agua no se pierde: cambia de lugar y de estado. Cuidar los ríos y los bañados es cuidar el agua de las personas, las aves y los peces.',
    '',
    'Actividad',
    '',
    '- Mirá por la ventana de la escuela y observá el cielo.',
    '- Escribí una oración sobre lo que ves.',
    '- Dibujá el ciclo del agua en tu cuaderno.'
  ].join('\n');

  // Texto didáctico original para la demostración; no es una página oficial.
  var EJEMPLO_SOCIALES = [
    'Ciencias Sociales: el río Bermejo y El Colorado',
    '',
    'El Colorado es una localidad del sur de la provincia de Formosa. Está a orillas del río Bermejo. El río forma parte del paisaje y de la historia de la comunidad.',
    '',
    'El territorio que habitamos',
    '',
    'En Formosa hay pueblos, ciudades, caminos, ríos y bañados. Las personas viven y se trasladan por distintos lugares. Los árboles, las plantas, las aves y los peces también forman parte del ambiente.',
    '',
    'Para observar',
    '',
    '- Buscá la provincia de Formosa en un mapa de la Argentina.',
    '- Señalá El Colorado y el río Bermejo.',
    '- Nombrá un lugar de tu comunidad que conozcas.',
    '',
    'Para conversar',
    '',
    '¿Por qué es importante que todos podamos conocer el lugar donde vivimos?'
  ].join('\n');

  var NOMBRES_MODO = {
    lectura: 'Lectura ajustable',
    contraste: 'Alto contraste',
    voz: 'Lectura en voz alta',
    partes: 'Por partes',
    imagenes: 'Texto con imágenes',
    pictogramas: 'Texto con pictogramas'
  };

  /* ---------------- Utilidades ---------------- */
  function $(sel) { return document.querySelector(sel); }
  function crear(tag, clase, texto) {
    var el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto != null) el.textContent = texto;
    return el;
  }
  function normalizar(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

  var anuncio = $('#anuncio');
  function anunciar(msg) {
    anuncio.textContent = '';
    setTimeout(function () { anuncio.textContent = msg; }, 80);
  }

  function cargarScript(url, global) {
    if (window[global]) return Promise.resolve();
    return new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = function () { window[global] ? resolver() : rechazar(new Error('sin-global')); };
      s.onerror = function () { s.remove(); rechazar(new Error('sin-conexion')); };
      document.head.appendChild(s);
    });
  }

  /* ---------------- Estado ---------------- */
  var estado = {
    textoExtraido: '',
    origen: null,
    urls: [],
    worker: null,
    cancelado: false,
    procesando: false,
    confianzas: [],
    modo: 'lectura',
    bloques: []
  };

  var el = {
    pasoCargar: $('#paso-cargar'),
    pasoRevisar: $('#paso-revisar'),
    pasoLeer: $('#paso-leer'),
    tCargar: $('#t-cargar'),
    tRevisar: $('#t-revisar'),
    tLeer: $('#t-leer'),
    errores: $('#errores'),
    textoPegado: $('#texto-pegado'),
    archivoPdf: $('#archivo-pdf'),
    archivoFoto: $('#archivo-foto'),
    camaraFoto: $('#camara-foto'),
    progreso: $('#progreso'),
    progresoTexto: $('#progreso-texto'),
    barra: $('#barra'),
    cancelar: $('#cancelar'),
    editable: $('#texto-editable'),
    original: $('#original'),
    avisos: $('#avisos-calidad'),
    lectura: $('#lectura'),
    nombreModo: $('#nombre-modo')
  };

  var botonesCarga = ['#usar-texto', '#leer-pdf', '#leer-foto', '#usar-ejemplo'].map($);

  /* ---------------- Pasos ---------------- */
  function marcarPaso(n) {
    [1, 2, 3].forEach(function (i) {
      var li = $('#ind-' + i);
      li.removeAttribute('aria-current');
      li.classList.toggle('hecho', i < n);
      var extra = li.querySelector('.visualmente-oculto');
      if (extra) extra.remove();
      if (i < n) li.appendChild(crear('span', 'visualmente-oculto', ' (completo)'));
      if (i === n) li.setAttribute('aria-current', 'step');
    });
    var titulos = { 1: 'Paso 1: cargar', 2: 'Paso 2: revisar el texto', 3: 'Paso 3: elegir cómo leer' };
    document.title = titulos[n] + ' | ' + TITULO_BASE;
  }

  function enfocar(elemento) {
    elemento.focus({ preventScroll: true });
    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    elemento.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------- Errores ---------------- */
  function limpiarErrores() {
    el.errores.hidden = true;
    el.errores.innerHTML = '';
    el.errores.removeAttribute('role');
    el.errores.removeAttribute('aria-labelledby');
    document.querySelectorAll('[aria-invalid="true"]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
    document.querySelectorAll('.error-campo').forEach(function (p) { p.hidden = true; p.textContent = ''; });
  }

  function mostrarError(mensaje, campoId) {
    limpiarErrores();
    var h = crear('h2', null, 'No se pudo continuar');
    h.id = 'errores-titulo';
    el.errores.appendChild(h);
    el.errores.setAttribute('role', 'region');
    el.errores.setAttribute('aria-labelledby', 'errores-titulo');
    el.errores.appendChild(crear('p', null, mensaje));
    if (campoId) {
      var campo = document.getElementById(campoId);
      var errCampo = document.getElementById('error-' + campoId);
      if (campo) {
        campo.setAttribute('aria-invalid', 'true');
        if (errCampo) {
          errCampo.textContent = 'Error: ' + mensaje;
          errCampo.hidden = false;
          var descritos = (campo.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
          if (descritos.indexOf(errCampo.id) === -1) descritos.push(errCampo.id);
          campo.setAttribute('aria-describedby', descritos.join(' '));
        }
        var ir = crear('a', null, 'Ir al campo con el problema');
        ir.href = '#' + campoId;
        ir.addEventListener('click', function (e) { e.preventDefault(); enfocar(campo); });
        el.errores.appendChild(ir);
      }
    }
    el.errores.hidden = false;
    enfocar(el.errores);
  }

  /* ---------------- Progreso ---------------- */
  var ultimoAnuncio = { texto: '', hito: -1 };

  function iniciarProgreso(texto) {
    estado.cancelado = false;
    estado.procesando = true;
    estado.confianzas = [];
    ultimoAnuncio = { texto: '', hito: -1 };
    botonesCarga.forEach(function (b) { b.disabled = true; });
    el.progreso.hidden = false;
    el.barra.removeAttribute('value');
    el.progresoTexto.textContent = texto;
    anunciar(texto);
    el.cancelar.focus();
  }

  function actualizarProgreso(porcentaje, texto) {
    if (estado.cancelado) return;
    if (porcentaje == null) {
      el.barra.removeAttribute('value');
    } else {
      el.barra.value = Math.max(0, Math.min(100, porcentaje));
    }
    var visible = texto + (porcentaje != null ? ' (' + Math.round(porcentaje) + ' %)' : '');
    el.progresoTexto.textContent = visible;
    // Se anuncia solo cuando cambia la etapa o cada 25 %, para no saturar al lector de pantalla.
    var hito = porcentaje == null ? -1 : Math.floor(porcentaje / 25);
    if (texto !== ultimoAnuncio.texto || hito > ultimoAnuncio.hito) {
      ultimoAnuncio = { texto: texto, hito: hito };
      anunciar(visible);
    }
  }

  function terminarProgreso() {
    estado.procesando = false;
    el.progreso.hidden = true;
    botonesCarga.forEach(function (b) { b.disabled = false; });
  }

  el.cancelar.addEventListener('click', function () {
    estado.cancelado = true;
    if (estado.worker) {
      estado.worker.terminate();
      estado.worker = null;
    }
    terminarProgreso();
    anunciar('Se canceló la lectura del archivo.');
    enfocar(el.tCargar);
  });

  /* ---------------- OCR con Tesseract.js ---------------- */
  var contextoOCR = { base: 0, total: 1, etiqueta: 'Reconociendo el texto' };

  function registroOCR(m) {
    var etapas = {
      'loading tesseract core': 'Preparando el lector de texto',
      'initializing tesseract': 'Preparando el lector de texto',
      'initialized tesseract': 'Preparando el lector de texto',
      'loading language traineddata': 'Descargando el idioma español (solo la primera vez)',
      'loading language traineddata (from cache)': 'Preparando el idioma español',
      'initializing api': 'Preparando el lector de texto',
      'initialized api': 'Preparando el lector de texto',
      'recognizing text': contextoOCR.etiqueta
    };
    var texto = etapas[m.status] || 'Procesando';
    var pct = null;
    if (m.status === 'recognizing text') {
      pct = ((contextoOCR.base + (m.progress || 0)) / contextoOCR.total) * 100;
    }
    actualizarProgreso(pct, texto);
  }

  function obtenerWorker() {
    if (estado.worker) return Promise.resolve(estado.worker);
    return cargarScript(TESSERACT_URL, 'Tesseract').then(function () {
      return window.Tesseract.createWorker('spa', 1, { logger: registroOCR });
    }).then(function (w) {
      if (estado.cancelado) { w.terminate(); throw new Error('cancelado'); }
      estado.worker = w;
      return w;
    });
  }

  function reconocer(fuente, etiqueta, base, total) {
    contextoOCR = { base: base || 0, total: total || 1, etiqueta: etiqueta };
    return obtenerWorker().then(function (w) {
      return w.recognize(fuente);
    }).then(function (res) {
      if (typeof res.data.confidence === 'number') estado.confianzas.push(res.data.confidence);
      return res.data.text || '';
    });
  }

  function liberarWorker() {
    if (estado.worker) {
      estado.worker.terminate();
      estado.worker = null;
    }
  }

  /* ---------------- PDF con PDF.js ---------------- */
  function textoDePagina(contenido) {
    var lineas = [];
    var linea = null;
    contenido.items.forEach(function (it) {
      if (typeof it.str !== 'string') return;
      var y = it.transform[5];
      var alto = Math.abs(it.transform[3]) || it.height || 10;
      if (!linea || Math.abs(y - linea.y) > alto * 0.45) {
        if (linea) lineas.push(linea);
        linea = { y: y, alto: alto, texto: '' };
      }
      linea.texto += it.str;
      linea.alto = Math.max(linea.alto, alto);
      if (it.hasEOL) { lineas.push(linea); linea = null; }
    });
    if (linea) lineas.push(linea);
    var utiles = lineas.filter(function (l) { return l.texto.trim(); });
    var salida = '';
    utiles.forEach(function (l, i) {
      if (i > 0) {
        var salto = utiles[i - 1].y - l.y;
        var referencia = Math.min(utiles[i - 1].alto, l.alto);
        salida += (salto > referencia * 1.75 || salto < 0) ? '\n\n' : '\n';
      }
      salida += l.texto.replace(/\s+/g, ' ').trim();
    });
    return salida;
  }

  function renderizarPagina(pagina) {
    var escala = 2;
    var vista = pagina.getViewport({ scale: escala });
    var lado = Math.max(vista.width, vista.height);
    if (lado > 2600) vista = pagina.getViewport({ scale: escala * (2600 / lado) });
    var lienzo = document.createElement('canvas');
    lienzo.width = Math.floor(vista.width);
    lienzo.height = Math.floor(vista.height);
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    return pagina.render({ canvasContext: ctx, viewport: vista }).promise.then(function () { return lienzo; });
  }

  async function extraerPDF(archivo) {
    var datos = new Uint8Array(await archivo.arrayBuffer());
    var pdf = await window.pdfjsLib.getDocument({ data: datos }).promise;
    var total = pdf.numPages;
    var limite = Math.min(total, MAX_PAGINAS);
    var partes = [];
    var escaneadas = 0;
    for (var n = 1; n <= limite; n++) {
      if (estado.cancelado) throw new Error('cancelado');
      actualizarProgreso(((n - 1) / limite) * 100, 'Leyendo la página ' + n + ' de ' + limite);
      var pagina = await pdf.getPage(n);
      var texto = textoDePagina(await pagina.getTextContent());
      if (texto.replace(/\s/g, '').length < 20) {
        escaneadas += 1;
        var lienzo = await renderizarPagina(pagina);
        if (estado.cancelado) throw new Error('cancelado');
        texto = await reconocer(lienzo, 'Página ' + n + ' de ' + limite + ': reconociendo texto de la imagen', n - 1, limite);
      }
      if (texto.trim()) partes.push(texto.trim());
      pagina.cleanup();
    }
    pdf.destroy();
    return { texto: partes.join('\n\n'), total: total, limite: limite, escaneadas: escaneadas };
  }

  /* ---------------- Imágenes ---------------- */
  function cargarImagen(url) {
    return new Promise(function (resolver, rechazar) {
      var img = new Image();
      img.onload = function () { resolver(img); };
      img.onerror = function () { rechazar(new Error('imagen')); };
      img.src = url;
    });
  }

  function prepararImagen(img) {
    var ancho = img.naturalWidth;
    var alto = img.naturalHeight;
    var lado = Math.max(ancho, alto);
    var escala = 1;
    if (lado > 2400) escala = 2400 / lado;
    else if (lado < 1200) escala = Math.min(2, 1200 / lado);
    var lienzo = document.createElement('canvas');
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    return lienzo;
  }

  /* ---------------- Limpieza y análisis del texto ---------------- */
  function limpiarTexto(t) {
    return t
      .replace(/\r\n?/g, '\n')
      .replace(/\u00ad/g, '')
      .replace(/\ufb01/g, 'fi').replace(/\ufb02/g, 'fl')
      .replace(/[ \t\u00a0]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function unirLineas(lineas) {
    return lineas.reduce(function (acc, l) {
      if (!acc) return l;
      if (/\p{L}-$/u.test(acc) && /^\p{Ll}/u.test(l)) return acc.slice(0, -1) + l;
      return acc + ' ' + l;
    }, '');
  }

  var RE_ITEM = /^(?:[-•*·●▪–]|\(?\d{1,2}[.)])\s+(.+)$/;

  function esTitulo(l, unica, siguiente) {
    if (l.length > 80) return false;
    if (/[.,;]$/.test(l)) return false;
    if (/^[-•*·●▪–]\s/.test(l)) return false;
    var palabras = l.split(/\s+/).length;
    if (palabras > 12) return false;
    var numerado = /^\d{1,2}[.)]\s+\p{Lu}/u.test(l);
    var mayusculas = l === l.toLocaleUpperCase('es') && /\p{L}{3}/u.test(l);
    if (numerado || mayusculas) return true;
    if (unica) return /^[\p{Lu}«"]/u.test(l) && !/[?!:]$/.test(l);
    return l.length <= 45 && palabras <= 7 && /^\p{Lu}/u.test(l) && !/[?!:]$/.test(l) &&
      !!siguiente && /^[\p{Lu}¿¡«"\d-]/u.test(siguiente);
  }

  function analizar(texto) {
    var bloques = [];
    limpiarTexto(texto).split(/\n\s*\n/).forEach(function (trozo) {
      var lineas = trozo.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lineas.length) return;
      var parrafo = [];
      var lista = null;
      function cerrarParrafo() {
        if (parrafo.length) { bloques.push({ tipo: 'parrafo', texto: unirLineas(parrafo) }); parrafo = []; }
      }
      function cerrarLista() {
        if (lista) { bloques.push({ tipo: 'lista', items: lista.items, ordenada: lista.ordenada }); lista = null; }
      }
      lineas.forEach(function (l, i) {
        if (!parrafo.length && !lista && esTitulo(l, lineas.length === 1, lineas[i + 1])) {
          bloques.push({ tipo: 'titulo', texto: l });
          return;
        }
        var m = l.match(RE_ITEM);
        if (m) {
          cerrarParrafo();
          var ordenada = /^\(?\d/.test(l);
          if (lista && lista.ordenada !== ordenada) cerrarLista();
          if (!lista) lista = { items: [], ordenada: ordenada };
          lista.items.push(m[1]);
          return;
        }
        if (lista && /^\p{Ll}/u.test(l)) {
          lista.items[lista.items.length - 1] = unirLineas([lista.items[lista.items.length - 1], l]);
          return;
        }
        cerrarLista();
        parrafo.push(l);
      });
      cerrarParrafo();
      cerrarLista();
    });
    // Une listas consecutivas del mismo tipo: en los PDF, cada viñeta
    // suele quedar separada de la siguiente por una línea en blanco.
    var unidos = [];
    bloques.forEach(function (b) {
      var previo = unidos[unidos.length - 1];
      if (b.tipo === 'lista' && previo && previo.tipo === 'lista' && previo.ordenada === b.ordenada) {
        previo.items = previo.items.concat(b.items);
      } else {
        unidos.push(b);
      }
    });
    return unidos;
  }

  function textoDeBloque(b) {
    if (b.tipo === 'lista') return b.items.join('. ');
    return b.texto;
  }

  function crearBloque(b, i) {
    var nodo;
    if (b.tipo === 'titulo') {
      nodo = crear('h4', null, b.texto);
    } else if (b.tipo === 'lista') {
      nodo = document.createElement(b.ordenada ? 'ol' : 'ul');
      b.items.forEach(function (t) { nodo.appendChild(crear('li', null, t)); });
    } else {
      nodo = crear('p', null, b.texto);
    }
    nodo.classList.add('bloque');
    nodo.dataset.indice = String(i);
    return nodo;
  }

  /* ---------------- Paso 1: carga ---------------- */
  $('#usar-ejemplo').addEventListener('click', function () {
    limpiarErrores();
    estado.origen = { tipo: 'ejemplo', nombre: 'Ejemplo: El ciclo del agua', textoOriginal: EJEMPLO };
    mostrarRevision(EJEMPLO, []);
  });

  $('#usar-sociales').addEventListener('click', function () {
    limpiarErrores();
    estado.origen = { tipo: 'ejemplo', nombre: 'Ejemplo de Sociales: El Colorado y el río Bermejo', textoOriginal: EJEMPLO_SOCIALES };
    mostrarRevision(EJEMPLO_SOCIALES, []);
  });

  $('#usar-texto').addEventListener('click', function () {
    var texto = el.textoPegado.value;
    if (!texto.trim()) {
      mostrarError('El cuadro de texto está vacío. Pegá o escribí el texto de tu material.', 'texto-pegado');
      return;
    }
    limpiarErrores();
    estado.origen = { tipo: 'texto', nombre: 'Texto pegado', textoOriginal: texto };
    mostrarRevision(texto, []);
  });

  // Reutiliza el mismo recorrido de corrección y lectura para transcripciones.
  window.BermejoCargarTranscripcion = function (texto, nombre, enlace) {
    if (!texto.trim()) return;
    limpiarErrores();
    estado.origen = { tipo: 'video', nombre: nombre, textoOriginal: texto, enlace: enlace || '' };
    mostrarRevision(texto, ['Los subtítulos y las descripciones pueden contener errores. Revisalos antes de seguir.']);
  };

  $('#leer-pdf').addEventListener('click', async function () {
    var archivo = el.archivoPdf.files[0];
    if (!archivo) {
      mostrarError('Todavía no elegiste un archivo PDF. Usá el botón para elegir un archivo.', 'archivo-pdf');
      return;
    }
    if (!(archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name))) {
      mostrarError('El archivo «' + archivo.name + '» no es un PDF. Si es una foto, usá la opción «Foto de tu material».', 'archivo-pdf');
      return;
    }
    if (archivo.size > MAX_PDF_MB * 1024 * 1024) {
      mostrarError('El PDF pesa más de ' + MAX_PDF_MB + ' MB. Probá con un archivo más chico o dividilo en partes.', 'archivo-pdf');
      return;
    }
    limpiarErrores();
    iniciarProgreso('Preparando la lectura del PDF');
    try {
      await cargarScript(PDFJS_URL, 'pdfjsLib');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    } catch (e) {
      terminarProgreso();
      mostrarError('No se pudo descargar la herramienta que lee PDF. Revisá tu conexión a internet y volvé a intentar. Tu archivo no se envía a ningún lado.', 'archivo-pdf');
      return;
    }
    try {
      var r = await extraerPDF(archivo);
      liberarWorker();
      if (estado.cancelado) return;
      terminarProgreso();
      if (!r.texto.trim()) {
        mostrarError('No encontramos texto en este PDF. Si tiene fotos de páginas, probá sacarles una foto más nítida y subirla en «Foto de tu material».', 'archivo-pdf');
        return;
      }
      var avisos = [];
      if (r.limite < r.total) avisos.push('Se leyeron las primeras ' + r.limite + ' páginas de ' + r.total + '. Para leer el resto, dividí el PDF.');
      if (r.escaneadas) avisos.push(r.escaneadas === 1 ? 'Una página era una imagen y se leyó con reconocimiento de texto. Revisala con atención.' : r.escaneadas + ' páginas eran imágenes y se leyeron con reconocimiento de texto. Revisalas con atención.');
      agregarAvisoConfianza(avisos);
      var url = URL.createObjectURL(archivo);
      estado.urls.push(url);
      estado.origen = { tipo: 'pdf', nombre: archivo.name, url: url, paginas: r.total };
      mostrarRevision(r.texto, avisos);
    } catch (e) {
      liberarWorker();
      if (estado.cancelado) return;
      terminarProgreso();
      if (e && e.name === 'PasswordException') {
        mostrarError('Este PDF tiene contraseña y no se puede abrir. Pedí una versión sin contraseña.', 'archivo-pdf');
      } else if (e && e.message === 'sin-conexion') {
        mostrarError('No se pudo descargar la herramienta que reconoce texto en imágenes. Revisá tu conexión a internet y volvé a intentar.', 'archivo-pdf');
      } else {
        mostrarError('No se pudo leer este PDF. Puede estar dañado. Probá abrirlo y guardarlo de nuevo, o sacale una foto a cada página.', 'archivo-pdf');
      }
    }
  });

  var ultimaFoto = null;
  el.archivoFoto.addEventListener('change', function () { if (el.archivoFoto.files[0]) ultimaFoto = el.archivoFoto.files[0]; });
  el.camaraFoto.addEventListener('change', function () { if (el.camaraFoto.files[0]) ultimaFoto = el.camaraFoto.files[0]; });

  $('#leer-foto').addEventListener('click', async function () {
    var archivo = ultimaFoto || el.archivoFoto.files[0] || el.camaraFoto.files[0];
    if (!archivo) {
      mostrarError('Todavía no elegiste ni sacaste una foto. Usá una de las dos opciones de arriba.', 'archivo-foto');
      return;
    }
    if (/heic|heif/i.test(archivo.type) || /\.(heic|heif)$/i.test(archivo.name)) {
      mostrarError('La foto está en formato HEIC, que la mayoría de los navegadores no puede leer. Guardala como JPG o PNG y volvé a subirla.', 'archivo-foto');
      return;
    }
    if (archivo.type && archivo.type.indexOf('image/') !== 0) {
      mostrarError('El archivo «' + archivo.name + '» no es una imagen. Si es un PDF, usá la opción «Subir un PDF».', 'archivo-foto');
      return;
    }
    if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
      mostrarError('La foto pesa más de ' + MAX_FOTO_MB + ' MB. Probá con una foto de menor tamaño.', 'archivo-foto');
      return;
    }
    limpiarErrores();
    iniciarProgreso('Abriendo la foto');
    var url = URL.createObjectURL(archivo);
    var img;
    try {
      img = await cargarImagen(url);
    } catch (e) {
      URL.revokeObjectURL(url);
      terminarProgreso();
      mostrarError('El navegador no pudo abrir esta imagen. Guardala como JPG o PNG y volvé a intentar.', 'archivo-foto');
      return;
    }
    try {
      var texto = await reconocer(prepararImagen(img), 'Reconociendo el texto de la foto', 0, 1);
      liberarWorker();
      if (estado.cancelado) { URL.revokeObjectURL(url); return; }
      terminarProgreso();
      if (texto.replace(/\s/g, '').length < 3) {
        URL.revokeObjectURL(url);
        mostrarError('No encontramos texto en la foto. Probá con más luz, la hoja derecha y más cerca, sin cortar los bordes.', 'archivo-foto');
        return;
      }
      var avisos = [];
      agregarAvisoConfianza(avisos);
      estado.urls.push(url);
      estado.origen = { tipo: 'foto', nombre: archivo.name || 'Foto', url: url };
      mostrarRevision(texto, avisos);
    } catch (e) {
      liberarWorker();
      URL.revokeObjectURL(url);
      if (estado.cancelado) return;
      terminarProgreso();
      if (e && e.message === 'sin-conexion') {
        mostrarError('No se pudo descargar la herramienta que reconoce texto. Revisá tu conexión a internet y volvé a intentar. Tu foto no se envía a ningún lado.', 'archivo-foto');
      } else {
        mostrarError('No se pudo reconocer el texto de la foto. Volvé a intentar con otra foto.', 'archivo-foto');
      }
    }
  });

  function agregarAvisoConfianza(avisos) {
    if (!estado.confianzas.length) return;
    var prom = estado.confianzas.reduce(function (a, b) { return a + b; }, 0) / estado.confianzas.length;
    if (prom < 75) {
      avisos.push('La lectura automática tuvo dudas (confianza aproximada: ' + Math.round(prom) + ' %). Compará con el original y corregí palabras y números.');
    }
  }

  /* ---------------- Paso 2: revisión ---------------- */
  function mostrarRevision(texto, avisos) {
    detenerVoz();
    var limpio = limpiarTexto(texto);
    estado.textoExtraido = limpio;
    el.editable.value = limpio;

    el.avisos.innerHTML = '';
    var lista = avisos.slice();
    lista.unshift('La lectura automática puede equivocarse. Revisá el texto antes de seguir.');
    var caja = crear('div', 'aviso');
    var p = crear('p');
    p.appendChild(crear('strong', null, 'Para tener en cuenta: '));
    p.appendChild(document.createTextNode(lista[0]));
    caja.appendChild(p);
    if (lista.length > 1) {
      var ul = document.createElement('ul');
      lista.slice(1).forEach(function (a) { ul.appendChild(crear('li', null, a)); });
      caja.appendChild(ul);
    }
    el.avisos.appendChild(caja);

    mostrarOriginal();
    el.pasoCargar.hidden = true;
    el.pasoLeer.hidden = true;
    el.pasoRevisar.hidden = false;
    marcarPaso(2);
    enfocar(el.tRevisar);
  }

  function mostrarOriginal() {
    var o = estado.origen;
    el.original.innerHTML = '';
    if (!o) return;
    if (o.tipo === 'pdf') {
      var pArchivo = crear('p', null, 'Archivo: ');
      pArchivo.appendChild(crear('span', 'literal', o.nombre));
      pArchivo.appendChild(document.createTextNode(' (' + o.paginas + (o.paginas === 1 ? ' página' : ' páginas') + ').'));
      el.original.appendChild(pArchivo);
      var a = crear('a', null, 'Abrir el PDF original (se abre en otra pestaña)');
      a.href = o.url; a.target = '_blank'; a.rel = 'noopener';
      el.original.appendChild(a);
    } else if (o.tipo === 'foto') {
      var img = document.createElement('img');
      img.src = o.url;
      img.alt = 'Foto original de tu material. El texto reconocido está en el cuadro para corregir.';
      el.original.appendChild(img);
      var a2 = crear('a', null, 'Ver la foto en tamaño completo (se abre en otra pestaña)');
      a2.href = o.url; a2.target = '_blank'; a2.rel = 'noopener';
      el.original.appendChild(a2);
    } else {
      el.original.appendChild(crear('p', null, o.tipo === 'ejemplo' ? 'Estás usando el texto de ejemplo.' :
        o.tipo === 'video' ? 'Transcripción del video «' + o.nombre + '», sin cambios:' : 'Tu texto pegado, sin cambios:'));
      var det = document.createElement('details');
      det.appendChild(crear('summary', null, 'Ver el texto original'));
      det.appendChild(crear('div', 'original__texto', o.textoOriginal));
      el.original.appendChild(det);
      if (o.enlace) {
        var enlace = crear('a', null, 'Abrir el video original en YouTube (otra pestaña)');
        enlace.href = o.enlace;
        enlace.target = '_blank';
        enlace.rel = 'noopener noreferrer';
        el.original.appendChild(enlace);
      }
      if (o.tipo === 'ejemplo') {
        var sociales = o.nombre.indexOf('Sociales') !== -1;
        var pe = crear('p', null, 'También podés probar el mismo ejemplo como ');
        var a3 = crear('a', null, sociales ? 'texto (.txt)' : 'PDF');
        a3.href = sociales ? 'ejemplos/sociales-bermejo.txt' : 'ejemplos/ciclo-del-agua.pdf';
        a3.setAttribute('download', '');
        var a4 = crear('a', null, 'imagen');
        a4.href = sociales ? 'ejemplos/sociales-bermejo-cuaderno.png' : 'ejemplos/ciclo-del-agua-foto.png';
        a4.setAttribute('download', '');
        pe.appendChild(a3); pe.appendChild(document.createTextNode(' o como ')); pe.appendChild(a4); pe.appendChild(document.createTextNode('.'));
        el.original.appendChild(pe);
      }
    }
  }

  $('#restaurar').addEventListener('click', function () {
    el.editable.value = estado.textoExtraido;
    anunciar('Se recuperó el texto extraído. Se perdieron las correcciones.');
    programarRender();
  });


  $('#descargar-txt').addEventListener('click', function () {
    var blob = new Blob([el.editable.value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mi-material.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    anunciar('Se descargó el archivo mi-material.txt.');
  });

  $('#ir-a-leer').addEventListener('click', function () {
    if (!el.editable.value.trim()) {
      mostrarError('El texto quedó vacío. Escribí algo o tocá «Volver al texto extraído».', 'texto-editable');
      return;
    }
    limpiarErrores();
    el.pasoLeer.hidden = false;
    marcarPaso(3);
    renderizar();
    enfocar(el.tLeer);
  });

  function otroMaterial() {
    detenerVoz();
    cancelarPictos();
    estado.urls.forEach(function (u) { URL.revokeObjectURL(u); });
    estado.urls = [];
    estado.origen = null;
    estado.textoExtraido = '';
    el.editable.value = '';
    el.lectura.innerHTML = '';
    el.archivoPdf.value = '';
    el.archivoFoto.value = '';
    el.camaraFoto.value = '';
    ultimaFoto = null;
    limpiarErrores();
    el.pasoRevisar.hidden = true;
    el.pasoLeer.hidden = true;
    el.pasoCargar.hidden = false;
    marcarPaso(1);
    enfocar(el.tCargar);
    anunciar('Se borró el material anterior.');
  }
  $('#otro-material').addEventListener('click', otroMaterial);
  $('#otro-material-2').addEventListener('click', otroMaterial);

  $('#volver-revisar').addEventListener('click', function (e) {
    e.preventDefault();
    enfocar(el.editable);
  });

  var temporizador = null;
  function programarRender() {
    if (el.pasoLeer.hidden) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(renderizar, 700);
  }
  el.editable.addEventListener('input', programarRender);

  /* ---------------- Paso 3: modos ---------------- */
  document.querySelectorAll('input[name="modo"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      if (estado.modo === 'voz') detenerVoz();
      if (estado.modo === 'pictogramas') cancelarPictos();
      estado.modo = radio.value;
      Object.keys(NOMBRES_MODO).forEach(function (m) {
        $('#controles-' + m).hidden = m !== estado.modo;
      });
      el.nombreModo.textContent = NOMBRES_MODO[estado.modo];
      renderizar();
      anunciar('Forma elegida: ' + NOMBRES_MODO[estado.modo] + '. Los controles y el texto están a continuación.');
    });
  });

  function renderizar() {
    detenerVoz();
    cancelarPictos();
    var bloques = analizar(el.editable.value);
    estado.bloques = bloques;
    el.lectura.innerHTML = '';
    if (!bloques.length) {
      el.lectura.appendChild(crear('p', 'vacio', 'No hay texto para mostrar. Volvé al paso 2 y escribí o recuperá el texto.'));
      return;
    }
    if (estado.modo === 'partes') renderPartes(bloques);
    else if (estado.modo === 'imagenes') renderImagenes(bloques);
    else if (estado.modo === 'pictogramas') renderPictogramasBase(bloques);
    else renderPlano(bloques);
    if (estado.modo === 'voz') prepararVoz();
  }

  function renderPlano(bloques) {
    bloques.forEach(function (b, i) { el.lectura.appendChild(crearBloque(b, i)); });
  }

  /* ----- Lectura ajustable ----- */
  var controles = {
    tam: $('#c-tam'), inter: $('#c-inter'), letras: $('#c-letras'), palabras: $('#c-palabras'),
    ancho: $('#c-ancho'), fuente: $('#c-fuente')
  };
  function aplicarLectura() {
    var s = el.lectura.style;
    s.setProperty('--l-tam', (controles.tam.value / 100) + 'rem');
    s.setProperty('--l-inter', controles.inter.value);
    s.setProperty('--l-letras', controles.letras.value + 'em');
    s.setProperty('--l-palabras', controles.palabras.value + 'em');
    s.setProperty('--l-ancho', controles.ancho.value);
    el.lectura.dataset.fuente = controles.fuente.value;
    $('#o-tam').textContent = controles.tam.value + ' %';
    $('#o-inter').textContent = String(controles.inter.value).replace('.', ',');
    $('#o-letras').textContent = Number(controles.letras.value) === 0 ? 'normal' : '+' + Math.round(controles.letras.value * 100) + ' %';
    $('#o-palabras').textContent = Number(controles.palabras.value) === 0 ? 'normal' : '+' + Math.round(controles.palabras.value * 100) + ' %';
    var valores = {
      'c-tam': controles.tam.value + ' por ciento',
      'c-inter': String(controles.inter.value).replace('.', ','),
      'c-letras': $('#o-letras').textContent,
      'c-palabras': $('#o-palabras').textContent
    };
    Object.keys(valores).forEach(function (id) { $('#' + id).setAttribute('aria-valuetext', valores[id]); });
  }
  Object.keys(controles).forEach(function (k) {
    controles[k].addEventListener('input', aplicarLectura);
    controles[k].addEventListener('change', aplicarLectura);
  });
  $('#lectura-restablecer').addEventListener('click', function () {
    controles.tam.value = 125; controles.inter.value = 1.8; controles.letras.value = 0;
    controles.palabras.value = 0; controles.ancho.value = '62ch'; controles.fuente.value = 'atkinson';
    aplicarLectura();
    anunciar('Ajustes de lectura restablecidos.');
  });
  aplicarLectura();

  /* ----- Contraste ----- */
  document.querySelectorAll('input[name="colores"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (r.checked) el.lectura.dataset.colores = r.value;
    });
  });

  /* ----- Por partes ----- */
  function agruparPartes(bloques) {
    var partes = [];
    var actual = null;
    bloques.forEach(function (b) {
      if (b.tipo === 'titulo') {
        actual = { titulo: b.texto, bloques: [] };
        partes.push(actual);
      } else {
        if (!actual) { actual = { titulo: null, bloques: [] }; partes.push(actual); }
        actual.bloques.push(b);
      }
    });
    var tituloDocumento = null;
    if (partes.length > 1 && partes[0].titulo && !partes[0].bloques.length) {
      tituloDocumento = partes.shift().titulo;
    }
    // Sin títulos: cada párrafo es una parte.
    if (partes.length === 1 && !partes[0].titulo && partes[0].bloques.length > 1) {
      partes = partes[0].bloques.map(function (b) { return { titulo: null, bloques: [b] }; });
    }
    // Un solo párrafo largo: grupos de tres oraciones.
    if (partes.length === 1 && partes[0].bloques.length === 1 && partes[0].bloques[0].tipo === 'parrafo') {
      var oraciones = partes[0].bloques[0].texto.match(/[^.!?]+[.!?]+["»)]*\s*|[^.!?]+$/g) || [];
      if (oraciones.length > 4) {
        var titulo = partes[0].titulo;
        partes = [];
        for (var i = 0; i < oraciones.length; i += 3) {
          partes.push({ titulo: i === 0 ? titulo : null, bloques: [{ tipo: 'parrafo', texto: oraciones.slice(i, i + 3).join('').trim() }] });
        }
      }
    }
    partes.forEach(function (p) {
      if (!p.titulo) {
        var palabras = textoDeBloque(p.bloques[0]).split(/\s+/);
        p.titulo = palabras.slice(0, 7).join(' ') + (palabras.length > 7 ? '…' : '');
        p.automatico = true;
      }
    });
    return { titulo: tituloDocumento, partes: partes };
  }

  function renderPartes(bloques) {
    var r = agruparPartes(bloques);
    var total = r.partes.length;
    if (r.titulo) el.lectura.appendChild(crear('p', 'titulo-documento', r.titulo));

    var nav = document.createElement('nav');
    nav.className = 'indice-partes';
    nav.setAttribute('aria-labelledby', 'indice-partes-t');
    var h = crear('h4', null, 'Índice (' + total + (total === 1 ? ' parte)' : ' partes)'));
    h.id = 'indice-partes-t';
    h.tabIndex = -1;
    nav.appendChild(h);
    var ol = document.createElement('ol');
    nav.appendChild(ol);
    el.lectura.appendChild(nav);

    var progreso = crear('p', 'estado-modo', '');
    progreso.setAttribute('role', 'status');
    progreso.id = 'partes-progreso';
    el.lectura.appendChild(progreso);

    var leidas = 0;
    function actualizar() {
      progreso.textContent = 'Marcaste ' + leidas + ' de ' + total + (total === 1 ? ' parte' : ' partes') + ' como leídas.';
    }
    actualizar();

    var indice = 0;
    r.partes.forEach(function (p, n) {
      var id = 'parte-' + (n + 1);
      var li = document.createElement('li');
      var enlace = crear('a', null, p.titulo);
      enlace.href = '#' + id + '-t';
      enlace.addEventListener('click', function (e) {
        e.preventDefault();
        enfocar(document.getElementById(id + '-t'));
      });
      var marcaIndice = crear('span', null, '');
      li.appendChild(enlace);
      li.appendChild(marcaIndice);
      ol.appendChild(li);

      var sec = document.createElement('section');
      sec.className = 'parte';
      sec.id = id;
      sec.setAttribute('aria-labelledby', id + '-t');
      var hp = document.createElement('h4');
      hp.id = id + '-t';
      hp.tabIndex = -1;
      hp.appendChild(crear('span', 'parte__num', 'Parte ' + (n + 1) + ' de ' + total + (p.automatico ? ' (sin título en el original)' : '')));
      hp.appendChild(document.createTextNode(p.titulo));
      sec.appendChild(hp);
      p.bloques.forEach(function (b) { sec.appendChild(crearBloque(b, indice++)); });

      var acciones = crear('div', 'parte__acciones');
      var etiqueta = document.createElement('label');
      var check = document.createElement('input');
      check.type = 'checkbox';
      check.addEventListener('change', function () {
        leidas += check.checked ? 1 : -1;
        marcaIndice.textContent = check.checked ? ' (leída)' : '';
        actualizar();
      });
      etiqueta.appendChild(check);
      etiqueta.appendChild(document.createTextNode('Marcar la parte ' + (n + 1) + ' como leída'));
      acciones.appendChild(etiqueta);
      var volver = crear('a', null, 'Volver al índice');
      volver.href = '#indice-partes-t';
      volver.addEventListener('click', function (e) { e.preventDefault(); enfocar(h); });
      acciones.appendChild(volver);
      if (n + 1 < total) {
        var sig = crear('a', null, 'Ir a la parte ' + (n + 2));
        sig.href = '#parte-' + (n + 2) + '-t';
        sig.addEventListener('click', function (e) { e.preventDefault(); enfocar(document.getElementById('parte-' + (n + 2) + '-t')); });
        acciones.appendChild(sig);
      }
      sec.appendChild(acciones);
      el.lectura.appendChild(sec);
    });
  }

  /* ----- Texto con imágenes ----- */
  function renderImagenes(bloques) {
    var conImagen = 0;
    var candidatos = 0;
    var tituloActual = '';
    var anteriores = {};
    var usos = {};
    var origen = estado.origen || {};
    var esDemoFormosa = (origen.tipo === 'ejemplo' && /Sociales/.test(origen.nombre || '')) ||
      (origen.tipo === 'pdf' && /geografia-formosa-pagina-6\.pdf/i.test(origen.nombre || ''));
    if (esDemoFormosa) {
      var lamina = document.getElementById('laminas-formosa-demo');
      if (lamina) {
        var tituloLaminas = crear('h3', null, 'Tres escenas para comprender el territorio');
        el.lectura.appendChild(tituloLaminas);
        el.lectura.appendChild(crear('p', 'ayuda', 'Ilustraciones generadas con IA y revisadas. No son mapas ni fotografías del lugar.'));
        var copiaLaminas = lamina.cloneNode(true);
        copiaLaminas.removeAttribute('id');
        el.lectura.appendChild(copiaLaminas);
      }
    }
    bloques.forEach(function (b, i) {
      var nodo = crearBloque(b, i);
      if (b.tipo === 'titulo') tituloActual = textoDeBloque(b);
      if (b.tipo === 'titulo' || !window.Ilustraciones) { el.lectura.appendChild(nodo); return; }
      candidatos += 1;
      var texto = textoDeBloque(b);
      var halladas = window.Ilustraciones.buscar(texto, 2, { titulo: tituloActual, evitar: anteriores, usos: usos });
      anteriores = {};
      if (!halladas.length) { el.lectura.appendChild(nodo); return; }
      halladas.forEach(function (h) {
        anteriores[h.ilustracion.id] = true;
        usos[h.ilustracion.id] = (usos[h.ilustracion.id] || 0) + 1;
      });
      conImagen += 1;
      var fila = crear('div', 'con-apoyo');
      fila.appendChild(nodo);
      var ul = crear('ul', 'apoyos');
      ul.setAttribute('aria-label', 'Imágenes de apoyo de este párrafo');
      halladas.forEach(function (h) {
        var li = document.createElement('li');
        li.appendChild(window.Ilustraciones.crearFigura(h, texto));
        ul.appendChild(li);
      });
      fila.appendChild(ul);
      el.lectura.appendChild(fila);
    });
    var msg = !window.Ilustraciones
      ? 'No se pudo cargar la colección de dibujos. Se muestra solo el texto.'
      : conImagen === 0
        ? 'No encontramos dibujos que correspondan a este texto. Se muestra solo el texto.'
        : 'Hay dibujos de apoyo en ' + conImagen + ' de ' + candidatos + ' párrafos.' +
          (conImagen < candidatos ? ' Los demás se muestran solo con texto, porque no tenemos un dibujo adecuado.' : '');
    $('#imagenes-estado').textContent = msg;
  }

  /* ----- Texto con pictogramas (ARASAAC) ----- */
  var PALABRAS_VACIAS = new Set((
    'para como pero porque cuando donde desde hasta sobre entre hacia contra segun sino tambien tampoco muy mas menos ' +
    'este esta estos estas ese esa esos esas aquel aquella aquellos aquellas esto eso aquello ' +
    'todo toda todos todas otro otra otros otras mismo misma mismos mismas cada cual cuales quien quienes ' +
    'algo alguien alguno alguna algunos algunas ninguno ninguna nada nadie mucho mucha muchos muchas poco poca pocos pocas ' +
    'tanto tanta tantos tantas varios varias ambos ambas demas ' +
    'solo sola solos solas luego despues antes ahora aqui alli alla entonces siempre nunca aunque mientras ' +
    'ser soy eres somos son era eran fue fueron sido siendo sea sean estar estoy estamos estan estaba estaban ' +
    'haber habia habian hubo hay han has hemos tener tiene tienen tenia tenian hacer hace hacen hizo ' +
    'puede pueden poder podria deben debe deber llamamos llama llaman dice dicen segun ' +
    'nuestro nuestra nuestros nuestras vuestro suyo suya suyos suyas tuyo mio ' +
    'ellos ellas usted ustedes nosotros nosotras ' +
    'parte partes forma formas manera vez veces tipo tipos cosa cosas ' +
    'uno una unos unas dos tres cuatro cinco seis siete ocho nueve diez ' +
    'bien mal asi ademas incluso casi tan tal tales ya aun todavia'
  ).split(/\s+/));

  var cachePictos = new Map();
  var busquedaPictos = null;

  function palabrasClave(texto, frecuencias, maximo) {
    var lista = texto.match(/\p{L}+/gu) || [];
    var vistas = new Set();
    var candidatas = [];
    lista.forEach(function (w, pos) {
      var n = normalizar(w);
      if (n.length < 4 || PALABRAS_VACIAS.has(n) || vistas.has(n)) return;
      vistas.add(n);
      candidatas.push({ palabra: w.toLowerCase(), normal: n, pos: pos, frec: frecuencias.get(n) || 1 });
    });
    candidatas.sort(function (a, b) { return b.frec - a.frec || a.pos - b.pos; });
    return candidatas.slice(0, maximo).sort(function (a, b) { return a.pos - b.pos; });
  }

  function renderPictogramasBase(bloques) {
    renderPlano(bloques);
    $('#pictos-estado').textContent = 'Tocá «Buscar pictogramas en ARASAAC» para agregarlos al texto.';
  }

  function coincide(clave, palabra) {
    if (!clave) return false;
    return clave === palabra || clave + 's' === palabra || clave + 'es' === palabra ||
      palabra + 's' === clave || palabra + 'es' === clave;
  }

  function elegirPicto(datos, normal) {
    if (!Array.isArray(datos)) return null;
    for (var i = 0; i < datos.length; i++) {
      var p = datos[i];
      if (!p || p.sex || p.violence) continue;
      var claves = [];
      (p.keywords || []).forEach(function (k) {
        if (k.keyword) claves.push(normalizar(k.keyword));
        if (k.plural) claves.push(normalizar(k.plural));
      });
      if (claves.some(function (k) { return coincide(k, normal); })) return { id: p._id };
    }
    return null;
  }

  async function buscarPicto(palabra, normal, senal) {
    if (cachePictos.has(normal)) return cachePictos.get(normal);
    var direcciones = [
      'https://api.arasaac.org/v1/pictograms/es/bestsearch/' + encodeURIComponent(palabra),
      'https://api.arasaac.org/api/pictograms/es/bestsearch/' + encodeURIComponent(palabra)
    ];
    var datos = null;
    for (var i = 0; i < direcciones.length; i++) {
      try {
        var r = await fetch(direcciones[i], { signal: senal });
        if (r.status === 404) { datos = []; break; }
        if (!r.ok) continue;
        datos = await r.json();
        break;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
      }
    }
    if (datos === null) throw new Error('red');
    var elegido = elegirPicto(datos, normal);
    cachePictos.set(normal, elegido);
    return elegido;
  }

  function cancelarPictos() {
    if (busquedaPictos) { busquedaPictos.abort(); busquedaPictos = null; }
    $('#cancelar-pictos').hidden = true;
    $('#buscar-pictos').disabled = false;
  }

  $('#cancelar-pictos').addEventListener('click', function () {
    cancelarPictos();
    $('#pictos-estado').textContent = 'Se detuvo la búsqueda. Los pictogramas encontrados hasta ahora quedan en el texto.';
    $('#buscar-pictos').focus();
  });

  $('#buscar-pictos').addEventListener('click', async function () {
    var estadoP = $('#pictos-estado');
    // Reiniciar el texto sin pictogramas anteriores.
    el.lectura.innerHTML = '';
    renderPlano(estado.bloques);

    var frecuencias = new Map();
    estado.bloques.forEach(function (b) {
      (normalizar(textoDeBloque(b)).match(/[a-zñ]+/g) || []).forEach(function (w) {
        frecuencias.set(w, (frecuencias.get(w) || 0) + 1);
      });
    });

    var tareas = [];
    estado.bloques.forEach(function (b, i) {
      var claves = palabrasClave(textoDeBloque(b), frecuencias, b.tipo === 'titulo' ? 2 : 4);
      if (claves.length) tareas.push({ indice: i, claves: claves });
    });
    var unicas = new Map();
    tareas.forEach(function (t) { t.claves.forEach(function (c) { if (!unicas.has(c.normal)) unicas.set(c.normal, c.palabra); }); });
    var lista = Array.from(unicas.entries()).slice(0, 90);

    if (!lista.length) {
      estadoP.textContent = 'No hay palabras para buscar. Se muestra solo el texto.';
      return;
    }

    busquedaPictos = new AbortController();
    var senal = busquedaPictos.signal;
    $('#buscar-pictos').disabled = true;
    $('#cancelar-pictos').hidden = false;
    $('#cancelar-pictos').focus();

    var hechas = 0;
    var errorRed = false;
    estadoP.textContent = 'Buscando pictogramas: 0 de ' + lista.length + ' palabras.';
    var cola = lista.slice();
    async function trabajador() {
      while (cola.length && !senal.aborted && !errorRed) {
        var par = cola.shift();
        try {
          await buscarPicto(par[1], par[0], senal);
        } catch (e) {
          if (e.name === 'AbortError') return;
          errorRed = true;
          return;
        }
        hechas += 1;
        if (hechas % 10 === 0 || hechas === lista.length) {
          estadoP.textContent = 'Buscando pictogramas: ' + hechas + ' de ' + lista.length + ' palabras.';
        }
      }
    }
    await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
    var detenida = senal.aborted;
    busquedaPictos = null;
    $('#cancelar-pictos').hidden = true;
    $('#buscar-pictos').disabled = false;

    if (errorRed && !cachePictos.size) {
      estadoP.textContent = 'No pudimos conectarnos con ARASAAC. Revisá tu conexión a internet. El texto sigue disponible sin pictogramas.';
      $('#buscar-pictos').focus();
      return;
    }

    var parrafosCon = 0;
    var totalPictos = 0;
    tareas.forEach(function (t) {
      var nodo = el.lectura.querySelector('[data-indice="' + t.indice + '"]');
      if (!nodo) return;
      var encontrados = t.claves.map(function (c) {
        var r = cachePictos.get(c.normal);
        return r ? { id: r.id, palabra: c.palabra } : null;
      }).filter(Boolean);
      if (!encontrados.length) return;
      parrafosCon += 1;
      totalPictos += encontrados.length;
      var ul = crear('ul', 'pictos');
      ul.setAttribute('aria-label', 'Pictogramas de este bloque');
      encontrados.forEach(function (e) {
        var li = document.createElement('li');
        var fig = crear('figure', 'picto');
        var img = document.createElement('img');
        img.src = 'https://static.arasaac.org/pictograms/' + e.id + '/' + e.id + '_300.png';
        img.alt = 'Pictograma: ' + e.palabra;
        img.width = 300; img.height = 300;
        img.loading = 'lazy';
        img.addEventListener('error', function () { li.remove(); });
        var cap = crear('figcaption', null, e.palabra);
        cap.setAttribute('aria-hidden', 'true');
        fig.appendChild(img);
        fig.appendChild(cap);
        li.appendChild(fig);
        ul.appendChild(li);
      });
      nodo.insertAdjacentElement('afterend', ul);
    });

    var sinPictos = tareas.length - parrafosCon;
    var mensaje = (detenida ? 'Búsqueda detenida. ' : 'Listo. ') +
      'Se agregaron ' + totalPictos + ' pictogramas en ' + parrafosCon + ' de ' + tareas.length + ' bloques.' +
      (sinPictos > 0 ? ' ' + sinPictos + ' bloques quedaron solo con texto porque no había un pictograma que coincidiera.' : '') +
      (errorRed ? ' Se cortó la conexión con ARASAAC antes de terminar.' : '');
    estadoP.textContent = mensaje;
    $('#buscar-pictos').focus();
  });

  /* ----- Lectura en voz alta ----- */
  var voz = {
    soportada: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    cola: [],
    indice: 0,
    estado: 'detenido',
    token: 0,
    vozElegida: null
  };
  var bVoz = {
    escuchar: $('#voz-escuchar'), pausar: $('#voz-pausar'), detener: $('#voz-detener'),
    anterior: $('#voz-anterior'), siguiente: $('#voz-siguiente'),
    velocidad: $('#voz-velocidad'), selector: $('#voz-voz'),
    posicion: $('#voz-posicion'), estado: $('#voz-estado')
  };

  function cargarVoces() {
    if (!voz.soportada) return;
    var voces = window.speechSynthesis.getVoices();
    var espanol = voces.filter(function (v) { return /^es\b|^es-/i.test(v.lang); });
    var lista = espanol.length ? espanol : voces;
    var prioridad = ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES'];
    lista.sort(function (a, b) {
      var pa = prioridad.indexOf(a.lang); var pb = prioridad.indexOf(b.lang);
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    });
    var previa = bVoz.selector.value;
    bVoz.selector.innerHTML = '';
    bVoz.selector.appendChild(new Option('Voz predeterminada del dispositivo', ''));
    lista.forEach(function (v) {
      bVoz.selector.appendChild(new Option(v.name + ' (' + v.lang + ')', v.voiceURI));
    });
    if (previa) bVoz.selector.value = previa;
    else if (lista.length && espanol.length) bVoz.selector.value = lista[0].voiceURI;
    elegirVoz();
  }
  function elegirVoz() {
    var uri = bVoz.selector.value;
    voz.vozElegida = null;
    if (!uri || !voz.soportada) return;
    window.speechSynthesis.getVoices().forEach(function (v) { if (v.voiceURI === uri) voz.vozElegida = v; });
  }
  if (voz.soportada) {
    cargarVoces();
    window.speechSynthesis.addEventListener('voiceschanged', cargarVoces);
  }

  function prepararVoz() {
    $('#voz-no-disponible').hidden = voz.soportada;
    voz.cola = Array.prototype.map.call(el.lectura.querySelectorAll('.bloque'), function (nodo) {
      return { nodo: nodo, texto: textoDeBloque(estado.bloques[Number(nodo.dataset.indice)]) };
    });
    voz.indice = 0;
    [bVoz.escuchar, bVoz.anterior, bVoz.siguiente, bVoz.velocidad, bVoz.selector].forEach(function (b) { b.disabled = !voz.soportada; });
    actualizarBotonesVoz();
    actualizarPosicion();
  }

  function actualizarPosicion() {
    var total = voz.cola.length || 1;
    bVoz.posicion.textContent = 'Bloque ' + Math.min(voz.indice + 1, total) + ' de ' + total +
      (voz.estado === 'leyendo' ? ' (leyendo)' : voz.estado === 'pausa' ? ' (en pausa)' : '');
  }

  function actualizarBotonesVoz() {
    bVoz.escuchar.textContent = voz.estado === 'pausa' ? 'Continuar' : 'Escuchar';
    bVoz.escuchar.disabled = !voz.soportada || voz.estado === 'leyendo';
    bVoz.pausar.disabled = voz.estado !== 'leyendo';
    bVoz.detener.disabled = voz.estado === 'detenido';
  }

  function estadoVoz(nuevo, mensaje) {
    var teniaFoco = document.activeElement;
    voz.estado = nuevo;
    actualizarBotonesVoz();
    actualizarPosicion();
    if (mensaje) bVoz.estado.textContent = mensaje;
    // Si el botón con foco quedó desactivado, mover el foco a uno útil.
    if (teniaFoco && teniaFoco.disabled) {
      (nuevo === 'leyendo' ? bVoz.pausar : bVoz.escuchar).focus();
    }
  }

  function marcarLeyendo(i) {
    el.lectura.querySelectorAll('.leyendo').forEach(function (n) { n.classList.remove('leyendo'); });
    el.lectura.querySelectorAll('.marca-lectura').forEach(function (n) { n.remove(); });
    var item = voz.cola[i];
    if (!item) return;
    item.nodo.classList.add('leyendo');
    var marca = crear('span', 'marca-lectura', 'Leyendo');
    marca.setAttribute('aria-hidden', 'true');
    var destino = item.nodo.tagName === 'UL' || item.nodo.tagName === 'OL' ? item.nodo.querySelector('li') : item.nodo;
    destino.insertBefore(marca, destino.firstChild);
    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    item.nodo.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'center' });
  }

  function trocear(texto) {
    var oraciones = texto.match(/[^.!?;:]+[.!?;:]*\s*/g) || [texto];
    var trozos = [];
    var actual = '';
    oraciones.forEach(function (o) {
      if ((actual + o).length > 220 && actual) { trozos.push(actual.trim()); actual = ''; }
      actual += o;
    });
    if (actual.trim()) trozos.push(actual.trim());
    return trozos;
  }

  function leerBloque(i) {
    voz.token += 1;
    var token = voz.token;
    window.speechSynthesis.cancel();
    if (i >= voz.cola.length) {
      voz.indice = 0;
      marcarLeyendo(-1);
      estadoVoz('detenido', 'Terminó la lectura.');
      return;
    }
    voz.indice = i;
    marcarLeyendo(i);
    actualizarPosicion();
    var trozos = trocear(voz.cola[i].texto);
    var k = 0;
    function siguiente() {
      if (token !== voz.token) return;
      if (k >= trozos.length) { leerBloque(i + 1); return; }
      var u = new SpeechSynthesisUtterance(trozos[k++]);
      u.lang = voz.vozElegida ? voz.vozElegida.lang : 'es-AR';
      if (voz.vozElegida) u.voice = voz.vozElegida;
      u.rate = Number(bVoz.velocidad.value) || 1;
      u.onend = siguiente;
      u.onerror = function (e) {
        if (token !== voz.token || e.error === 'interrupted' || e.error === 'canceled') return;
        estadoVoz('detenido', 'La voz se detuvo por un error del navegador. Probá con otra voz o volvé a tocar «Escuchar».');
      };
      window.speechSynthesis.speak(u);
    }
    // Pequeña espera: algunos navegadores ignoran «speak» justo después de «cancel».
    setTimeout(siguiente, 60);
  }

  function detenerVoz() {
    if (!voz.soportada) return;
    voz.token += 1;
    window.speechSynthesis.cancel();
    if (voz.estado !== 'detenido') {
      voz.estado = 'detenido';
      bVoz.estado.textContent = 'Lectura detenida.';
    }
    marcarLeyendo(-1);
    actualizarBotonesVoz();
  }

  bVoz.escuchar.addEventListener('click', function () {
    if (!voz.soportada || !voz.cola.length) return;
    if (voz.estado === 'pausa') {
      window.speechSynthesis.resume();
      estadoVoz('leyendo', 'Leyendo.');
      return;
    }
    estadoVoz('leyendo', 'Leyendo desde el bloque ' + (voz.indice + 1) + '.');
    leerBloque(voz.indice);
  });
  bVoz.pausar.addEventListener('click', function () {
    window.speechSynthesis.pause();
    estadoVoz('pausa', 'En pausa. Tocá «Continuar» para seguir.');
  });
  bVoz.detener.addEventListener('click', function () {
    voz.token += 1;
    window.speechSynthesis.cancel();
    voz.indice = 0;
    marcarLeyendo(-1);
    estadoVoz('detenido', 'Lectura detenida. Al tocar «Escuchar» empieza desde el principio.');
  });
  function moverBloque(paso) {
    if (!voz.cola.length) return;
    var nuevo = Math.max(0, Math.min(voz.cola.length - 1, voz.indice + paso));
    if (voz.estado === 'leyendo' || voz.estado === 'pausa') {
      if (voz.estado === 'pausa') window.speechSynthesis.resume();
      estadoVoz('leyendo');
      leerBloque(nuevo);
    } else {
      voz.indice = nuevo;
      marcarLeyendo(nuevo);
      actualizarPosicion();
    }
    bVoz.estado.textContent = 'Bloque ' + (nuevo + 1) + ' de ' + voz.cola.length + ': ' + voz.cola[nuevo].texto.slice(0, 80);
  }
  bVoz.anterior.addEventListener('click', function () { moverBloque(-1); });
  bVoz.siguiente.addEventListener('click', function () { moverBloque(1); });
  bVoz.velocidad.addEventListener('change', function () {
    if (voz.estado === 'leyendo') leerBloque(voz.indice);
  });
  bVoz.selector.addEventListener('change', function () {
    elegirVoz();
    if (voz.estado === 'leyendo') leerBloque(voz.indice);
  });

  window.addEventListener('pagehide', function () {
    if (voz.soportada) window.speechSynthesis.cancel();
    liberarWorker();
    estado.urls.forEach(function (u) { URL.revokeObjectURL(u); });
  });

  // Si el navegador no tiene síntesis de voz, se avisa desde el inicio.
  if (!voz.soportada) {
    $('#voz-no-disponible').hidden = false;
  }

  // Exponer funciones de análisis para pruebas automáticas (sin efecto en la interfaz).
  window.BermejoPruebas = { analizar: analizar, agruparPartes: agruparPartes, esTitulo: esTitulo, EJEMPLO: EJEMPLO };
})();
