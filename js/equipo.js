/* ============================================================
   EQUIPO — pantalla previa al nivel donde el jugador elige qué
   defensas lleva y en qué orden (el orden decide la tecla de cada una).

   Lee del nivel:
     nivel.defensas   todas las defensas disponibles en ese nivel
     nivel.ranuras    cuántas se pueden llevar a la vez
   El equipo elegido se recuerda por nivel en los ajustes del navegador
   y se entrega al motor como "mazo" (ver CQ.Juego en motor.js).
   ============================================================ */
CQ.equipo = (() => {
  const $ = id => document.getElementById(id);
  let nivel = null, elegidas = [], arrastrada = null;

  const ranuras = () => nivel.ranuras || nivel.defensas.length;
  const tecla = i => (i + 1) % 10;   // la décima carta usa la tecla 0

  /* Equipo inicial para un nivel: el orden que el jugador usó la última vez
     (vale para todos los niveles) y, si sobran ranuras, las defensas nuevas. */
  function porDefecto(nivelPedido) {
    const guardado = CQ.ajustes.leer('equipo');
    const lista = (Array.isArray(guardado) ? guardado : []).filter(id => nivelPedido.defensas.includes(id));
    for (const id of nivelPedido.defensas) if (!lista.includes(id)) lista.push(id);
    return lista.slice(0, nivelPedido.ranuras || lista.length);
  }

  /* Abre la pantalla. Sin argumento usa el nivel actual. */
  function abrir(nivelElegido) {
    nivel = nivelElegido || CQ.niveles[CQ.app.nivelActual];
    elegidas = porDefecto(nivel);

    CQ.ui.panel(`
      <h2>Elige tu equipo</h2>
      <p>Lleva hasta <b>${ranuras()}</b> defensas. El orden marca su <b>tecla</b>: arrastra una carta o usa las flechas para recolocarla.</p>
      <div class="equipo" id="equipoRanuras"></div>
      <p class="rotulo">Disponibles · clic para añadir o quitar</p>
      <div class="equipo" id="equipoBanco"></div>
      <button class="boton grande" data-accion="empezar" id="equipoEmpezar">¡A defender!</button>
      <button class="boton" data-accion="volver">Volver</button>`,
      { empezar, volver: () => CQ.app.salirAlMapa() }, 'ancho');
    refrescar();
  }

  function empezar() {
    if (!elegidas.length) return;
    // Se guarda el orden elegido y, detrás, lo que ya había guardado de otros niveles.
    const anterior = CQ.ajustes.leer('equipo');
    CQ.ajustes.guardar('equipo', [...elegidas, ...(Array.isArray(anterior) ? anterior : []).filter(id => !elegidas.includes(id) && !nivel.defensas.includes(id))]);
    CQ.ui.cerrarPanel();
    CQ.app.nuevaPartida(null, elegidas.slice());
  }

  function alternar(id) {
    const i = elegidas.indexOf(id);
    if (i >= 0) elegidas.splice(i, 1);
    else if (elegidas.length < ranuras()) elegidas.push(id);
    refrescar();
  }

  function mover(desde, hasta) {
    if (hasta < 0 || hasta >= elegidas.length || desde === hasta) return;
    elegidas.splice(hasta, 0, elegidas.splice(desde, 1)[0]);
    refrescar();
  }

  /* Vuelve a pintar las ranuras y el banco sin recrear el panel. */
  function refrescar() {
    const filaRanuras = $('equipoRanuras'), banco = $('equipoBanco');
    filaRanuras.innerHTML = ''; banco.innerHTML = '';

    for (let i = 0; i < ranuras(); i++) {
      const hueco = document.createElement('div');
      hueco.className = 'ranura';
      const id = elegidas[i];
      if (!id) { hueco.innerHTML = `<span class="vacia">${tecla(i)}</span>`; filaRanuras.appendChild(hueco); continue; }

      const carta = CQ.ui.crearCarta(id, tecla(i));
      carta.draggable = true;
      carta.addEventListener('click', () => alternar(id));
      carta.addEventListener('dragstart', () => { arrastrada = i; });
      hueco.addEventListener('dragover', ev => ev.preventDefault());
      hueco.addEventListener('drop', ev => { ev.preventDefault(); if (arrastrada != null) mover(arrastrada, i); arrastrada = null; });

      const flechas = document.createElement('div');
      flechas.className = 'flechas';
      [['◀', i - 1], ['▶', i + 1]].forEach(([simbolo, destino]) => {
        const b = document.createElement('button');
        b.textContent = simbolo; b.disabled = destino < 0 || destino >= elegidas.length;
        b.addEventListener('click', () => mover(i, destino));
        flechas.appendChild(b);
      });
      hueco.append(carta, flechas);
      filaRanuras.appendChild(hueco);
    }

    for (const id of nivel.defensas) {
      const carta = CQ.ui.crearCarta(id, '');
      const dentro = elegidas.includes(id);
      carta.classList.toggle('usada', dentro);
      carta.classList.toggle('apagada', !dentro && elegidas.length >= ranuras());
      carta.addEventListener('click', () => alternar(id));
      banco.appendChild(carta);
    }
    $('equipoEmpezar').disabled = !elegidas.length;
  }

  return { abrir, porDefecto };
})();
