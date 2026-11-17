/* ============================================================
   AUDIO — sonidos sintetizados, sin archivos. Escucha el evento
   'sonido' del motor. Cada sonido es una lista de CAPAS que suenan
   juntas; para cambiar o añadir un sonido, edita la tabla.

   Tipos de capa:
     tono   oscilador.        onda: sine | square | triangle | sawtooth
     ruido  ruido filtrado (golpes, explosiones, soplidos)
     voz    voz cartoon (diente de sierra con filtro y vibrato)
   Campos: de / a = frecuencia inicial y final (Hz) · dur = segundos
           vol = 0..1 · espera = segundos antes de sonar
   ============================================================ */
CQ.sonidos = {
  colocar:   [{ tipo: 'tono', onda: 'triangle', de: 330, a: 660, dur: 0.1, vol: 0.25 },
              { tipo: 'tono', onda: 'sine', de: 660, a: 990, dur: 0.12, vol: 0.18, espera: 0.06 }],
  quitar:    [{ tipo: 'tono', onda: 'triangle', de: 520, a: 200, dur: 0.14, vol: 0.2 },
              { tipo: 'ruido', de: 2000, a: 400, dur: 0.1, vol: 0.12 }],
  chip:      [{ tipo: 'tono', onda: 'sine', de: 988, a: 988, dur: 0.07, vol: 0.22 },
              { tipo: 'tono', onda: 'sine', de: 1319, a: 1319, dur: 0.16, vol: 0.22, espera: 0.07 }],
  disparo:   [{ tipo: 'tono', onda: 'triangle', de: 620, a: 280, dur: 0.06, vol: 0.07 },
              { tipo: 'ruido', de: 2600, a: 900, dur: 0.04, vol: 0.03 }],
  rayo:      [{ tipo: 'tono', onda: 'triangle', de: 1100, a: 180, dur: 0.24, vol: 0.14 },
              { tipo: 'ruido', de: 3500, a: 600, dur: 0.2, vol: 0.08 }],
  eliminada: [{ tipo: 'ruido', de: 1400, a: 250, dur: 0.16, vol: 0.2 },
              { tipo: 'tono', onda: 'triangle', de: 280, a: 70, dur: 0.14, vol: 0.1 }],
  destruida: [{ tipo: 'ruido', de: 900, a: 90, dur: 0.38, vol: 0.28 },
              { tipo: 'voz', de: 620, a: 240, dur: 0.34, vol: 0.2 }],
  colada:    [{ tipo: 'tono', onda: 'square', de: 233, a: 110, dur: 0.4, vol: 0.14 },
              { tipo: 'voz', de: 300, a: 380, dur: 0.1, vol: 0.16, espera: 0.05 },
              { tipo: 'voz', de: 300, a: 380, dur: 0.1, vol: 0.16, espera: 0.2 },
              { tipo: 'voz', de: 280, a: 340, dur: 0.14, vol: 0.16, espera: 0.35 }],
  revelada:  [{ tipo: 'tono', onda: 'triangle', de: 520, a: 1040, dur: 0.14, vol: 0.18 },
              { tipo: 'voz', de: 260, a: 520, dur: 0.18, vol: 0.12 }],
  parche:    [{ tipo: 'ruido', de: 500, a: 3000, dur: 0.1, vol: 0.2 },
              { tipo: 'tono', onda: 'square', de: 160, a: 720, dur: 0.14, vol: 0.14 }],
  sandbox:   [{ tipo: 'tono', onda: 'triangle', de: 720, a: 300, dur: 0.2, vol: 0.2 },
              { tipo: 'ruido', de: 800, a: 200, dur: 0.15, vol: 0.14, espera: 0.1 }],
  anzuelo:   [{ tipo: 'tono', onda: 'sine', de: 1000, a: 320, dur: 0.3, vol: 0.16 },
              { tipo: 'tono', onda: 'sine', de: 1200, a: 400, dur: 0.3, vol: 0.1, espera: 0.05 }],
  cifrado:   [{ tipo: 'tono', onda: 'sawtooth', de: 130, a: 55, dur: 0.5, vol: 0.2 },
              { tipo: 'ruido', de: 300, a: 2500, dur: 0.45, vol: 0.12 }],
  restaurar: [{ tipo: 'tono', onda: 'sine', de: 523, a: 523, dur: 0.1, vol: 0.16 },
              { tipo: 'tono', onda: 'sine', de: 659, a: 659, dur: 0.1, vol: 0.16, espera: 0.08 },
              { tipo: 'tono', onda: 'sine', de: 784, a: 784, dur: 0.2, vol: 0.16, espera: 0.16 }],
  miel:      [{ tipo: 'tono', onda: 'sine', de: 440, a: 660, dur: 0.12, vol: 0.16 },
              { tipo: 'voz', de: 300, a: 450, dur: 0.16, vol: 0.1, espera: 0.05 }],
  explosion: [{ tipo: 'ruido', filtro: 'lowpass', de: 2500, a: 80, dur: 0.6, vol: 0.4 },
              { tipo: 'tono', onda: 'sine', de: 140, a: 35, dur: 0.5, vol: 0.4 }],
  robo:      [{ tipo: 'tono', onda: 'square', de: 880, a: 440, dur: 0.1, vol: 0.1 },
              { tipo: 'tono', onda: 'square', de: 660, a: 330, dur: 0.12, vol: 0.1, espera: 0.08 }],
  invocar:   [{ tipo: 'tono', onda: 'sawtooth', de: 200, a: 600, dur: 0.25, vol: 0.12 },
              { tipo: 'ruido', de: 600, a: 3000, dur: 0.2, vol: 0.1 }],
  // Sirena de dos tonos para la llegada de un jefe.
  alarma:    [0, 1, 2].flatMap(i => [
              { tipo: 'tono', onda: 'square', de: 466, a: 466, dur: 0.16, vol: 0.13, espera: i * 0.36 },
              { tipo: 'tono', onda: 'square', de: 349, a: 349, dur: 0.16, vol: 0.13, espera: i * 0.36 + 0.18 }]),
  // Fanfarria: arpegio ascendente y acorde final.
  victoria:  [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.62]]
              .map(([f, espera], i) => ({ tipo: 'tono', onda: 'triangle', de: f, a: f, dur: i === 5 ? 0.7 : 0.14, vol: 0.2, espera }))
              .concat([{ tipo: 'tono', onda: 'sine', de: 659, a: 659, dur: 0.7, vol: 0.14, espera: 0.62 },
                       { tipo: 'tono', onda: 'sine', de: 523, a: 523, dur: 0.7, vol: 0.14, espera: 0.62 }]),
  derrota:   [[392, 0], [370, 0.22], [349, 0.44], [262, 0.66]]
              .map(([f, espera], i) => ({ tipo: 'tono', onda: 'sawtooth', de: f, a: i === 3 ? 80 : f, dur: i === 3 ? 0.9 : 0.2, vol: 0.13, espera }))
              .concat([{ tipo: 'voz', de: 400, a: 150, dur: 0.8, vol: 0.14, espera: 0.66 }]),
};

