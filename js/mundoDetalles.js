/* ============================================================
   DETALLES DEL MUNDO — decoración extra de cada zona del mapa.
   Cada zona de mundo.js pinta lo esencial; aquí se añade el atrezo
   para que el paisaje no quede vacío. El mapa llama a
   zona.detalles(ctx, r, t, D) justo después de zona.dibujar.

   Para añadir un adorno: escribe su dibujo dentro del bloque de la
   zona. fx = fracción del ancho (0 izquierda, 1 derecha).
   Para quitar toda la decoración extra, basta con no cargar este archivo.
   ============================================================ */
(() => {
  const Z = CQ.zonasMapa;
  const semilla = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  /* Ejecuta fn con el origen en (x, y). */
  const en = (ctx, x, y, fn) => { ctx.save(); ctx.translate(x, y); fn(); ctx.restore(); };

  /* ---------------- CASA ---------------- */
  Z.casa.detalles = (ctx, r, t, D) => {
    const w = r.ancho, suelo = r.y + r.alto - 70;
    // Alfombra.
    D.elipse(ctx, w * 0.43, suelo + 34, w * 0.2, 16, '#e07a5f', 4);
    D.elipse(ctx, w * 0.43, suelo + 34, w * 0.14, 9, '#f2cc8f', 3);
    // Cuadro de montañas.
    en(ctx, w * 0.2, r.y + 130, () => {
      D.caja(ctx, 0, 0, 110, 80, 6, '#fff');
      D.forma(ctx, [[-44, 28], [-14, -14], [8, 12], [22, -4], [44, 28]], '#95d5b2', 3);
      D.circulo(ctx, 28, -20, 8, '#ffd166', 2.5);
    });
    // Estantería con libros.
    en(ctx, w * 0.5, r.y + 170, () => {
      D.caja(ctx, 0, 0, 170, 120, 6, '#b08968');
      D.linea(ctx, -85, 0, 85, 0, 5);
      ['#ff5d73', '#4cc9f0', '#ffd166', '#80ed99', '#c77dff', '#ff8fab'].forEach((c, i) => {
        D.caja(ctx, -66 + i * 20, -30, 15, 46 - (i % 3) * 6, 2, c, 3);
        D.caja(ctx, 66 - i * 20, 30, 15, 44 - ((i + 1) % 3) * 7, 2, c, 3);
      });
      // Maceta con cactus encima.
      D.caja(ctx, 60, -74, 26, 18, 3, '#e07a5f', 3); D.elipse(ctx, 60, -98, 9, 16, '#52b788', 3);
    });
    // Lámpara de pie encendida.
    en(ctx, w * 0.94, suelo, () => {
      ctx.beginPath(); ctx.arc(0, -150, 60 + Math.sin(t * 3) * 4, 0, 7); ctx.fillStyle = 'rgba(255,214,10,.16)'; ctx.fill();
      D.linea(ctx, 0, 0, 0, -130, 6); D.elipse(ctx, 0, 0, 22, 6, '#495057', 3.5);
      D.forma(ctx, [[-30, -126], [30, -126], [18, -174], [-18, -174]], '#ffd166', 4);
    });
    // Sofá con un gato dormido.
    en(ctx, w * 0.43, suelo - 34, () => {
      D.caja(ctx, 0, -22, 170, 70, 18, '#9d4edd');
      D.caja(ctx, 0, 14, 190, 44, 14, '#c77dff');
      D.caja(ctx, -84, 0, 30, 66, 12, '#9d4edd'); D.caja(ctx, 84, 0, 30, 66, 12, '#9d4edd');
      // Gato.
      const resp = Math.sin(t * 2) * 1.5;
      ctx.beginPath(); ctx.moveTo(36, -8); ctx.quadraticCurveTo(64 + Math.sin(t * 1.5) * 8, -30, 54, -8);
      ctx.lineWidth = 9; ctx.strokeStyle = D.TINTA; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#adb5bd'; ctx.stroke();
      D.elipse(ctx, 10, -14 - resp, 30, 16 + resp, '#adb5bd', 3.5);
      D.forma(ctx, [[-22, -24], [-18, -40], [-8, -28]], '#adb5bd', 3); D.forma(ctx, [[-10, -28], [0, -40], [4, -26]], '#adb5bd', 3);
      D.circulo(ctx, -10, -18, 13, '#adb5bd', 3.5);
      D.ojos(ctx, -11, -18, 11, 3, { cerrados: true });
    });
    // "Zzz" del gato.
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.4 + i / 3) % 1;
      ctx.globalAlpha = 1 - k; D.texto(ctx, 'z', w * 0.43 - 16 + k * 26, suelo - 70 - k * 50, 12 + k * 10, '#fff'); ctx.globalAlpha = 1;
    }
    // Móvil cargando en el suelo, junto al router.
    en(ctx, w * 0.05, suelo - 16, () => {
      D.caja(ctx, 0, 0, 26, 44, 6, '#495057', 3.5); D.caja(ctx, 0, -2, 18, 30, 3, Math.sin(t * 4) > 0 ? '#80ed99' : '#b9fbc0', 2.5);
    });
  };

  /* ---------------- OFICINA ---------------- */
  Z.oficina.detalles = (ctx, r, t, D) => {
    const w = r.ancho, suelo = r.y + r.alto - 60;
    // Lámparas de techo.
    for (const fx of [0.3, 0.5, 0.7]) en(ctx, w * fx, r.y + 14, () => {
      D.linea(ctx, 0, 0, 0, 26, 4); D.forma(ctx, [[-22, 44], [22, 44], [12, 26], [-12, 26]], '#ffd166', 3.5);
      ctx.beginPath(); ctx.moveTo(-22, 46); ctx.lineTo(22, 46); ctx.lineTo(50, 120); ctx.lineTo(-50, 120); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
    });
    // Pizarra con una gráfica que sube.
    en(ctx, w * 0.5, r.y + 230, () => {
      D.caja(ctx, 0, 0, 200, 120, 8, '#fff');
      [0.3, 0.5, 0.42, 0.7, 0.9].forEach((h, i) => {
        const alto = 80 * h * (0.85 + Math.sin(t * 1.5 + i) * 0.15);
        ctx.fillStyle = ['#4cc9f0', '#80ed99', '#ffd166', '#ff8fab', '#c77dff'][i];
        ctx.fillRect(-78 + i * 32, 44 - alto, 22, alto); ctx.lineWidth = 3; ctx.strokeStyle = D.TINTA; ctx.strokeRect(-78 + i * 32, 44 - alto, 22, alto);
      });
      D.linea(ctx, -88, 46, 88, 46, 4);
      D.caja(ctx, 0, 66, 60, 8, 3, '#adb5bd', 3);
    });
    // Notas adhesivas.
    [[0.27, 120, '#ffd166'], [0.31, 150, '#ff8fab'], [0.7, 130, '#80ed99'], [0.73, 165, '#4cc9f0']].forEach(([fx, dy, c], i) =>
      en(ctx, w * fx, r.y + dy, () => { ctx.rotate((i % 2 ? 1 : -1) * 0.12); D.caja(ctx, 0, 0, 26, 26, 2, c, 3); D.linea(ctx, -7, -3, 7, -3, 2.5); D.linea(ctx, -7, 4, 3, 4, 2.5); }));
    // Dispensador de agua con burbujas.
    en(ctx, w * 0.38, suelo - 6, () => {
      D.caja(ctx, 0, -34, 50, 70, 6, '#f8f9fa');
      D.caja(ctx, 0, -98, 42, 58, 14, '#a8e6ff');
      for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.beginPath(); ctx.arc(-8 + i * 8, -76 - k * 36, 3 + i, 0, 7); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      D.circulo(ctx, -10, -40, 5, '#4cc9f0', 2.5); D.circulo(ctx, 10, -40, 5, '#ff5d73', 2.5);
    });
    // Impresora escupiendo una hoja.
    en(ctx, w * 0.62, suelo - 24, () => {
      const k = (t * 0.5) % 1;
      D.caja(ctx, 0, -40 - k * 26, 50, 36, 2, '#fff', 3);
      D.caja(ctx, 0, 0, 90, 50, 8, '#dee2e6');
      D.caja(ctx, 0, -8, 66, 8, 3, D.TINTA, 1);
      D.circulo(ctx, 30, 10, 4, Math.sin(t * 8) > 0 ? '#80ed99' : '#2b9348', 2);
    });
    // Archivador.
    en(ctx, w * 0.95, suelo - 60, () => {
      D.caja(ctx, 0, 0, 62, 120, 6, '#8d99ae');
      for (const dy of [-36, 0, 36]) { D.caja(ctx, 0, dy, 48, 28, 3, '#adb5bd', 3); D.caja(ctx, 0, dy, 16, 5, 2, D.TINTA, 1); }
    });
    // Papelera con bolas de papel.
    en(ctx, w * 0.06, suelo - 18, () => {
      D.circulo(ctx, 16, -30, 8, '#fff', 3); D.circulo(ctx, 34, 12, 7, '#fff', 3);
      D.forma(ctx, [[-20, -22], [20, -22], [14, 20], [-14, 20]], '#6c757d', 4);
    });
  };

  /* ---------------- BANCO ---------------- */
  Z.banco.detalles = (ctx, r, t, D) => {
    const w = r.ancho, suelo = r.y + r.alto - 50;
    // Rótulo.
    en(ctx, w * 0.5, r.y + 62, () => { D.caja(ctx, 0, 0, 190, 44, 10, '#2d6a4f'); D.texto(ctx, 'BANCO', 0, 2, 26, '#ffd60a'); });
    // Cámaras de seguridad que barren la sala.
    for (const s of [-1, 1]) en(ctx, w * (0.5 + s * 0.32), r.y + 60, () => {
      ctx.rotate(s * (0.5 + Math.sin(t * 0.8) * 0.35));
      D.caja(ctx, 0, 14, 46, 22, 5, '#495057', 3.5); D.circulo(ctx, 0, 30, 7, Math.sin(t * 5) > 0 ? '#ff5d73' : '#7a1f3d', 2.5);
    });
    // Cajero automático con cara.
    en(ctx, w * 0.18, suelo - 124, () => {
      D.caja(ctx, 0, 34, 100, 180, 10, '#2d6a4f');
      D.caja(ctx, 0, -20, 76, 54, 6, '#b7e4c7', 3.5);
      D.ojos(ctx, 0, -24, 26, 6, { mx: 0.5 }); D.boca(ctx, 0, -8, 18, 'sonrisa');
      for (let i = 0; i < 9; i++) D.caja(ctx, -20 + (i % 3) * 20, 36 + Math.floor(i / 3) * 16, 13, 10, 2, '#e9ecef', 2);
      D.caja(ctx, 0, 96, 60, 8, 2, D.TINTA, 1);
      const k = (t * 0.6) % 1; D.caja(ctx, 0, 100 + k * 16, 46, 14, 2, '#95d5b2', 2.5);   // billete saliendo
    });
    // Ventanilla con un cajero robot.
    en(ctx, w * 0.82, suelo - 70, () => {
      D.caja(ctx, 0, -64, 150, 110, 8, 'rgba(168,230,255,.6)');
      D.circulo(ctx, 0, -66, 26, '#dee2e6', 4); D.ojos(ctx, 0, -70, 18, 5, { mx: -0.6 }); D.boca(ctx, 0, -56, 14, 'sonrisa');
      D.linea(ctx, 0, -92, 0, -106, 4); D.circulo(ctx, 0, -110, 5, '#ffd60a', 2.5);
      D.caja(ctx, 0, 30, 170, 90, 8, '#8a6f47');
      D.caja(ctx, 0, -10, 180, 16, 5, '#b08968');
    });
    // Postes con cordón.
    const postes = [0.4, 0.5, 0.6].map(fx => w * fx);
    ctx.beginPath(); ctx.moveTo(postes[0], suelo - 46);
    ctx.quadraticCurveTo((postes[0] + postes[1]) / 2, suelo - 24, postes[1], suelo - 46);
    ctx.quadraticCurveTo((postes[1] + postes[2]) / 2, suelo - 24, postes[2], suelo - 46);
    ctx.lineWidth = 11; ctx.strokeStyle = D.TINTA; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#d62839'; ctx.stroke();
    for (const x of postes) { D.linea(ctx, x, suelo, x, suelo - 46, 7); D.circulo(ctx, x, suelo - 52, 8, '#ffd60a', 3.5); D.elipse(ctx, x, suelo, 14, 5, '#ffd60a', 3); }
    // Saco de dinero.
    en(ctx, w * 0.32, suelo - 22, () => {
      D.elipse(ctx, 0, 4, 26, 24, '#d4a373', 4); D.forma(ctx, [[-10, -18], [10, -18], [16, -32], [-16, -32]], '#d4a373', 3.5);
      D.texto(ctx, '$', 0, 6, 22, '#2d6a4f', false);
    });
    // Monedas que brillan.
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = Math.abs(Math.sin(t * 2 + i * 1.3));
      D.texto(ctx, '✦', w * (0.1 + semilla(i + 3) * 0.8), r.y + 330 + semilla(i + 9) * 150, 16, '#fff', false);
    }
    ctx.globalAlpha = 1;
  };

  /* ---------------- CENTRO DE DATOS ---------------- */
  Z.datos.detalles = (ctx, r, t, D) => {
    const w = r.ancho, base = r.y + r.alto - 30;
    // Suelo técnico de rejilla.
    ctx.fillStyle = '#2b2140'; ctx.fillRect(0, base, w, 30);
    for (let x = 0; x < w; x += 40) D.linea(ctx, x, base, x, base + 30, 2.5, 'rgba(199,125,255,.35)');
    D.linea(ctx, 0, base, w, base, 4, '#c77dff');
    // Tuberías de refrigeración por el techo.
    for (const [dy, c] of [[26, '#4cc9f0'], [48, '#ff8fab']]) {
      ctx.beginPath(); ctx.moveTo(0, r.y + dy); ctx.lineTo(w, r.y + dy);
      ctx.lineWidth = 15; ctx.strokeStyle = D.TINTA; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = c; ctx.stroke();
      for (let x = 60; x < w; x += 170) D.caja(ctx, x, r.y + dy, 14, 22, 3, '#adb5bd', 3);
    }
    // Cables colgando entre armarios.
    ['#ffd166', '#80ed99', '#ff5d73'].forEach((c, i) => {
      ctx.beginPath(); ctx.moveTo(w * 0.24, r.y + 190 + i * 40);
      ctx.quadraticCurveTo(w * 0.5, r.y + 300 + i * 46 + Math.sin(t + i) * 8, w * 0.76, r.y + 180 + i * 44);
      ctx.lineWidth = 9; ctx.strokeStyle = D.TINTA; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = c; ctx.stroke();
    });
    // Señal de alta tensión.
    en(ctx, w * 0.36, r.y + 150, () => { D.forma(ctx, [[0, -30], [30, 22], [-30, 22]], '#ffd60a', 4.5); D.forma(ctx, [[4, -14], [-8, 4], [0, 4], [-4, 16], [9, -2], [1, -2]], D.TINTA, 1); });
    // Pantalla de monitorización con un latido.
    en(ctx, w * 0.64, r.y + 250, () => {
      D.caja(ctx, 0, 0, 120, 76, 8, '#2b2140');
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const x = -50 + i * 5, fase = (i + Math.floor(t * 10)) % 10;
        const y = fase === 4 ? -22 : fase === 5 ? 20 : fase === 6 ? -8 : 0;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.lineWidth = 4; ctx.strokeStyle = '#80ed99'; ctx.lineJoin = 'round'; ctx.stroke();
    });
    // Robot técnico con ruedas, de un lado a otro.
    en(ctx, w * (0.5 + Math.sin(t * 0.5) * 0.14), base - 34, () => {
      D.circulo(ctx, -16, 30, 9, '#495057', 3.5); D.circulo(ctx, 16, 30, 9, '#495057', 3.5);
      D.caja(ctx, 0, 6, 56, 44, 10, '#f8f9fa');
      D.caja(ctx, 0, -32, 46, 34, 9, '#f8f9fa');
      D.caja(ctx, 0, -32, 34, 18, 5, '#2b2140', 2.5);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 8, -32, 4, 0, 7); ctx.fillStyle = '#80ed99'; ctx.fill(); }
      D.linea(ctx, 0, -50, 0, -62, 4); D.circulo(ctx, 0, -66, 5, Math.sin(t * 6) > 0 ? '#ff5d73' : '#7a1f3d', 2.5);
      D.caja(ctx, 34, 6, 20, 26, 3, '#4cc9f0', 3);   // tableta
    });
  };

  /* ---------------- LA NUBE ---------------- */
  Z.nube.detalles = (ctx, r, t, D) => {
    const w = r.ancho;
    // Luna.
    en(ctx, w * 0.14, r.y + 110, () => {
      D.circulo(ctx, 0, 0, 40, '#fff3b0', 4.5);
      ctx.beginPath(); ctx.arc(16, -10, 34, 0, 7); ctx.fillStyle = Z.nube.color; ctx.fill();
      D.circulo(ctx, -18, 12, 5, '#ffe08a', 2);
    });
    // Arcoíris detrás de la gran nube.
    ['#ff5d73', '#ffd166', '#80ed99', '#4cc9f0'].forEach((c, i) => {
      ctx.beginPath(); ctx.arc(w * 0.5, r.y + 240, 250 - i * 16, Math.PI * 1.1, Math.PI * 1.9);
      ctx.globalAlpha = 0.45; ctx.lineWidth = 15; ctx.strokeStyle = c; ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // Nubes-servidor: nubes con ranuras y luces.
    [[0.2, 400], [0.78, 480], [0.3, 520]].forEach(([fx, dy], i) => en(ctx, w * fx, r.y + dy + Math.sin(t + i * 2) * 5, () => {
      ctx.beginPath(); ctx.arc(-40, 8, 28, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(-10, -16, 32, Math.PI, Math.PI * 1.9);
      ctx.arc(36, -2, 28, Math.PI * 1.3, Math.PI * 0.5); ctx.closePath(); D.trazo(ctx, '#e9ecef', 4.5);
      for (const y of [-4, 14]) {
        D.caja(ctx, 0, y, 76, 12, 4, '#3d2f63', 2.5);
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-26 + k * 10, y, 2.6, 0, 7); ctx.fillStyle = Math.sin(t * 5 + k * 2 + i + y) > 0 ? '#80ed99' : '#ffd166'; ctx.fill(); }
      }
    }));
    // Aviones de papel: paquetes de datos volando.
    for (let i = 0; i < 3; i++) {
      const k = (t * (0.05 + i * 0.015) + semilla(i + 1)) % 1;
      en(ctx, -60 + k * (w + 120), r.y + 200 + i * 120 + Math.sin(t * 2 + i) * 14, () => {
        ctx.rotate(Math.sin(t * 2 + i) * 0.15 - 0.1);
        D.forma(ctx, [[-22, -8], [24, 0], [-22, 12], [-12, 2]], '#fff', 3.5);
        D.linea(ctx, -12, 2, 24, 0, 3);
      });
    }
    // Estrella fugaz de vez en cuando.
    const f = (t * 0.25) % 1;
    if (f < 0.25) {
      const k = f / 0.25, x = w * (0.9 - k * 0.5), y = r.y + 40 + k * 150;
      ctx.globalAlpha = 1 - k; D.linea(ctx, x, y, x + 60, y - 30, 4, '#fff'); D.circulo(ctx, x, y, 5, '#fff', 2); ctx.globalAlpha = 1;
    }
  };
})();
