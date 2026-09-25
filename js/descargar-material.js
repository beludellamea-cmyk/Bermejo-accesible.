/* Guarda la vista actual como HTML autónomo. No envía el material a un servidor. */
(function () {
  'use strict';

  var boton = document.getElementById('descargar-adaptado');
  if (!boton) return;

  function leerComoDatos(blob) {
    return new Promise(function (resolver, rechazar) {
      var lector = new FileReader();
      lector.onload = function () { resolver(lector.result); };
      lector.onerror = rechazar;
      lector.readAsDataURL(blob);
    });
  }

  async function incluirFuente() {
    if (document.documentElement.dataset.letra !== 'mayuscula') return '';
    try {
      var archivos = await Promise.all(['regular', 'negrita'].map(async function (peso) {
        var respuesta = await fetch('fuentes/bermejo-mayuscula-' + peso + '.woff');
        if (!respuesta.ok) throw new Error('fuente');
        return leerComoDatos(await respuesta.blob());
      }));
      return '@font-face{font-family:BermejoExport;src:url("' + archivos[0] + '") format("woff");font-weight:400}' +
        '@font-face{font-family:BermejoExport;src:url("' + archivos[1] + '") format("woff");font-weight:700}';
    } catch (error) {
      return '';
    }
  }

  async function incluirPictogramas(copia) {
    var imagenes = Array.from(copia.querySelectorAll('img[src^="https://static.arasaac.org/pictograms/"]'));
    var faltan = 0;
    for (var i = 0; i < imagenes.length; i++) {
      try {
        var respuesta = await fetch(imagenes[i].src);
        if (!respuesta.ok) throw new Error('imagen');
        imagenes[i].src = await leerComoDatos(await respuesta.blob());
      } catch (error) {
        // El texto alternativo queda disponible aunque el dispositivo esté sin red.
        faltan++;
      }
    }
    return faltan;
  }

  async function incluirLaminas(copia) {
    var imagenes = Array.from(copia.querySelectorAll('.lamina__foto'));
    if (!imagenes.length) return false;
    try {
      var respuesta = await fetch('img/laminas-formosa-ia.png');
      if (!respuesta.ok) throw new Error('imagen');
      var datos = await leerComoDatos(await respuesta.blob());
      imagenes.forEach(function (imagen) { imagen.src = datos; });
      return true;
    } catch (error) {
      imagenes.forEach(function (imagen) { imagen.remove(); });
      return false;
    }
  }

  function cssSeguro(valor, alternativo) {
    // Los valores provienen de los controles de lectura de la página.
    return /^[#(),.%\w\s-]+$/.test(valor || '') ? valor : alternativo;
  }

  boton.addEventListener('click', async function () {
    var original = document.getElementById('lectura');
    var editor = document.getElementById('texto-editable');
    var aviso = document.getElementById('anuncio');
    if (!original || !editor || !editor.value.trim()) {
      if (aviso) aviso.textContent = 'Primero cargá un material y revisá el texto.';
      return;
    }
    if (document.querySelector('input[name="modo"]:checked').value === 'pictogramas' &&
        !document.getElementById('cancelar-pictos').hidden) {
      if (aviso) aviso.textContent = 'Esperá a que termine la búsqueda de pictogramas antes de descargar.';
      return;
    }

    boton.disabled = true;
    var textoBoton = boton.textContent;
    boton.textContent = 'Preparando descarga…';
    try {
      var copia = original.cloneNode(true);
      copia.removeAttribute('id');
      copia.removeAttribute('style');
      copia.querySelectorAll('.marca-lectura').forEach(function (n) { n.remove(); });
      copia.querySelectorAll('.leyendo').forEach(function (n) { n.classList.remove('leyendo'); });
      copia.querySelectorAll('.parte__acciones, #partes-progreso').forEach(function (n) { n.remove(); });
      copia.querySelectorAll('h4').forEach(function (n) {
        var h = document.createElement('h2');
        Array.from(n.attributes).forEach(function (a) { h.setAttribute(a.name, a.value); });
        while (n.firstChild) h.appendChild(n.firstChild);
        n.replaceWith(h);
      });
      // La copia usa enlaces normales: el índice continúa funcionando sin JS.
      var pictosConInternet = await incluirPictogramas(copia);
      var laminasIncluidas = await incluirLaminas(copia);
      var fuentes = await incluirFuente();
      var mayuscula = document.documentElement.dataset.letra === 'mayuscula' && !!fuentes;
      var modo = document.querySelector('input[name="modo"]:checked');
      var esVoz = modo && modo.value === 'voz';
      var nombreModo = document.getElementById('nombre-modo').textContent;
      var estilo = getComputedStyle(original);
      var tam = cssSeguro(estilo.fontSize, '20px');
      var inter = cssSeguro(estilo.lineHeight, '1.8');
      var letras = cssSeguro(estilo.letterSpacing, 'normal');
      var palabras = cssSeguro(estilo.wordSpacing, 'normal');
      var ancho = cssSeguro(estilo.getPropertyValue('--l-ancho').trim(), '62ch');
      var fondo = cssSeguro(estilo.backgroundColor, '#ffffff');
      var tinta = cssSeguro(estilo.color, '#15222c');
      var fuente = mayuscula ? 'BermejoExport,Arial,sans-serif' :
        (/mono/.test(original.dataset.fuente) ? '"Courier New",monospace' :
          /serif/.test(original.dataset.fuente) ? 'Georgia,serif' : 'Arial,sans-serif');
      var avisoPictos = pictosConInternet ?
        '<p class="nota">Algunos pictogramas necesitan internet para aparecer. El texto permanece disponible.</p>' : '';
      var avisoFuente = document.documentElement.dataset.letra === 'mayuscula' && !fuentes ?
        '<p class="nota">No se pudo incluir la imprenta mayúscula en este archivo. El texto se muestra en letra habitual.</p>' : '';
      var avisoLaminas = copia.querySelector('.laminas-formosa') && !laminasIncluidas ?
        '<p class="nota">No se pudieron incluir las ilustraciones en este archivo; sus descripciones escritas siguen disponibles.</p>' : '';
      var ayudaVoz = esVoz ? '<div class="voz"><button type="button" id="escuchar">Escuchar material</button> ' +
        '<button type="button" id="detener">Detener</button><p id="estado-voz" role="status"></p></div>' : '';
      var scriptVoz = esVoz ? '<script>(function(){var estado=document.getElementById("estado-voz");' +
        'document.getElementById("escuchar").onclick=function(){if(!("speechSynthesis" in window)){estado.textContent="Este navegador no tiene lectura en voz alta.";return;}' +
        'speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(document.querySelector("article").innerText);u.lang="es-AR";' +
        'u.onend=function(){estado.textContent="Terminó la lectura."};speechSynthesis.speak(u);estado.textContent="Leyendo material."};' +
        'document.getElementById("detener").onclick=function(){if("speechSynthesis" in window)speechSynthesis.cancel();estado.textContent="Lectura detenida."};' +
        'window.addEventListener("pagehide",function(){if("speechSynthesis" in window)speechSynthesis.cancel()})})();<\/script>' : '';

      var css = fuentes + '\n' +
        '*{box-sizing:border-box}html{font-size:100%}body{margin:0;padding:clamp(1rem,4vw,2.5rem);font-family:' + fuente +
        ';font-size:' + tam + ';line-height:' + inter + ';letter-spacing:' + letras + ';word-spacing:' + palabras +
        ';background:' + fondo + ';color:' + tinta + ';overflow-wrap:anywhere}' +
        'main{max-width:76rem;margin:auto}h1{font-size:1.6em;line-height:1.25}h2{font-size:1.23em;line-height:1.3;margin:1.3em 0 .5em}' +
        'p,li{max-width:' + ancho + '}a{color:inherit;text-decoration:underline}a:focus-visible,button:focus-visible{outline:3px solid currentColor;outline-offset:4px}' +
        'article p{margin:0 0 1em}article ol,article ul{padding-left:1.5em}.nota{font-size:.85em}' +
        '.indice-partes,.parte{border-top:2px solid currentColor;padding-top:.8em;margin-top:1.4em}.parte__num{display:block;font-size:.8em}' +
        '.con-apoyo{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;margin-block:1rem}' +
        '.apoyos,.pictos{list-style:none;display:flex;flex-wrap:wrap;gap:.75rem;padding:0}.apoyo,.picto{width:min(8.5rem,100%);margin:0;text-align:center;font-size:.8em}' +
        'figure svg,figure img{display:block;max-width:100%;height:auto;margin:auto}' +
        '.laminas-formosa{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:1rem 0}' +
        '.lamina{min-width:0;margin:0;border:2px solid currentColor;border-radius:.5rem;overflow:hidden}' +
        '.lamina__foto{width:100%;max-width:100%;aspect-ratio:1;object-fit:cover}' +
        '.lamina__foto--1{object-position:left center}.lamina__foto--2{object-position:center center}.lamina__foto--3{object-position:right center}' +
        '.lamina figcaption{padding:.5rem;font-weight:bold}@media(max-width:45rem){.laminas-formosa{grid-template-columns:minmax(0,1fr)}}' +
        'button{font:inherit;padding:.6em .9em;background:' +
        fondo + ';color:' + tinta + ';border:2px solid currentColor;border-radius:.4em;cursor:pointer}' +
        '@media(max-width:40rem){.con-apoyo{grid-template-columns:minmax(0,1fr)}}@media print{.voz{display:none}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}' +
        '@media(forced-colors:active){body,button{background:Canvas;color:CanvasText}}';
      var html = '<!doctype html>\n<html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Mi material adaptado | Bermejo Accesible</title><style>' + css + '</style></head><body><main>' +
        '<h1>Mi material adaptado</h1><p class="nota">Forma elegida: ' + nombreModo +
        '. Podés abrir este archivo en el navegador o imprimirlo y guardarlo como PDF.</p>' + avisoPictos + avisoFuente + avisoLaminas + ayudaVoz +
        '<article aria-label="Material adaptado">' + copia.innerHTML + '</article>' +
        '<footer><p class="nota">Creado con Bermejo Accesible. Revisá el contenido antes de compartirlo.</p>' +
        (copia.querySelector('.pictos') ? '<p class="nota">Pictogramas: Sergio Palao. Origen: ARASAAC. Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).</p>' : '') +
        '</footer></main>' + scriptVoz + '</body></html>';

      var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mi-material-adaptado.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      if (aviso) aviso.textContent = 'Se descargó mi-material-adaptado.html. Abrilo para ver el material y, si querés, imprimirlo como PDF.';
    } catch (error) {
      if (aviso) aviso.textContent = 'No se pudo preparar la descarga. Probá otra vez o descargá el texto desde el paso 2.';
    } finally {
      boton.disabled = false;
      boton.textContent = textoBoton;
    }
  });
})();
