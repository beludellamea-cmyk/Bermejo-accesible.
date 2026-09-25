/* Bermejo Accesible · Espacio docente */
(function () {
  'use strict';

  function $(s) { return document.querySelector(s); }
  function crear(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function enfocar(e) {
    e.focus({ preventScroll: true });
    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    e.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
  }

  /* Los enlaces internos llevan el foco a la sección, no solo el desplazamiento. */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var destino = document.getElementById(a.getAttribute('href').slice(1));
      if (!destino) return;
      e.preventDefault();
      if (!destino.hasAttribute('tabindex')) destino.setAttribute('tabindex', '-1');
      enfocar(destino);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });

  /* ---------- Guía: resumen ---------- */
  var form = $('#form-chequeo');
  var resumen = $('#resumen-chequeo');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var items = Array.prototype.slice.call(form.querySelectorAll('input[type="checkbox"]'));
    var marcados = items.filter(function (i) { return i.checked; });
    var pendientes = items.filter(function (i) { return !i.checked; });
    resumen.innerHTML = '';
    var h = crear('h3', null, 'Resumen de tu revisión');
    h.id = 'resumen-titulo';
    resumen.appendChild(h);
    resumen.setAttribute('role', 'region');
    resumen.setAttribute('aria-labelledby', 'resumen-titulo');
    resumen.appendChild(crear('p', null, 'Tu material cumple ' + marcados.length + ' de ' + items.length + ' puntos.'));
    if (!pendientes.length) {
      resumen.appendChild(crear('p', null, 'No quedan puntos pendientes. Igual conviene probar el material con estudiantes y con su familia o equipo de apoyo.'));
    } else {
      resumen.appendChild(crear('p', null, 'Puntos para revisar, con una idea para cada uno:'));
      var ul = document.createElement('ul');
      pendientes.forEach(function (i) {
        var li = document.createElement('li');
        var texto = form.querySelector('label[for="' + i.id + '"]').textContent.trim();
        li.appendChild(document.createTextNode(texto + ' '));
        var idea = document.getElementById(i.dataset.idea);
        if (idea) {
          var a = crear('a', null, 'Ver idea: ' + idea.querySelector('h3').textContent);
          a.href = '#' + i.dataset.idea;
          a.addEventListener('click', function (ev) { ev.preventDefault(); enfocar(idea); });
          li.appendChild(a);
        }
        ul.appendChild(li);
      });
      resumen.appendChild(ul);
    }
    resumen.appendChild(crear('p', 'fuente-linea', 'Este resumen no se guarda. Es una guía orientativa y está sujeta a revisión docente.'));
    resumen.hidden = false;
    enfocar(resumen);
  });

  form.addEventListener('reset', function () {
    resumen.hidden = true;
    resumen.innerHTML = '';
  });

  /* ---------- Revisor de texto ---------- */
  var SIGLAS_COMUNES = new Set(['PDF', 'TV', 'OK', 'DNI', 'ESI', 'ONU']);

  function oraciones(texto) {
    return (texto.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
      .map(function (o) { return o.trim(); })
      .filter(Boolean);
  }
  function contarPalabras(t) { return (t.match(/[\p{L}\d]+/gu) || []).length; }

  $('#revisar').addEventListener('click', function () {
    var campo = $('#texto-revisar');
    var error = $('#error-texto-revisar');
    var salida = $('#resultado-revisor');
    var texto = campo.value.trim();
    if (!texto) {
      campo.setAttribute('aria-invalid', 'true');
      error.textContent = 'Error: el cuadro está vacío. Pegá un texto para revisarlo.';
      error.hidden = false;
      salida.hidden = true;
      campo.focus();
      return;
    }
    campo.removeAttribute('aria-invalid');
    error.hidden = true;

    var textoNFC = texto.normalize('NFC');
    var lista = oraciones(texto);
    var largas = lista.filter(function (o) { return contarPalabras(o) > 25; });
    var parrafos = texto.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
    var parrafosLargos = parrafos.filter(function (p) { return contarPalabras(p) > 80; });
    // Frases en mayúsculas: tres o más palabras seguidas en mayúsculas,
    // con al menos una de cuatro letras o más.
    var mayus = (textoNFC.match(/(?<![\p{L}\p{M}\p{N}])[\p{Lu}\p{M}]{2,}(?:\s+[\p{Lu}\p{M}]{2,}){2,}(?![\p{L}\p{M}\p{N}])/gu) || [])
      .filter(function (f) { return /[\p{Lu}\p{M}]{4,}/u.test(f); });
    // Las palabras de frases en mayúsculas no se cuentan como siglas.
    var sinMayus = mayus.reduce(function (t, f) { return t.split(f).join(' '); }, textoNFC);
    var siglas = Array.from(new Set((sinMayus.match(/(?<![\p{L}\p{M}\p{N}])[\p{Lu}\p{M}]{2,6}(?![\p{L}\p{M}\p{N}])/gu) || []).filter(function (s) {
      if (SIGLAS_COMUNES.has(s)) return false;
      var explicada = new RegExp('\\(\\s*' + s + '\\s*\\)|' + s + '\\s*\\(').test(texto);
      return !explicada;
    })));
    var colores = texto.match(/\b(?:en|de color)\s+(?:rojo|verde|azul|amarillo|naranja|violeta|rosa)\b/gi) || [];
    var promedio = lista.length ? Math.round(contarPalabras(texto) / lista.length) : 0;

    salida.innerHTML = '';
    var h = crear('h3', null, 'Resultado de la revisión');
    h.id = 'resultado-revisor-titulo';
    salida.appendChild(h);
    salida.setAttribute('role', 'region');
    salida.setAttribute('aria-labelledby', 'resultado-revisor-titulo');
    salida.appendChild(crear('p', null, 'El texto tiene ' + lista.length + (lista.length === 1 ? ' oración' : ' oraciones') +
      ' y un promedio de ' + promedio + ' palabras por oración.'));

    var ul = document.createElement('ul');
    function punto(titulo, detalle, ejemplos) {
      var li = document.createElement('li');
      li.appendChild(crear('strong', null, titulo + ' '));
      li.appendChild(document.createTextNode(detalle));
      (ejemplos || []).slice(0, 3).forEach(function (e) {
        li.appendChild(crear('span', 'cita-oracion', '«' + (e.length > 160 ? e.slice(0, 160) + '…' : e) + '»'));
      });
      ul.appendChild(li);
    }
    if (largas.length) punto('Revisar:', largas.length + (largas.length === 1 ? ' oración tiene' : ' oraciones tienen') + ' más de 25 palabras. Probá ' + (largas.length === 1 ? 'dividirla.' : 'dividirlas.'), largas);
    else punto('Bien:', 'ninguna oración supera las 25 palabras.');
    if (parrafosLargos.length) punto('Revisar:', parrafosLargos.length + (parrafosLargos.length === 1 ? ' párrafo tiene' : ' párrafos tienen') + ' más de 80 palabras. Sumá títulos o separalos.');
    else punto('Bien:', 'los párrafos tienen un largo cómodo.');
    if (mayus.length) punto('Revisar:', 'hay frases enteras en mayúsculas. Cuestan más de leer; usá negrita para destacar.', mayus);
    if (siglas.length) punto('Revisar:', 'estas siglas no parecen explicadas: ' + siglas.slice(0, 8).join(', ') + '. Escribí qué significan la primera vez.');
    if (colores.length) punto('Revisar:', 'el texto nombra colores para indicar algo. Sumá también una palabra o un símbolo.', colores);

    salida.appendChild(ul);
    salida.appendChild(crear('p', 'fuente-linea', 'Revisión automática y orientativa: no detecta todo ni reemplaza tu criterio. Tu texto no se guarda ni se envía.'));
    salida.hidden = false;
    enfocar(salida);
  });

  /* ---------- Filtro de normativa ---------- */
  var buscador = $('#buscar-norma');
  var ambito = $('#ambito-norma');
  var conteo = $('#conteo-normas');
  var normas = Array.prototype.slice.call(document.querySelectorAll('#lista-normas > li'));
  function norm(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  var espera = null;

  function filtrar() {
    var q = norm(buscador.value.trim()).replace(/\./g, '');
    var a = ambito.value;
    var visibles = 0;
    normas.forEach(function (li) {
      var texto = norm(li.dataset.texto + ' ' + li.textContent).replace(/\./g, '');
      var ok = (a === 'todas' || li.dataset.ambito === a) && (!q || q.split(/\s+/).every(function (p) { return texto.indexOf(p) !== -1; }));
      li.hidden = !ok;
      if (ok) visibles += 1;
    });
    conteo.textContent = visibles === 0
      ? 'No hay normas que coincidan. Probá con otra palabra o elegí «Todos».'
      : 'Se ' + (visibles === 1 ? 'muestra 1 norma.' : 'muestran ' + visibles + ' normas.');
  }
  buscador.addEventListener('input', function () {
    clearTimeout(espera);
    espera = setTimeout(filtrar, 400);
  });
  ambito.addEventListener('change', filtrar);
  filtrar();
})();
