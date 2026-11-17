/* ============================================================
   DECORADOS — lo que se dibuja en la zona de entrada (izquierda).
   Cada escenario elige uno con "decoradoOrigen". Para crear otro
   (una terminal, una nube, un router…), registra un decorado nuevo.

   dibujar(api, juego, t) recibe:
     api.ctx   contexto del lienzo
     api.en    en(x, y, escala, fn): coloca el origen en una casilla (100 u = 1 casilla)
     api.D     utilidades de dibujo cartoon
   ============================================================ */

/* ---------- NAVEGADORES ----------
   Una ventana de navegador por carril. Cuando va a entrar una amenaza,
   la ventana muestra su web, su cara y una barra de descarga que se llena. */
CQ.registrarDecorado({
  id: 'navegadores',
  dibujar(api, juego, t) {
    const { ctx, en, D } = api;
    for (let fila = 0; fila < juego.filas; fila++) {
      const { lista, progreso } = juego.proximas(fila);
      const primera = lista[0];
      const def = primera ? CQ.amenazas[primera.tipo] : null;
      const urgente = primera && progreso > 0.7;
      const tiembla = urgente ? Math.sin(t * 40 + fila) * 1.5 : 0;

      en(-0.66, fila + 0.5, 1, () => {
        ctx.rotate((fila % 2 ? 1 : -1) * 0.02);
        ctx.translate(tiembla, 0);
        // Marco de la ventana.
        D.caja(ctx, 0, 0, 128, 86, 10, '#fff');
        // Barra de título (se pone roja cuando la descarga está a punto de acabar).
        ctx.beginPath(); ctx.roundRect(-64, -43, 128, 24, [10, 10, 0, 0]);
        D.trazo(ctx, urgente ? '#ff5d73' : primera ? '#ffd166' : '#b8c0cc', 4);
        ['#ff5d73', '#ffd166', '#80ed99'].forEach((c, i) => {
          ctx.beginPath(); ctx.arc(-53 + i * 10, -31, 3.5, 0, 7); ctx.fillStyle = urgente && i === 0 ? '#fff' : c; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = D.TINTA; ctx.stroke();
        });
        // Barra de direcciones.
        D.caja(ctx, 17, -31, 84, 14, 7, '#fff', 2.5);
        D.texto(ctx, def ? def.web || def.nombre : 'www', 17, -30.5, 9.5, D.TINTA, false);

        if (!primera) {
          // Ventana en reposo: un globo terráqueo dormido.
          ctx.globalAlpha = 0.45;
          D.circulo(ctx, 0, 12, 20, '#cfe8ff', 3.5);
          ctx.beginPath(); ctx.ellipse(0, 12, 9, 20, 0, 0, 7); ctx.moveTo(-20, 12); ctx.lineTo(20, 12);
          ctx.lineWidth = 2.5; ctx.strokeStyle = D.TINTA; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }

        // Cara de la amenaza que viene.
        primera.muestra = primera.muestra || CQ.crearAmenaza(primera.tipo, primera.fila, juego.fase.escalada);
        ctx.save();
        ctx.beginPath(); ctx.rect(-62, -18, 124, 44); ctx.clip();
        ctx.translate(-30, 4); ctx.scale(0.52, 0.52);
        def.dibujar(ctx, primera.muestra, t);
        ctx.restore();
        if (lista.length > 1) D.texto(ctx, '×' + lista.length, 26, 2, 22, '#fff');
        else D.texto(ctx, '!', 26, 2, 26, '#ff5d73');

        // Barra de descarga.
        D.caja(ctx, 0, 32, 112, 12, 6, '#fff', 3);
        ctx.fillStyle = urgente ? '#ff5d73' : '#4cc9f0';
        ctx.beginPath(); ctx.roundRect(-54, 28, 108 * Math.max(0.04, progreso), 8, 4); ctx.fill();
      });
    }
  },
});
