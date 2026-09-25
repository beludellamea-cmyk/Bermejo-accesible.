/* Bermejo Accesible · Ajustes de lectura de toda la web
   Guarda en este navegador solo tres preferencias: tamaño, contraste y tipo de letra.
   Nunca guarda textos ni archivos.

   Tipo de letra: «IMPRENTA MAYÚSCULA» (valor inicial) o «Texto habitual».
   La imprenta mayúscula NO cambia el texto de la página: se logra con una fuente
   propia («Bermejo Mayúscula») que dibuja cada minúscula con la forma de su
   mayúscula. Así, los lectores de pantalla, la lectura en voz alta, la búsqueda y
   el copiado reciben siempre el texto original, con sus nombres, siglas y archivos
   tal como fueron escritos. */
(function () {
  'use strict';

  var CLAVE = 'bermejo-accesible-preferencias';
  var ESCALAS = [100, 115, 130, 150, 175, 200];
  var INICIALES = { escala: 100, contraste: 'normal', letra: 'mayuscula' };
  var pref = { escala: INICIALES.escala, contraste: INICIALES.contraste, letra: INICIALES.letra };

  try {
    var guardadas = JSON.parse(localStorage.getItem(CLAVE));
    if (guardadas && ESCALAS.indexOf(guardadas.escala) !== -1) pref.escala = guardadas.escala;
    if (guardadas && (guardadas.contraste === 'alto' || guardadas.contraste === 'normal')) pref.contraste = guardadas.contraste;
    if (guardadas && (guardadas.letra === 'mayuscula' || guardadas.letra === 'habitual')) pref.letra = guardadas.letra;
  } catch (e) { /* sin almacenamiento disponible: se usan los valores iniciales */ }

  function aplicar() {
    var raiz = document.documentElement;
    raiz.style.fontSize = pref.escala + '%';
    raiz.setAttribute('data-contraste', pref.contraste);
    raiz.setAttribute('data-letra', pref.letra);
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(pref)); } catch (e) { /* ignorar */ }
  }

  // Se aplica antes de pintar la página para evitar parpadeos.
  aplicar();

  document.addEventListener('DOMContentLoaded', function () {
    var valor = document.getElementById('tam-valor');
    var anuncio = document.getElementById('ajustes-anuncio');
    var achicar = document.querySelector('[data-ajuste="achicar"]');
    var agrandar = document.querySelector('[data-ajuste="agrandar"]');
    var restablecer = document.querySelector('[data-ajuste="restablecer"]');
    var botonesContraste = document.querySelectorAll('[data-contraste-opcion]');
    var botonesLetra = document.querySelectorAll('[data-letra-opcion]');
    if (!valor) return;

    function avisar(texto) {
      if (!anuncio) return;
      anuncio.textContent = '';
      window.setTimeout(function () { anuncio.textContent = texto; }, 60);
    }

    function actualizar() {
      valor.textContent = pref.escala + ' %';
      achicar.setAttribute('aria-disabled', String(pref.escala === ESCALAS[0]));
      agrandar.setAttribute('aria-disabled', String(pref.escala === ESCALAS[ESCALAS.length - 1]));
      botonesContraste.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-contraste-opcion') === pref.contraste));
      });
      botonesLetra.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-letra-opcion') === pref.letra));
      });
    }

    function cambiarEscala(paso) {
      var i = ESCALAS.indexOf(pref.escala) + paso;
      if (i < 0) { avisar('El texto ya está en el tamaño más chico: 100 %.'); return; }
      if (i >= ESCALAS.length) { avisar('El texto ya está en el tamaño más grande: 200 %.'); return; }
      pref.escala = ESCALAS[i];
      aplicar(); guardar(); actualizar();
      avisar('Tamaño del texto: ' + pref.escala + ' %.');
    }

    achicar.addEventListener('click', function () { cambiarEscala(-1); });
    agrandar.addEventListener('click', function () { cambiarEscala(1); });

    botonesContraste.forEach(function (b) {
      b.addEventListener('click', function () {
        pref.contraste = b.getAttribute('data-contraste-opcion');
        aplicar(); guardar(); actualizar();
        avisar(pref.contraste === 'alto' ? 'Alto contraste activado.' : 'Contraste normal activado.');
      });
    });

    botonesLetra.forEach(function (b) {
      b.addEventListener('click', function () {
        pref.letra = b.getAttribute('data-letra-opcion');
        aplicar(); guardar(); actualizar();
        avisar(pref.letra === 'mayuscula'
          ? 'Letra en imprenta mayúscula activada. El texto no cambia para los lectores de pantalla.'
          : 'Texto habitual activado: mayúsculas y minúsculas como están escritas.');
      });
    });

    restablecer.addEventListener('click', function () {
      pref = { escala: INICIALES.escala, contraste: INICIALES.contraste, letra: INICIALES.letra };
      aplicar(); guardar(); actualizar();
      avisar('Ajustes restablecidos: texto al 100 %, contraste normal e imprenta mayúscula.');
    });

    actualizar();
  });
})();
