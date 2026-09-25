/* Video local con subtítulos y texto revisable. No transcribe ni sube archivos. */
(function () {
  'use strict';
  var videoArchivo = document.getElementById('archivo-video');
  var subtitulosArchivo = document.getElementById('archivo-subtitulos');
  var transcripcion = document.getElementById('video-transcripcion');
  var descripcion = document.getElementById('video-descripcion');
  var usar = document.getElementById('video-usar');
  var error = document.getElementById('video-error');
  var panel = document.getElementById('video-vista');
  var reproductor = document.getElementById('video-reproductor');
  var urls = [];

  function aviso(mensaje) {
    error.hidden = !mensaje;
    error.textContent = mensaje || '';
    if (mensaje) error.focus();
  }
  function limpiar() {
    reproductor.pause();
    reproductor.removeAttribute('src');
    reproductor.querySelectorAll('track').forEach(function (t) { t.remove(); });
    reproductor.load();
    urls.forEach(function (u) { URL.revokeObjectURL(u); });
    urls = [];
    panel.hidden = true;
  }
  function mostrarVideo(archivo) {
    limpiar();
    if (!archivo) return;
    var url = URL.createObjectURL(archivo);
    urls.push(url);
    reproductor.src = url;
    panel.hidden = false;
  }
  videoArchivo.addEventListener('change', function () {
    aviso('');
    var archivo = videoArchivo.files[0];
    if (archivo && !/\.(mp4|webm)$/i.test(archivo.name)) {
      limpiar();
      aviso('Elegí un video MP4 o WebM. Otros formatos pueden no abrirse en el navegador.');
      return;
    }
    mostrarVideo(archivo);
  });

  function cues(texto) {
    var grupos = texto.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
    var partes = [];
    grupos.forEach(function (grupo) {
      var lineas = grupo.trim().split('\n');
      var inicio = lineas.findIndex(function (l) { return /-->/.test(l); });
      if (inicio < 0) return;
      var palabras = lineas.slice(inicio + 1).join(' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (palabras && palabras !== partes[partes.length - 1]) partes.push(palabras);
    });
    return partes;
  }
  function textoCues(lista) {
    var parrafos = [];
    for (var i = 0; i < lista.length; i += 5) parrafos.push(lista.slice(i, i + 5).join(' '));
    return parrafos.join('\n\n');
  }
  function convertirVtt(texto) {
    var limpio = texto.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
    if (!/^WEBVTT(?:\s|$)/.test(limpio)) limpio = 'WEBVTT\n\n' + limpio;
    return limpio.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2') + '\n';
  }
  function ponerSubtitulos(vtt) {
    reproductor.querySelectorAll('track').forEach(function (t) { t.remove(); });
    var url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    urls.push(url);
    var pista = document.createElement('track');
    pista.kind = 'captions';
    pista.label = 'Español';
    pista.srclang = 'es';
    pista.src = url;
    pista.default = true;
    reproductor.appendChild(pista);
    pista.addEventListener('load', function () { pista.track.mode = 'showing'; });
  }

  usar.addEventListener('click', async function () {
    aviso('');
    var archivo = videoArchivo.files[0];
    if (!archivo || !/\.(mp4|webm)$/i.test(archivo.name)) {
      aviso('Primero elegí un video MP4 o WebM.');
      return;
    }
    if (archivo.size > 200 * 1024 * 1024) {
      aviso('El video supera 200 MB. Elegí una versión más liviana para reproducirla en este dispositivo.');
      return;
    }
    var subtitulos = subtitulosArchivo.files[0];
    var texto = transcripcion.value.trim();
    var vtt = '';
    if (subtitulos) {
      if (!/\.(srt|vtt|txt)$/i.test(subtitulos.name) || subtitulos.size > 1024 * 1024) {
        aviso('Elegí un archivo de subtítulos .srt, .vtt o .txt de hasta 1 MB.');
        return;
      }
      try {
        var contenido = await subtitulos.text();
        if (/\.(srt|vtt)$/i.test(subtitulos.name)) {
          var lista = cues(contenido);
          if (!lista.length) throw new Error('sin-cues');
          if (!texto) texto = textoCues(lista);
          vtt = convertirVtt(contenido);
        } else if (!texto) texto = contenido.trim();
      } catch (e) {
        aviso('No se pudo leer el archivo de subtítulos. Revisá su formato o pegá la transcripción.');
        return;
      }
    }
    if (!texto) {
      aviso('Para adaptar el video, agregá subtítulos o pegá una transcripción de lo que se dice.');
      return;
    }
    if (vtt) ponerSubtitulos(vtt);
    var final = 'Transcripción del video\n\n' + texto;
    if (descripcion.value.trim()) final += '\n\nDescripción de imágenes importantes\n\n' + descripcion.value.trim();
    if (typeof window.BermejoCargarTranscripcion === 'function') {
      window.BermejoCargarTranscripcion(final, archivo.name);
      reproductor.pause();
      panel.scrollIntoView({ block: 'start' });
    } else {
      aviso('No se pudo abrir el lector de textos. Actualizá la página y volvé a intentar.');
    }
  });

  ['usar-ejemplo', 'usar-sociales', 'usar-texto', 'leer-pdf', 'leer-foto', 'otro-material', 'otro-material-2'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function () { limpiar(); }, true);
  });
  window.addEventListener('pagehide', limpiar);
})();
