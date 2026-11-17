/* ============================================================
   DETECTOR DE SOLAPES (herramienta de desarrollo, el juego no la carga).
   Recorre las pantallas del juego y avisa si algún elemento visible
   tapa a otro o se sale de la ventana. Útil para revisar el móvil.

   Uso, desde la consola con el juego abierto (mejor emulando un móvil):
     const s = document.createElement('script'); s.src = 'herramientas/solapes.js'; document.head.append(s);
     await CQ.solapes.recorrer()   // devuelve la lista de problemas por pantalla
   Deja el progreso guardado como estaba.
   ============================================================ */
CQ.solapes = (() => {
  const espera = ms => new Promise(r => setTimeout(r, ms));

  /* Elementos que el jugador ve y puede pulsar o leer. */
  function visibles() {
    const sel = '.boton, .carta, .nodo, #cpu, #cartelPrep, #mapaFicha, #mapaTitulo, #mapaBotones > *, #tutorialCaja, #girar, ' +
      '#capa .panel, #enciclopedia .panel, #faseNombre, #progreso, #coladas, #ficha, .flechas button, .ranura, .nodo .insignias';
    return [...document.querySelectorAll(sel)].filter(el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      if (!(r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05)) return false;
      // Los avisos que no reciben toques (pointer-events: none) no los detecta elementFromPoint: se dan por visibles.
      if (s.pointerEvents === 'none') return true;
      // Solo cuenta si se ve: algún punto del elemento no está tapado por una capa entera (mapa, paneles…).
      const puntos = [[0.5, 0.5], [0.15, 0.5], [0.85, 0.5], [0.5, 0.2], [0.5, 0.8]];
      return puntos.some(([fx, fy]) => {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
        const arriba = document.elementFromPoint(x, y);
        return arriba && (el.contains(arriba) || arriba.contains(el) || getComputedStyle(arriba).pointerEvents === 'none');
      });
    });
  }

  const nombre = el => el.id ? '#' + el.id : (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : el.tagName)
    + (el.textContent.trim() ? ' «' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 22) + '»' : '');

  /* Comprueba solapes entre elementos que no son padre/hijo y salidas de la ventana. */
  function revisar(titulo) {
    const els = visibles(), problemas = [];
    const W = innerWidth, H = innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      // Dentro de un panel con scroll no cuenta salirse de la ventana.
      const enScroll = el.closest('#capa, #enciclopedia, #mapa');
      if (!enScroll && (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1)) problemas.push('se sale: ' + nombre(el));
    }
    for (let i = 0; i < els.length; i++) for (let k = i + 1; k < els.length; k++) {
      const a = els[i], b = els[k];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ancho = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const alto = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ancho > 3 && alto > 3) problemas.push('tapa: ' + nombre(a) + '  ×  ' + nombre(b));
    }
    return { pantalla: titulo, problemas };
  }

  async function recorrer() {
    const A = CQ.ajustes, copia = {};
    for (const c of ['progreso', 'novedadesVistas', 'tutorialVisto', 'equipo', 'dificultad']) copia[c] = A.leer(c);
    const informe = [];
    const mirar = async t => { await espera(120); informe.push(revisar(t)); };
    try {
      A.guardar('progreso', {}); A.borrar(['tutorialVisto', 'novedadesVistas']);
      CQ.app.salirAlMapa(); const m = document.getElementById('mapa'); m.scrollTop = m.scrollHeight;
      await mirar('mapa abajo');
      document.querySelector('.nodo.abierto').click(); await mirar('ficha del nivel 1');
      document.getElementById('mapaBorrar').click(); await mirar('borrar progreso (paso 1)');
      document.querySelector('#mapaFicha [data-accion=seguir]').click(); await mirar('borrar progreso (paso 2)');
      document.querySelector('#mapaFicha [data-accion=cancelar]').click();
      document.getElementById('mapaEnciclopedia').click(); await mirar('enciclopedia'); CQ.enciclopedia.cerrar();
      // Tutorial
      CQ.tutorial.empezar(); await mirar('tutorial paso 1');
      document.querySelector('#tutorialCaja [data-t=siguiente]').click(); document.querySelector('#tutorialCaja [data-t=siguiente]').click(); await mirar('tutorial paso 3');
      // Nivel 5: novedades, equipo, partida
      A.guardar('tutorialVisto', true);
      CQ.app.nivelActual = 4; CQ.equipo.abrir(CQ.niveles[4]); await mirar('elegir equipo');
      document.querySelector('#capa [data-accion=empezar]').click(); await mirar('novedades');
      document.querySelector('#capa [data-accion=ok]').click(); await mirar('preparación');
      const j = CQ.app.juego; j.empezarHorda(); for (let i = 0; i < 400; i++) j.actualizar(0.05);
      await mirar('partida');
      document.querySelector('#cartas .carta').dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      await espera(600); await mirar('ficha de carta'); document.querySelector('#cartas .carta').dispatchEvent(new PointerEvent('pointerleave'));
      CQ.app.alternarPausa(); await mirar('pausa'); CQ.app.alternarPausa();
      j.cola.length = 0; for (const a of j.amenazas) a.x = j.columnas + 1; j.actualizar(0.05); await mirar('brecha (intermedio)');
      document.querySelector('#capa [data-accion=seguir]').click(); j.ganarYa(); await mirar('victoria');
      CQ.app.nivelActual = 9; CQ.app.nuevaPartida(null, CQ.equipo.porDefecto(CQ.niveles[9])); CQ.app.juego.ganarYa(); await mirar('cierre del juego');
      CQ.app.nivelActual = 0; CQ.app.nuevaPartida(null, CQ.equipo.porDefecto(CQ.niveles[0]));
      const j1 = CQ.app.juego; j1.empezarHorda(); j1.cola = [{ t: 0, tipo: 'virus', fila: 0 }]; j1.actualizar(0.05);
      j1.amenazas[0].x = j1.columnas + 1; j1.actualizar(0.05); await mirar('derrota');
    } finally {
      for (const c in copia) A.guardar(c, copia[c] === false ? undefined : copia[c]);
      CQ.app.salirAlMapa();
    }
    return informe.filter(p => p.problemas.length);
  }

  return { revisar, recorrer };
})();
