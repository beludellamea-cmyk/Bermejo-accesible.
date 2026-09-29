/* Propuestas opcionales de IA. El original y la revisión docente permanecen en la página. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var endpoint = String(window.BERMEJO_CHAT_ENDPOINT || '').replace(/\/$/, '');
  var texto = $('#texto-editable');
  if (!texto) return;
  var originalRevisado = '';
  var actividadActual = null;
  function estado(id, mensaje) { $(id).textContent = mensaje; }
  function normal(s) { return String(s || '').trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function seguro(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  async function solicitar(ruta, datos) {
    if (!endpoint) throw new Error('Falta configurar la dirección del servicio de IA.');
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 30000);
    try {
      var r = await fetch(endpoint + ruta, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos),signal:ctrl.signal});
      var salida = await r.json();
      if (!r.ok) throw new Error(salida.error || 'El servicio de IA no respondió.');
      return salida;
    } finally { clearTimeout(timer); }
  }
  function iniciar() {
    originalRevisado = '';
    $('#ia-adaptar-resultado').hidden = true;
    $('#ia-consentimiento').checked = false;
    $('#ia-revision').checked = false;
    $('#ia-recuperar').hidden = true;
    estado('#ia-adaptar-estado','');
    actividadActual = null;
    $('#actividad-editor').hidden = true;
    $('#actividad-practica').hidden = true;
    $('#actividad-consentimiento').checked = false;
    $('#actividad-revisada').checked = false;
    estado('#actividad-estado','');
  }
  document.addEventListener('bermejo:material-nuevo', iniciar);
  texto.addEventListener('input', function () {
    if (!$('#ia-adaptar-resultado').hidden && originalRevisado && texto.value !== originalRevisado) {
      $('#ia-revision').checked = false;
      estado('#ia-adaptar-estado','El texto cambió después de generar la propuesta. Revisá de nuevo antes de aplicarla.');
    }
    if (actividadActual) {
      actividadActual = null;
      $('#actividad-practica').hidden = true;
      $('#actividad-revisada').checked = false;
      estado('#actividad-estado','El material cambió. Generá y revisá una nueva actividad para usarla.');
    }
  });
  $('#ia-adaptar').addEventListener('click', async function () {
    var fuente = texto.value.trim();
    if (!$('#ia-consentimiento').checked) return estado('#ia-adaptar-estado','Primero leé y marcá la confirmación sobre datos personales.');
    if (fuente.length < 20 || fuente.length > 6000) return estado('#ia-adaptar-estado','Usá un texto revisado de 20 a 6000 caracteres. Podés dividir un material largo en partes.');
    var boton = this; boton.disabled = true;
    estado('#ia-adaptar-estado','Creando propuesta. Esperá un momento…');
    try {
      var r = await solicitar('/adaptar',{texto:fuente,confirmacion:true});
      originalRevisado = fuente;
      $('#ia-original').textContent = fuente;
      $('#ia-propuesta').value = r.texto;
      $('#ia-adaptar-resultado').hidden = false;
      $('#ia-revision').checked = false;
      $('#ia-recuperar').hidden = true;
      estado('#ia-adaptar-estado','Propuesta recibida. Comparala y corregila. ' + (r.nota || ''));
      $('#ia-propuesta').focus();
    } catch (e) { estado('#ia-adaptar-estado',e.name === 'AbortError' ? 'El servicio tardó demasiado. Intentá de nuevo.' : e.message); }
    finally { boton.disabled = false; }
  });
  $('#ia-usar').addEventListener('click', function () {
    if (!$('#ia-revision').checked) return estado('#ia-adaptar-estado','La propuesta necesita revisión docente antes de usarla.');
    if (!$('#ia-propuesta').value.trim()) return estado('#ia-adaptar-estado','La propuesta está vacía. Corregila antes de continuar.');
    texto.value = $('#ia-propuesta').value.trim();
    $('#ia-recuperar').hidden = false;
    texto.dispatchEvent(new Event('input',{bubbles:true}));
    estado('#ia-adaptar-estado','Texto revisado aplicado. El original se conserva a la izquierda y podés recuperarlo.');
  });
  $('#ia-recuperar').addEventListener('click', function () {
    if (!originalRevisado) return;
    texto.value = originalRevisado; texto.dispatchEvent(new Event('input',{bubbles:true}));
    $('#ia-revision').checked = false;
    estado('#ia-adaptar-estado','Recuperaste el texto original revisado.');
  });
  $('#actividad-generar').addEventListener('click', async function () {
    var fuente = texto.value.trim();
    var materia = $('#actividad-materia').value.trim(), nivel = $('#actividad-nivel').value.trim();
    var formato = $('#actividad-formato').value;
    if (!$('#actividad-consentimiento').checked) return estado('#actividad-estado','Confirmá primero que quitaste los datos personales.');
    if (!materia || !nivel) return estado('#actividad-estado','Escribí la materia y el nivel o grado.');
    if (fuente.length < 20 || fuente.length > 6000) return estado('#actividad-estado','Usá un texto de 20 a 6000 caracteres.');
    var boton = this; boton.disabled = true;
    estado('#actividad-estado','Preparando una actividad. Esperá un momento…');
    try {
      var r = await solicitar('/actividad',{texto:fuente,materia,nivel,formato,confirmacion:true});
      $('#actividad-consigna').value = r.consigna;
      [1,2,3].forEach(function (i) { $('#actividad-opcion-'+i).value = r.opciones[i-1] || ''; });
      $('#actividad-respuesta').value = r.respuesta;
      $('#actividad-explicacion').value = r.explicacion;
      $('#actividad-opciones-editor').hidden = formato !== 'opciones';
      $('#actividad-revisada').checked = false;
      $('#actividad-editor').hidden = false;
      $('#actividad-practica').hidden = true;
      actividadActual = null;
      estado('#actividad-estado','Propuesta recibida. El docente debe corregirla y marcar la revisión antes de mostrarla.');
      $('#actividad-consigna').focus();
    } catch (e) { estado('#actividad-estado',e.name === 'AbortError' ? 'El servicio tardó demasiado. Intentá de nuevo.' : e.message); }
    finally { boton.disabled = false; }
  });
  $('#actividad-publicar').addEventListener('click', function () {
    if (!$('#actividad-revisada').checked) return estado('#actividad-estado','Marcá la revisión docente antes de mostrar la actividad.');
    var formato = $('#actividad-formato').value;
    var opciones = [1,2,3].map(i=>$('#actividad-opcion-'+i).value.trim());
    var consigna = $('#actividad-consigna').value.trim(), respuesta = $('#actividad-respuesta').value.trim();
    if (!consigna || !respuesta || (formato === 'opciones' && (opciones.some(x=>!x) || !opciones.includes(respuesta))))
      return estado('#actividad-estado','Completá la consigna y la respuesta. En opción múltiple, la respuesta correcta debe coincidir con una de las tres opciones.');
    actividadActual = {formato,consigna,respuesta,opciones:formato==='opciones'?opciones:[],explicacion:$('#actividad-explicacion').value.trim(),materia:$('#actividad-materia').value.trim(),nivel:$('#actividad-nivel').value.trim()};
    $('#actividad-pregunta').textContent = consigna;
    var lugar = $('#actividad-responder'); lugar.replaceChildren();
    if (formato === 'opciones') opciones.forEach(function (opcion, i) {
      var l = document.createElement('label'); l.className='actividad__opcion';
      var radio = document.createElement('input'); radio.type='radio'; radio.name='actividad-eleccion'; radio.value=opcion;
      l.append(radio,document.createTextNode(' '+opcion)); lugar.appendChild(l);
    });
    else {
      var label = document.createElement('label'); label.htmlFor='actividad-respuesta-usuario'; label.textContent='Tu respuesta';
      var campo = document.createElement('input'); campo.id='actividad-respuesta-usuario'; campo.type='text';
      lugar.append(label,campo);
    }
    $('#actividad-devolucion').textContent=''; $('#actividad-practica').hidden=false;
    estado('#actividad-estado','Actividad revisada y lista para practicar.');
    $('#actividad-pregunta').scrollIntoView({block:'center'});
  });
  $('#actividad-comprobar').addEventListener('click', function () {
    if (!actividadActual) return;
    var a = actividadActual;
    var elegido = a.formato==='opciones' ? document.querySelector('input[name="actividad-eleccion"]:checked')?.value : $('#actividad-respuesta-usuario').value.trim();
    if (!elegido) return $('#actividad-devolucion').textContent='Elegí o escribí una respuesta.';
    var mensaje = a.formato==='opciones' ? (normal(elegido)===normal(a.respuesta) ? '¡Bien! ' : 'Volvé a mirar el material. ') : 'Compará tu respuesta con la respuesta esperada. ';
    $('#actividad-devolucion').textContent = mensaje + 'Respuesta esperada: ' + a.respuesta + (a.explicacion ? '. ' + a.explicacion : '');
  });
  function htmlActividad(a) {
    var opciones = a.formato==='opciones' ? '<ol>'+a.opciones.map(x=>'<li>'+seguro(x)+'</li>').join('')+'</ol>' : '<p>Respuesta: ______________________________</p>';
    return '<!doctype html><html lang="es-AR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Actividad de '+seguro(a.materia)+'</title><style>body{font:20px/1.5 Arial,sans-serif;max-width:48rem;margin:auto;padding:1.5rem;color:#16313a}h1{font-size:1.6em}li{margin:.5em 0}details{margin-top:2rem;border-top:2px solid #006477;padding-top:1rem}@media print{body{padding:.5rem}}</style><main><h1>Actividad: '+seguro(a.materia)+'</h1><p>Nivel: '+seguro(a.nivel)+'</p><h2>'+seguro(a.consigna)+'</h2>'+opciones+'<details><summary>Respuesta para revisión docente</summary><p>'+seguro(a.respuesta)+'</p><p>'+seguro(a.explicacion)+'</p></details></main></html>';
  }
  $('#actividad-descargar').addEventListener('click', function () {
    if (!actividadActual) return;
    var url = URL.createObjectURL(new Blob([htmlActividad(actividadActual)],{type:'text/html;charset=utf-8'}));
    var a=document.createElement('a'); a.href=url; a.download='actividad-bermejo-accesible.html'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); },1000);
    estado('#actividad-estado','Se descargó la actividad revisada.');
  });
  $('#actividad-imprimir').addEventListener('click', function () {
    if (!actividadActual) return;
    document.body.classList.add('imprimir-actividad');
    window.addEventListener('afterprint', function () { document.body.classList.remove('imprimir-actividad'); },{once:true});
    window.print();
  });
})();
