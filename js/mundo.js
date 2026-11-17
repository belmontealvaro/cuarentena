/* ============================================================
   MUNDO — datos del mapa de niveles: "de lo pequeño a lo crítico".
   El camino sube de casa a la nube, con dos niveles por zona.

   Para añadir un nivel al camino: añade { tipo: 'nivel', nivel: 'id' }
   a "nodos" (el nivel debe estar registrado en niveles.js). Los nodos
   se reparten solos de abajo arriba; con dos por zona, cada pareja
   cae en su paisaje. Un nodo { tipo: 'proximo' } sale con candado.
   Para un paisaje nuevo, registra otra zona y ponla en "zonas".

   Cada zona dibuja su franja con dibujar(ctx, r, t, D):
     r = { y, ancho, alto }  franja en píxeles (y = borde superior)
     t = segundos (para animar)   D = utilidades de dibujo cartoon
   ============================================================ */
CQ.zonasMapa = {};
CQ.registrarZonaMapa = def => { CQ.zonasMapa[def.id] = def; };

CQ.mundo = {
  altoZona: 560,                                          // píxeles de alto de cada zona
  zonas: ['casa', 'oficina', 'banco', 'datos', 'nube'],   // de abajo arriba
  nodos: [
    { tipo: 'nivel', nivel: 'nivel1' }, { tipo: 'nivel', nivel: 'nivel2' },
    { tipo: 'nivel', nivel: 'nivel3' }, { tipo: 'nivel', nivel: 'nivel4' },
    { tipo: 'nivel', nivel: 'nivel5' }, { tipo: 'nivel', nivel: 'nivel6' },
    { tipo: 'nivel', nivel: 'nivel7' }, { tipo: 'nivel', nivel: 'nivel8' },
    { tipo: 'nivel', nivel: 'nivel9' }, { tipo: 'nivel', nivel: 'nivel10' },
  ],
};

