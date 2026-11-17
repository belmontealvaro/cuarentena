/* ============================================================
   RENDER — pinta el estado del juego en el lienzo. Solo lee
   datos del motor; no cambia ninguna regla.
   Orden de pintado: placa de fondo → (cámara) zonas, tablero,
   defensas, amenazas, proyectiles, efectos → velos de color.
   ============================================================ */
CQ.render = (() => {
  const D = CQ.dibujo;
  let lienzo, ctx;
  const L = { s: 80, ox: 0, oy: 0, ancho: 0, alto: 0 };   // medidas del tablero en píxeles
  const muestras = {};                                     // defensas de muestra para el "fantasma"

  function iniciar(elemento) { lienzo = elemento; ctx = lienzo.getContext('2d'); }

  function ajustar(juego) {
    const dpr = window.devicePixelRatio || 1;
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (lienzo.width !== Math.round(w * dpr) || lienzo.height !== Math.round(h * dpr)) {
      lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    L.ancho = w; L.alto = h;
    // Una fase puede reservar hueco bajo el tablero (en casillas) para carteles, p. ej. el tutorial.
    const reserva = juego.fase.reservaAbajo || 0;
    L.s = Math.max(20, Math.min(w / (juego.columnas + 3), h / (juego.filas + 0.8 + reserva)));
    L.ox = (w - juego.columnas * L.s) / 2;
    L.oy = (h - (juego.filas + reserva) * L.s) / 2 + L.s * 0.12;
  }

  /* Píxeles del lienzo -> coordenadas de tablero, y tablero -> píxeles de la ventana. */
  function aTablero(px, py) { return { x: (px - L.ox) / L.s, y: (py - L.oy) / L.s }; }
  function aPantalla(x, y) {
    const r = lienzo.getBoundingClientRect();
    return { x: r.left + L.ox + x * L.s, y: r.top + L.oy + y * L.s };
  }

  /* Ejecuta fn con el origen en (x, y) del tablero y 100 unidades = 1 casilla. */
  function en(x, y, escala, fn) {
    ctx.save();
    ctx.translate(L.ox + x * L.s, L.oy + y * L.s);
    ctx.scale(L.s / 100 * escala, L.s / 100 * escala);
    fn();
    ctx.restore();
  }
  const rebote = k => k >= 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);

  function barraVida(fraccion, y, ancho) {
    D.caja(ctx, 0, y, ancho, 9, 4, '#fff', 3);
    ctx.fillStyle = fraccion > 0.5 ? '#80ed99' : fraccion > 0.25 ? '#ffd166' : '#ff5d73';
    ctx.beginPath(); ctx.roundRect(-ancho / 2 + 2, y - 2.5, (ancho - 4) * Math.max(0, fraccion), 5, 2); ctx.fill();
  }

  /* ---------- Fondo: placa de circuito cartoon ----------
     Trama de puntos + pistas con codos a 45° + pulsos de datos que las recorren.
     Las pistas se generan una sola vez por tamaño de pantalla. */
  let pistas = [], clavePistas = '', tramaPuntos = null;

  function generarPistas() {
    const clave = L.ancho + 'x' + L.alto;
    if (clave === clavePistas) return;
    clavePistas = clave; pistas = [];
    let semilla = 11;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const paso = 28;
    for (let i = 0; i * paso < L.alto; i++) {
      if (azar() < 0.3) continue;
      const y = i * paso + 14, salto = (azar() < 0.5 ? -1 : 1) * paso;
      const x0 = azar() < 0.35 ? azar() * L.ancho * 0.25 : -30;
      const x2 = azar() < 0.35 ? L.ancho * (0.75 + azar() * 0.25) : L.ancho + 30;
      const x1 = L.ancho * (0.3 + azar() * 0.4);
      const pts = [[x0, y], [x1, y], [x1 + paso, y + salto], [x2, y + salto]];
      const largos = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
      pistas.push({ pts, largos, total: largos.reduce((a, b) => a + b, 0), vel: 60 + azar() * 90, fase: azar() });
    }
  }

  function puntoEnPista(p, distancia) {
    for (let k = 0; k < p.largos.length; k++) {
      if (distancia <= p.largos[k]) {
        const f = distancia / p.largos[k], a = p.pts[k], b = p.pts[k + 1];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      }
      distancia -= p.largos[k];
    }
    return p.pts[p.pts.length - 1];
  }

  function placaDeCircuito(juego, t) {
    ctx.fillStyle = juego.escenario.fondo; ctx.fillRect(0, 0, L.ancho, L.alto);
    if (!tramaPuntos) {
      const c = document.createElement('canvas'); c.width = c.height = 28;
      const x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.22)';
      x.beginPath(); x.arc(14, 14, 2.2, 0, 7); x.fill();
      tramaPuntos = ctx.createPattern(c, 'repeat');
    }
    ctx.fillStyle = tramaPuntos; ctx.fillRect(0, 0, L.ancho, L.alto);
    generarPistas();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const p of pistas) {
      ctx.beginPath(); p.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(43,33,64,.2)'; ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.stroke();
      for (const q of [p.pts[0], p.pts[3]]) {      // almohadillas en los extremos
        ctx.beginPath(); ctx.arc(q[0], q[1], 8, 0, 7); ctx.fillStyle = 'rgba(43,33,64,.28)'; ctx.fill();
        ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
      }
      const q = puntoEnPista(p, (t * p.vel + p.fase * p.total) % p.total);   // pulso de datos
      ctx.beginPath(); ctx.arc(q[0], q[1], 5.5, 0, 7);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(43,33,64,.55)'; ctx.stroke();
    }
  }

  /* ---------- Zonas laterales: de dónde vienen y qué hay que proteger ---------- */
  function zonas(juego, t) {
    const e = juego.escenario, s = L.s, cols = juego.columnas, filas = juego.filas;
    ctx.beginPath(); ctx.roundRect(L.ox - s * 1.45, L.oy - 6, s * 1.6, filas * s + 12, 18); D.trazo(ctx, e.colorOrigen, 5);
    ctx.beginPath(); ctx.roundRect(L.ox + cols * s - s * 0.15, L.oy - 6, s * 1.6, filas * s + 12, 18); D.trazo(ctx, e.colorDestino, 5);
    const decorado = CQ.decorados[e.decoradoOrigen];
    if (decorado) decorado.dibujar({ ctx, en, D, L }, juego, t);
    // Puertos de destino, uno por carril.
    for (let f = 0; f < filas; f++) {
      en(cols + 0.72, f + 0.5, 1, () => {
        D.caja(ctx, 0, 0, 62, 62, 14, '#fff');
        D.caja(ctx, 0, 4, 34, 26, 5, D.TINTA, 1);
        ctx.fillStyle = e.colorDestino;
        for (let i = -1; i <= 1; i++) ctx.fillRect(i * 9 - 2.5, -4, 5, 9);
        D.circulo(ctx, -18, -20, 4, Math.sin(t * 4 + f) > 0 ? '#80ed99' : '#2b9348', 2.5);
      });
    }
    const tam = Math.max(11, s * 0.2);
    D.texto(ctx, e.origen, L.ox - s * 0.65, L.oy - tam * 1.1, tam, '#fff');
    D.texto(ctx, e.destino, L.ox + cols * s + s * 0.65, L.oy - tam * 1.1, tam, '#fff');
  }

  /* ---------- Tablero: casillas con forma de zócalo y bus de datos ---------- */
  function tablero(juego, t) {
    const e = juego.escenario, s = L.s, cols = juego.columnas, filas = juego.filas;
    ctx.beginPath(); ctx.roundRect(L.ox - 6, L.oy - 6, cols * s + 12, filas * s + 12, 14); D.trazo(ctx, e.casillaA, 6);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(L.ox, L.oy, cols * s, filas * s, 9); ctx.clip();
    for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
      const x = L.ox + c * s, y = L.oy + f * s, m = s * 0.07;
      ctx.fillStyle = (f + c) % 2 ? e.casillaB : e.casillaA;
      ctx.fillRect(x, y, s + 1, s + 1);
      ctx.beginPath(); ctx.roundRect(x + m, y + m, s - m * 2, s - m * 2, s * 0.1);
      ctx.lineWidth = Math.max(1.5, s * 0.022); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.stroke();
      ctx.fillStyle = 'rgba(43,33,64,.16)';
      for (const dx of [m * 1.9, s - m * 1.9]) for (const dy of [m * 1.9, s - m * 1.9]) {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, Math.max(1.5, s * 0.025), 0, 7); ctx.fill();
      }
    }
    ctx.lineWidth = Math.max(2, s * 0.035); ctx.strokeStyle = 'rgba(43,33,64,.1)'; ctx.lineCap = 'round';
    ctx.setLineDash([s * 0.14, s * 0.2]); ctx.lineDashOffset = -t * s * 0.5;
    for (let f = 0; f < filas; f++) {
      ctx.beginPath(); ctx.moveTo(L.ox, L.oy + (f + 0.5) * s); ctx.lineTo(L.ox + cols * s, L.oy + (f + 0.5) * s); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function casillaActiva(juego, vista, t) {
    const h = vista.hover;
    if (!h || !vista.herramienta) return;
    if (h.fila < 0 || h.col < 0 || h.fila >= juego.filas || h.col >= juego.columnas) return;
    const quitar = vista.herramienta === 'quitar';
    const valido = quitar ? !!juego.defensaEn(h.fila, h.col) : !juego.puedeColocar(vista.herramienta, h.fila, h.col);
    ctx.fillStyle = quitar ? 'rgba(255,93,115,.45)' : valido ? 'rgba(255,255,255,.55)' : 'rgba(255,93,115,.35)';
    ctx.fillRect(L.ox + h.col * L.s, L.oy + h.fila * L.s, L.s, L.s);
    if (quitar || !valido) return;
    const id = vista.herramienta;
    muestras[id] = muestras[id] || CQ.crearDefensa(id, 0, 0);
    ctx.save(); ctx.globalAlpha = 0.55;
    en(h.col + 0.5, h.fila + 0.5, 1, () => muestras[id].def.dibujar(ctx, muestras[id], t));
    ctx.restore();
  }

  /* ¿Tiene esta defensa una amenaza visible encima? Entonces pone cara de miedo. */
  function asustada(juego, d) {
    if (d.def.valiente || d.def.mordible === false) return false;
    const limite = CQ.config.efectos.distanciaMiedo, centro = d.col + 0.5;
    return juego.amenazas.some(a => !a.muerta && a.revelada && a.fila === d.fila && centro - a.x > -0.2 && centro - a.x < limite);
  }

  function defensas(juego, t) {
    for (const d of [...juego.defensas].sort((a, b) => a.fila - b.fila)) {
      const bloqueada = juego.tiene(d, 'bloqueada');
      const miedo = !bloqueada && asustada(juego, d);
      const temblor = Math.sin(t * 60) * d.anim.golpe * 0.02 + (miedo ? Math.sin(t * 45 + d.id) * 0.012 : 0);
      en(d.col + 0.5 + temblor, d.fila + 0.5, rebote(d.anim.nace), () => {
        ctx.save(); if (bloqueada) ctx.globalAlpha = 0.6;
        D.humor = miedo ? 'miedo' : null;
        d.def.dibujar(ctx, d, bloqueada ? 0 : t);
        D.humor = null;
        ctx.restore();
        if (miedo) {   // gotita de sudor
          ctx.beginPath(); ctx.moveTo(30, -34); ctx.quadraticCurveTo(38, -22, 30, -20); ctx.quadraticCurveTo(22, -22, 30, -34);
          D.trazo(ctx, '#a8e6ff', 3);
        }
        if (bloqueada) {
          ctx.beginPath(); ctx.arc(0, -26, 9, Math.PI, 0); ctx.lineWidth = 5; ctx.strokeStyle = D.TINTA; ctx.stroke();
          D.caja(ctx, 0, -14, 30, 24, 6, '#ffb703', 4);
          D.circulo(ctx, 0, -14, 3.5, D.TINTA, 1);
        }
        if (d.vida < d.vidaMax && d.def.mordible !== false) barraVida(d.vida / d.vidaMax, 46, 56);
      });
    }
  }

  function amenazas(juego, t) {
    const lista = [...juego.amenazas].sort((a, b) => a.fila - b.fila || a.x - b.x);
    for (const a of lista) {
      const g = a.anim.golpe, atrapada = juego.tiene(a, 'atrapada');
      // Si algo la cambia de carril (honeypot), se desliza en vez de teletransportarse.
      a.anim.y = a.anim.y == null ? a.fila : a.anim.y + (a.fila - a.anim.y) * 0.18;
      en(a.x, a.anim.y + 0.5, rebote(a.anim.nace), () => {
        ctx.save(); ctx.scale(1 + g * 0.14, 1 - g * 0.12);
        if (a.mordiendo) ctx.translate(Math.abs(Math.sin(t * 14)) * 7, 0);
        a.def.dibujar(ctx, a, atrapada ? 0 : t);
        ctx.restore();
        if (atrapada) {
          ctx.lineWidth = 5; ctx.strokeStyle = D.TINTA; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.roundRect(-38, -40, 76, 80, 8); ctx.stroke();
          for (const x of [-19, 0, 19]) { ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x, 40); ctx.stroke(); }
        }
        if (juego.fase.insignia && a.revelada) {
          D.caja(ctx, 0, -50, 16 + juego.fase.insignia.length * 8.5, 18, 9, '#ffd60a', 3);
          D.texto(ctx, juego.fase.insignia, 0, -49, 13, D.TINTA, false);
        }
        if (a.vida < a.vidaMax) barraVida(a.vida / a.vidaMax, 48, a.radio > 0.35 ? 80 : 50);
        if (juego.tiene(a, 'lenta')) {   // bocadillo de "pensando" mientras va frenada
          D.circulo(ctx, 26, -34, 12, '#fff', 3); D.texto(ctx, '?', 26, -33, 16, D.TINTA, false);
        }
      });
    }
  }

  function proyectilesYChips(juego, t) {
    for (const p of juego.proyectiles) en(p.x, p.fila + 0.45, 1, () => {
      D.circulo(ctx, 0, 0, 9, p.color, 4); ctx.beginPath(); ctx.arc(-3, -3, 3, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    });
    for (const c of juego.chips) {
      if (c.vida < 3 && Math.sin(t * 18) > 0.3) continue;   // parpadea antes de desaparecer
      en(c.x, c.y, 1, () => D.sombra(ctx, 16, 8));
      en(c.x, c.y - c.altura + Math.sin(t * 5 + c.x * 9) * 0.03, rebote(c.nace), () => {
        ctx.rotate(Math.sin(t * 3 + c.x * 5) * 0.12);
        for (const s of [-1, 1]) for (const k of [-8, 8]) { D.linea(ctx, s * 18, k, s * 25, k, 5); D.linea(ctx, k, s * 18, k, s * 25, 5); }
        D.caja(ctx, 0, 0, 38, 38, 8, '#80ed99', 4.5);
        D.texto(ctx, '+', 0, 1, 26, '#fff');
      });
    }
  }

  /* Formas de partícula. Para añadir una, pon otra función aquí y úsala
     en el campo "forma" de fx.lanzar o de amenaza.muerte. */
  const formas = {
    circulo(r, color) { D.circulo(ctx, 0, 0, r, color, 3); },
    papel(r, color) { D.caja(ctx, 0, 0, r * 2.2, r * 1.5, 2, color, 2.5); },
    astilla(r, color) { D.forma(ctx, [[-r, r * 0.8], [r * 1.3, 0], [-r * 0.6, -r * 0.9]], color, 2.5); },
    gota(r, color) {
      ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.quadraticCurveTo(r * 1.3, r * 0.4, 0, r); ctx.quadraticCurveTo(-r * 1.3, r * 0.4, 0, -r * 1.6);
      D.trazo(ctx, color, 2.5);
    },
    burbuja(r, color) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = D.TINTA; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.stroke();
    },
  };

  function efectos(juego) {
    for (const e of juego.efectos) {
      const k = Math.max(0, e.vida / e.max);
      if (e.tipo === 'particula') en(e.x, e.y, 1, () => {
        const pinta = formas[e.forma] || formas.circulo;
        if (e.forma) { ctx.globalAlpha = Math.min(1, k * 3); ctx.rotate(e.giro || 0); pinta(e.r * 100, e.color); }
        else pinta(e.r * 100 * k + 1, e.color);
      });
      else if (e.tipo === 'texto') en(e.x, e.y, 1, () => { ctx.globalAlpha = Math.min(1, k * 2.5); D.texto(ctx, e.cadena, 0, 0, 20, e.color); });
      else if (e.tipo === 'onda') en(e.x, e.y, 1, () => {
        ctx.beginPath(); ctx.arc(0, 0, e.r * 100 * (1 - k * 0.7), 0, 7);
        ctx.globalAlpha = k; ctx.lineWidth = 12; ctx.strokeStyle = D.TINTA; ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = e.color; ctx.stroke();
      });
      else if (e.tipo === 'rayo') {
        ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s / 100, L.s / 100); ctx.globalAlpha = k;
        ctx.beginPath(); ctx.moveTo(e.x1 * 100, e.y1 * 100);
        for (let i = 1; i < 6; i++) {
          const f = i / 6;
          ctx.lineTo((e.x1 + (e.x2 - e.x1) * f) * 100 + (Math.random() - 0.5) * 14, (e.y1 + (e.y2 - e.y1) * f) * 100 + (Math.random() - 0.5) * 14);
        }
        ctx.lineTo(e.x2 * 100, e.y2 * 100);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.lineWidth = 13; ctx.strokeStyle = D.TINTA; ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = e.color; ctx.stroke();
        ctx.restore();
      }
    }
  }

  const CAMARA_QUIETA = { dx: 0, dy: 0, escala: 1, oscuro: 0, destello: 0, colorDestello: '#fff' };

  function dibujar(juego, vista, t) {
    ajustar(juego);
    placaDeCircuito(juego, t);

    // La cámara (sacudida, caída entre fases…) la decide espectaculo.js, si existe.
    const cam = CQ.espectaculo ? CQ.espectaculo.camara(L.alto) : CAMARA_QUIETA;
    ctx.save();
    ctx.translate(L.ancho / 2 + cam.dx, L.alto / 2 + cam.dy);
    ctx.scale(cam.escala, cam.escala);
    ctx.translate(-L.ancho / 2, -L.alto / 2);
    zonas(juego, t);
    tablero(juego, t);
    casillaActiva(juego, vista, t);
    defensas(juego, t);
    amenazas(juego, t);
    proyectilesYChips(juego, t);
    efectos(juego);
    ctx.restore();

    if (cam.oscuro > 0.01) { ctx.fillStyle = `rgba(43,33,64,${cam.oscuro})`; ctx.fillRect(0, 0, L.ancho, L.alto); }
    if (cam.destello > 0.01) {
      ctx.globalAlpha = Math.min(0.6, cam.destello); ctx.fillStyle = cam.colorDestello;
      ctx.fillRect(0, 0, L.ancho, L.alto); ctx.globalAlpha = 1;
    }
  }

  return { iniciar, dibujar, aTablero, aPantalla };
})();
