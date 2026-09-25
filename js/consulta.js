/* Bermejo Accesible · «Contame qué pasa en tu aula»
   Consulta docente por situación. Todo se procesa en el navegador: el texto
   no se envía ni se guarda.

   Cómo funciona: se buscan palabras clave en la situación descripta y se
   muestran los casos preparados que coinciden. Si nada coincide, se dice
   claramente y se ofrecen temas relacionados. Nunca se generan respuestas
   nuevas ni se responden preguntas legales. Cada fundamento indica su fuente. */
(function () {
  'use strict';

  var URL_2481 = 'https://archivos.formosa.gob.ar/media/uploads/documentos/documento_1720711093.pdf';
  var URL_26206 = 'https://www.argentina.gob.ar/normativa/nacional/ley-26206-123542/actualizacion';
  var URL_26378 = 'https://www.argentina.gob.ar/normativa/nacional/ley-26378-141317/texto';

  /* ---------- Fundamentos (revisados en septiembre de 2026) ---------- */
  var F = {
    r2481: {
      destacado: true,
      titulo: 'Resolución 2481/24 del Ministerio de Cultura y Educación de Formosa',
      texto: 'Si el o la estudiante tiene una discapacidad, temporal o permanente, este marco provincial orienta a sostener su trayectoria en la escuela con configuraciones de apoyo y, cuando corresponda, un Proyecto Pedagógico para la Inclusión (PPI), en trabajo conjunto con la Modalidad de Educación Especial.',
      url: URL_2481, enlace: 'Leer la Resolución 2481/24 (PDF oficial)'
    },
    cfe311: {
      titulo: 'Resolución CFE 311/16',
      texto: 'Pide brindar configuraciones de apoyo y ajustes razonables a estudiantes con discapacidad, y valorar sus saberes de acuerdo con los apoyos previstos. Su Anexo III distingue barreras de acceso físico, de la comunicación y didácticas.',
      url: 'https://www.bnm.me.gov.ar/giga1/normas/RCFE_311-16.pdf', enlace: 'Leer la Resolución CFE 311/16 (PDF)'
    },
    ley44: {
      titulo: 'Ley de Educación Nacional 26.206, artículo 44, inciso c',
      texto: 'Las autoridades educativas deben asegurar los recursos técnicos y materiales necesarios para que estudiantes con discapacidad desarrollen el currículo escolar.',
      url: URL_26206, enlace: 'Leer la Ley 26.206 (texto actualizado)'
    },
    ley11e: {
      titulo: 'Ley de Educación Nacional 26.206, artículo 11, inciso e',
      texto: 'Fija como objetivo garantizar la inclusión educativa con políticas universales y estrategias pedagógicas.',
      url: URL_26206, enlace: 'Leer la Ley 26.206 (texto actualizado)'
    },
    eib: {
      titulo: 'Ley de Educación Nacional 26.206, artículos 11 (inciso ñ) y 52',
      texto: 'Asegura a los pueblos indígenas el respeto a su lengua y a su identidad cultural, y define la modalidad de Educación Intercultural Bilingüe.',
      url: URL_26206, enlace: 'Leer la Ley 26.206 (texto actualizado)'
    },
    conv24: {
      titulo: 'Convención sobre los Derechos de las Personas con Discapacidad, artículo 24 (Ley 26.378, con jerarquía constitucional por Ley 27.044)',
      texto: 'Reconoce el derecho a una educación inclusiva, con ajustes razonables y apoyos. Menciona el Braille, la lengua de señas y otros formatos y medios de comunicación.',
      url: URL_26378, enlace: 'Leer la Ley 26.378'
    },
    conv9: {
      titulo: 'Convención sobre los Derechos de las Personas con Discapacidad, artículo 9 (Ley 26.378)',
      texto: 'Trata la accesibilidad, incluida la de la información y las comunicaciones.',
      url: URL_26378, enlace: 'Leer la Ley 26.378'
    },
    lsa: {
      titulo: 'Ley 27.710 de Lengua de Señas Argentina (2023)',
      texto: 'Reconoce la Lengua de Señas Argentina (LSA) como lengua natural y originaria de las personas sordas y promueve eliminar barreras comunicacionales.',
      url: 'https://www.argentina.gob.ar/normativa/nacional/norma-383041/texto', enlace: 'Leer la Ley 27.710'
    },
    dua: {
      titulo: 'Diseño Universal para el Aprendizaje (CAST) · referencia pedagógica, no es una norma',
      texto: 'Propone ofrecer varias formas de presentar la información, varias formas de responder y varias formas de sostener el interés.',
      url: 'https://udlguidelines.cast.org/', enlace: 'Ver las pautas DUA (en inglés)'
    },
    wcag: {
      titulo: 'WCAG 2.2 del W3C · referencia técnica, no es una ley',
      texto: 'Recomienda que el texto sea texto real y no una imagen de texto (criterio 1.4.5) y que se pueda ampliar sin perder contenido (1.4.4).',
      url: 'https://www.w3.org/TR/WCAG22/', enlace: 'Ver WCAG 2.2 (en inglés)'
    }
  };

  /* ---------- Casos preparados ---------- */
  var CASOS = [
    {
      id: 'lectura', tema: 'Le cuesta leer textos largos',
      claves: [['le cuesta leer', 4], ['lee lento', 3], ['lee muy lento', 3], ['texto largo', 3], ['textos largos', 3], ['silabe', 3], ['deletre', 2], ['dislexi', 3], ['decodific', 3], ['fluidez', 2], ['se cansa', 2], ['no termina de leer', 3], ['lectura', 1], ['leer', 1], ['lee', 1], ['fotocopia', 1]],
      barrera: 'El texto es largo, denso o con letra chica, y la tarea exige leerlo todo de una vez y en poco tiempo. La barrera está en el formato y en la exigencia, no en el estudiante.',
      acciones: [
        'Dividí el texto en partes cortas con títulos que anticipen de qué trata cada una.',
        'Marcá las ideas clave o entregá una versión en lenguaje claro junto al original.',
        'Ofrecé el texto en Bermejo Accesible (Acceder a mi material): por partes, con letra más grande o en voz alta.',
        'Leé en voz alta o proponé lectura compartida antes de la tarea individual.',
        'Dale más tiempo o reducí la cantidad de texto sin cambiar el contenido que se aprende.'
      ],
      fundamentos: ['r2481', 'dua', 'ley11e', 'cfe311']
    },
    {
      id: 'consignas', tema: 'No entiende las consignas',
      claves: [['consigna', 3], ['no entiende', 2], ['no comprende', 2], ['comprension', 2], ['enunciado', 2], ['instruccion', 2], ['hace otra cosa', 2], ['palabras dificiles', 2], ['vocabulario', 1], ['pregunta', 1], ['autismo', 1]],
      barrera: 'Las consignas piden varias cosas a la vez, usan palabras poco conocidas o dan por sabido cómo se hace la tarea.',
      acciones: [
        'Escribí una acción por consigna y empezá con el verbo: «Leé», «Marcá», «Escribí».',
        'Numerá los pasos y mostrá un ejemplo resuelto.',
        'Leé la consigna en voz alta y pedí que alguien la cuente con sus palabras.',
        'Explicá las palabras nuevas la primera vez que aparecen. Los pictogramas pueden acompañar, sin reemplazar el texto.',
        'Revisá la consigna con el revisor de texto de esta página.'
      ],
      fundamentos: ['r2481', 'dua', 'ley11e']
    },
    {
      id: 'vision', tema: 'No ve bien: pizarrón, letra chica, fotocopias',
      claves: [['baja vision', 4], ['no ve bien', 3], ['ve poco', 3], ['letra chica', 3], ['letra pequena', 3], ['pizarron', 2], ['se acerca', 2], ['anteojo', 2], ['lupa', 2], ['ampliar', 2], ['vista', 2], ['visual', 2], ['fotocopia', 1], ['no ve', 2], ['contraste', 1]],
      barrera: 'La información llega solo por la vista y con poco tamaño o contraste: pizarrón lejano, fotocopias grises, letra chica o imágenes sin descripción.',
      acciones: [
        'Ubicá al estudiante cerca del pizarrón y de la luz, sin reflejos, y preguntale dónde ve mejor.',
        'Decí en voz alta lo que escribís en el pizarrón.',
        'Compartí el material en formato digital para que pueda ampliarlo en el celular o la computadora, o usar Bermejo Accesible.',
        'En papel, usá letra grande y sin adornos (por ejemplo, 18 puntos o más), buen contraste y sin fondos con dibujos.',
        'Coordiná con el equipo de Educación Especial los apoyos que necesite (ampliaciones, lupas u otros recursos).'
      ],
      fundamentos: ['r2481', 'ley44', 'conv24', 'wcag']
    },
    {
      id: 'ceguera', tema: 'Estudiante ciego o que usa lector de pantalla',
      claves: [['ciego', 4], ['ciega', 4], ['ceguera', 4], ['no vidente', 4], ['braille', 4], ['lector de pantalla', 3], ['baston', 2], ['tactil', 2], ['no ve', 2]],
      barrera: 'El material está solo impreso o es una imagen (foto o PDF escaneado), y los gráficos no tienen descripción.',
      acciones: [
        'Compartí los textos en un formato con texto real (documento de texto o PDF con texto), no como foto.',
        'Describí con palabras las imágenes, gráficos y mapas que enseñan algo.',
        'Anticipá los materiales al equipo de apoyo con tiempo para prepararlos en Braille o en relieve.',
        'Nombrá lo que señalás: en vez de «esto va acá», decí «la palabra agua va en el primer casillero».',
        'Si solo tenés una fotocopia, podés pasarla a texto con Bermejo Accesible y revisarlo antes de compartirlo.'
      ],
      fundamentos: ['r2481', 'conv24', 'ley44']
    },
    {
      id: 'auditiva', tema: 'No escucha bien o es sordo',
      claves: [['sord', 4], ['hipoacus', 4], ['no escucha', 3], ['no oye', 3], ['audifono', 4], ['implante', 3], ['lengua de senas', 4], ['lsa', 3], ['senas', 2], ['interprete', 2], ['subtitul', 3], ['labio', 2], ['auditiv', 3], ['video', 2], ['audio', 2], ['escucha', 1]],
      barrera: 'La información llega solo por la voz: explicaciones orales, videos sin subtítulos, audios, avisos dichos de espaldas o con ruido.',
      acciones: [
        'Hablá de frente, con buena luz en la cara, y sin tapar la boca.',
        'Escribí en el pizarrón las consignas, fechas y palabras clave.',
        'Usá videos con subtítulos o compartí la transcripción; acompañá con imágenes.',
        'Si el estudiante se comunica en Lengua de Señas Argentina, coordiná con la dirección y la Modalidad de Educación Especial la presencia de intérprete o de apoyos en LSA.',
        'Ubicalo donde vea a quien habla y a sus compañeros, lejos del ruido.'
      ],
      fundamentos: ['r2481', 'lsa', 'conv24', 'ley44']
    },
    {
      id: 'responder', tema: 'Le cuesta escribir o responder por escrito',
      claves: [['no puede escribir', 4], ['le cuesta escribir', 4], ['escribir', 2], ['escribe', 2], ['escritura', 2], ['a mano', 2], ['letra ilegible', 3], ['motric', 3], ['lapiz', 2], ['copiar', 2], ['evaluacion', 2], ['examen', 2], ['prueba', 1], ['responder', 2], ['oral', 2], ['dictado', 2], ['tarda', 1]],
      barrera: 'Hay una sola forma de mostrar lo aprendido: escribir a mano, rápido y en papel. Así se evalúa la escritura en vez del contenido.',
      acciones: [
        'Aceptá otras formas de respuesta: oral, grabación de audio, dibujo, elegir entre opciones o unir con flechas.',
        'Permití escribir con teclado o celular, o dictar la respuesta.',
        'Reducí la copia del pizarrón: entregá el texto ya escrito.',
        'Dale más tiempo y evaluá el contenido, no la prolijidad de la letra.',
        'Si hay una discapacidad, acordá estos ajustes con el equipo y dejalos por escrito en el PPI.'
      ],
      fundamentos: ['r2481', 'cfe311', 'dua']
    },
    {
      id: 'atencion', tema: 'Se distrae o se pierde en tareas largas',
      claves: [['se distrae', 3], ['distrae', 2], ['atencion', 2], ['concentr', 2], ['se pierde', 2], ['organiz', 2], ['muchos pasos', 2], ['tdah', 2], ['inquiet', 2], ['no termina', 1]],
      barrera: 'La tarea es larga, tiene muchos pasos sin separar o la hoja tiene mucha información junta.',
      acciones: [
        'Dividí la tarea en pasos cortos con una lista para ir tachando lo hecho.',
        'Dejá los pasos a la vista durante toda la actividad.',
        'Usá hojas limpias, con espacio y sin decoraciones que distraigan.',
        'Anticipá qué se va a hacer en la clase y cuánto tiempo lleva cada parte.',
        'Proponé pausas breves y controles intermedios en lugar de una sola entrega al final.'
      ],
      fundamentos: ['r2481', 'dua', 'ley11e']
    },
    {
      id: 'lengua', tema: 'Habla otra lengua en su casa (qom, wichí, pilagá u otra)',
      nota: 'Hablar otra lengua no es una discapacidad. La Resolución 2481/24 no se aplica por la lengua: corresponde solo si además hay una discapacidad.',
      claves: [['qom', 4], ['toba', 3], ['wichi', 4], ['pilaga', 4], ['nivacle', 4], ['indigena', 3], ['originari', 3], ['lengua materna', 3], ['no habla castellano', 4], ['castellano', 2], ['bilingue', 2], ['otra lengua', 3], ['guarani', 3], ['migrante', 2]],
      barrera: 'El material y las explicaciones están solo en castellano escolar, con palabras y referencias que no forman parte de la experiencia del estudiante.',
      acciones: [
        'Trabajá con los docentes y referentes de Educación Intercultural Bilingüe de tu escuela o zona.',
        'Armá un glosario de palabras clave con imágenes y, si es posible, su traducción.',
        'Aceptá respuestas en la lengua del estudiante cuando lo que se evalúa no es el castellano.',
        'Usá ejemplos del entorno y la cultura del estudiante.',
        'Acompañá los textos con imágenes o pictogramas, sin reemplazar el texto.'
      ],
      fundamentos: ['eib', 'dua']
    },
    {
      id: 'digitales', tema: 'Los materiales son fotos o PDF escaneados',
      claves: [['escane', 3], ['pdf', 2], ['whatsapp', 2], ['foto de la', 2], ['fotos', 1], ['archivo', 2], ['classroom', 2], ['plataforma', 2], ['digital', 2], ['imagen de texto', 3], ['captura', 2]],
      barrera: 'Los materiales circulan como fotos o PDF escaneados: no se pueden ampliar bien ni leer con lector de pantalla o con la voz del celular.',
      acciones: [
        'Compartí el archivo original con texto real (documento de texto o PDF exportado, no escaneado).',
        'Si solo tenés la foto, pasala a texto con Bermejo Accesible, revisá el resultado y compartí ese texto.',
        'Usá títulos reales del procesador de textos y nombres de archivo claros.',
        'No mandes la consigna solo en audio o solo en imagen: sumá siempre el texto.',
        'Describí las imágenes que tengan información importante.'
      ],
      fundamentos: ['r2481', 'conv9', 'wcag']
    }
  ];

  var LEGALES = ['es legal', 'ilegal', 'me obliga', 'obligad', 'obligatori', 'puedo negarme', 'negarme', 'denunci', 'demanda', 'juicio', 'abogad', 'sancion', 'sumario', 'licencia', 'cud', 'certificado unico', 'amparo', 'reclamo', 'me pueden', 'responsabilidad legal', 'multa'];

  /* ---------- Utilidades ---------- */
  function $(s) { return document.querySelector(s); }
  function crear(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function normalizar(t) {
    return ' ' + t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ@.\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  }
  // La clave tiene que empezar al inicio de una palabra.
  function contiene(texto, clave) { return texto.indexOf(' ' + clave) !== -1; }

  function puntuar(texto) {
    return CASOS.map(function (c) {
      var p = 0;
      c.claves.forEach(function (k) { if (contiene(texto, k[0])) p += k[1]; });
      return { caso: c, puntos: p };
    }).filter(function (r) { return r.puntos >= 2; })
      .sort(function (a, b) { return b.puntos - a.puntos; });
  }

  function datosPersonales(original) {
    var hallados = [];
    if (/\b\d{1,2}\.?\d{3}\.?\d{3}\b/.test(original)) hallados.push('un número que parece un documento');
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(original)) hallados.push('un correo electrónico');
    if (/(\+?54[\s-]?)?(\d{3,4}[\s-]?)\d{6,7}\b/.test(original.replace(/\b\d{1,2}\.?\d{3}\.?\d{3}\b/g, ''))) hallados.push('un número que parece un teléfono');
    if (/\b(se llama|llamad[oa]|de nombre|mi alumn[oa] [A-ZÁÉÍÓÚÑ]|el alumno [A-ZÁÉÍÓÚÑ]|la alumna [A-ZÁÉÍÓÚÑ])/i.test(original)) hallados.push('lo que parece un nombre');
    if (/\b(dni|domicilio|vive en la calle)\b/i.test(original)) hallados.push('datos de documento o domicilio');
    return hallados;
  }

  /* ---------- Elementos ---------- */
  var form = $('#consulta-form');
  if (!form) return;
  var campo = $('#consulta-texto');
  var error = $('#consulta-error');
  var resultado = $('#consulta-resultado');
  var temas = $('#consulta-temas');

  function botonTema(c) {
    var b = crear('button', 'boton', c.tema);
    b.type = 'button';
    b.setAttribute('aria-controls', 'consulta-resultado');
    b.addEventListener('click', function () { limpiarError(); mostrar([{ caso: c }], { elegido: true }); });
    return b;
  }
  CASOS.forEach(function (c) {
    var li = crear('li');
    li.appendChild(botonTema(c));
    temas.appendChild(li);
  });

  function limpiarError() {
    error.hidden = true;
    error.textContent = '';
    campo.removeAttribute('aria-invalid');
    campo.setAttribute('aria-describedby', 'consulta-ayuda');
  }
  function mostrarError(msj) {
    error.textContent = 'Error: ' + msj;
    error.hidden = false;
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', 'consulta-error consulta-ayuda');
    campo.focus();
  }

  function renderCaso(c) {
    var art = crear('article', 'caso');
    var idT = 'caso-' + c.id + '-t';
    art.setAttribute('aria-labelledby', idT);
    var h = crear('h4', null, c.tema); h.id = idT;
    art.appendChild(h);
    if (c.nota) art.appendChild(crear('p', 'aviso', c.nota));

    art.appendChild(crear('h5', null, 'Barrera posible'));
    art.appendChild(crear('p', null, c.barrera));

    art.appendChild(crear('h5', null, 'Acciones pedagógicas'));
    var ul = crear('ul');
    c.acciones.forEach(function (a) { ul.appendChild(crear('li', null, a)); });
    art.appendChild(ul);

    art.appendChild(crear('h5', null, 'Fundamento'));
    var fl = crear('ul', 'fundamento');
    c.fundamentos.forEach(function (k) {
      var f = F[k];
      var li = crear('li', f.destacado ? 'fundamento--destacado' : null);
      if (f.destacado) li.appendChild(crear('span', 'fundamento__etiqueta', 'Norma provincial destacada'));
      li.appendChild(crear('p', null, null)).appendChild(crear('strong', null, f.titulo));
      li.appendChild(crear('p', null, f.texto));
      var a = crear('a', null, f.enlace);
      a.href = f.url;
      li.appendChild(crear('p')).appendChild(a);
      fl.appendChild(li);
    });
    art.appendChild(fl);
    art.appendChild(crear('p', 'caso__revision', 'Sujeto a revisión docente. Es una orientación general: no reemplaza el texto oficial de las normas ni las decisiones de tu equipo, la dirección y la supervisión.'));
    return art;
  }

  function mostrar(encontrados, opciones) {
    opciones = opciones || {};
    resultado.textContent = '';
    var titulo = crear('h3');
    titulo.id = 'consulta-resultado-t';
    titulo.tabIndex = -1;
    resultado.appendChild(titulo);

    if (opciones.datos && opciones.datos.length) {
      var d = crear('div', 'consulta__aviso-datos');
      d.setAttribute('role', 'note');
      d.appendChild(crear('p', null, 'Atención: tu consulta parece incluir ' + opciones.datos.join(', ') + '. No hace falta para buscar orientaciones: borralo. El texto no salió de tu dispositivo.'));
      resultado.appendChild(d);
    }
    if (opciones.legal) {
      var l = crear('div', 'consulta__fuera');
      l.appendChild(crear('p', null, null)).appendChild(crear('strong', null, 'No respondo preguntas legales ni administrativas.'));
      l.appendChild(crear('p', null, 'Tu consulta parece preguntar qué es obligatorio, qué se puede reclamar o qué trámite corresponde. Eso depende del caso y del texto completo de cada norma: consultalo con la dirección, la supervisión o el área legal del Ministerio de Cultura y Educación de Formosa. Abajo solo hay orientaciones pedagógicas, si se encontraron.'));
      resultado.appendChild(l);
    }

    if (!encontrados.length) {
      titulo.textContent = 'No tengo una orientación preparada para esta situación';
      var fuera = crear('div', 'consulta__fuera');
      fuera.appendChild(crear('p', null, 'Las orientaciones preparadas cubren barreras de lectura, comprensión, acceso visual y auditivo, formas de responder, atención, lengua y materiales digitales. Para no darte una respuesta inventada, no propongo acciones para otras situaciones.'));
      fuera.appendChild(crear('p', null, 'Podés hablarlo con tu equipo, la dirección o la Modalidad de Educación Especial, revisar tu material con la guía de esta página o elegir un tema relacionado:'));
      var lista = crear('ul', 'consulta__temas');
      CASOS.forEach(function (c) { var li = crear('li'); li.appendChild(botonTema(c)); lista.appendChild(li); });
      fuera.appendChild(lista);
      resultado.appendChild(fuera);
    } else {
      titulo.textContent = opciones.elegido
        ? 'Orientación: ' + encontrados[0].caso.tema
        : (encontrados.length === 1 ? 'Encontré 1 orientación para tu situación' : 'Encontré ' + encontrados.length + ' orientaciones para tu situación');
      encontrados.forEach(function (r) { resultado.appendChild(renderCaso(r.caso)); });
      var mas = crear('p');
      mas.appendChild(document.createTextNode('Para consultar otras normas, usá la '));
      var a = crear('a', null, 'biblioteca de normativa');
      a.href = '#normativa';
      mas.appendChild(a);
      mas.appendChild(document.createTextNode('.'));
      resultado.appendChild(mas);
    }
    titulo.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    limpiarError();
    var original = campo.value.trim();
    var palabras = original.split(/\s+/).filter(Boolean).length;
    if (!original) { mostrarError('Escribí la situación antes de buscar.'); return; }
    if (palabras < 4) { mostrarError('Contá la situación con un poco más de detalle (al menos cuatro palabras).'); return; }
    var texto = normalizar(original);
    var encontrados = puntuar(texto);
    if (encontrados.length) {
      var tope = encontrados[0].puntos;
      encontrados = encontrados.filter(function (r) { return r.puntos >= Math.max(2, tope / 2); }).slice(0, 3);
    }
    mostrar(encontrados, {
      datos: datosPersonales(original),
      legal: LEGALES.some(function (k) { return contiene(texto, k); })
    });
  });

  $('#consulta-borrar').addEventListener('click', function () {
    campo.value = '';
    limpiarError();
    resultado.textContent = '';
    campo.focus();
  });

  window.BermejoConsulta = { puntuar: puntuar, normalizar: normalizar, datosPersonales: datosPersonales, CASOS: CASOS };
})();