(() => {
  /* Posición estable "al azar" para repartir adornos sin que bailen. */
  const semilla = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  /* Franja de suelo con línea de tinta; devuelve la y del suelo. */
  function suelo(ctx, r, D, color, alto) {
    const y = r.y + r.alto - alto;
    ctx.fillStyle = color; ctx.fillRect(0, y, r.ancho, alto);
    D.linea(ctx, 0, y, r.ancho, y, 5);
    return y;
  }

  /* ---------- CASA: tu ordenador y tu wifi ---------- */
  CQ.registrarZonaMapa({
    id: 'casa', nombre: 'CASA', color: '#ffcf99',
    dibujar(ctx, r, t, D) {
      const w = r.ancho;
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      for (let x = 20; x < w; x += 70) ctx.fillRect(x, r.y, 26, r.alto);
      const y = suelo(ctx, r, D, '#c98b5b', 70);
      // Ventana con sol.
      ctx.save(); ctx.translate(w * 0.8, r.y + 150);
      D.caja(ctx, 0, 0, 150, 130, 12, '#a8e6ff');
      D.circulo(ctx, 28, -22, 22 + Math.sin(t * 2) * 2, '#ffd166', 4);
      D.linea(ctx, 0, -65, 0, 65, 5); D.linea(ctx, -75, 0, 75, 0, 5);
      ctx.restore();
      // Ordenador de casa, con cara.
      ctx.save(); ctx.translate(w * 0.2, y - 120);
      D.caja(ctx, 0, 92, 60, 16, 4, '#8d99ae'); D.caja(ctx, 0, 70, 22, 34, 3, '#8d99ae');
      D.caja(ctx, 0, 0, 190, 130, 14, '#495057');
      D.caja(ctx, 0, -2, 164, 102, 8, '#a8e6ff', 4);
      D.ojos(ctx, 0, -12, 46, 11, { mx: 0.5, my: -0.5 });
      D.boca(ctx, 0, 18, 34, 'sonrisa');
      ctx.restore();
      // Router con antenas y ondas de wifi.
      ctx.save(); ctx.translate(w * 0.78, y - 30);
      D.linea(ctx, -34, -14, -44, -64, 7); D.linea(ctx, 34, -14, 44, -64, 7);
      D.caja(ctx, 0, 0, 120, 40, 12, '#fff');
      for (let i = 0; i < 4; i++) D.circulo(ctx, -30 + i * 20, 0, 5, Math.sin(t * 6 + i * 1.7) > 0 ? '#80ed99' : '#2b9348', 2.5);
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.8 + i / 3) % 1;
        ctx.beginPath(); ctx.arc(0, -70, 20 + k * 60, Math.PI * 1.2, Math.PI * 1.8);
        ctx.globalAlpha = 1 - k; ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  });

  /* ---------- OFICINA: la red de una empresa pequeña ---------- */
  CQ.registrarZonaMapa({
    id: 'oficina', nombre: 'OFICINA', color: '#bfe3d0',
    dibujar(ctx, r, t, D) {
      const w = r.ancho;
      const y = suelo(ctx, r, D, '#8d99ae', 60);
      // Ventanales con persianas.
      for (const fx of [0.14, 0.86]) {
        ctx.save(); ctx.translate(w * fx, r.y + 150);
        D.caja(ctx, 0, 0, 130, 170, 8, '#d7f3ff');
        for (let i = -3; i <= 3; i++) D.linea(ctx, -60, i * 22, 60, i * 22, 3, 'rgba(43,33,64,.25)');
        ctx.restore();
      }
      // Reloj de pared.
      ctx.save(); ctx.translate(w * 0.5, r.y + 90);
      D.circulo(ctx, 0, 0, 34, '#fff');
      D.linea(ctx, 0, 0, Math.cos(t * 0.5) * 22, Math.sin(t * 0.5) * 22, 4);
      D.linea(ctx, 0, 0, Math.cos(t * 0.05 - 1) * 14, Math.sin(t * 0.05 - 1) * 14, 5);
      ctx.restore();
      // Mesas con monitores (uno de ellos teclea nervioso).
      [0.2, 0.8].forEach((fx, i) => {
        ctx.save(); ctx.translate(w * fx, y - 60);
        D.caja(ctx, 0, 40, 200, 18, 5, '#b08968');
        D.linea(ctx, -84, 50, -84, 62, 8); D.linea(ctx, 84, 50, 84, 62, 8);
        D.caja(ctx, -30, 22, 16, 22, 2, '#8d99ae');
        D.caja(ctx, -30, -22, 110, 76, 8, '#495057');
        D.caja(ctx, -30, -24, 92, 56, 5, i ? '#fff3b0' : '#c7f9cc', 3.5);
        D.ojos(ctx, -30, -28, 28, 7, { mx: i ? -0.6 : 0.6 });
        D.boca(ctx, -30, -10, 20, i ? 'o' : 'sonrisa');
        // Taza de café con vapor.
        D.caja(ctx, 56, 20, 24, 24, 5, '#fff', 3.5);
        for (let k = 0; k < 2; k++) {
          const s = (t * 0.6 + k * 0.5) % 1;
          ctx.globalAlpha = 1 - s; D.linea(ctx, 50 + k * 12, 2 - s * 26, 54 + k * 12, -8 - s * 26, 3, '#fff'); ctx.globalAlpha = 1;
        }
        ctx.restore();
      });
      // Planta.
      ctx.save(); ctx.translate(w * 0.5, y - 26);
      for (const a of [-0.7, -0.25, 0.25, 0.7]) { ctx.save(); ctx.rotate(a + Math.sin(t + a) * 0.05); D.elipse(ctx, 0, -46, 13, 34, '#52b788', 4); ctx.restore(); }
      D.forma(ctx, [[-26, -8], [26, -8], [18, 28], [-18, 28]], '#e07a5f', 4.5);
      ctx.restore();
    },
  });

  /* ---------- BANCO: el dinero de los clientes ---------- */
  CQ.registrarZonaMapa({
    id: 'banco', nombre: 'BANCO', color: '#f6e7b4',
    dibujar(ctx, r, t, D) {
      const w = r.ancho;
      const y = suelo(ctx, r, D, '#b7b7a4', 50);
      // Baldosas del suelo.
      for (let x = 0; x < w; x += 60) D.linea(ctx, x, y + 6, x - 20, y + 50, 2.5, 'rgba(43,33,64,.2)');
      // Columnas.
      for (const fx of [0.07, 0.3, 0.7, 0.93]) {
        ctx.save(); ctx.translate(w * fx, 0);
        D.caja(ctx, 0, r.y + r.alto / 2 - 10, 46, r.alto - 150, 6, '#fff');
        for (const dx of [-10, 0, 10]) D.linea(ctx, dx, r.y + 110, dx, y - 50, 2.5, 'rgba(43,33,64,.2)');
        D.caja(ctx, 0, r.y + 78, 70, 22, 6, '#e9ecef'); D.caja(ctx, 0, y - 22, 70, 22, 6, '#e9ecef');
        ctx.restore();
      }
      // Cámara acorazada con la rueda girando.
      ctx.save(); ctx.translate(w * 0.5, r.y + 190);
      const brillo = 0.5 + Math.sin(t * 2) * 0.5;
      ctx.beginPath(); ctx.arc(0, 0, 100 + brillo * 12, 0, 7); ctx.fillStyle = `rgba(255,183,3,${0.1 + brillo * 0.12})`; ctx.fill();
      D.circulo(ctx, 0, 0, 84, '#adb5bd', 6);
      D.circulo(ctx, 0, 0, 62, '#dee2e6', 4);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t * 0.4; D.linea(ctx, Math.cos(a) * 16, Math.sin(a) * 16, Math.cos(a) * 52, Math.sin(a) * 52, 7); }
      D.circulo(ctx, 0, 0, 16, '#ffd60a', 4);
      ctx.restore();
      // Montones de monedas.
      [0.17, 0.83].forEach((fx, i) => {
        for (let k = 0; k < 4 + i; k++) D.elipse(ctx, w * fx, y - 12 - k * 11, 30, 10, '#ffd60a', 3.5);
        ctx.save(); ctx.translate(w * fx + 44, y - 14 + Math.sin(t * 3 + i) * 3); D.circulo(ctx, 0, 0, 14, '#ffd60a', 3.5); D.texto(ctx, '$', 0, 1, 15, D.TINTA, false); ctx.restore();
      });
    },
  });

  /* ---------- CENTRO DE DATOS: los servidores de medio internet ---------- */
  CQ.registrarZonaMapa({
    id: 'datos', nombre: 'CENTRO DE DATOS', color: '#3d2f63',
    dibujar(ctx, r, t, D) {
      const w = r.ancho;
      // Rejilla de luces al fondo.
      for (let i = 0; i < 40; i++) {
        ctx.globalAlpha = 0.15 + Math.abs(Math.sin(t + i * 2.3)) * 0.3;
        ctx.fillStyle = '#c77dff'; ctx.fillRect(w * semilla(i + 2), r.y + r.alto * semilla(i + 50), 5, 5);
      }
      ctx.globalAlpha = 1;
      // Armarios de servidores a los lados.
      [0.09, 0.24, 0.76, 0.91].forEach((fx, i) => {
        const alto = 250 + semilla(i + 4) * 160, x = w * fx, base = r.y + r.alto - 30;
        D.caja(ctx, x, base - alto / 2, 84, alto, 10, '#5a4a8a');
        for (let yy = base - alto + 26; yy < base - 16; yy += 30) {
          D.caja(ctx, x, yy, 62, 18, 4, '#2b2140', 2.5);
          for (let k = 0; k < 3; k++) {
            ctx.beginPath(); ctx.arc(x - 18 + k * 12, yy, 3, 0, 7);
            ctx.fillStyle = Math.sin(t * 5 + yy * 0.3 + k * 2 + i) > 0.2 ? '#80ed99' : '#ffd166'; ctx.fill();
          }
        }
      });
      // Ventilador de refrigeración.
      ctx.save(); ctx.translate(w * 0.5, r.y + 120);
      D.circulo(ctx, 0, 0, 62, '#5a4a8a', 5);
      ctx.rotate(t * 5);
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); D.elipse(ctx, 0, -30, 14, 26, '#c77dff', 3.5); }
      D.circulo(ctx, 0, 0, 10, '#fff', 3.5);
      ctx.restore();
    },
  });

  /* ---------- LA NUBE: donde vive todo ---------- */
  CQ.registrarZonaMapa({
    id: 'nube', nombre: 'LA NUBE', color: '#a99cf0',
    dibujar(ctx, r, t, D) {
      const w = r.ancho;
      const nube = (x, y, e, cara) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
        ctx.beginPath();
        ctx.arc(-34, 8, 26, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(-8, -14, 30, Math.PI, Math.PI * 1.9);
        ctx.arc(30, -2, 26, Math.PI * 1.3, Math.PI * 0.5); ctx.closePath();
        D.trazo(ctx, '#fff', 4.5 / e);
        if (cara === 'reina') { D.ojos(ctx, -2, 2, 26, 6, {}); D.boca(ctx, -2, 16, 16, 'sonrisa'); }
        else D.ojos(ctx, -2, 2, 26, 5, { cerrados: true });
        ctx.restore();
      };
      // Estrellas que titilan.
      for (let i = 0; i < 26; i++) {
        ctx.globalAlpha = 0.35 + Math.abs(Math.sin(t * 1.5 + i)) * 0.6;
        ctx.beginPath(); ctx.arc(w * semilla(i + 5), r.y + r.alto * semilla(i + 80), 2 + semilla(i + 33) * 2.5, 0, 7);
        ctx.fillStyle = '#fff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
      // La gran nube del final, con corona.
      const cx = w * 0.5, cy = r.y + 120 + Math.sin(t * 1.2) * 6;
      ctx.beginPath(); ctx.arc(cx, cy, 150, 0, 7); ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.abs(Math.sin(t)) * 0.08})`; ctx.fill();
      nube(cx, cy, 2.4, 'reina');
      D.forma(ctx, [[cx - 40, cy - 92], [cx - 46, cy - 132], [cx - 20, cy - 110], [cx, cy - 142], [cx + 20, cy - 110], [cx + 46, cy - 132], [cx + 40, cy - 92]], '#ffd60a', 4.5);
      // Satélite.
      ctx.save(); ctx.translate(w * 0.84 + Math.sin(t * 0.6) * 16, r.y + 300 + Math.cos(t * 0.6) * 10); ctx.rotate(-0.3 + Math.sin(t * 0.6) * 0.08);
      D.caja(ctx, -50, 0, 44, 24, 3, '#74c7ec', 4); D.caja(ctx, 50, 0, 44, 24, 3, '#74c7ec', 4);
      D.caja(ctx, 0, 0, 46, 40, 8, '#f8f9fa');
      D.ojos(ctx, 0, -2, 16, 5, {});
      D.linea(ctx, 0, -20, 0, -36, 4); D.circulo(ctx, 0, -40, 5, '#ff5d73', 3);
      ctx.restore();
      // Nubes dormidas a la deriva.
      for (let i = 0; i < 4; i++) {
        nube(((w * semilla(i + 7) + t * (6 + i * 3)) % (w + 240)) - 120, r.y + 260 + i * 80, 0.8 + semilla(i + 11) * 0.5);
      }
    },
  });
})();
