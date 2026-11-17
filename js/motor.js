/* ============================================================
   MOTOR — reglas genéricas del juego. No conoce ninguna amenaza
   ni defensa concreta: solo lee sus definiciones y llama a sus
   funciones. Coordenadas del tablero en casillas:
     x: 0 = borde izquierdo, columnas = borde derecho (la red)
     y: fila + 0.5 = centro del carril
   ============================================================ */
(() => {
  const U = CQ.util;
  let contador = 0;

  /* Crea una amenaza con las estadísticas ya escaladas. También sirve
     para dibujar muestras (avisos de carril, resúmenes). */
  CQ.crearAmenaza = (tipo, fila, escalada) => {
    const def = CQ.amenazas[tipo], e = def.sinEscalada ? {} : (escalada || {});
    const vida = def.vida * (e.vida || 1) * CQ.config.dificultad;
    return {
      id: ++contador, def, tipo, fila, x: -0.6,
      vida, vidaMax: vida,
      vel: def.velocidad * (e.velocidad || 1),
      fuerza: def.fuerza + (e.fuerza || 0),
      mordisco: def.mordisco * (e.mordisco || 1),
      radio: def.radio || 0.3,
      revelada: !def.sigilosa,
      estados: {}, t: {}, mordiendo: null, muerta: false,
      anim: { golpe: 0, nace: 0, fase: Math.random() * 6.28 },
    };
  };

  CQ.crearDefensa = (id, fila, col) => {
    const def = CQ.defensas[id];
    return {
      id: ++contador, def, tipo: id, fila, col,
      vida: def.vida, vidaMax: def.vida,
      estados: {}, t: {}, muerta: false,
      anim: { golpe: 0, nace: 0, accion: 0, fase: Math.random() * 6.28 },
    };
  };

  class Juego {
    /* opciones.defensas: el "mazo" elegido por el jugador (lista ordenada de ids). */
    constructor(nivel, opciones) {
      this.nivel = nivel;
      this.mazo = (opciones && opciones.defensas) || null;
      this.resumen = [];          // estadísticas de cada fase jugada
      this.puntos = 0;
      this._crearEfectos();
      this.iniciarFase(0, null);
    }

    /* ---------------- Fases ---------------- */
    iniciarFase(indice, supervivientes, cpuTraspasada) {
      const fase = this.nivel.fases[indice];
      this.indiceFase = indice;
      this.fase = fase;
      this.esUltimaFase = indice === this.nivel.fases.length - 1;
      this.escenario = CQ.escenarios[fase.escenario];
      this.filas = fase.filas; this.columnas = fase.columnas;
      this.cpu = fase.cpuInicial + (cpuTraspasada || 0);
      this.estado = 'preparacion';   // preparacion | horda | intermedio | victoria | derrota
      this.tPreparacion = fase.preparacion;
      this.tiempo = 0;               // segundos desde que empezó la horda
      this.reloj = 0;                // segundos totales de la fase (animaciones)
      this.tChip = this.regla('chipCada', CQ.config.cpu.chipCada);
      this.defensas = []; this.amenazas = []; this.proyectiles = [];
      this.chips = []; this.efectos = []; this.programados = [];
      this.pasaron = [];             // amenazas que se han colado en esta fase
      this.recargas = {};            // id de defensa -> segundos que faltan
      this.rejilla = Array.from({ length: this.filas }, () => Array(this.columnas).fill(null));
      this.cola = CQ.generadoresHorda[fase.horda.tipo](fase.horda, this, supervivientes || [])
        .sort((a, b) => a.t - b.t);
      // CPU extra proporcional a la vida total de la horda (útil en fases de supervivientes:
      // cuanto más peligroso es lo que se coló, más presupuesto para frenarlo).
      if (fase.cpuPor100Vida) {
        const vidaTotal = this.cola.reduce((s, e) => s + CQ.amenazas[e.tipo].vida, 0)
          * ((fase.escalada && fase.escalada.vida) || 1) * CQ.config.dificultad;
        this.cpu += Math.round(vidaTotal / 100 * fase.cpuPor100Vida / 25) * 25;
      }
      this.stats = { total: this.cola.length, eliminadas: 0, coladas: 0 };
      this.emitir('faseIniciada', {});
    }

    empezarHorda() {
      if (this.estado !== 'preparacion') return;
      this.estado = 'horda';
      this.emitir('hordaIniciada', {});
    }

    /* Da el nivel por ganado ahora mismo (lo usa el modo desarrollo). */
    ganarYa() {
      if (this.estado !== 'preparacion' && this.estado !== 'horda') return;
      this.stats.eliminadas += this.restantes();
      this.cola = []; this.amenazas = []; this.pasaron = [];
      this._terminar('victoria');
    }

    siguienteFase() {
      if (this.estado === 'intermedio') this.iniciarFase(this.indiceFase + 1, this.pasaron, this.traspaso.total);
    }

    _terminarFase() {
      this._guardarResumen();
      if (this.pasaron.length === 0) return this._terminar('victoria');
      this.traspaso = this._calcularTraspaso();
      this.estado = 'intermedio';
      this.emitir('faseTerminada', { pasaron: this.pasaron });
    }

    /* Lo que te llevas a la fase siguiente: la CPU sin gastar y el valor de las
       defensas que sigan en pie (según la vida que les quede). */
    _calcularTraspaso() {
      const cfg = CQ.config.traspaso;
      const sobrante = Math.floor(this.cpu * cfg.cpuSobrante);
      let defensas = 0;
      for (const d of this.defensas) if (!d.muerta) defensas += d.def.coste * (d.vida / d.vidaMax) * cfg.defensas;
      defensas = Math.round(defensas / 5) * 5;
      return { sobrante, defensas, enPie: this.defensas.filter(d => !d.muerta).length, total: sobrante + defensas };
    }

    _guardarResumen() {
      if (this.resumen[this.indiceFase]) return;
      this.resumen[this.indiceFase] = { nombre: this.fase.nombre, ...this.stats };
    }

    _terminar(resultado) {
      this._guardarResumen();
      this.estado = resultado;
      const p = CQ.config.puntuacion;
      const eliminadas = this.resumen.reduce((s, r) => s + r.eliminadas, 0);
      const coladas = this.resumen.reduce((s, r) => s + r.coladas, 0);
      let puntos = eliminadas * p.porEliminada + coladas * p.porColada;
      if (resultado === 'victoria') {
        puntos += p.porFaseGanada[Math.min(this.indiceFase, p.porFaseGanada.length - 1)];
        puntos += this.cpu * p.porCpu;
      }
      this.puntos = Math.max(0, Math.round(puntos));
      this.emitir(resultado, { puntos: this.puntos });
    }

    /* ---------------- Eventos y sonido ---------------- */
    emitir(nombre, datos) {
      datos.juego = this;
      CQ.eventos.emitir(nombre, datos);
      // Las defensas vivas también pueden reaccionar a eventos.
      if (!this.defensas) return;
      for (const d of [...this.defensas]) {
        const fn = d.def.eventos && d.def.eventos[nombre];
        if (fn && !d.muerta && !this.tiene(d, 'bloqueada')) fn(d, datos, this);
      }
    }
    sonido(nombre) { CQ.eventos.emitir('sonido', { nombre, juego: this }); }

    /* ---------------- Estados temporales (bloqueada, atrapada, vulnerable…) ---------------- */
    poner(obj, estado, segundos) { obj.estados[estado] = Math.max(obj.estados[estado] || 0, segundos); }
    tiene(obj, estado) { return obj.estados[estado] > 0; }
    quitar(obj, estado) { delete obj.estados[estado]; }
    _avanzarEstados(obj, dt) {
      for (const k in obj.estados) { obj.estados[k] -= dt; if (obj.estados[k] <= 0) delete obj.estados[k]; }
    }

    /* Valor de un ajuste para la fase actual: el de fase.reglas si lo define, o el general. */
    regla(nombre, porDefecto) {
      const r = this.fase.reglas;
      return r && r[nombre] != null ? r[nombre] : porDefecto;
    }

    /* ---------------- Consultas ---------------- */
    amenazasEnFila(fila) { return this.amenazas.filter(a => a.fila === fila && !a.muerta); }
    esVisible(a) { return a.revelada; }
    defensaEn(fila, col) { return (this.rejilla[fila] && this.rejilla[fila][col]) || null; }
    /* Amenazas que están a punto de entrar por un carril (para los avisos).
       Devuelve { lista, progreso }: progreso 0..1 indica cuánto falta para la primera. */
    proximas(fila) {
      const todo = this.estado === 'preparacion' && this.fase.horda.mostrarCarriles;
      const aviso = this.regla('avisoSegundos', CQ.config.avisoSegundos);
      const lista = this.cola.filter(e => e.fila === fila && (todo || e.t - this.tiempo <= aviso));
      const progreso = lista.length ? U.limitar(1 - (lista[0].t - this.tiempo) / aviso, 0, 1) : 0;
      return { lista, progreso };
    }
    restantes() { return this.cola.length + this.amenazas.filter(a => !a.muerta).length; }

    /* ---------------- Acciones sobre amenazas ---------------- */
    herirAmenaza(a, cantidad) {
      if (a.muerta) return;
      if (this.tiene(a, 'vulnerable')) cantidad *= CQ.config.vulnerableMult;
      a.vida -= cantidad; a.anim.golpe = 1;
      if (a.vida > 0) return;
      a.muerta = true;
      this.stats.eliminadas++;
      this.sonido('eliminada');
      this.emitir('amenazaEliminada', { amenaza: a });
    }
    /* Hace aparecer una amenaza en mitad del tablero (la usan botnets y jefes). */
    invocar(tipo, fila, x) {
      const a = CQ.crearAmenaza(tipo, fila, this.fase.escalada);
      a.x = x;
      this.amenazas.push(a);
      this.stats.total++;
      this.fx.particulas(x, fila + 0.5, '#fff', 5);
      this.emitir('amenazaAparece', { amenaza: a });
      return a;
    }
    revelar(a) {
      if (a.revelada) return;
      a.revelada = true;
      this.fx.texto(a.x, a.fila + 0.05, '¡Descubierta!', '#c77dff');
      this.sonido('revelada');
    }
    _colar(a) {
      a.muerta = true;
      this.stats.coladas++;
      this.pasaron.push({ tipo: a.tipo, fila: a.fila });
      this.fx.texto(this.columnas - 0.3, a.fila + 0.3, '¡Se coló!', '#ff5d73');
      this.sonido('colada');
      this.emitir('amenazaColada', { amenaza: a });
      if (this.esUltimaFase && !this.fase.sinFin) this._terminar('derrota');
    }

    /* Defensas que se pueden desplegar ahora, en el orden de las cartas:
       el mazo elegido, o las que fije la fase, o las primeras del nivel. */
    defensasActivas() {
      return this.mazo || this.fase.defensas || (this.nivel.defensas || []).slice(0, this.nivel.ranuras || 99);
    }

    /* ---------------- Acciones sobre defensas ---------------- */
    puedeColocar(id, fila, col) {
      const def = CQ.defensas[id];
      if (!def || !this.defensasActivas().includes(id)) return 'No disponible';
      if (this.estado !== 'preparacion' && this.estado !== 'horda') return 'Ahora no';
      if (fila < 0 || col < 0 || fila >= this.filas || col >= this.columnas) return 'Fuera del tablero';
      if (this.rejilla[fila][col]) return 'Casilla ocupada';
      if (this.cpu < def.coste) return 'Falta CPU';
      if (this.recargas[id] > 0) return 'Recargando';
      return null;   // null = se puede
    }
    colocar(id, fila, col) {
      const motivo = this.puedeColocar(id, fila, col);
      if (motivo) return motivo;
      const def = CQ.defensas[id];
      this.cpu -= def.coste;
      this.recargas[id] = def.recarga;
      this._instalar(id, fila, col, 1);
      this.sonido('colocar');
      return null;
    }
    colocarGratis(id, fila, col, fraccionVida) {
      if (this.rejilla[fila][col] || !CQ.defensas[id]) return false;
      this._instalar(id, fila, col, fraccionVida == null ? 1 : fraccionVida);
      return true;
    }
    _instalar(id, fila, col, fraccionVida) {
      const d = CQ.crearDefensa(id, fila, col);
      d.vida = d.vidaMax * fraccionVida;
      this.defensas.push(d); this.rejilla[fila][col] = d;
      this.fx.particulas(col + 0.5, fila + 0.7, '#fff', 5);
      if (d.def.alColocar) d.def.alColocar(d, this);
      this.emitir('defensaColocada', { defensa: d });
    }
    herirDefensa(d, cantidad) {
      if (d.muerta) return;
      d.vida -= cantidad; d.anim.golpe = 1;
      if (d.vida > 0) return;
      this.retirarDefensa(d);
      this.fx.particulas(d.col + 0.5, d.fila + 0.5, '#adb5bd', 10);
      this.sonido('destruida');
      this.emitir('defensaDestruida', { defensa: d });
    }
    /* Quita la defensa del tablero sin más (trampas gastadas, etc.). */
    retirarDefensa(d) {
      if (d.muerta) return;
      d.muerta = true;
      if (this.rejilla[d.fila][d.col] === d) this.rejilla[d.fila][d.col] = null;
    }
    /* Desinstalar a mano: devuelve parte del coste. */
    desinstalar(fila, col) {
      const d = this.defensaEn(fila, col);
      if (!d || (this.estado !== 'preparacion' && this.estado !== 'horda')) return false;
      const devuelto = Math.round(d.def.coste * CQ.config.reembolsoAlQuitar * (d.vida / d.vidaMax));
      this.cpu += devuelto;
      this.retirarDefensa(d);
      this.fx.texto(col + 0.5, fila + 0.3, '+' + devuelto, '#80ed99');
      this.sonido('quitar');
      return true;
    }
    bloquearDefensa(d, segundos, idOrigen) {
      if (d.def.inmuneA && d.def.inmuneA.includes(idOrigen)) return false;
      this.poner(d, 'bloqueada', segundos);
      return true;
    }

    /* ---------------- Proyectiles, chips y temporizadores ---------------- */
    disparar(p) { this.proyectiles.push({ muerto: false, ...p }); }
    soltarChip(x, y, valor, cae) {
      this.chips.push({ x, y, altura: cae ? y + 1.5 : 0, valor, vida: CQ.config.cpu.chipDuracion, nace: 0 });
    }
    programar(segundos, fn) { this.programados.push({ t: segundos, fn }); }

    /* Clic en coordenadas del tablero: recoge un chip si lo hay. */
    recogerChipEn(x, y) {
      for (const c of this.chips) {
        if (c.vida <= 0 || Math.hypot(c.x - x, (c.y - c.altura) - y) > 0.42) continue;
        this._recoger(c);
        return true;
      }
      return false;
    }

    _recoger(c) {
      c.vida = 0;
      this.cpu += c.valor;
      this.fx.texto(c.x, c.y - c.altura - 0.3, '+' + c.valor, '#b9fbc0');
      this.sonido('chip');
      this.emitir('chipRecogido', { chip: c });
    }

    /* ---------------- Efectos visuales (solo datos; los pinta render.js) ---------------- */
    _crearEfectos() {
      const lista = () => this.efectos;
      this.fx = {
        particulas(x, y, color, n) {
          for (let i = 0; i < n; i++) {
            const ang = Math.random() * 6.28, v = U.azar(0.6, 2.2);
            lista().push({ tipo: 'particula', x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 0.8, color, r: U.azar(0.05, 0.11), vida: 0.5, max: 0.5 });
          }
        },
        /* Lanza trozos con forma: 'circulo', 'papel', 'gota', 'astilla' o 'burbuja'. */
        lanzar(op) {
          const colores = op.colores || [op.color || '#fff'];
          for (let i = 0; i < (op.cantidad || 8); i++) {
            const ang = Math.random() * 6.28, v = U.azar(0.5, 1) * (op.fuerza || 2.4), dura = U.azar(0.6, 1) * (op.vida || 0.8);
            lista().push({
              tipo: 'particula', forma: op.forma || 'circulo', x: op.x, y: op.y,
              vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - (op.impulso == null ? 1 : op.impulso),
              color: colores[i % colores.length], r: U.azar(0.7, 1.2) * (op.r || 0.09),
              giro: Math.random() * 6.28, vgiro: U.azar(-9, 9),
              gravedad: op.gravedad == null ? 5 : op.gravedad, vida: dura, max: dura,
            });
          }
        },
        texto(x, y, cadena, color) { lista().push({ tipo: 'texto', x, y, cadena, color, vida: 0.9, max: 0.9 }); },
        rayo(x1, y1, x2, y2, color) { lista().push({ tipo: 'rayo', x1, y1, x2, y2, color, vida: 0.22, max: 0.22 }); },
        onda(x, y, r, color) { lista().push({ tipo: 'onda', x, y, r, color, vida: 0.45, max: 0.45 }); },
      };
    }

    /* ---------------- Bucle principal ---------------- */
    actualizar(dt) {
      this._actualizarEfectos(dt);
      if (this.estado !== 'preparacion' && this.estado !== 'horda') return;
      this.reloj += dt;

      if (this.estado === 'preparacion') {
        this.tPreparacion -= dt;
        if (this.tPreparacion <= 0) this.empezarHorda();
      }
      if (this.estado === 'horda') {
        this.tiempo += dt;
        while (this.cola.length && this.cola[0].t <= this.tiempo) {
          const e = this.cola.shift();
          const nueva = CQ.crearAmenaza(e.tipo, e.fila, this.fase.escalada);
          this.amenazas.push(nueva);
          this.emitir('amenazaAparece', { amenaza: nueva });
        }
      }

      // Chips que caen del cielo.
      if (!this.fase.sinChips && (this.estado === 'horda' || CQ.config.cpu.enPreparacion)) {
        this.tChip -= dt;
        if (this.tChip <= 0) {
          this.tChip = this.regla('chipCada', CQ.config.cpu.chipCada);
          this.soltarChip(U.azar(0.6, this.columnas - 0.6), U.azarEntero(0, this.filas - 1) + 0.6, CQ.config.cpu.chipValor, true);
        }
      }

      for (const id in this.recargas) this.recargas[id] = Math.max(0, this.recargas[id] - dt);

      for (const p of this.programados) { p.t -= dt; if (p.t <= 0) { p.hecho = true; p.fn(); } }
      this.programados = this.programados.filter(p => !p.hecho);

      this._actualizarDefensas(dt);
      this._actualizarAmenazas(dt);
      if (this.estado === 'derrota') return;
      this._actualizarProyectiles(dt);

      for (const c of this.chips) {
        c.vida -= dt; c.nace = Math.min(1, c.nace + dt * 4);
        c.altura = Math.max(0, c.altura - dt * 1.6);
        // Recogida automática: tras un instante en el suelo, el chip se cobra solo.
        if (CQ.config.cpu.recogidaAutomatica && c.altura <= 0 && c.vida > 0) {
          c.enSuelo = (c.enSuelo || 0) + dt;
          if (c.enSuelo >= CQ.config.cpu.retardoRecogida) this._recoger(c);
        }
      }

      this.defensas = this.defensas.filter(d => !d.muerta);
      this.amenazas = this.amenazas.filter(a => !a.muerta);
      this.proyectiles = this.proyectiles.filter(p => !p.muerto);
      this.chips = this.chips.filter(c => c.vida > 0);

      // Una fase con sinFin: true (tutorial, pruebas) nunca termina sola.
      if (this.estado === 'horda' && !this.cola.length && !this.amenazas.length && !this.fase.sinFin) this._terminarFase();
    }

    _actualizarDefensas(dt) {
      for (const d of [...this.defensas]) {
        if (d.muerta) continue;
        this._avanzarEstados(d, dt);
        d.anim.golpe = Math.max(0, d.anim.golpe - dt * 6);
        d.anim.nace = Math.min(1, d.anim.nace + dt * 5);
        if (this.tiene(d, 'bloqueada')) continue;
        // Detección de amenazas disfrazadas.
        if (d.def.deteccion) {
          for (const a of this.amenazas) {
            if (!a.revelada && !a.muerta && a.fila === d.fila && Math.abs(a.x - (d.col + 0.5)) <= d.def.deteccion) this.revelar(a);
          }
        }
        if (d.def.actualizar) d.def.actualizar(d, dt, this);
      }
    }

    _bloquea(d, a) {
      const b = d.def.bloquea;
      return typeof b === 'function' ? b(d, a) : b !== false;
    }

    _actualizarAmenazas(dt) {
      for (const a of [...this.amenazas]) {
        if (a.muerta) continue;
        this._avanzarEstados(a, dt);
        a.anim.golpe = Math.max(0, a.anim.golpe - dt * 6);
        a.anim.nace = Math.min(1, a.anim.nace + dt * 4);
        a.mordiendo = null;
        if (this.tiene(a, 'atrapada')) continue;
        if (a.def.actualizar) a.def.actualizar(a, dt, this);

        // ¿Hay una defensa justo delante que la frene?
        const colBase = Math.floor(a.x);
        for (const col of [colBase, colBase + 1]) {
          const d = this.defensaEn(a.fila, col);
          if (!d || d.muerta) continue;
          const centro = col + 0.5;
          if (a.x + a.radio >= centro - 0.25 && a.x < centro && this._bloquea(d, a)) { a.mordiendo = d; break; }
        }
        if (a.mordiendo) {
          this.revelar(a);
          if (a.mordiendo.def.mordible !== false) this.herirDefensa(a.mordiendo, a.mordisco * dt);
        }

        // ¿Está pisando una casilla con defensa (trampas, sandbox…)?
        const pisada = this.defensaEn(a.fila, colBase);
        if (pisada && !pisada.muerta && pisada.def.alTocar && !this.tiene(pisada, 'bloqueada')
            && Math.abs(a.x - (colBase + 0.5)) < 0.42) {
          pisada.def.alTocar(pisada, a, dt, this);
          if (a.muerta) continue;
        }

        // El estado "lenta" multiplica la velocidad por a.factorLenta (lo pone quien la frena).
        const freno = this.tiene(a, 'lenta') ? (a.factorLenta || 0.5) : 1;
        if (!a.mordiendo && !this.tiene(a, 'atrapada')) a.x += a.vel * freno * dt;
        if (a.x >= this.columnas + 0.3) { this._colar(a); if (this.estado === 'derrota') return; }
      }
    }

    _actualizarProyectiles(dt) {
      for (const p of this.proyectiles) {
        p.x += p.vel * dt;
        if (p.x < -1 || p.x > this.columnas + 1) { p.muerto = true; continue; }
        for (const a of this.amenazas) {
          if (a.muerta || a.fila !== p.fila || !this.esVisible(a)) continue;
          if (Math.abs(a.x - p.x) > a.radio + 0.12) continue;
          this.herirAmenaza(a, p.golpe);
          this.fx.particulas(p.x, p.fila + 0.5, p.color, 3);
          p.muerto = true;
          break;
        }
      }
    }

    _actualizarEfectos(dt) {
      for (const e of this.efectos) {
        e.vida -= dt;
        if (e.tipo === 'particula') {
          e.x += e.vx * dt; e.y += e.vy * dt;
          e.vy += (e.gravedad == null ? 4 : e.gravedad) * dt;
          if (e.vgiro) e.giro += e.vgiro * dt;
        }
        if (e.tipo === 'texto') e.y -= dt * 0.5;
      }
      this.efectos = this.efectos.filter(e => e.vida > 0);
    }
  }

  CQ.Juego = Juego;
})();
