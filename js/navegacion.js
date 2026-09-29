/* Menú lateral y accesos a los paneles ya existentes. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var menu = document.getElementById('menu-principal');
    var abrir = document.querySelector('.menu-abrir');
    var ajustes = document.getElementById('ajustes');
    var movil = window.matchMedia('(max-width: 60rem)');
    function cerrarMenu(devolverFoco) {
      menu.dataset.menuCerrado = 'true';
      abrir.setAttribute('aria-expanded', 'false');
      if (devolverFoco) abrir.focus();
    }
    function adaptar() {
      if (movil.matches) cerrarMenu(false);
      else { delete menu.dataset.menuCerrado; abrir.setAttribute('aria-expanded', 'false'); }
    }
    adaptar();
    if (movil.addEventListener) movil.addEventListener('change', adaptar);
    else movil.addListener(adaptar);
    abrir.addEventListener('click', function () {
      var abierto = menu.dataset.menuCerrado === 'true';
      menu.dataset.menuCerrado = String(!abierto);
      abrir.setAttribute('aria-expanded', String(abierto));
      if (abierto) menu.querySelector('a').focus();
    });
    document.querySelectorAll('[data-abrir-ajustes]').forEach(function (b) {
      b.addEventListener('click', function () {
        ajustes.open = true;
        if (movil.matches) cerrarMenu(false);
        ajustes.querySelector('summary').focus();
      });
    });
    document.querySelectorAll('[data-abrir-ayuda]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (movil.matches) cerrarMenu(false);
        var ayuda = document.querySelector('.ayuda-abrir');
        if (ayuda) ayuda.click();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (ajustes.open) { ajustes.open = false; ajustes.querySelector('summary').focus(); }
      else if (movil.matches && menu.dataset.menuCerrado === 'false') cerrarMenu(true);
    });
  });
}());