CQ.audio = (() => {
  let ctx = null, salidas = null, bufferRuido = null;
  const ultimo = {};

  function activar() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        salidas = { sonido: ctx.createGain(), musica: ctx.createGain() };
        salidas.sonido.connect(ctx.destination); salidas.musica.connect(ctx.destination);
        const n = ctx.sampleRate;   // un segundo de ruido blanco reutilizable
        bufferRuido = ctx.createBuffer(1, n, n);
        const datos = bufferRuido.getChannelData(0);
        for (let i = 0; i < n; i++) datos[i] = Math.random() * 2 - 1;
        aplicarAjustes();
      }
      ctx.resume();
    } catch (e) { /* sin sonido */ }
  }

  function aplicarAjustes() {
    if (!salidas) return;
    salidas.sonido.gain.value = CQ.ajustes.leer('sonido') ? CQ.config.efectos.volumenSonido : 0;
    salidas.musica.gain.value = CQ.ajustes.leer('musica') ? CQ.config.efectos.volumenMusica : 0;
  }

  /* Programa una capa en el instante "cuando" hacia la salida indicada. */
  function capa(c, cuando, salida) {
    const fin = cuando + c.dur, gan = ctx.createGain();
    gan.gain.setValueAtTime(c.vol, cuando);
    gan.gain.exponentialRampToValueAtTime(0.001, fin);
    gan.connect(salida);
    const rampa = (param, de, a) => { param.setValueAtTime(de, cuando); param.exponentialRampToValueAtTime(Math.max(20, a), fin); };

    if (c.tipo === 'ruido') {
      const fuente = ctx.createBufferSource(), filtro = ctx.createBiquadFilter();
      fuente.buffer = bufferRuido; fuente.loop = true;
      filtro.type = c.filtro || 'bandpass'; filtro.Q.value = 0.9; rampa(filtro.frequency, c.de, c.a);
      fuente.connect(filtro).connect(gan);
      fuente.start(cuando); fuente.stop(fin + 0.02);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = c.tipo === 'voz' ? 'sawtooth' : (c.onda || 'sine');
    rampa(osc.frequency, c.de, c.a);
    if (c.tipo === 'voz') {
      // Filtro que imita una boca abriéndose + vibrato rápido: suena a "¡ay!".
      const boca = ctx.createBiquadFilter(), vibrato = ctx.createOscillator(), cuanto = ctx.createGain();
      boca.type = 'bandpass'; boca.Q.value = 5; rampa(boca.frequency, 1300, 600);
      vibrato.frequency.value = 22; cuanto.gain.value = c.de * 0.05;
      vibrato.connect(cuanto).connect(osc.frequency);
      vibrato.start(cuando); vibrato.stop(fin + 0.02);
      osc.connect(boca).connect(gan);
    } else osc.connect(gan);
    osc.start(cuando); osc.stop(fin + 0.02);
  }

  function tocar(nombre) {
    const capas = CQ.sonidos[nombre];
    if (!capas || !ctx) return;
    const ahora = ctx.currentTime;
    if (ultimo[nombre] && ahora - ultimo[nombre] < 0.05) return;   // evita saturar
    ultimo[nombre] = ahora;
    // Cada vez suena con un tono ligeramente distinto, para que no canse.
    const v = 1 + (Math.random() - 0.5) * (CQ.config.efectos.variacionTono || 0);
    for (const c of capas) capa(c.tipo === 'ruido' ? c : { ...c, de: c.de * v, a: c.a * v }, ahora + (c.espera || 0), salidas.sonido);
  }

  // Solo suena la partida que está en pantalla.
  const mia = d => CQ.app && d.juego === CQ.app.juego;
  CQ.eventos.on('sonido', d => { if (mia(d)) tocar(d.nombre); });
  CQ.eventos.on('victoria', d => { if (mia(d)) tocar('victoria'); });
  CQ.eventos.on('derrota', d => { if (mia(d)) tocar('derrota'); });
  CQ.eventos.on('ajusteCambiado', aplicarAjustes);

  return {
    activar,          // debe llamarse tras un clic del usuario (norma de los navegadores)
    tocar, capa,
    contexto: () => ctx,
    salida: nombre => salidas && salidas[nombre],
  };
})();
