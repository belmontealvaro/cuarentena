/* ============================================================
   ESPECTÁCULO — todo lo que es "jugo" visual y no cambia ninguna
   regla: sacudida de pantalla, destellos, carteles, animaciones
   de muerte, chips que vuelan al contador y transición de fases.

   Escucha eventos del motor y lee datos de las definiciones:
     amenaza.muerte   { forma, colores, cantidad, sacudida… }
     amenaza.entrada  { cartel, sonido, oscurecer }
   El render le pide la cámara cada fotograma con camara().
   Si se borra este archivo, el juego sigue funcionando (sin adornos).
   ============================================================ */
CQ.espectaculo = (() => {
  const E = { sacudida: 0, destello: 0, colorDestello: '#fff', oscuro: 0, caida: 0, hundido: 0 };
  const mia = d => CQ.app && d.juego === CQ.app.juego;
  const cfg = () => CQ.config.efectos;

  function sacudir(fuerza) { if (CQ.ajustes.leer('sacudida')) E.sacudida = Math.max(E.sacudida, fuerza); }
  function destellar(color, fuerza) { E.colorDestello = color; E.destello = Math.max(E.destello, fuerza); }

  /* Cartel grande en el centro (jefes, avisos). */
  function cartel(texto) {
    const el = document.getElementById('cartel');
    if (!el) return;
    el.textContent = texto;
    el.classList.remove('visible'); void el.offsetWidth;   // reinicia la animación
    el.classList.add('visible');
  }

  /* Un chip sale volando desde el tablero hasta el contador de CPU. */
  function volarChip(chip) {
    const destino = document.getElementById('cpu');
    if (!destino || !CQ.render.aPantalla) return;
    const desde = CQ.render.aPantalla(chip.x, chip.y - chip.altura), r = destino.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'chipVolador'; el.textContent = '+';
    el.style.left = desde.x + 'px'; el.style.top = desde.y + 'px';
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = (r.top + r.height / 2) + 'px';
      el.style.transform = 'translate(-50%, -50%) scale(.5) rotate(200deg)';
    });
    setTimeout(() => {
      el.remove();
      destino.classList.remove('pum'); void destino.offsetWidth; destino.classList.add('pum');
    }, 420);
  }

  /* ---------------- Reacciones a eventos del motor ---------------- */
  CQ.eventos.on('amenazaEliminada', d => {
    if (!mia(d)) return;
    const a = d.amenaza, m = a.def.muerte || { forma: 'circulo', colores: ['#fff'], cantidad: 9 };
    d.juego.fx.lanzar({ ...m, x: a.x, y: a.fila + 0.5 });
    d.juego.fx.onda(a.x, a.fila + 0.5, a.radio * 1.4, m.colores[0]);
    if (m.sacudida) { sacudir(m.sacudida); destellar('#fff', 0.5); }
  });
  CQ.eventos.on('amenazaColada', d => {
    if (!mia(d)) return;
    sacudir(cfg().sacudidaColada); destellar('#ff5d73', 0.45);
  });
  CQ.eventos.on('defensaDestruida', d => {
    if (!mia(d)) return;
    sacudir(cfg().sacudidaDestruida);
    d.juego.fx.lanzar({ forma: 'astilla', colores: ['#adb5bd', '#fff'], cantidad: 10, x: d.defensa.col + 0.5, y: d.defensa.fila + 0.5 });
  });
  CQ.eventos.on('amenazaAparece', d => {
    if (!mia(d)) return;
    const entrada = d.amenaza.def.entrada;
    if (!entrada) return;
    if (entrada.cartel) cartel(entrada.cartel);
    if (entrada.oscurecer) E.oscuro = 1;
    if (entrada.sonido) d.juego.sonido(entrada.sonido);
    sacudir(8);
  });
  CQ.eventos.on('explosion', d => { if (mia(d)) { sacudir(d.fuerza || 10); destellar('#fff', 0.45); } });
  CQ.eventos.on('chipRecogido', d => { if (mia(d)) volarChip(d.chip); });
  CQ.eventos.on('faseIniciada', d => {
    if (!mia(d)) return;
    E.hundido = 0;
    if (d.juego.indiceFase > 0) { E.caida = 1; cartel(d.juego.fase.nombre.toUpperCase()); }
  });
  CQ.eventos.on('partidaNueva', () => { Object.assign(E, { sacudida: 0, destello: 0, oscuro: 0, caida: 0, hundido: 0 }); });

  return {
    sacudir, destellar, cartel,

    actualizar(dt, juego) {
      E.sacudida = Math.max(0, E.sacudida - dt * 40);
      E.destello = Math.max(0, E.destello - dt * 1.6);
      E.oscuro = Math.max(0, E.oscuro - dt * 0.45);
      E.caida = Math.max(0, E.caida - dt * 1.4);
      // Al terminar una fase con brecha, el tablero "se hunde" hacia la capa siguiente.
      const objetivo = juego && juego.estado === 'intermedio' ? 1 : 0;
      E.hundido += (objetivo - E.hundido) * Math.min(1, dt * 3);
    },

    /* Lo que el render aplica al tablero: desplazamiento, escala y velos de color. */
    camara(alto) {
      const c = E.caida, rebota = c * c * Math.abs(Math.cos(c * 7));   // cae desde arriba y rebota
      return {
        dx: (Math.random() - 0.5) * 2 * E.sacudida,
        dy: (Math.random() - 0.5) * 2 * E.sacudida - rebota * alto * 0.9 + E.hundido * alto * 0.06,
        escala: 1 - E.hundido * 0.12 + c * 0.05,
        oscuro: Math.min(0.55, E.oscuro * 0.4 + E.hundido * 0.35),
        destello: E.destello, colorDestello: E.colorDestello,
      };
    },
  };
})();
