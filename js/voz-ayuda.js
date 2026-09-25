/* Ayuda opcional por voz, disponible en Inicio, Material y Docentes. */
(function () {
  'use strict';
  var API = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!document.querySelector('main')) return;
  var pagina = location.pathname.split('/').pop() || 'index.html';
  var abrir = document.createElement('button');
  abrir.type = 'button'; abrir.className = 'boton voz-abrir';
  abrir.textContent = '🎙 Ayuda por voz';
  abrir.setAttribute('aria-expanded', 'false'); abrir.setAttribute('aria-controls', 'voz-panel');
  var panel = document.createElement('section');
  panel.id = 'voz-panel'; panel.className = 'voz-panel'; panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'voz-titulo');
  panel.innerHTML = '<div class="voz-panel__cabecera"><h2 id="voz-titulo" tabindex="-1">Ayuda por voz</h2><button type="button" class="boton" id="voz-cerrar">Cerrar</button></div><p id="voz-respuesta" role="status">Hola, ¿en qué puedo ayudarte? Podés decir: adaptar mi material, subir una foto, ir a docentes o necesito ayuda.</p><div class="fila-botones"><button type="button" class="boton boton--principal" id="voz-hablar">🎙 Hablar</button><button type="button" class="boton" id="voz-detener" disabled>Detener micrófono</button><button type="button" class="boton" id="voz-repetir">Escuchar respuesta</button></div><p id="voz-estado" role="status">Micrófono apagado.</p><p>También podés pedir: agrandar letra, alto contraste, escuchar el material, leer por partes, ver imágenes, ir a normativa o volver al inicio.</p>';
  document.body.append(abrir, panel);
  var $ = function (s) { return document.querySelector(s); };
  var respuesta = $('#voz-respuesta'), estado = $('#voz-estado');
  var hablar = $('#voz-hablar'), parar = $('#voz-detener');
  var reconocimiento, activo = false;
  if (!API) {
    hablar.disabled = true;
    estado.textContent = 'Este navegador no admite reconocimiento de voz. Usá los botones o «Necesito ayuda».';
  }
  function decir(s, voz) {
    respuesta.textContent = s;
    if (voz && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(s); u.lang = 'es-AR'; speechSynthesis.speak(u);
    }
  }
  function cerrar() {
    if (reconocimiento) reconocimiento.abort();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    panel.hidden = true; abrir.setAttribute('aria-expanded', 'false'); abrir.focus();
  }
  abrir.onclick = function () {
    if (!panel.hidden) return cerrar();
    panel.hidden = false; abrir.setAttribute('aria-expanded', 'true');
    $('#voz-titulo').focus(); decir(respuesta.textContent, true);
  };
  $('#voz-cerrar').onclick = cerrar;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) cerrar(); });
  $('#voz-repetir').onclick = function () { decir(respuesta.textContent, true); };
  function foco(sel) {
    var el = $(sel);
    if (!el || el.closest('[hidden]')) return false;
    if (!el.matches('input, textarea, select, button, a') && !el.hasAttribute('tabindex')) el.tabIndex = -1;
    el.focus(); el.scrollIntoView({block: 'center'}); return true;
  }
  function pulsar(sel) {
    var el = $(sel); if (!el || el.disabled || el.closest('[hidden]')) return false;
    el.click(); return true;
  }
  function ir(destino, sel, texto) {
    if (pagina === destino) return decir(foco(sel) ? texto : 'No encontré ese control. Podés usar los enlaces de la página.', true);
    sessionStorage.setItem('voz-destino', sel);
    decir(texto + ' Abriendo la sección.', true);
    setTimeout(function () { location.href = destino; }, 950);
  }
  function normal(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function comando(frase) {
    var s = normal(frase);
    estado.textContent = 'Escuché: «' + frase + '». Micrófono apagado.';
    if (/\b(inicio|portada|volver al inicio)\b/.test(s)) return ir('index.html', 'main h1', 'Vamos al inicio.');
    if (/\b(normativa|resolucion|resoluciones|leyes)\b/.test(s)) return ir('docente.html', '#normativa', 'Vamos a la normativa.');
    if (/\b(docente|docentes|profesor|profesores)\b/.test(s)) return ir('docente.html', 'main h1', 'Vamos al espacio docente.');
    if (/\b(ideas|recursos docentes)\b/.test(s)) return ir('docente.html', '#ideas', 'Vamos a las ideas para docentes.');
    if (/\b(ayuda|necesito ayuda)\b/.test(s)) {
      var ok = pulsar('.ayuda-abrir');
      decir(ok ? 'Abrí la ayuda con opciones visibles.' : 'Buscá el botón Necesito ayuda.', true);
      if (ok) { panel.hidden = true; abrir.setAttribute('aria-expanded', 'false'); }
      return;
    }
    if (/\b(chat|traducir|traduccion|qom|guarani)\b/.test(s)) return ir('qom.html', 'main h1', 'Vamos al chat intercultural. Revisá las traducciones antes de usarlas.');
    if (/\b(foto|sacar foto|camara)\b/.test(s)) return ir('material.html', '#archivo-foto', 'Elegí una foto y después pulsá Leer la foto.');
    if (/\b(pdf|documento)\b/.test(s)) return ir('material.html', '#archivo-pdf', 'Elegí un PDF y después pulsá Leer el PDF.');
    if (/\b(adaptar|pegar texto|escribir texto|cargar texto|mi material|materiales)\b/.test(s)) return ir('material.html', '#texto-pegado', 'Pegá o escribí tu texto y pulsá Usar este texto.');
    if (/\b(agrandar|aumentar|mas grande)\b/.test(s)) return decir(pulsar('[data-ajuste="agrandar"]') ? 'Agrandé la letra.' : 'No pude cambiar el tamaño.', true);
    if (/\b(achicar|reducir|mas chico)\b/.test(s)) return decir(pulsar('[data-ajuste="achicar"]') ? 'Reduje la letra.' : 'No pude cambiar el tamaño.', true);
    if (/\b(contraste)\b/.test(s)) return decir(pulsar(/normal|desactivar/.test(s) ? '[data-contraste-opcion="normal"]' : '[data-contraste-opcion="alto"]') ? 'Cambié el contraste.' : 'No pude cambiarlo.', true);
    if (/\b(escuchar|oir|voz alta)\b/.test(s)) {
      if (pagina !== 'material.html') return ir('material.html', '#texto-pegado', 'Primero cargá un material para escucharlo.');
      if ($('#paso-leer[hidden]')) return decir('Primero cargá tu material y tocá Continuar: elegir cómo leer.', true);
      pulsar('input[name="modo"][value="voz"]');
      if (pulsar('#voz-escuchar')) { respuesta.textContent = 'Comenzó la lectura. Usá los controles visibles para detenerla.'; return; }
      return decir('Elegí Lectura en voz alta y tocá Escuchar.', true);
    }
    if (/\b(partes|fragmentos|imagenes|pictogramas)\b/.test(s)) {
      if (pagina !== 'material.html') return ir('material.html', '#texto-pegado', 'Primero cargá tu material.');
      if ($('#paso-leer[hidden]')) return decir('Primero cargá tu material y continuá hasta las opciones de lectura.', true);
      var esPartes = /partes|fragmentos/.test(s);
      return decir(pulsar('input[name="modo"][value="' + (esPartes ? 'partes' : 'imagenes') + '"]') ? (esPartes ? 'Elegí lectura por partes.' : 'Elegí texto con imágenes.') : 'Buscá esta opción entre las formas de lectura.', true);
    }
    decir('No entendí esa instrucción. Probá: adaptar mi material, subir un PDF, ir a docentes o necesito ayuda.', true);
  }
  hablar.onclick = function () {
    if (!API || activo) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    reconocimiento = new API(); reconocimiento.lang = 'es-AR';
    reconocimiento.continuous = false; reconocimiento.interimResults = false;
    reconocimiento.onstart = function () { activo = true; hablar.disabled = true; parar.disabled = false; estado.textContent = 'Escuchando una frase…'; };
    reconocimiento.onresult = function (e) { comando(e.results[0][0].transcript); };
    reconocimiento.onerror = function (e) { estado.textContent = e.error === 'not-allowed' ? 'Revisá el permiso de micrófono del navegador.' : e.error === 'no-speech' ? 'No escuché ninguna frase. Volvé a pulsar Hablar.' : 'No pude reconocer la frase. Usá los botones.'; };
    reconocimiento.onend = function () { activo = false; hablar.disabled = false; parar.disabled = true; if (estado.textContent === 'Escuchando una frase…') estado.textContent = 'Micrófono apagado.'; };
    try { reconocimiento.start(); } catch (_) { estado.textContent = 'No se pudo encender el micrófono.'; }
  };
  parar.onclick = function () { if (reconocimiento) reconocimiento.abort(); estado.textContent = 'Micrófono apagado.'; };
  var pendiente = sessionStorage.getItem('voz-destino');
  if (pendiente !== null) { sessionStorage.removeItem('voz-destino'); if (pendiente) setTimeout(function () { foco(pendiente); }, 300); }
  window.addEventListener('pagehide', function () { if (reconocimiento) reconocimiento.abort(); });
}());
