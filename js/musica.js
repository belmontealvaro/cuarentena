/* ============================================================
   MÚSICA — secuenciador por pasos, todo sintetizado.
   Cada fase elige su música con el campo "musica" en niveles.js.

   Una partitura es:
     bpm      pulsaciones por minuto
     tonica   nota base en número MIDI (57 = La grave)
     bajo / melodia / melodiaB   listas de pasos (semicorcheas). Cada paso es la
                      distancia en semitonos a la tónica, o _ (silencio).
     bombo / caja / plato   texto donde 'x' es golpe y '.' silencio.
   Cada pista se repite sola al llegar al final, así que pueden
   tener longitudes distintas. Para una música nueva, copia un bloque.
   ============================================================ */
(() => {
  const _ = null;

  // Fase 1: alegre y juguetona (modo mayor).
  CQ.registrarMusica({
    id: 'perimetro', bpm: 108, tonica: 57,
    bajo:    [0, _, _, 0, _, _, 7, _, 5, _, _, 5, _, _, 7, _,   0, _, _, 0, _, _, 7, _, 9, _, _, 9, _, _, 7, _],
    melodia: [12, _, 16, _, 19, _, 16, _, 21, _, 19, _, 16, _, _, _,   12, _, 16, _, 19, _, 24, _, 23, _, 19, _, 16, _, _, _],
    melodiaB: [12, _, _, _, 16, _, 19, _, 16, _, _, _, 14, _, _, _,   12, _, _, _, 16, _, 19, _, 21, _, 19, _, 16, _, _, _],
    bombo: 'x.......x.......',
    caja:  '....x.......x...',
    plato: 'x.x.x.x.x.x.x.x.',
  });

  // Fase 2: más rápida y en menor: algo va mal.
  CQ.registrarMusica({
    id: 'redInterna', bpm: 122, tonica: 55,
    bajo:    [0, _, 0, _, 0, _, 3, _, 5, _, 5, _, 3, _, -2, _],
    melodia: [12, _, _, 15, _, _, 19, _, 17, _, 15, _, _, _, 14, _,   12, _, _, 15, _, _, 19, _, 22, _, 20, _, 19, _, _, _],
    melodiaB: [19, _, _, 17, _, _, 15, _, 14, _, _, _, 12, _, _, _,   15, _, _, 17, _, _, 19, _, 20, _, 19, _, 15, _, _, _],
    bombo: 'x.....x.x.......',
    caja:  '....x.......x..x',
    plato: 'x.xxx.xxx.xxx.xx',
  });

  // Fase 3: tensa y machacona (segunda menor, bombo a contratiempo).
  CQ.registrarMusica({
    id: 'servidor', bpm: 138, tonica: 52,
    bajo:    [0, 0, _, 0, 0, _, 0, _, 1, 1, _, 1, 1, _, 3, _],
    melodia: [12, _, 13, _, 12, _, _, _, 15, _, 13, _, 12, _, _, _,   19, _, 18, _, 15, _, _, _, 13, _, 12, _, 13, _, 15, _],
    melodiaB: [12, _, _, _, 13, _, _, _, 15, _, _, _, 13, _, _, _,   12, _, _, _, 18, _, _, _, 19, _, 18, _, 15, _, 13, _],
    bombo: 'x..x..x.x..x..x.',
    caja:  '....x.......x.x.',
    plato: 'xxxxxxxxxxxxxxxx',
  });
})();

CQ.musica = (() => {
  let actual = null, paso = 0, siguiente = 0, reloj = null, atenuada = false;
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  /* Instrumentos: cómo suena cada pista. Cambia aquí el timbre. */
  const instrumentos = {
    bajo:    (nota, dur) => ({ tipo: 'tono', onda: 'triangle', de: hz(nota), a: hz(nota), dur: dur * 1.8, vol: 0.5 }),
    melodia: (nota, dur) => ({ tipo: 'tono', onda: 'triangle', de: hz(nota), a: hz(nota), dur: dur * 1.8, vol: 0.2 }),
    bombo:   () => ({ tipo: 'tono', onda: 'sine', de: 150, a: 45, dur: 0.13, vol: 0.8 }),
    caja:    () => ({ tipo: 'ruido', filtro: 'highpass', de: 1800, a: 1200, dur: 0.11, vol: 0.3 }),
    plato:   () => ({ tipo: 'ruido', filtro: 'highpass', de: 8000, a: 7000, dur: 0.03, vol: 0.05 }),
  };

  function programar(i, cuando, dur) {
    const salida = volumenPista;
    for (const pista in instrumentos) {
      // La melodía alterna dos frases (melodia y melodiaB) y calla una vuelta de cada cuatro.
      let partitura = actual[pista];
      if (pista === 'melodia') {
        const vuelta = Math.floor(i / actual.melodia.length);
        if (vuelta % 4 === 3) continue;
        if (vuelta % 2 && actual.melodiaB) partitura = actual.melodiaB;
      }
      if (!partitura) continue;
      const valor = partitura[i % partitura.length];
      if (valor == null || valor === '.') continue;
      const c = instrumentos[pista](actual.tonica + (typeof valor === 'number' ? valor : 0), dur);
      CQ.audio.capa(c, cuando, salida);
    }
  }

  /* Antelación con la que se programan las notas. Con poca, la música se corta
     cuando el navegador retrasa los temporizadores (p. ej. el navegador integrado
     de Instagram mientras procesa toques). Las notas ya programadas suenan aunque
     la página esté ocupada; parar y atenuar actúan al instante sobre "volumenPista". */
  const ANTELACION = 1;
  let volumenPista = null;   // volumen propio de la canción en curso

  function nuevaPista(ctx) {
    if (volumenPista) volumenPista.disconnect();   // corta lo que quedara programado
    volumenPista = ctx.createGain();
    volumenPista.gain.value = atenuada ? 0.35 : 1;
    volumenPista.connect(CQ.audio.salida('musica'));
  }

  function latido() {
    const ctx = CQ.audio.contexto();
    if (!ctx || !actual || ctx.state !== 'running') return;
    if (!volumenPista) nuevaPista(ctx);
    const dur = 60 / actual.bpm / 4;
    if (siguiente < ctx.currentTime) siguiente = ctx.currentTime + 0.05;   // tras una pausa del navegador
    while (siguiente < ctx.currentTime + ANTELACION) { programar(paso++, siguiente, dur); siguiente += dur; }
  }

  function poner(id) {
    if (actual && actual.id === id) return;
    actual = CQ.musicas[id] || null; paso = 0; siguiente = 0;
    if (volumenPista) { volumenPista.disconnect(); volumenPista = null; }
    if (!reloj) reloj = setInterval(latido, 50);
  }
  function parar() { actual = null; if (volumenPista) { volumenPista.disconnect(); volumenPista = null; } }

  function atenuar(si) {
    atenuada = si;
    const ctx = CQ.audio.contexto();
    if (volumenPista && ctx) volumenPista.gain.setTargetAtTime(si ? 0.35 : 1, ctx.currentTime, 0.05);
  }

  const mia = d => CQ.app && d.juego === CQ.app.juego;
  CQ.eventos.on('partidaNueva', d => { if (mia(d)) { atenuada = false; poner(d.juego.fase.musica); } });
  CQ.eventos.on('faseIniciada', d => { if (mia(d)) poner(d.juego.fase.musica); });
  CQ.eventos.on('victoria', d => { if (mia(d)) parar(); });
  CQ.eventos.on('derrota', d => { if (mia(d)) parar(); });
  CQ.eventos.on('pausa', d => atenuar(d.activa));

  return { poner, parar };
})();
