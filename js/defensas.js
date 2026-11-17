/* ============================================================
   DEFENSAS — cada bloque es una defensa completa e independiente.
   Para crear una nueva: copia un bloque, cambia el id y los números,
   y añade su id a la lista "defensas" de la fase en niveles.js.

   Campos comunes:
     coste       CPU que cuesta desplegarla
     recarga     segundos hasta poder desplegar otra igual
     vida        aguante frente a mordiscos
     bloquea     true/false o función (defensa, amenaza) => ¿la frena?
     mordible    false = las amenazas no la atacan (trampas)
     inmuneA     ids de amenazas cuyos bloqueos no le afectan
     deteccion   distancia (casillas) a la que descubre amenazas disfrazadas
     actualizar  lógica por fotograma (no se ejecuta si está bloqueada)
     alTocar     se llama mientras una amenaza está sobre su casilla
     eventos     reacciones a eventos del motor (p. ej. defensaDestruida)
     dibujar     cómo se pinta (100 unidades = 1 casilla, mirando a la izquierda)
   ============================================================ */
(() => {
  const D = CQ.dibujo;

  /* ---------- NÚCLEO: no ataca, fabrica chips de CPU ---------- */
  CQ.registrarDefensa({
    id: 'nucleo', nombre: 'Núcleo',
    bien: 'Tu economía: cuantos más, más CPU',
    mal: 'No se defiende solo',
    descripcion: 'Fabrica chips de CPU. No ataca: protégelo.',
    coste: 50, recarga: 5, vida: 60,
    produccion: { primera: 6, cada: 14, valor: 25 },
    actualizar(d, dt, juego) {
      const cfg = d.def.produccion;
      d.t.producir = (d.t.producir == null ? cfg.primera : d.t.producir) - dt;
      if (d.t.producir > 0) return;
      d.t.producir = cfg.cada;
      juego.soltarChip(d.col + 0.5 + CQ.util.azar(-0.25, 0.25), d.fila + 0.62, cfg.valor, false);
    },
    dibujar(ctx, d, t) {
      const listo = d.t.producir != null && d.t.producir < 1.5;
      const late = 1 + (listo ? Math.sin(t * 18) * 0.05 : Math.sin(t * 3 + d.anim.fase) * 0.02);
      D.sombra(ctx, 30);
      ctx.save(); ctx.scale(late, late);
      for (const s of [-1, 1]) for (const p of [-16, 0, 16]) {
        D.linea(ctx, s * 28, p, s * 38, p, 6); D.linea(ctx, p, s * 28, p, s * 38, 6);
      }
      D.caja(ctx, 0, 0, 58, 58, 10, listo ? '#b9fbc0' : '#06d6a0');
      D.caja(ctx, 0, 0, 40, 40, 6, '#e9fff5', 3.5);
      D.ojos(ctx, 0, -4, 18, 6, { mx: -0.6 });
      D.boca(ctx, 0, 10, 14, 'sonrisa');
      ctx.restore();
    },
  });

  /* ---------- FIREWALL: muro barato. Frena y quema a las amenazas débiles ---------- */
  CQ.registrarDefensa({
    id: 'firewall', nombre: 'Firewall',
    bien: 'Spam y virus',
    mal: 'Gusanos, troyanos, phishing y jefes: lo cruzan',
    descripcion: 'Muro que frena y quema a las amenazas débiles. Las fuertes lo cruzan.',
    coste: 50, recarga: 6, vida: 220,
    valiente: true,         // no pone cara de miedo
    fuerzaMaxima: 1,        // frena amenazas con fuerza <= este valor
    quemadura: 16,          // daño/seg a las que frena
    quemaduraAlCruzar: 6,   // daño/seg a las que lo atraviesan
    bloquea(d, a) { return a.fuerza <= d.def.fuerzaMaxima; },
    actualizar(d, dt, juego) {
      for (const a of juego.amenazasEnFila(d.fila)) {
        if (Math.abs(a.x - (d.col + 0.5)) > 0.6) continue;
        juego.herirAmenaza(a, (d.def.bloquea(d, a) ? d.def.quemadura : d.def.quemaduraAlCruzar) * dt);
      }
    },
    dibujar(ctx, d, t) {
      D.sombra(ctx, 30, 42);
      for (let i = -1; i <= 1; i++) {
        const alto = 16 + Math.sin(t * 12 + i * 2 + d.anim.fase) * 6;
        D.forma(ctx, [[i * 16 - 10, -30], [i * 16, -34 - alto], [i * 16 + 10, -30]], i ? '#ffb703' : '#ff7b00', 4);
      }
      D.caja(ctx, 0, 6, 52, 72, 6, '#f4845f');
      ctx.lineWidth = 3; ctx.strokeStyle = D.TINTA;
      for (const y of [-12, 6, 24]) { ctx.beginPath(); ctx.moveTo(-26, y); ctx.lineTo(26, y); ctx.stroke(); }
      for (const [x, y] of [[0, -21], [-12, -3], [12, -3], [0, 15], [-12, 33], [12, 33]]) {
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke();
      }
      D.ojos(ctx, -3, -3, 22, 7, { mx: -1, enfado: true });
    },
  });

  /* ---------- ANTIVIRUS: dispara por su carril ---------- */
  CQ.registrarDefensa({
    id: 'antivirus', nombre: 'Antivirus',
    bien: 'Casi todo lo que ve venir',
    mal: 'Troyanos disfrazados (hasta tenerlos cerca)',
    descripcion: 'Dispara a todo lo que ve venir por su carril. Descubre troyanos de cerca.',
    coste: 100, recarga: 5, vida: 90,
    deteccion: 1.6,
    disparo: { cada: 1.1, golpe: 18, velocidad: 7 },
    actualizar(d, dt, juego) {
      const cfg = d.def.disparo;
      d.t.disparo = (d.t.disparo == null ? 0.5 : d.t.disparo) - dt;
      d.anim.accion = Math.max(0, (d.anim.accion || 0) - dt * 5);
      if (d.t.disparo > 0) return;
      const hayObjetivo = juego.amenazasEnFila(d.fila).some(a => juego.esVisible(a) && a.x < d.col + 0.5 && a.x > -0.4);
      if (!hayObjetivo) { d.t.disparo = 0.1; return; }
      d.t.disparo = cfg.cada; d.anim.accion = 1;
      juego.disparar({ fila: d.fila, x: d.col + 0.25, vel: -cfg.velocidad, golpe: cfg.golpe, color: '#4cc9f0' });
      juego.sonido('disparo');
    },
    dibujar(ctx, d, t) {
      const retroceso = (d.anim.accion || 0) * 8, resp = Math.sin(t * 3 + d.anim.fase) * 2;
      D.sombra(ctx, 28, 42);
      ctx.save(); ctx.translate(retroceso, resp);
      ctx.beginPath(); ctx.moveTo(-30, -28); ctx.quadraticCurveTo(0, -40, 30, -28); ctx.lineTo(30, 2);
      ctx.quadraticCurveTo(30, 28, 0, 40); ctx.quadraticCurveTo(-30, 28, -30, 2); ctx.closePath();
      D.trazo(ctx, '#4cc9f0');
      ctx.beginPath(); ctx.moveTo(-19, -20); ctx.quadraticCurveTo(0, -28, 19, -20); ctx.lineTo(19, 0);
      ctx.quadraticCurveTo(19, 18, 0, 27); ctx.quadraticCurveTo(-19, 18, -19, 0); ctx.closePath();
      ctx.fillStyle = '#a8e6ff'; ctx.fill();
      D.ojos(ctx, -3, -6, 20, 7.5, { mx: -1 });
      D.boca(ctx, -3, 10, 14, (d.anim.accion || 0) > 0.3 ? 'o' : 'sonrisa');
      ctx.restore();
    },
  });

  /* ---------- DOBLE FACTOR: rayo lento y potente, verdugo del phishing ---------- */
  CQ.registrarDefensa({
    id: 'dobleFactor', nombre: 'Doble factor',
    bien: 'Phishing (triple daño) y amenazas duras',
    mal: 'Grupos numerosos: dispara muy lento',
    descripcion: 'Rayo lento y muy potente contra la amenaza más dura cercana. Triple daño al phishing.',
    coste: 150, recarga: 8, vida: 80,
    inmuneA: ['phishing'],
    rayo: { cada: 3.2, golpe: 90, alcance: 4, multiplicadores: { phishing: 3 } },
    actualizar(d, dt, juego) {
      const cfg = d.def.rayo;
      d.t.rayo = (d.t.rayo == null ? 1.5 : d.t.rayo) - dt;
      if (d.t.rayo > 0) return;
      let objetivo = null;
      for (const a of juego.amenazasEnFila(d.fila)) {
        if (!juego.esVisible(a) || Math.abs(a.x - (d.col + 0.5)) > cfg.alcance || a.x < -0.3) continue;
        if (!objetivo || a.vida > objetivo.vida) objetivo = a;
      }
      if (!objetivo) { d.t.rayo = 0.15; return; }
      d.t.rayo = cfg.cada;
      juego.fx.rayo(d.col + 0.5, d.fila + 0.25, objetivo.x, objetivo.fila + 0.5, '#c77dff');
      juego.sonido('rayo');
      juego.herirAmenaza(objetivo, cfg.golpe * (cfg.multiplicadores[objetivo.def.id] || 1));
    },
    dibujar(ctx, d, t) {
      const cfg = d.def.rayo;
      const carga = d.t.rayo == null ? 1 : 1 - CQ.util.limitar(d.t.rayo / cfg.cada, 0, 1);
      D.sombra(ctx, 24, 42);
      D.linea(ctx, 10, -34, 16, -46, 5); D.circulo(ctx, 17, -48, 6, carga > 0.9 ? '#fff' : '#c77dff', 3.5);
      D.caja(ctx, 0, 2, 46, 72, 11, '#7b2cbf');
      D.caja(ctx, 0, -4, 34, 44, 6, carga > 0.9 ? '#fff' : '#e0aaff', 3.5);
      D.ojos(ctx, -1, -10, 14, 5, { mx: -0.8 });
      // Barra de carga con forma de código de verificación.
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(-11 + i * 7.5, 6, 2.6, 0, 7);
        ctx.fillStyle = carga * 4 > i + 0.5 ? '#7b2cbf' : 'rgba(123,44,191,.25)'; ctx.fill();
      }
      D.circulo(ctx, 0, 30, 4, '#e0aaff', 3);
    },
  });

  /* ---------- PARCHE: trampa de un uso. Fulmina gusanos ---------- */
  CQ.registrarDefensa({
    id: 'parche', nombre: 'Parche',
    bien: 'Gusanos: los fulmina',
    mal: 'Solo sirve una vez',
    descripcion: 'Trampa barata de un solo uso. Fulmina gusanos y hace mucho daño al resto.',
    coste: 25, recarga: 7, vida: 1,
    bloquea: false, mordible: false,
    trampa: { armado: 2, golpe: 130, fulmina: ['gusano'] },
    actualizar(d, dt) {
      d.t.armado = (d.t.armado == null ? d.def.trampa.armado : d.t.armado) - dt;
    },
    alTocar(d, a, dt, juego) {
      const cfg = d.def.trampa;
      if (d.t.armado == null || d.t.armado > 0) return;
      const fulminada = a.def.etiquetas.some(e => cfg.fulmina.includes(e));
      juego.revelar(a);
      juego.fx.onda(d.col + 0.5, d.fila + 0.5, 0.6, '#ff8fab');
      juego.fx.texto(d.col + 0.5, d.fila + 0.2, fulminada ? '¡Parcheado!' : '¡Zas!', '#fff');
      juego.sonido('parche');
      juego.herirAmenaza(a, fulminada ? 99999 : cfg.golpe);
      juego.retirarDefensa(d);
    },
    dibujar(ctx, d, t) {
      const armado = d.t.armado == null || d.t.armado <= 0;
      ctx.save(); ctx.globalAlpha *= armado ? 1 : 0.55;
      ctx.translate(0, 22); ctx.rotate(-0.28);
      D.caja(ctx, 0, 0, 72, 28, 14, '#f6c9a8');
      D.caja(ctx, 0, 0, 24, 22, 4, '#fff1e6', 3.5);
      ctx.fillStyle = D.TINTA;
      for (const x of [-25, -18, 18, 25]) for (const y of [-5, 5]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); }
      if (armado) D.ojos(ctx, 0, 0, 10, 3.5, { mx: -0.6 });
      ctx.restore();
    },
  });

  /* ---------- SANDBOX: encierra a una amenaza y la deja vulnerable ---------- */
  CQ.registrarDefensa({
    id: 'sandbox', nombre: 'Sandbox',
    bien: 'Troyanos y amenazas rápidas',
    mal: 'Jefes: no los atrapa',
    descripcion: 'Encierra a la primera amenaza que entra, la descubre y la deja vulnerable. No sirve con jefes.',
    coste: 75, recarga: 9, vida: 1,
    bloquea: false, mordible: false,
    captura: { duracion: 6, recarga: 10, ignora: ['jefe'] },
    actualizar(d, dt) { d.t.recarga = Math.max(0, (d.t.recarga || 0) - dt); },
    alTocar(d, a, dt, juego) {
      const cfg = d.def.captura;
      if (d.t.recarga > 0 || juego.tiene(a, 'atrapada')) return;
      if (a.def.etiquetas.some(e => cfg.ignora.includes(e))) return;
      juego.poner(a, 'atrapada', cfg.duracion);
      juego.poner(a, 'vulnerable', cfg.duracion);
      juego.revelar(a);
      a.x = d.col + 0.5;
      d.t.recarga = cfg.duracion + cfg.recarga;
      d.t.ocupada = cfg.duracion;
      juego.fx.texto(d.col + 0.5, d.fila + 0.1, '¡Atrapada!', '#ffe27a');
      juego.sonido('sandbox');
    },
    dibujar(ctx, d, t) {
      const lista = !(d.t.recarga > 0);
      ctx.save(); ctx.globalAlpha *= lista ? 1 : 0.6;
      D.caja(ctx, 0, 22, 78, 34, 7, '#e9c46a');
      D.elipse(ctx, 0, 16, 30, 9, '#fff3b0', 3.5);
      D.linea(ctx, -39, 22, 39, 22, 3);
      // Banderín.
      D.linea(ctx, 26, 14, 26, -8, 4);
      D.forma(ctx, [[26, -8], [8, -2], [26, 4]], lista ? '#ff5d73' : '#adb5bd', 3.5);
      ctx.restore();
    },
  });

  /* ---------- COPIA DE SEGURIDAD: desbloquea, cura y reconstruye ---------- */
  CQ.registrarDefensa({
    id: 'copia', nombre: 'Copia',
    bien: 'Ransomware y phishing: deshace sus bloqueos',
    mal: 'No ataca',
    descripcion: 'Desbloquea y repara las defensas de su carril y los vecinos. Reconstruye una defensa destruida cada cierto tiempo.',
    coste: 125, recarga: 12, vida: 100,
    inmuneA: ['ransomware', 'phishing'],
    restaurar: { cada: 6, cura: 25, filas: 1, reconstruirTras: 3, reconstruirRecarga: 25 },
    actualizar(d, dt, juego) {
      const cfg = d.def.restaurar;
      d.t.reconstruir = Math.max(0, (d.t.reconstruir || 0) - dt);
      d.t.pulso = (d.t.pulso == null ? cfg.cada : d.t.pulso) - dt;
      if (d.t.pulso > 0) return;
      d.t.pulso = cfg.cada;
      let hizoAlgo = false;
      for (const otra of juego.defensas) {
        if (otra.muerta || otra === d || Math.abs(otra.fila - d.fila) > cfg.filas) continue;
        let ayudada = false;
        if (juego.tiene(otra, 'bloqueada')) { juego.quitar(otra, 'bloqueada'); ayudada = true; }
        if (otra.vida < otra.vidaMax) { otra.vida = Math.min(otra.vidaMax, otra.vida + cfg.cura); ayudada = true; }
        if (ayudada) { hizoAlgo = true; juego.fx.particulas(otra.col + 0.5, otra.fila + 0.5, '#80ed99', 4); }
      }
      if (hizoAlgo) { juego.fx.onda(d.col + 0.5, d.fila + 0.5, 0.7, '#80ed99'); juego.sonido('restaurar'); }
    },
    eventos: {
      defensaDestruida(d, datos, juego) {
        const cfg = d.def.restaurar, caida = datos.defensa;
        if (caida === d || caida.def.id === d.def.id) return;
        if (Math.abs(caida.fila - d.fila) > cfg.filas || d.t.reconstruir > 0) return;
        d.t.reconstruir = cfg.reconstruirRecarga;
        juego.programar(cfg.reconstruirTras, () => {
          if (d.muerta) return;
          if (juego.colocarGratis(caida.def.id, caida.fila, caida.col, 0.5)) {
            juego.fx.texto(caida.col + 0.5, caida.fila + 0.1, '¡Restaurada!', '#80ed99');
            juego.sonido('restaurar');
          }
        });
      },
    },
    dibujar(ctx, d, t) {
      const lista = !(d.t.reconstruir > 0), resp = Math.sin(t * 3 + d.anim.fase) * 2;
      D.sombra(ctx, 30, 42);
      ctx.save(); ctx.translate(0, resp);
      D.forma(ctx, [[-30, -32], [20, -32], [30, -22], [30, 32], [-30, 32]], '#577590');
      D.caja(ctx, -2, -22, 30, 18, 3, '#dfe7ec', 3.5);
      D.caja(ctx, 4, -22, 8, 12, 1, '#577590', 2.5);
      D.caja(ctx, 0, 14, 44, 28, 4, '#fff', 3.5);
      D.ojos(ctx, -1, 10, 16, 5.5, { mx: -0.7 });
      D.boca(ctx, -1, 20, 12, 'sonrisa');
      D.circulo(ctx, 24, -30, 7, lista ? '#80ed99' : '#adb5bd', 3.5);
      ctx.restore();
    },
  });
  /* ---------- HONEYPOT: cebo resistente que atrae a las amenazas de los carriles vecinos ---------- */
  CQ.registrarDefensa({
    id: 'honeypot', nombre: 'Honeypot',
    descripcion: 'Tarro de miel muy resistente. Atrae a su carril a las amenazas de los carriles vecinos.',
    bien: 'Juntar amenazas en un solo carril bien defendido',
    mal: 'No hace daño y los jefes lo ignoran',
    coste: 75, recarga: 12, vida: 320,
    valiente: true,
    cebo: { alcance: 2.5, filas: 1, ignora: ['jefe'] },
    actualizar(d, dt, juego) {
      const cfg = d.def.cebo, centro = d.col + 0.5;
      for (const a of juego.amenazas) {
        if (a.muerta || a.t.atraida || a.fila === d.fila || Math.abs(a.fila - d.fila) > cfg.filas) continue;
        if (centro - a.x < 0.6 || centro - a.x > cfg.alcance) continue;
        if (a.mordiendo || juego.tiene(a, 'atrapada') || a.def.etiquetas.some(e => cfg.ignora.includes(e))) continue;
        a.t.atraida = true;          // cada amenaza solo pica una vez
        a.fila = d.fila;
        juego.fx.texto(a.x, d.fila + 0.1, '¡Miel!', '#ffd166');
        juego.sonido('miel');
      }
    },
    dibujar(ctx, d, t) {
      const resp = Math.sin(t * 3 + d.anim.fase) * 1.5;
      D.sombra(ctx, 30, 42);
      ctx.save(); ctx.translate(0, resp);
      D.caja(ctx, 0, 8, 58, 60, 16, '#ffc93c');
      D.caja(ctx, 0, -24, 46, 14, 5, '#b5651d');
      ctx.beginPath(); ctx.moveTo(-18, -17); ctx.quadraticCurveTo(-18, 2 + Math.sin(t * 2) * 3, -10, -2); ctx.quadraticCurveTo(-6, -8, -4, -17); ctx.closePath();
      D.trazo(ctx, '#ff9f1c', 3.5);
      D.ojos(ctx, 2, 6, 20, 6.5, { mx: -0.8 });
      D.boca(ctx, 2, 20, 14, 'sonrisa');
      ctx.restore();
    },
  });

  /* ---------- CAPTCHA: campo que ralentiza a las amenazas que lo cruzan ---------- */
  CQ.registrarDefensa({
    id: 'captcha', nombre: 'Captcha',
    descripcion: 'Las amenazas que pasan cerca se entretienen resolviéndolo y avanzan mucho más despacio.',
    bien: 'Gusanos y grupos: da tiempo a tus disparos',
    mal: 'No hace daño y los jefes no se molestan en resolverlo',
    coste: 75, recarga: 10, vida: 1,
    bloquea: false, mordible: false,
    campo: { alcance: 1.2, factor: 0.4, ignora: ['jefe'] },   // factor: 0.4 = van al 40 % de su velocidad
    actualizar(d, dt, juego) {
      const cfg = d.def.campo;
      d.t.activo = Math.max(0, (d.t.activo || 0) - dt);
      for (const a of juego.amenazasEnFila(d.fila)) {
        if (Math.abs(a.x - (d.col + 0.5)) > cfg.alcance || a.def.etiquetas.some(e => cfg.ignora.includes(e))) continue;
        a.factorLenta = cfg.factor;
        juego.poner(a, 'lenta', 0.25);
        d.t.activo = 0.3;
      }
    },
    dibujar(ctx, d, t) {
      const activo = d.t.activo > 0;
      D.sombra(ctx, 34, 40);
      D.caja(ctx, 0, 6, 76, 46, 8, '#f8f9fa');
      D.caja(ctx, -22, 6, 22, 22, 4, activo ? '#fff3b0' : '#fff', 3.5);
      if (activo) {   // la casilla gira mientras alguien intenta resolverlo
        ctx.beginPath(); ctx.arc(-22, 6, 7, t * 9, t * 9 + 4.2); ctx.lineWidth = 3.5; ctx.strokeStyle = '#4cc9f0'; ctx.stroke();
      }
      for (const [y, w] of [[0, 30], [10, 20]]) D.linea(ctx, -4, y, -4 + w, y, 4, 'rgba(43,33,64,.35)');
      D.ojos(ctx, 22, -24, 14, 5, { mx: -0.8 });
    },
  });

  /* ---------- FORMATEO: bomba de un uso. Arrasa una zona de 3x3 ---------- */
  CQ.registrarDefensa({
    id: 'formateo', nombre: 'Formateo',
    descripcion: 'Botón rojo de un solo uso. Tras una cuenta atrás, arrasa a las amenazas de las casillas de alrededor.',
    bien: 'Limpiar de golpe una zona desbordada',
    mal: 'Caro, lento de recargar y los jefes solo reciben la mitad',
    coste: 175, recarga: 30, vida: 1,
    bloquea: false, mordible: false,
    bomba: { mecha: 1.3, radio: 1.6, golpe: 420, multiplicadores: { jefe: 0.5 } },
    actualizar(d, dt, juego) {
      const cfg = d.def.bomba;
      d.t.mecha = (d.t.mecha == null ? cfg.mecha : d.t.mecha) - dt;
      if (d.t.mecha > 0) return;
      const x = d.col + 0.5, y = d.fila + 0.5;
      for (const a of [...juego.amenazas]) {
        if (a.muerta || Math.hypot(a.x - x, (a.fila + 0.5) - y) > cfg.radio) continue;
        const mult = a.def.etiquetas.reduce((m, e) => m * (cfg.multiplicadores[e] == null ? 1 : cfg.multiplicadores[e]), 1);
        juego.revelar(a);
        juego.herirAmenaza(a, cfg.golpe * mult);
      }
      juego.fx.onda(x, y, cfg.radio, '#ff5d73');
      juego.fx.lanzar({ forma: 'astilla', colores: ['#ff5d73', '#ffd166', '#fff'], cantidad: 22, fuerza: 4, x, y });
      juego.sonido('explosion');
      juego.emitir('explosion', { x, y, fuerza: 14 });
      juego.retirarDefensa(d);
    },
    dibujar(ctx, d, t) {
      const cfg = d.def.bomba, queda = d.t.mecha == null ? cfg.mecha : d.t.mecha;
      const alerta = Math.sin(t * (10 + (cfg.mecha - queda) * 20)) > 0;
      D.sombra(ctx, 30, 40);
      D.caja(ctx, 0, 16, 64, 34, 8, '#495057');
      D.elipse(ctx, 0, -2, 24, 18, alerta ? '#ffd6dc' : '#ff5d73');
      D.ojos(ctx, 0, -4, 16, 5.5, { enfado: true });
      D.texto(ctx, queda.toFixed(1), 0, 22, 15, '#fff');
    },
  });
})();
