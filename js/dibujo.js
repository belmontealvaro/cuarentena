/* ============================================================
   DIBUJO — utilidades de estilo cartoon (contorno grueso, ojos…).
   Todas trabajan en "unidades de casilla": 100 = una casilla,
   con el (0,0) en el centro de la casilla.
   ============================================================ */
CQ.dibujo = (() => {
  const D = {
    TINTA: '#2b2140',
    GROSOR: 5,
    /* Estado de ánimo actual. El render lo pone a 'miedo' antes de pintar una
       defensa asustada; ojos() y boca() cambian solos, sin tocar cada personaje. */
    humor: null,

    trazo(ctx, color, grosor) {
      ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = grosor || D.GROSOR; ctx.strokeStyle = D.TINTA;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    },
    circulo(ctx, x, y, r, color, grosor) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); D.trazo(ctx, color, grosor);
    },
    elipse(ctx, x, y, rx, ry, color, grosor) {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); D.trazo(ctx, color, grosor);
    },
    caja(ctx, x, y, ancho, alto, radio, color, grosor) {
      ctx.beginPath(); ctx.roundRect(x - ancho / 2, y - alto / 2, ancho, alto, radio); D.trazo(ctx, color, grosor);
    },
    forma(ctx, puntos, color, grosor) {
      ctx.beginPath(); puntos.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath(); D.trazo(ctx, color, grosor);
    },
    linea(ctx, x1, y1, x2, y2, grosor, color) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.lineWidth = grosor || D.GROSOR; ctx.strokeStyle = color || D.TINTA; ctx.lineCap = 'round'; ctx.stroke();
    },
    sombra(ctx, ancho, y) {
      ctx.beginPath(); ctx.ellipse(0, y == null ? 40 : y, ancho || 30, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(43,33,64,.18)'; ctx.fill();
    },
    /* Ojos cartoon. op: { mx, my (hacia dónde miran, -1..1), enfado, cerrados } */
    ojos(ctx, x, y, separacion, r, op) {
      op = op || {};
      if (D.humor === 'miedo' && !op.cerrados) op = { mx: op.mx, my: op.my, miedo: true };
      for (const lado of [-1, 1]) {
        const ox = x + lado * separacion / 2;
        if (op.cerrados) {
          ctx.beginPath(); ctx.arc(ox, y, r * 0.8, Math.PI * 0.1, Math.PI * 0.9);
          ctx.lineWidth = 4; ctx.strokeStyle = D.TINTA; ctx.lineCap = 'round'; ctx.stroke();
          continue;
        }
        if (op.miedo) {   // ojos como platos, pupila diminuta y cejas de preocupación
          D.circulo(ctx, ox, y, r * 1.2, '#fff', 3.5);
          ctx.beginPath(); ctx.arc(ox + (op.mx || 0) * r * 0.5, y, r * 0.26, 0, Math.PI * 2); ctx.fillStyle = D.TINTA; ctx.fill();
          D.linea(ctx, ox - lado * r * 0.9, y - r * 2.1, ox + lado * r * 1.1, y - r * 1.6, 4);
          continue;
        }
        D.circulo(ctx, ox, y, r, '#fff', 3.5);
        ctx.beginPath();
        ctx.arc(ox + (op.mx || 0) * r * 0.4, y + (op.my || 0) * r * 0.4, r * 0.48, 0, Math.PI * 2);
        ctx.fillStyle = D.TINTA; ctx.fill();
        if (op.enfado) D.linea(ctx, ox - lado * r * 1.2, y - r * 1.5, ox + lado * r * 0.9, y - r * 0.6, 4.5);
      }
    },
    /* Bocas: 'sonrisa', 'mala' (sonrisa con dientes), 'o', 'seria' */
    boca(ctx, x, y, ancho, tipo) {
      ctx.lineWidth = 4; ctx.strokeStyle = D.TINTA; ctx.lineCap = 'round';
      if (D.humor === 'miedo' && tipo === 'sonrisa') {   // boca temblorosa
        ctx.beginPath(); ctx.moveTo(x - ancho / 2, y);
        for (let i = 1; i <= 4; i++) ctx.lineTo(x - ancho / 2 + ancho * i / 4, y + (i % 2 ? -3 : 3));
        ctx.stroke(); return;
      }
      if (tipo === 'o') { D.circulo(ctx, x, y, ancho / 3, '#7a1f3d', 3.5); return; }
      if (tipo === 'seria') { D.linea(ctx, x - ancho / 2, y, x + ancho / 2, y, 4); return; }
      if (tipo === 'mala') {
        ctx.beginPath(); ctx.moveTo(x - ancho / 2, y - 2);
        ctx.quadraticCurveTo(x, y + ancho * 0.7, x + ancho / 2, y - 2); ctx.closePath();
        D.trazo(ctx, '#fff', 3.5);
        D.linea(ctx, x - ancho / 6, y, x - ancho / 6, y + ancho * 0.22, 2.5);
        D.linea(ctx, x + ancho / 6, y, x + ancho / 6, y + ancho * 0.22, 2.5);
        return;
      }
      ctx.beginPath(); ctx.arc(x, y - ancho * 0.2, ancho / 2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    },
    texto(ctx, cadena, x, y, tam, color, borde) {
      ctx.font = `700 ${tam}px Fredoka, "Comic Sans MS", system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      if (borde !== false) { ctx.lineWidth = tam * 0.28; ctx.strokeStyle = D.TINTA; ctx.strokeText(cadena, x, y); }
      ctx.fillStyle = color || '#fff'; ctx.fillText(cadena, x, y);
    },
  };
  return D;
})();
