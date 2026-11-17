/* ============================================================
   DESARROLLO — atajos para probar el juego sin pasarse los niveles.
   Se activa con el botón "DEV" de la esquina del mapa, o abriendo
   el juego con ?dev en la dirección. Se recuerda entre sesiones.

   Con el modo activo:
     - Todos los niveles del mapa están abiertos.
     - El menú de pausa ofrece las herramientas de la lista de abajo.
   Para añadir una herramienta, pon otra entrada en "herramientas".
   Si se borra este archivo, el juego funciona igual (sin modo DEV).
   ============================================================ */
CQ.desarrollo = (() => {
  const porDireccion = /[?&]dev\b/.test(location.search);
  const activo = () => porDireccion || !!CQ.ajustes.leer('desarrollo');

  /* Cada herramienta: texto del botón y qué hace con la partida en curso. */
  const herramientas = [
    { texto: 'Ganar el nivel', hacer: juego => juego.ganarYa() },
    { texto: '+500 CPU', hacer: juego => { juego.cpu += 500; } },
    { texto: 'Limpiar amenazas', hacer: juego => { for (const a of [...juego.amenazas]) juego.herirAmenaza(a, 1e9); } },
    { texto: 'Saltar la preparación', hacer: juego => juego.empezarHorda() },
  ];

  function alternar() {
    CQ.ajustes.guardar('desarrollo', !CQ.ajustes.leer('desarrollo'));
    return activo();
  }

  return { activo, alternar, herramientas, fijoPorDireccion: porDireccion };
})();
