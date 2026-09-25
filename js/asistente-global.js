/* Ayuda contextual en todas las páginas. Funciona con botones; no escucha ni envía datos. */
(function () {
  'use strict';
  function $(s) { return document.querySelector(s); }
  function nodo(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }
  // Símbolos simples con texto visible: el significado nunca depende solo del dibujo.
  function icono(tipo) {
    var dibujos = {
      ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-1.2 1-1.8 1.5-1.8 2.7"/><path d="M12 17h.01"/>',
      voz: '<path d="M3 10v4h4l5 4V6l-5 4H3Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
      libro: '<path d="M12 5c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v14"/>',
      docente: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M7 20h10M12 16v4M7 9h10"/>',
      texto: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
      foto: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="1"/><path d="m5 17 5-5 3 3 2-2 4 4"/>',
      revisar: '<path d="M4 20h4l11-11-4-4L4 16v4ZM13 7l4 4"/>',
      seguir: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
      partes: '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>',
      ampliar: '<path d="M4 18 9 6h2l5 12M6 14h8M19 7v8M15 11h8"/>',
      imagen: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1"/><path d="m4 18 6-6 3 3 3-3 4 5"/>',
      ideas: '<path d="M9 17h6m-5 3h4M8 14c-2-2-3-4-2-7a6 6 0 0 1 12 0c1 3 0 5-2 7l-1 3H9l-1-3Z"/>',
      norma: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
      opciones: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
    };
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'ayuda-icono');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.innerHTML = dibujos[tipo] || dibujos.ayuda;
    return s;
  }
  var ruta = location.pathname.split('/').pop() || 'index.html';
  var boton = nodo('button', 'boton boton--principal ayuda-abrir', 'Necesito ayuda');
  boton.type = 'button';
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', 'ayuda-panel');
  boton.prepend(icono('ayuda'));
  var audioRapido = nodo('button', 'boton ayuda-escuchar', 'Escuchar ayuda');
  audioRapido.type = 'button';
  audioRapido.prepend(icono('voz'));
  audioRapido.setAttribute('aria-controls', 'ayuda-panel');
  var lanzadores = nodo('div', 'ayuda-lanzadores');
  lanzadores.append(boton, audioRapido);
  var panel = nodo('section', 'ayuda-panel');
  panel.id = 'ayuda-panel';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'ayuda-titulo');
  var cab = nodo('div', 'ayuda-panel__cabecera');
  var titulo = nodo('h2', null, 'Asistente de Bermejo');
  titulo.id = 'ayuda-titulo';
  titulo.tabIndex = -1;
  var cerrar = nodo('button', 'boton', 'Cerrar ayuda');
  cerrar.type = 'button';
  cab.append(titulo, cerrar);
  var frase = nodo('p', null, 'Hola, ¿en qué puedo ayudarte?');
  frase.id = 'ayuda-frase';
  var opciones = nodo('div', 'ayuda-panel__opciones');
  opciones.setAttribute('role', 'group');
  opciones.setAttribute('aria-label', 'Opciones de ayuda');
  var controles = nodo('div', 'ayuda-panel__controles');
  var escuchar = nodo('button', 'boton', 'Escuchar indicación');
  escuchar.prepend(icono('voz'));
  var repetir = nodo('button', 'boton', 'Repetir indicación');
  var apagar = nodo('button', 'boton', 'Apagar voz');
  [escuchar, repetir, apagar].forEach(function (b) { b.type = 'button'; controles.appendChild(b); });
  var estado = nodo('p', 'ayuda-panel__estado', 'La voz está apagada. Podés usar los botones sin escucharla.');
  estado.setAttribute('role', 'status');
  panel.append(cab, frase, opciones, controles, estado);
  var principal = $('main');
  if (principal) principal.before(lanzadores, panel);
  else document.body.append(lanzadores, panel);

  var disponible = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var vozActiva = false;
  var token = 0;
  if (!disponible) {
    [escuchar, repetir, apagar].forEach(function (b) { b.disabled = true; });
    audioRapido.disabled = true;
    estado.textContent = 'La voz no está disponible en este navegador. Todas las indicaciones se muestran por escrito.';
  }
  function detener() {
    token++;
    if (disponible) window.speechSynthesis.cancel();
  }
  function hablar() {
    if (!disponible) return;
    detener();
    vozActiva = true;
    var actual = token;
    var u = new SpeechSynthesisUtterance(frase.textContent);
    u.lang = 'es-AR';
    u.onstart = function () { if (actual === token) estado.textContent = 'El asistente está hablando.'; };
    u.onend = function () { if (actual === token) estado.textContent = 'Terminó la indicación.'; };
    u.onerror = function (ev) {
      if (actual === token && ev.error !== 'canceled' && ev.error !== 'interrupted') estado.textContent = 'No se pudo reproducir la voz. La indicación está escrita arriba.';
    };
    window.speechSynthesis.speak(u);
  }
  escuchar.addEventListener('click', hablar);
  repetir.addEventListener('click', hablar);
  apagar.addEventListener('click', function () { vozActiva = false; detener(); estado.textContent = 'La voz está apagada.'; });
  function decir(texto) {
    frase.textContent = texto;
    if (vozActiva) hablar();
    else estado.textContent = 'Indicación escrita. Tocá «Escuchar indicación» si querés oírla.';
  }
  function mostrar(abrir) {
    panel.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
    if (abrir) { actualizar(); titulo.focus(); }
    else { vozActiva = false; detener(); boton.focus(); }
  }
  boton.addEventListener('click', function () { mostrar(panel.hidden); });
  audioRapido.addEventListener('click', function () { if (disponible) { mostrar(true); hablar(); } });
  cerrar.addEventListener('click', function () { mostrar(false); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') mostrar(false); });
  window.addEventListener('pagehide', detener);

  function paso() {
    if ($('#paso-leer') && !$('#paso-leer').hidden) return 3;
    if ($('#paso-revisar') && !$('#paso-revisar').hidden) return 2;
    return 1;
  }
  function acciones() {
    if (ruta === 'index.html') return {
      pregunta: 'Hola, ¿en qué puedo ayudarte? Podés entrar con tu propio material o conocer las herramientas para docentes.',
      botones: [['Quiero acceder a un material', 'material.html'], ['Soy docente', 'docente.html'], ['Necesito un lector de pantalla', '#lector-titulo']]
    };
    if (ruta === 'docente.html') return {
      pregunta: 'Hola, ¿en qué puedo ayudarte? Elegí qué parte del espacio docente querés consultar.',
      botones: [['Contar una situación del aula', '#consulta'], ['Revisar barreras de un material', '#guia'], ['Buscar ideas prácticas', '#ideas'], ['Consultar las resoluciones', '#normativa']]
    };
    if (paso() === 1) return {
      pregunta: 'Hola, ¿en qué puedo ayudarte? Primero elegí cómo querés cargar tu material.',
      botones: [['Voy a pegar un texto', '#texto-pegado'], ['Voy a subir un PDF', '#archivo-pdf'], ['Voy a subir una foto', '#archivo-foto'], ['Tengo un video', '#archivo-video'], ['Probar Sociales de Formosa', '#usar-sociales'], ['Probar el ciclo del agua', '#usar-ejemplo']]
    };
    if (paso() === 2) return {
      pregunta: 'Ya cargaste el material. Revisá el texto y corregí lo que haga falta. Después elegí cómo leerlo.',
      botones: [['Revisar o corregir', '#texto-editable'], ['Continuar a las formas de lectura', '#ir-a-leer'], ['Cargar otro material', '#otro-material']]
    };
    return {
      pregunta: 'Ya podés elegir cómo acceder a tu material. ¿Qué te ayudaría ahora?',
      botones: [['Quiero escucharlo', 'modo:voz'], ['Prefiero leer por partes', 'modo:partes'], ['Necesito letra más grande', 'modo:agrandar'], ['Me ayudan las imágenes', 'modo:imagenes'], ['Ver todas las formas', '#modos-ayuda']]
    };
  }
  function abrirDestino(destino) {
    if (!destino.startsWith('#')) { location.href = destino; return; }
    var el = destino === '#modos-ayuda' ? $('input[name="modo"]') : $(destino);
    if (!el) return;
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    vozActiva = false;
    detener();
    if (el.matches('input,button,textarea,a')) el.focus();
    else { if (!el.hasAttribute('tabindex')) el.tabIndex = -1; el.focus(); }
    el.scrollIntoView({ block: 'start' });
  }
  function elegirModo(modo) {
    var hablarDespues = vozActiva;
    detener();
    var nombre = modo === 'agrandar' ? 'lectura' : modo;
    var radio = $('input[name="modo"][value="' + nombre + '"]');
    if (!radio) return;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    if (modo === 'agrandar') {
      var tam = $('#c-tam');
      if (tam) { tam.stepUp(); tam.dispatchEvent(new Event('input', { bubbles: true })); tam.focus(); }
      decir('Agrandé el texto. Si necesitás otro tamaño, podés cambiarlo en los ajustes de lectura.');
    } else if (modo === 'voz') {
      $('#voz-escuchar').focus();
      decir('Abrí la lectura en voz alta. Tocá Escuchar para comenzar. Podés pausar o repetir cuando quieras.');
    } else if (modo === 'partes') {
      $('#controles-partes').tabIndex = -1;
      $('#controles-partes').focus();
      decir('Vamos paso a paso. Te mostraré una parte por vez. Tocá Siguiente cuando estés listo.');
    } else {
      $('#controles-imagenes').tabIndex = -1;
      $('#controles-imagenes').focus();
      decir('Voy a mostrar imágenes cuando ayuden a comprender una palabra. También podés seguir leyendo el texto.');
    }
    if (!hablarDespues) estado.textContent = 'Elegiste una forma de lectura. La indicación está escrita arriba.';
  }
  function actualizar() {
    var datos = acciones();
    frase.textContent = datos.pregunta;
    opciones.replaceChildren();
    datos.botones.forEach(function (item) {
      var b = nodo('button', 'boton', item[0]);
      b.type = 'button';
      var simbolos = {
        'material.html': 'libro', 'docente.html': 'docente', '#lector-titulo': 'voz',
        '#consulta': 'docente', '#guia': 'revisar', '#ideas': 'ideas', '#normativa': 'norma',
        '#texto-pegado': 'texto', '#archivo-pdf': 'texto', '#archivo-foto': 'foto', '#archivo-video': 'imagen',
        '#usar-ejemplo': 'libro', '#usar-sociales': 'libro', '#texto-editable': 'revisar', '#ir-a-leer': 'seguir',
        '#otro-material': 'foto', 'modo:voz': 'voz', 'modo:partes': 'partes',
        'modo:agrandar': 'ampliar', 'modo:imagenes': 'imagen', '#modos-ayuda': 'opciones'
      };
      b.prepend(icono(simbolos[item[1]]));
      b.addEventListener('click', function () {
        if (item[1].startsWith('modo:')) elegirModo(item[1].slice(5));
        else abrirDestino(item[1]);
      });
      opciones.appendChild(b);
    });
    estado.textContent = 'Elegí una opción. La voz se activa solo cuando pulsás «Escuchar indicación».';
  }
  // Si se inicia la lectura del material, se detiene la indicación del asistente.
  document.addEventListener('click', function (e) {
    if (e.target.closest('#voz-escuchar')) { vozActiva = false; detener(); }
  }, true);
  if (ruta === 'material.html') {
    var pasos = [$('#paso-cargar'), $('#paso-revisar'), $('#paso-leer')].filter(Boolean);
    var observador = new MutationObserver(function () {
      if (!panel.hidden) actualizar();
    });
    pasos.forEach(function (p) { observador.observe(p, { attributes: true, attributeFilter: ['hidden'] }); });
  }
})();
