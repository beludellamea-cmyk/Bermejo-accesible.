/* Navegación voluntaria por voz en español. El chat intercultural no carga este script. */
(function () {
  'use strict';
  var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  var principal = document.querySelector('main');
  if (!principal) return;
  var caja = document.createElement('section');
  caja.className = 'voz-navegacion contenedor';
  caja.setAttribute('aria-labelledby', 'voz-navegacion-titulo');
  var titulo = document.createElement('h2');
  titulo.id = 'voz-navegacion-titulo';
  titulo.textContent = 'Recorrer la página con la voz';
  var ayuda = document.createElement('p');
  ayuda.textContent = 'Tocá «Usar voz» para dar una instrucción en español. Por ejemplo: «abrir material», «ir a docente», «agrandar letra» o «alto contraste». El micrófono se detiene después de cada frase.';
  var acciones = document.createElement('div');
  acciones.className = 'fila-botones';
  var comenzar = document.createElement('button');
  comenzar.type = 'button';
  comenzar.className = 'boton boton--principal';
  comenzar.textContent = 'Usar voz';
  var detener = document.createElement('button');
  detener.type = 'button';
  detener.className = 'boton';
  detener.textContent = 'Detener micrófono';
  detener.disabled = true;
  acciones.append(comenzar, detener);
  var estado = document.createElement('p');
  estado.id = 'voz-navegacion-estado';
  estado.setAttribute('role', 'status');
  estado.setAttribute('aria-live', 'polite');
  estado.textContent = Reconocimiento ? 'El micrófono está apagado.' : 'Este navegador no admite el reconocimiento de voz de la página. Podés usar los botones o el control por voz del dispositivo.';
  caja.append(titulo, ayuda, acciones, estado);
  principal.before(caja);
  if (!Reconocimiento) { comenzar.disabled = true; detener.disabled = true; return; }

  var escucha = null;
  var enCurso = false;
  var ultimoCampo = null;
  document.addEventListener('focusin', function (e) {
    if (e.target.matches('textarea, input[type="text"], input[type="search"]')) ultimoCampo = e.target;
  });
  function limpiar(texto) {
    return texto.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function cambiar(selector) {
    var boton = document.querySelector(selector);
    if (!boton) return false;
    boton.click();
    return true;
  }
  function enfocar(selector) {
    var destino = document.querySelector(selector);
    if (!destino || destino.closest('[hidden]')) return false;
    if (!destino.hasAttribute('tabindex') && !destino.matches('input,textarea,button,a,select')) destino.tabIndex = -1;
    destino.focus();
    destino.scrollIntoView({block:'start'});
    return true;
  }
  function responder(frase) {
    var orden = limpiar(frase);
    estado.textContent = 'Escuché: «' + frase + '». ';
    var paginas = [
      [/^(ir a |abrir |quiero |entrar a )?(inicio|portada)$/, 'index.html'],
      [/^(ir a |abrir |quiero |entrar a )?(mi )?(material|materiales)$/, 'material.html'],
      [/^(ir a |abrir |quiero |entrar a )?(espacio )?(docente|profesores)$/, 'docente.html'],
      [/^(ir a |abrir |quiero |entrar a )?(el )?(chat|chat intercultural)$/, 'qom.html']
    ];
    for (var i = 0; i < paginas.length; i++) {
      if (paginas[i][0].test(orden)) {
        estado.textContent += 'Abriendo ' + paginas[i][1] + '.';
        window.location.href = paginas[i][1];
        return;
      }
    }
    if (/^(agrandar|aumentar|mas grande)( la)? (letra|texto)$/.test(orden)) {
      estado.textContent += cambiar('[data-ajuste="agrandar"]') ? 'Texto agrandado.' : 'No pude cambiar el tamaño.';
    } else if (/^(achicar|reducir|mas chico)( la)? (letra|texto)$/.test(orden)) {
      estado.textContent += cambiar('[data-ajuste="achicar"]') ? 'Texto reducido.' : 'No pude cambiar el tamaño.';
    } else if (/^(alto contraste|activar alto contraste)$/.test(orden)) {
      estado.textContent += cambiar('[data-contraste-opcion="alto"]') ? 'Alto contraste activado.' : 'No pude cambiar el contraste.';
    } else if (/^(contraste normal|desactivar alto contraste)$/.test(orden)) {
      estado.textContent += cambiar('[data-contraste-opcion="normal"]') ? 'Contraste normal activado.' : 'No pude cambiar el contraste.';
    } else if (/^(imprenta mayuscula|letra mayuscula)$/.test(orden)) {
      estado.textContent += cambiar('[data-letra-opcion="mayuscula"]') ? 'Imprenta mayúscula activada.' : 'No pude cambiar la letra.';
    } else if (/^texto habitual$/.test(orden)) {
      estado.textContent += cambiar('[data-letra-opcion="habitual"]') ? 'Texto habitual activado.' : 'No pude cambiar la letra.';
    } else if (/^(ayuda|necesito ayuda|abrir ayuda)$/.test(orden)) {
      estado.textContent += cambiar('.ayuda-abrir') ? 'Ayuda abierta.' : 'No pude abrir la ayuda.';
    } else if (/^(consulta|ir a consulta|consultar situacion)$/.test(orden) && enfocar('#consulta-texto')) {
      estado.textContent += 'Consulta docente preparada.';
    } else if (/^(normativa|ir a normativa|resoluciones)$/.test(orden) && enfocar('#normativa')) {
      estado.textContent += 'Normativa abierta.';
    } else if (/^(ideas|buscar ideas)$/.test(orden) && enfocar('#ideas')) {
      estado.textContent += 'Ideas abiertas.';
    } else if (/^(pegar texto|escribir material|cargar texto)$/.test(orden) && enfocar('#texto-pegado')) {
      estado.textContent += 'Campo de texto preparado.';
    } else if (/^dictar? .+/.test(orden)) {
      var texto = frase.replace(/^dictar?\b[\s,.:;-]+/i, '').trim();
      if (ultimoCampo && ultimoCampo.isConnected && !ultimoCampo.disabled && !ultimoCampo.readOnly && !ultimoCampo.closest('[hidden]')) {
        var inicio = ultimoCampo.selectionStart == null ? ultimoCampo.value.length : ultimoCampo.selectionStart;
        var fin = ultimoCampo.selectionEnd == null ? inicio : ultimoCampo.selectionEnd;
        ultimoCampo.setRangeText(texto + ' ', inicio, fin, 'end');
        ultimoCampo.dispatchEvent(new Event('input', {bubbles:true}));
        ultimoCampo.focus();
        estado.textContent += 'Texto escrito en el campo; revisalo antes de enviarlo.';
      } else estado.textContent += 'Primero seleccioná un campo de texto y después decí «dictar» seguido de tu frase.';
    } else estado.textContent += 'No reconocí una instrucción. Probá «abrir material», «ir a docente», «agrandar letra» o «ayuda».';
  }
  comenzar.addEventListener('click', function () {
    if (enCurso) return;
    escucha = new Reconocimiento();
    escucha.lang = 'es-AR';
    escucha.continuous = false;
    escucha.interimResults = false;
    escucha.maxAlternatives = 1;
    escucha.onstart = function () {
      enCurso = true; comenzar.disabled = true; detener.disabled = false;
      estado.textContent = 'Escuchando una instrucción en español…';
    };
    escucha.onresult = function (e) { responder(e.results[0][0].transcript); };
    escucha.onerror = function (e) {
      estado.textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'No se permitió usar el micrófono. Revisá el permiso del sitio en el navegador.'
        : e.error === 'no-speech' ? 'No se escuchó ninguna frase. Podés volver a pulsar «Usar voz».'
        : 'No se pudo reconocer la voz. Probá de nuevo o usá los botones.';
    };
    escucha.onend = function () {
      enCurso = false; comenzar.disabled = false; detener.disabled = true;
      if (estado.textContent === 'Escuchando una instrucción en español…') estado.textContent = 'Micrófono detenido. Tocá «Usar voz» si querés dar otra instrucción.';
    };
    try { escucha.start(); } catch (_) {
      enCurso = false; comenzar.disabled = false; detener.disabled = true;
      estado.textContent = 'No se pudo iniciar el micrófono. Usá los botones o el control por voz del dispositivo.';
    }
  });
  detener.addEventListener('click', function () {
    if (escucha) escucha.abort();
    estado.textContent = 'Micrófono detenido por vos.';
  });
  window.addEventListener('pagehide', function () { if (escucha) escucha.abort(); });
}());
