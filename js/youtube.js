/* YouTube: reproduce el enlace y adapta únicamente la transcripción pegada. */
(function () {
  'use strict';
  var urlCampo = document.getElementById('youtube-url');
  var textoCampo = document.getElementById('youtube-texto');
  var descripcion = document.getElementById('youtube-descripcion');
  var boton = document.getElementById('youtube-usar');
  var error = document.getElementById('youtube-error');
  var panel = document.getElementById('youtube-vista');
  var marco = document.getElementById('youtube-marco');
  if (!urlCampo || !boton) return;

  function idVideo(valor) {
    var u;
    try { u = new URL(valor.trim()); } catch (e) { return null; }
    if (u.protocol !== 'https:') return null;
    var host = u.hostname.toLowerCase();
    var id = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      var partes = u.pathname.split('/').filter(Boolean);
      if (partes.length === 1) id = partes[0];
    } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        var ruta = u.pathname.split('/').filter(Boolean);
        if (ruta.length === 2 && ['shorts', 'live', 'embed'].indexOf(ruta[0]) !== -1) id = ruta[1];
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }
  function aviso(mensaje) {
    error.hidden = !mensaje;
    error.textContent = mensaje || '';
    if (mensaje) error.focus();
  }
  function limpiar() {
    marco.replaceChildren();
    panel.hidden = true;
  }
  boton.addEventListener('click', function () {
    aviso('');
    var id = idVideo(urlCampo.value);
    if (!id) {
      aviso('Pegá un enlace válido de YouTube: youtube.com/watch, youtu.be, shorts o live.');
      return;
    }
    var texto = textoCampo.value.trim();
    if (!texto) {
      aviso('Pegá la transcripción del video para poder adaptarla. El enlace por sí solo no incluye el texto.');
      return;
    }
    if (texto.length > 100000) {
      aviso('La transcripción es demasiado larga. Dividila y cargá una parte por vez.');
      return;
    }
    if (typeof window.BermejoCargarTranscripcion !== 'function') {
      aviso('No se pudo abrir el lector. Actualizá la página y volvé a intentar.');
      return;
    }

    limpiar();
    var reproductorLocal = document.getElementById('video-reproductor');
    if (reproductorLocal) reproductorLocal.pause();
    document.getElementById('video-vista').hidden = true;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?cc_load_policy=1';
    iframe.title = 'Video de YouTube. Revisá la disponibilidad de subtítulos en el reproductor.';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    marco.appendChild(iframe);
    panel.hidden = false;

    var final = 'Transcripción del video\n\n' + texto;
    if (descripcion.value.trim()) final += '\n\nDescripción de imágenes importantes\n\n' + descripcion.value.trim();
    window.BermejoCargarTranscripcion(final, 'Video de YouTube', 'https://www.youtube.com/watch?v=' + id);
  });

  ['usar-ejemplo', 'usar-sociales', 'usar-texto', 'leer-pdf', 'leer-foto', 'video-usar',
    'otro-material', 'otro-material-2'].forEach(function (id) {
    var elemento = document.getElementById(id);
    if (elemento) elemento.addEventListener('click', limpiar, true);
  });
  window.addEventListener('pagehide', limpiar);
})();
