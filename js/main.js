/* ============================================================
   ARRANQUE — crea la partida y ejecuta el bucle de juego.
   ============================================================ */
CQ.app = {
  juego: null,
  pausa: false,
  indiceVelocidad: 0,
  nivelActual: 0,

  mazo: null,   // equipo elegido en la pantalla previa (lista ordenada de ids)

  /* Empieza una partida. Sin nivel juega el actual con la dificultad elegida;
     con un nivel (p. ej. el del tutorial) juega ese en dificultad normal.
     mazo: defensas elegidas y ordenadas por el jugador (opcional). */
  nuevaPartida(nivel, mazo) {
    CQ.audio.activar();
    this.pausa = false;
    this.mazo = mazo || null;
    CQ.config.dificultad = nivel ? 1 : this.dificultad().vida;
    this.juego = new CQ.Juego(nivel || CQ.niveles[this.nivelActual], { defensas: this.mazo });
    CQ.eventos.emitir('partidaNueva', { juego: this.juego });
  },
  /* Entra al nivel actual desde el mapa. Decide qué toca antes de jugar:
     el tutorial (primera vez en un nivel con guia), la pantalla de equipo
     (si hay más defensas que las básicas) o directamente la partida. */
  entrarNivel() {
    const nivel = CQ.niveles[this.nivelActual];
    if (nivel.guia && !CQ.ajustes.leer('tutorialVisto')) return CQ.tutorial.empezar();
    if (nivel.defensas.length <= CQ.config.interfaz.equipoSinElegir) return this.nuevaPartida(null, CQ.equipo.porDefecto(nivel));
    CQ.equipo.abrir(nivel);
  },
  /* Abandona la partida en curso y vuelve al mapa de niveles. */
  salirAlMapa() {
    this.juego = null; this.pausa = false;
    if (CQ.musica) CQ.musica.parar();
    CQ.ui.mostrarMenu();
  },
  /* Repite la partida con el mismo nivel y el mismo equipo. */
  reiniciar() { this.nuevaPartida(this.juego && this.juego.nivel !== CQ.niveles[this.nivelActual] ? this.juego.nivel : null, this.mazo); },
  dificultad() {
    const id = CQ.ajustes.leer('dificultad') || 'normal';
    return CQ.config.dificultades.find(d => d.id === id) || CQ.config.dificultades[0];
  },
  alternarPausa() {
    const j = this.juego;
    if (!j || (j.estado !== 'preparacion' && j.estado !== 'horda')) return;
    this.pausa = !this.pausa;
    CQ.eventos.emitir('pausa', { activa: this.pausa });
  },
  fijarVelocidad(indice) { this.indiceVelocidad = indice; },
};

/* Borra restos de versiones anteriores del guardado (récords sueltos y equipos por nivel). */
function limpiarGuardadoAntiguo() {
  try {
    for (const clave of Object.keys(localStorage)) if (clave.startsWith('cuarentena_record')) localStorage.removeItem(clave);
  } catch (e) { /* sin almacenamiento */ }
  CQ.ajustes._cargar();
  const viejas = Object.keys(CQ.ajustes._valores).filter(c => c.startsWith('equipo_') || c === 'desarrollo');
  if (viejas.length) CQ.ajustes.borrar(viejas);
}

window.addEventListener('DOMContentLoaded', () => {
  limpiarGuardadoAntiguo();
  CQ.render.iniciar(document.getElementById('lienzo'));
  CQ.ui.iniciar();

  // Partida de fondo para que el menú tenga tablero detrás.
  const decorado = new CQ.Juego(CQ.niveles[0]);
  CQ.eventos.emitir('partidaNueva', { juego: decorado });
  let anterior = performance.now();

  function fotograma(ahora) {
    const dt = Math.min(0.05, (ahora - anterior) / 1000);
    anterior = ahora;
    const juego = CQ.app.juego;
    // Con el mapa abierto solo se pinta el mapa (tapa todo lo demás).
    if (CQ.mapa && CQ.mapa.abierto()) { CQ.mapa.dibujar(ahora / 1000); requestAnimationFrame(fotograma); return; }
    if (CQ.espectaculo) CQ.espectaculo.actualizar(dt, juego);
    if (CQ.tutorial) CQ.tutorial.actualizar();
    if (juego) {
      if (!CQ.app.pausa) {
        const pasos = CQ.config.velocidades[CQ.app.indiceVelocidad];
        for (let i = 0; i < pasos; i++) juego.actualizar(dt);
      }
      CQ.render.dibujar(juego, CQ.ui.vista, ahora / 1000);
      CQ.ui.actualizar(juego);
    } else {
      CQ.render.dibujar(decorado, CQ.ui.vista, ahora / 1000);
    }
    requestAnimationFrame(fotograma);
  }
  requestAnimationFrame(fotograma);
});
