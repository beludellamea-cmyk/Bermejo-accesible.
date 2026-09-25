(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var nombres = {qom:'qom', wichi:'wichí', pilaga:'pilagá', nivacle:'nivaclé', guarani:'guaraní'};
  var historial = [];
  var traduciendo = false;
  var endpoint = String(window.BERMEJO_CHAT_ENDPOINT || '').trim();
  var roles = document.querySelectorAll('input[name="chat-rol"]');
  function rol() { return document.querySelector('input[name="chat-rol"]:checked').value; }
  function estado(s) { $('chat-estado').textContent = s; }
  function fallo(s) { $('chat-error').textContent = s; $('chat-error').hidden = false; }
  function etiqueta() {
    var alumno = rol() === 'estudiante';
    $('chat-texto-label').textContent = alumno ? 'Tu mensaje en ' + nombres[$('chat-lengua').value] : 'Tu mensaje en español';
    $('chat-texto').lang = alumno ? ({qom:'tob',wichi:'und',pilaga:'plg',nivacle:'cag',guarani:'gn'}[$('chat-lengua').value]) : 'es-AR';
  }
  roles.forEach(function (r) { r.addEventListener('change', etiqueta); });
  $('chat-lengua').addEventListener('change', function () {
    if (historial.length) { estado('La lengua elegida cambió. La conversación anterior sigue visible, pero las próximas traducciones usarán la lengua nueva.'); }
    etiqueta();
  });
  etiqueta();
  if (!/^https:\/\/[^\s]+$/.test(endpoint)) {
    $('chat-servicio').textContent = 'El chat con IA todavía necesita conectar el servicio de traducción. Consultá las instrucciones del README para activarlo; esta página no inventará respuestas de prueba.';
    $('chat-traducir').disabled = true;
  } else $('chat-servicio').textContent = 'Servicio de IA configurado. Traducciones automáticas sujetas a revisión.';

  function parrafo(titulo, texto, lang) {
    var p = document.createElement('p');
    var b = document.createElement('strong'); b.textContent = titulo + ': ';
    var span = document.createElement('span'); span.lang = lang; span.textContent = texto;
    p.append(b, span);
    return p;
  }
  function mostrar(m) {
    $('chat-vacio').hidden = true;
    var item = document.createElement('li');
    var h = document.createElement('h3'); h.textContent = m.rol === 'estudiante' ? 'Estudiante' : 'Docente'; item.appendChild(h);
    var lengua = m.lengua, origen = m.rol === 'estudiante' ? nombres[lengua] : 'español', destino = m.rol === 'estudiante' ? 'español' : nombres[lengua];
    item.appendChild(parrafo('Original en ' + origen, m.original, m.rol === 'estudiante' ? ({qom:'tob',wichi:'und',pilaga:'plg',nivacle:'cag',guarani:'gn'}[lengua]) : 'es-AR'));
    var trad = parrafo('Propuesta en ' + destino, m.traduccion, m.rol === 'estudiante' ? 'es-AR' : ({qom:'tob',wichi:'und',pilaga:'plg',nivacle:'cag',guarani:'gn'}[lengua])); item.appendChild(trad);
    var aviso = document.createElement('p'); aviso.textContent = '⚠ Traducción automática: puede contener errores. ' + (m.nota || 'Verificá el sentido con una persona hablante.'); item.appendChild(aviso);
    var editar = document.createElement('button'); editar.type = 'button'; editar.className = 'boton'; editar.textContent = 'Corregir esta traducción'; item.appendChild(editar);
    editar.addEventListener('click', function () {
      if (item.querySelector('textarea')) return;
      var label = document.createElement('label'); label.textContent = 'Versión corregida en ' + destino;
      var ta = document.createElement('textarea'); ta.rows = 3; ta.maxLength = 1500; ta.value = m.traduccion; ta.lang = trad.querySelector('span').lang;
      var id = 'correccion-' + historial.indexOf(m); label.htmlFor = id; ta.id = id;
      var guardar = document.createElement('button'); guardar.type='button';guardar.className='boton';guardar.textContent='Guardar corrección';
      item.append(label,ta,guardar);ta.focus();
      guardar.addEventListener('click',function () {
        if (!ta.value.trim()) { ta.focus();return; }
        m.traduccion=ta.value.trim();m.nota='Versión corregida por una persona. Verificar con hablantes de la comunidad.';
        trad.querySelector('span').textContent=m.traduccion;aviso.textContent='Versión corregida por una persona; verificar con hablantes de la comunidad.';
        label.remove();ta.remove();guardar.remove();editar.focus();
      });
    });
    $('chat-mensajes').appendChild(item);
  }
  $('chat-form').addEventListener('submit', async function (ev) {
    ev.preventDefault(); if (traduciendo || !endpoint) return;
    var texto = $('chat-texto').value.trim(); if (!texto) { fallo('Escribí un mensaje antes de traducir.'); $('chat-texto').focus(); return; }
    $('chat-error').hidden = true;
    traduciendo = true; $('chat-traducir').disabled = true; estado('La IA está preparando una traducción.');
    var abort = new AbortController(); var timeout = setTimeout(function () { abort.abort(); }, 25000);
    var seleccionado = $('chat-lengua').value, quien = rol();
    try {
      var res = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({texto:texto, rol:quien, lengua:seleccionado, contexto:historial.slice(-6).map(function (m) { return {rol:m.rol, original:m.original, traduccion:m.traduccion, lengua:m.lengua}; })}), signal:abort.signal});
      var data = await res.json();
      if (!res.ok) throw new Error(res.status === 429 ? 'El servicio recibió demasiadas solicitudes. Intentá de nuevo en un momento.' : (data.error || 'El servicio no respondió correctamente.'));
      if (!data.traduccion || typeof data.traduccion !== 'string') throw new Error('La IA no devolvió una traducción legible. Intentá reformular la frase.');
      var m={rol:quien,lengua:seleccionado,original:texto,traduccion:data.traduccion.slice(0,1500),nota:typeof data.nota==='string' ? data.nota.slice(0,250) : ''};
      historial.push(m); mostrar(m);$('chat-texto').value=''; estado('Traducción propuesta agregada a la conversación. Revisá que exprese lo que querías decir.'); $('chat-texto').focus();
    } catch (e) { fallo(e.name === 'AbortError' ? 'El servicio tardó demasiado. Intentá otra vez.' : e.message || 'No se pudo traducir el mensaje.'); estado('No se agregó ningún mensaje sin traducción.'); }
    finally { clearTimeout(timeout); traduciendo=false; $('chat-traducir').disabled=false; }
  });
  $('chat-limpiar').addEventListener('click',function () { historial=[];$('chat-mensajes').replaceChildren();$('chat-vacio').hidden=false;estado('Conversación borrada de esta pantalla.');$('chat-error').hidden=true;$('chat-texto').focus(); });
}());
