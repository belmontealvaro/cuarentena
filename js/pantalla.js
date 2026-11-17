/* ============================================================
   PANTALLA — modo pantalla completa (pensado para el móvil).

   Pone un botón "Pantalla completa" en el pie de la partida y en el
   mapa. Al activarlo oculta las barras del navegador y, si el móvil
   lo permite, fija la orientación en horizontal.

   El iPhone no deja poner una web en pantalla completa desde un botón;
   allí el botón no aparece, y la alternativa es "Añadir a pantalla de
   inicio" (manifest.webmanifest hace que se abra sin barras).
   Si se borra este archivo, el juego funciona igual.
   ============================================================ */
CQ.pantalla = (() => {
  const raiz = document.documentElement;
  const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
  const disponible = !!pedir && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const enCompleta = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const botones = [];

  function alternar() {
    if (enCompleta()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    Promise.resolve(pedir.call(raiz))
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
      .catch(() => { /* el navegador no deja bloquear la orientación: no pasa nada */ });
  }

  function pintar() {
    for (const b of botones) {
      const corto = b.classList.contains('lateral');
      b.textContent = enCompleta() ? (corto ? 'Salir' : 'Salir de pantalla completa') : (corto ? 'Pantalla completa' : 'Pantalla completa');
    }
  }

  /* Crea un botón y lo mete en el contenedor indicado (si el navegador lo permite).
     clase: clase extra para colocarlo con CSS. */
  function boton(contenedor, clase) {
    if (!disponible || !contenedor) return;
    const b = document.createElement('button');
    b.className = 'boton botonPantalla' + (clase ? ' ' + clase : '');
    b.addEventListener('click', alternar);
    contenedor.appendChild(b);
    botones.push(b);
    pintar();
  }

  document.addEventListener('fullscreenchange', pintar);
  document.addEventListener('webkitfullscreenchange', pintar);

  return { disponible, alternar, boton, enCompleta };
})();
