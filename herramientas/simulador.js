/* ============================================================
   SIMULADOR DE EQUILIBRIO (herramienta de desarrollo, el juego no la carga).
   Juega partidas enteras sin pantalla con un bot para medir la dificultad.

   Uso, desde la consola del navegador con el juego abierto:
     const s = document.createElement('script'); s.src = 'herramientas/simulador.js'; document.head.append(s);
     CQ.sim.prueba(6, false, 3, 4)   // 6 partidas, bot experto, 3 núcleos, nivel 5 (índice 4)
     CQ.sim.prueba(6, true)    // 6 partidas con el bot "humano" (lento y despistado)
   Cada línea: coladas/total de cada fase, resultado (v/d) y CPU inicial de las fases 2 y 3.
   ============================================================ */
CQ.sim = (() => {
  /* Bot: reparte antivirus según la vida prevista por carril, usa parches
     contra gusanos, sandbox contra troyanos y firewalls delante. */
  function bot(j, nucleos) {
    const sup = j.fase.horda.tipo === 'supervivientes';
    const vida = Array(j.filas).fill(0), gus = Array(j.filas).fill(0), tro = Array(j.filas).fill(0);
    const esc = j.fase.escalada.vida || 1;
    const apunta = (fila, tipo, v) => { vida[fila] += v; if (tipo === 'gusano') gus[fila]++; if (tipo === 'troyano') tro[fila]++; };
    for (const a of j.amenazas) apunta(a.fila, a.tipo, a.vida);
    for (const e of j.cola) if (sup || e.t - j.tiempo < CQ.config.avisoSegundos) apunta(e.fila, e.tipo, CQ.amenazas[e.tipo].vida * esc);
    const cuenta = (f, id) => j.defensas.filter(d => d.fila === f && d.tipo === id).length;
    const activas = j.defensasActivas();
    const pon = (id, f, cols) => {
      if (!activas.includes(id)) return false;
      for (const c of cols.filter(c => c < j.columnas)) if (!j.defensaEn(f, c)) { if (!j.puedeColocar(id, f, c)) j.colocar(id, f, c); return true; }
      return false;
    };
    if (!sup && j.tiempo < 70 && j.defensas.filter(d => d.tipo === 'nucleo').length < nucleos) {
      for (let f = 0; f < j.filas; f++) if (!j.defensaEn(f, j.columnas - 1)) { pon('nucleo', f, [j.columnas - 1]); return; }
    }
    for (let f = 0; f < j.filas; f++) if (gus[f] > cuenta(f, 'parche') && pon('parche', f, [2, 1, 0])) return;
    for (let f = 0; f < j.filas; f++) if (tro[f] > 0 && !cuenta(f, 'sandbox') && pon('sandbox', f, [3])) return;
    const orden = [...Array(j.filas).keys()].filter(f => vida[f] > 0)
      .sort((a, b) => vida[b] / (1 + cuenta(b, 'antivirus')) - vida[a] / (1 + cuenta(a, 'antivirus')));
    const fondo = j.columnas - 2;   // los antivirus se colocan de atrás hacia delante
    for (const f of orden) { const n = cuenta(f, 'antivirus'); if (vida[f] / (n + 0.01) > 170 && n < 4 && pon('antivirus', f, [fondo, fondo - 1, fondo - 2, fondo - 3])) return; }
    for (const f of orden) if (!sup && !cuenta(f, 'firewall') && pon('firewall', f, [3])) return;
  }

  /* humano = true: recoge los chips tarde, pierde el 15 % y actúa cada 2 s. */
  function partida(humano, nucleos, indiceNivel) {
    const j = new CQ.Juego(CQ.niveles[indiceNivel || 0]), fases = [], cpus = [];
    let pasos = 0, espera = 0;
    while (pasos++ < 400000) {
      if (j.estado === 'intermedio') { fases.push({ ...j.stats }); j.siguienteFase(); cpus.push(j.cpu); continue; }
      if (j.estado === 'victoria' || j.estado === 'derrota') break;
      for (const c of [...j.chips]) {
        if (c.ignorado == null) c.ignorado = humano && Math.random() < 0.15;
        if (!c.ignorado && c.altura <= 0.01 && c.vida < CQ.config.cpu.chipDuracion - (humano ? 4 : 2)) j.recogerChipEn(c.x, c.y);
      }
      espera += 0.05;
      if (espera >= (humano ? 2 : 0.3)) { espera = 0; bot(j, nucleos); }
      j.actualizar(0.05);
    }
    fases.push({ ...j.stats });
    return { fases, cpus, fin: j.estado, puntos: j.puntos };
  }

  function prueba(n, humano, nucleos, indiceNivel) {
    const lineas = [];
    for (let i = 0; i < n; i++) {
      const p = partida(humano, nucleos || 3, indiceNivel);
      lineas.push(p.fases.map(f => f.coladas + '/' + f.total).join(' > ') + '  ' + p.fin[0] + '  cpu: ' + p.cpus.join(', ') + '  pts: ' + p.puntos);
    }
    return lineas.join('\n');
  }

  return { bot, partida, prueba };
})();
