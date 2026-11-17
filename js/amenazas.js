/* ============================================================
   AMENAZAS — cada bloque es una amenaza completa e independiente.
   Para crear una nueva: copia un bloque, cambia el id y los números.

   Campos comunes:
     vida        puntos de vida base
     velocidad   casillas por segundo
     fuerza      1 = débil, 2 = media, 3 = fuerte (el firewall solo frena hasta cierta fuerza)
     mordisco    daño por segundo a la defensa que la bloquea
     radio       tamaño (en casillas)
     etiquetas   palabras clave que usan las defensas (p. ej. el parche fulmina 'gusano')
     sigilosa    true = va disfrazada: los disparos no la ven hasta que se revela
     sinEscalada true = no se hace más fuerte al pasar de fase
     actualizar  (opcional) habilidad especial, se llama cada fotograma
     dibujar     cómo se pinta (100 unidades = 1 casilla, mirando a la derecha)
   ============================================================ */
(() => {
  const D = CQ.dibujo;

  /* ---------- SPAM: débil, viene en grupo ---------- */
  CQ.registrarAmenaza({
    id: 'spam', nombre: 'Spam',
    descripcion: 'Débil pero viene en grupo. Un firewall basta para quemarlo.',
    web: 'superofertas.biz',
    muerte: { forma: 'papel', colores: ['#ffe27a', '#fff', '#ff5d73'], cantidad: 12 },
    vida: 40, velocidad: 0.45, fuerza: 1, mordisco: 10, radio: 0.26,
    etiquetas: ['debil'],
    dibujar(ctx, a, t) {
      const bote = Math.abs(Math.sin(t * 9 + a.anim.fase)) * -8;
      D.sombra(ctx, 24);
      D.linea(ctx, -12, 24, -14, 36, 5); D.linea(ctx, 12, 24, 14, 36, 5);
      D.caja(ctx, 0, 6 + bote, 56, 40, 7, '#ffe27a');
      ctx.beginPath(); ctx.moveTo(-26, -12 + bote); ctx.lineTo(0, 4 + bote); ctx.lineTo(26, -12 + bote);
      ctx.lineWidth = 4; ctx.strokeStyle = D.TINTA; ctx.stroke();
      D.ojos(ctx, 2, 12 + bote, 20, 6.5, { mx: 1, enfado: true });
      D.circulo(ctx, 24, -14 + bote, 9, '#ff5d73', 3.5);
      D.texto(ctx, '!', 24, -13 + bote, 14, '#fff', false);
    },
  });

  /* ---------- VIRUS: el enemigo estándar ---------- */
  CQ.registrarAmenaza({
    id: 'virus', nombre: 'Virus',
    descripcion: 'La amenaza de toda la vida: aguanta más que el spam y muerde tus defensas.',
    web: 'descarga-ya.net',
    muerte: { forma: 'gota', colores: ['#8ee05a', '#5fc23a'], cantidad: 12 },
    vida: 105, velocidad: 0.30, fuerza: 1, mordisco: 14, radio: 0.3,
    etiquetas: [],
    dibujar(ctx, a, t) {
      const lat = 1 + Math.sin(t * 6 + a.anim.fase) * 0.05;
      D.sombra(ctx, 28);
      ctx.save(); ctx.scale(lat, 2 - lat);
      for (let i = 0; i < 8; i++) {
        const ang = i * Math.PI / 4 + t * 0.8 + a.anim.fase;
        D.circulo(ctx, Math.cos(ang) * 30, Math.sin(ang) * 30, 7, '#5fc23a', 3.5);
      }
      D.circulo(ctx, 0, 0, 27, '#8ee05a');
      D.ojos(ctx, 5, -6, 22, 8, { mx: 1, enfado: true });
      D.boca(ctx, 5, 8, 22, 'mala');
      ctx.restore();
    },
  });

  /* ---------- GUSANO: muy rápido, atraviesa firewalls ---------- */
  CQ.registrarAmenaza({
    id: 'gusano', nombre: 'Gusano',
    descripcion: 'Muy rápido y atraviesa los firewalls. Un parche lo fulmina.',
    web: 'reenvia-esto.me',
    muerte: { forma: 'circulo', colores: ['#ff9ecb', '#ff6fae'], cantidad: 7, r: 0.13, fuerza: 1.6 },
    vida: 70, velocidad: 0.75, fuerza: 2, mordisco: 12, radio: 0.26,
    etiquetas: ['gusano'],
    dibujar(ctx, a, t) {
      const onda = i => Math.sin(t * 14 + a.anim.fase - i * 0.9) * 7;
      D.sombra(ctx, 34, 34);
      for (let i = 3; i >= 1; i--) D.circulo(ctx, -i * 15, 12 + onda(i), 15 - i * 1.5, '#ff9ecb');
      D.circulo(ctx, 4, 8 + onda(0), 19, '#ff6fae');
      D.ojos(ctx, 10, 3 + onda(0), 15, 6, { mx: 1 });
      D.boca(ctx, 12, 16 + onda(0), 10, 'o');
    },
  });

  /* ---------- TROYANO: disfrazado de regalo, duro y mordedor ---------- */
  CQ.registrarAmenaza({
    id: 'troyano', nombre: 'Troyano',
    descripcion: 'Va disfrazado de regalo: tus disparos no lo ven hasta que está muy cerca o algo lo descubre.',
    web: 'regalo-gratis.com',
    muerte: { forma: 'astilla', colores: ['#9d4edd', '#ffd166', '#c77dff'], cantidad: 14 },
    vida: 210, velocidad: 0.26, fuerza: 2, mordisco: 30, radio: 0.3,
    etiquetas: [],
    sigilosa: true,
    dibujar(ctx, a, t) {
      const bote = Math.abs(Math.sin(t * 5 + a.anim.fase)) * -5;
      D.sombra(ctx, 30);
      if (!a.revelada) {
        D.caja(ctx, 0, 12 + bote, 56, 46, 6, '#ff6b81');
        D.caja(ctx, 0, 12 + bote, 12, 46, 0, '#ffd166', 3.5);
        D.caja(ctx, 0, -14 + bote, 64, 16, 5, '#ff8fa0');
        D.circulo(ctx, -9, -28 + bote, 9, '#ffd166', 3.5); D.circulo(ctx, 9, -28 + bote, 9, '#ffd166', 3.5);
        D.ojos(ctx, 0, 8 + bote, 30, 6, { cerrados: true });
        D.boca(ctx, 0, 24 + bote, 14, 'sonrisa');
      } else {
        D.caja(ctx, 0, 14 + bote, 56, 44, 6, '#9d4edd');
        ctx.fillStyle = D.TINTA; ctx.fillRect(-26, -12 + bote, 52, 10);
        ctx.save(); ctx.translate(-4, -22 + bote); ctx.rotate(-0.3 + Math.sin(t * 8) * 0.06);
        D.caja(ctx, 0, 0, 64, 15, 5, '#c77dff'); ctx.restore();
        D.ojos(ctx, 6, -6 + bote, 22, 7, { mx: 1, enfado: true });
        D.boca(ctx, 6, 14 + bote, 30, 'mala');
      }
    },
  });

  /* ---------- PHISHING: lanza un anzuelo que deja "engañada" a una defensa ---------- */
  CQ.registrarAmenaza({
    id: 'phishing', nombre: 'Phishing',
    descripcion: 'Lanza un anzuelo que deja engañada (bloqueada) a una defensa durante unos segundos.',
    web: 'tu-banc0.com',
    muerte: { forma: 'burbuja', colores: ['#9b5de5', '#e0aaff'], cantidad: 10, gravedad: -2.5, impulso: 0 },
    vida: 80, velocidad: 0.34, fuerza: 2, mordisco: 10, radio: 0.3,
    etiquetas: ['phishing'],
    anzuelo: { cada: 5, alcance: 3.5, duracion: 4.5 },
    actualizar(a, dt, juego) {
      const cfg = a.def.anzuelo;
      a.t.anzuelo = (a.t.anzuelo == null ? cfg.cada * 0.5 : a.t.anzuelo) - dt;
      if (a.t.anzuelo > 0) return;
      // Busca la defensa más cercana por delante en su carril.
      let objetivo = null;
      for (const d of juego.defensas) {
        const dx = d.col + 0.5 - a.x;
        if (d.muerta || d.fila !== a.fila || dx < 0 || dx > cfg.alcance) continue;
        if (juego.tiene(d, 'bloqueada') || d.def.mordible === false) continue;
        if (!objetivo || dx < objetivo.col + 0.5 - a.x) objetivo = d;
      }
      if (!objetivo) { a.t.anzuelo = 0.5; return; }
      a.t.anzuelo = cfg.cada;
      juego.fx.rayo(a.x, a.fila + 0.4, objetivo.col + 0.5, objetivo.fila + 0.5, '#9b5de5');
      if (juego.bloquearDefensa(objetivo, cfg.duracion, a.def.id)) juego.sonido('anzuelo');
      else juego.fx.texto(objetivo.col + 0.5, objetivo.fila + 0.2, '¡Inmune!', '#80ed99');
    },
    dibujar(ctx, a, t) {
      const flota = Math.sin(t * 5 + a.anim.fase) * 4;
      D.sombra(ctx, 30);
      ctx.save(); ctx.translate(0, flota);
      D.forma(ctx, [[-24, 0], [-46, -16 + Math.sin(t * 10) * 3], [-46, 16 - Math.sin(t * 10) * 3]], '#7b2cbf');
      D.elipse(ctx, 0, 0, 30, 22, '#9b5de5');
      D.forma(ctx, [[-6, -20], [4, -34], [12, -20]], '#7b2cbf', 4);
      D.circulo(ctx, 13, -5, 9, '#fff', 3.5);
      ctx.beginPath(); ctx.arc(16, -5, 4.2, 0, 7); ctx.fillStyle = D.TINTA; ctx.fill();
      D.linea(ctx, 6, -17, 20, -12, 4.5);
      D.boca(ctx, 18, 9, 16, 'mala');
      // Caña con anzuelo (brilla cuando va a lanzarlo).
      ctx.beginPath(); ctx.moveTo(6, -22); ctx.quadraticCurveTo(26, -52, 44, -30); ctx.lineTo(44, -16);
      ctx.lineWidth = 3.5; ctx.strokeStyle = D.TINTA; ctx.stroke();
      ctx.beginPath(); ctx.arc(39, -14, 6, 0, Math.PI);
      ctx.lineWidth = 5; ctx.strokeStyle = (a.t.anzuelo != null && a.t.anzuelo < 0.8) ? '#fff' : '#ffd166'; ctx.stroke();
      ctx.restore();
    },
  });

  /* ---------- RANSOMWARE: jefe. Cifra (bloquea) las defensas cercanas ---------- */
  CQ.registrarAmenaza({
    id: 'ransomware', nombre: 'Ransomware',
    descripcion: 'Jefe lento y durísimo. Cifra (bloquea) todas las defensas que tenga cerca.',
    web: 'paga-o-llora.onion',
    muerte: { forma: 'astilla', colores: ['#ffb703', '#cfd8dc', '#fff'], cantidad: 30, r: 0.14, fuerza: 4, vida: 1.2, sacudida: 16 },
    entrada: { cartel: '¡RANSOMWARE!', sonido: 'alarma', oscurecer: true },
    vida: 780, velocidad: 0.16, fuerza: 3, mordisco: 40, radio: 0.4,
    etiquetas: ['jefe'],
    cifrado: { cada: 8, radio: 1.6, duracion: 4 },
    actualizar(a, dt, juego) {
      const cfg = a.def.cifrado;
      a.t.cifrar = (a.t.cifrar == null ? cfg.cada * 0.6 : a.t.cifrar) - dt;
      if (a.t.cifrar > 0) return;
      a.t.cifrar = cfg.cada;
      juego.fx.onda(a.x, a.fila + 0.5, cfg.radio, '#ffb703');
      juego.sonido('cifrado');
      for (const d of juego.defensas) {
        if (d.muerta) continue;
        if (Math.hypot(d.col + 0.5 - a.x, d.fila - a.fila) <= cfg.radio) juego.bloquearDefensa(d, cfg.duracion, a.def.id);
      }
    },
    dibujar(ctx, a, t) {
      const paso = Math.sin(t * 4 + a.anim.fase);
      D.sombra(ctx, 40, 44);
      ctx.save(); ctx.scale(1.2, 1.2); ctx.rotate(paso * 0.05);
      ctx.beginPath(); ctx.arc(0, -18, 19, Math.PI, 0);
      ctx.lineCap = 'butt'; ctx.lineWidth = 17; ctx.strokeStyle = D.TINTA; ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = '#cfd8dc'; ctx.stroke();
      const aviso = a.t.cifrar != null && a.t.cifrar < 1;
      D.caja(ctx, 0, 10, 74, 58, 12, aviso ? '#ffe08a' : '#ffb703');
      D.ojos(ctx, 4, 2, 28, 9, { mx: 1, enfado: true });
      D.circulo(ctx, 4, 20, 6, D.TINTA, 1);
      D.forma(ctx, [[4, 20], [-1, 34], [9, 34]], D.TINTA, 1);
      ctx.restore();
    },
  });
  /* ---------- KEYLOGGER: mientras vive, te roba CPU ---------- */
  CQ.registrarAmenaza({
    id: 'keylogger', nombre: 'Keylogger',
    descripcion: 'Mientras siga en el tablero te roba CPU poco a poco. Elimínalo cuanto antes.',
    web: 'teclados-gratis.io',
    muerte: { forma: 'papel', colores: ['#495057', '#adb5bd', '#fff'], cantidad: 12 },
    vida: 95, velocidad: 0.28, fuerza: 2, mordisco: 12, radio: 0.3,
    etiquetas: ['espia'],
    robo: { cada: 2.5, cantidad: 10 },
    actualizar(a, dt, juego) {
      const cfg = a.def.robo;
      a.t.robo = (a.t.robo == null ? cfg.cada : a.t.robo) - dt;
      if (a.t.robo > 0 || a.x < 0) return;
      a.t.robo = cfg.cada;
      const robado = Math.min(juego.cpu, cfg.cantidad);
      if (robado <= 0) return;
      juego.cpu -= robado;
      juego.fx.texto(a.x, a.fila + 0.05, '-' + robado + ' CPU', '#ff5d73');
      juego.sonido('robo');
    },
    dibujar(ctx, a, t) {
      const paso = Math.sin(t * 9 + a.anim.fase);
      D.sombra(ctx, 28);
      D.linea(ctx, -12, 24, -12 + paso * 5, 37, 5); D.linea(ctx, 12, 24, 12 - paso * 5, 37, 5);
      D.caja(ctx, 0, 6, 62, 52, 10, '#343a40');
      D.caja(ctx, 0, 0, 50, 40, 8, '#6c757d', 3.5);
      D.ojos(ctx, 4, -4, 22, 7, { mx: 1, enfado: true });
      D.texto(ctx, 'K', -16, 16, 13, '#fff', false);
      if (a.t.robo != null && a.t.robo < 0.5) { D.circulo(ctx, 26, -26, 9, '#80ed99', 3); D.texto(ctx, '+', 26, -25, 13, '#fff', false); }
    },
  });

  /* ---------- BOTNET: lento y duro, invoca spam a su alrededor ---------- */
  CQ.registrarAmenaza({
    id: 'botnet', nombre: 'Botnet',
    descripcion: 'Lento y resistente. Cada pocos segundos invoca spam en su carril y en los vecinos.',
    web: 'ordenadores-zombi.net',
    muerte: { forma: 'astilla', colores: ['#74c7ec', '#adb5bd', '#fff'], cantidad: 18, r: 0.12 },
    vida: 260, velocidad: 0.2, fuerza: 2, mordisco: 18, radio: 0.34,
    etiquetas: [],
    invocacion: { cada: 7.5, amenaza: 'spam', cantidad: 2 },
    actualizar(a, dt, juego) {
      const cfg = a.def.invocacion;
      a.t.invocar = (a.t.invocar == null ? cfg.cada * 0.6 : a.t.invocar) - dt;
      if (a.t.invocar > 0 || a.x < 0.3) return;
      a.t.invocar = cfg.cada;
      for (let i = 0; i < cfg.cantidad; i++) {
        const fila = CQ.util.limitar(a.fila + (i % 2 ? 1 : -1), 0, juego.filas - 1);
        juego.invocar(cfg.amenaza, fila, a.x - 0.2 - i * 0.25);
      }
      juego.fx.onda(a.x, a.fila + 0.5, 0.9, '#74c7ec');
      juego.sonido('invocar');
    },
    dibujar(ctx, a, t) {
      const resp = Math.sin(t * 4 + a.anim.fase) * 2, aviso = a.t.invocar != null && a.t.invocar < 0.8;
      D.sombra(ctx, 32, 42);
      ctx.save(); ctx.translate(0, resp);
      for (const s of [-1, 1]) { D.linea(ctx, s * 16, -30, s * 24, -48, 5); D.circulo(ctx, s * 25, -50, 6, aviso ? '#fff' : '#ff5d73', 3); }
      D.caja(ctx, 0, 4, 70, 64, 14, '#74c7ec');
      D.caja(ctx, 0, -4, 54, 28, 8, '#2b2140', 3);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 13 + 3, -4, 6, 0, 7); ctx.fillStyle = aviso ? '#fff' : '#ff5d73'; ctx.fill(); }
      for (let i = -2; i <= 2; i++) D.linea(ctx, i * 9 + 2, 18, i * 9 + 2, 28, 4);
      ctx.restore();
    },
  });

  /* ---------- DÍA CERO: jefe final. Rota tres ataques ---------- */
  CQ.registrarAmenaza({
    id: 'diaCero', nombre: 'Día Cero',
    descripcion: 'El jefe final: un fallo que nadie conocía. Va alternando tres ataques: bloquea tus defensas, invoca gusanos y cambia de carril.',
    web: '0day.???',
    muerte: { forma: 'astilla', colores: ['#ff5d73', '#2b2140', '#ffd60a', '#fff'], cantidad: 44, r: 0.15, fuerza: 5, vida: 1.5, sacudida: 22 },
    entrada: { cartel: '¡DÍA CERO!', sonido: 'alarma', oscurecer: true },
    vida: 1500, velocidad: 0.1, fuerza: 3, mordisco: 70, radio: 0.45,
    etiquetas: ['jefe'],
    sinEscalada: true,   // si se cuela, vuelve igual: no gana vida ni velocidad
    ataques: { cada: 7, bloqueo: { radio: 2, duracion: 4 }, invoca: { amenaza: 'gusano', cantidad: 2 } },
    actualizar(a, dt, juego) {
      const cfg = a.def.ataques;
      a.t.ataque = (a.t.ataque == null ? cfg.cada * 0.5 : a.t.ataque) - dt;
      if (a.t.ataque > 0 || a.x < 0.3) return;
      a.t.ataque = cfg.cada;
      a.t.turno = ((a.t.turno == null ? -1 : a.t.turno) + 1) % 3;
      if (a.t.turno === 0) {          // 1) bloquea las defensas cercanas
        juego.fx.onda(a.x, a.fila + 0.5, cfg.bloqueo.radio, '#ff5d73');
        juego.sonido('cifrado');
        for (const d of juego.defensas) {
          if (!d.muerta && Math.hypot(d.col + 0.5 - a.x, d.fila - a.fila) <= cfg.bloqueo.radio) juego.bloquearDefensa(d, cfg.bloqueo.duracion, a.def.id);
        }
      } else if (a.t.turno === 1) {   // 2) invoca refuerzos por carriles al azar
        for (let i = 0; i < cfg.invoca.cantidad; i++) juego.invocar(cfg.invoca.amenaza, CQ.util.azarEntero(0, juego.filas - 1), Math.max(0, a.x - 0.5));
        juego.sonido('invocar');
      } else {                        // 3) salta al carril peor defendido por delante
        const cuenta = f => juego.defensas.filter(d => !d.muerta && d.fila === f && d.col + 0.5 > a.x).length;
        const filas = [...Array(juego.filas).keys()].filter(f => f !== a.fila).sort((x, y) => cuenta(x) - cuenta(y));
        if (filas.length) { a.fila = filas[0]; juego.fx.texto(a.x, a.fila + 0.05, '¡Salto!', '#ff5d73'); juego.sonido('anzuelo'); }
      }
    },
    dibujar(ctx, a, t) {
      const paso = Math.sin(t * 3 + a.anim.fase), aviso = a.t.ataque != null && a.t.ataque < 1;
      D.sombra(ctx, 46, 50);
      ctx.save(); ctx.scale(1.25, 1.25); ctx.rotate(paso * 0.04);
      for (const s of [-1, 1]) for (const k of [-1, 0, 1]) D.linea(ctx, s * 26, 8 + k * 14, s * (44 + Math.sin(t * 8 + k) * 4), 14 + k * 18, 6);
      D.forma(ctx, [[-22, -30], [-30, -50], [-10, -36], [0, -54], [10, -36], [30, -50], [22, -30]], '#ffd60a', 4);
      D.elipse(ctx, 0, 6, 36, 38, aviso ? '#ff8fa0' : '#2b2140');
      D.elipse(ctx, 0, 6, 28, 30, aviso ? '#ffd6dc' : '#4a3b6e', 3);
      D.ojos(ctx, 4, -4, 26, 9, { mx: 1, enfado: true });
      D.boca(ctx, 4, 16, 28, 'mala');
      D.texto(ctx, '0', 4, -24, 15, '#ff5d73');
      ctx.restore();
    },
  });
})();
