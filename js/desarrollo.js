/* ============================================================
   DESARROLLO — atajos para probar el juego sin pasarse los niveles.
   Solo existe si el juego se abre con ?dev en la dirección
   (por ejemplo index.html?dev). Así no aparece en la web pública.
   Con ?dev sale el botón "DEV" en el mapa para apagarlo y encenderlo.

   Con el modo activo:
     - Todos los niveles del mapa están abiertos.
     - El menú de pausa ofrece las herramientas de la lista de abajo.
   Para añadir una herramienta, pon otra entrada en "herramientas".
   Si se borra este archivo, el juego funciona igual (sin modo DEV).
   ============================================================ */
CQ.desarrollo = (() => {
  const disponible = /[?&]dev\b/.test(location.search);
  const activo = () => disponible && !CQ.ajustes.leer('desarrolloApagado');

  /* Cada herramienta: texto del botón y qué hace con la partida en curso. */
  const herramientas = [
    { texto: 'Ganar el nivel', hacer: juego => juego.ganarYa() },
    { texto: '+500 CPU', hacer: juego => { juego.cpu += 500; } },
    { texto: 'Limpiar amenazas', hacer: juego => { for (const a of [...juego.amenazas]) juego.herirAmenaza(a, 1e9); } },
    { texto: 'Saltar la preparación', hacer: juego => juego.empezarHorda() },
  ];

  function alternar() {
    CQ.ajustes.guardar('desarrolloApagado', !CQ.ajustes.leer('desarrolloApagado'));
    return activo();
  }

  return { activo, alternar, herramientas, disponible };
})();
