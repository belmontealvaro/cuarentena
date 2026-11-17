/* ============================================================
   TUTORIAL — enseña a jugar desde cero. Se puede saltar siempre.

   Es una lista de PASOS sobre un nivel de prácticas pequeño.
   Cada paso es un objeto independiente:
     texto     lo que dice el cuadro (admite <b>)
     foco      (opcional) función que devuelve qué resaltar:
               F.elemento('#cpu'), F.carta('antivirus'), F.casilla(fila, col)…
     alEntrar  (opcional) función(juego, memo) que prepara el paso
               (dar CPU, hacer aparecer una amenaza…)
     hasta     'boton' -> espera a que el jugador pulse Siguiente
               función(juego, memo) -> el paso termina cuando devuelve true
     boton     (opcional) texto del botón
   "memo" es un objeto para que un paso recuerde cosas.
   Para añadir un paso, inserta un objeto en la lista.
   ============================================================ */
CQ.tutorial = (() => {
  const $ = id => document.getElementById(id);

  /* Nivel de prácticas: tablero pequeño, una sola fase que no termina sola
     y sin chips del cielo (los suelta el propio tutorial). */
  const nivel = {
    id: 'tutorial', nombre: 'Prácticas',
    fases: [{
      nombre: 'Prácticas', escenario: 'perimetro', musica: 'perimetro',
      filas: 3, columnas: 7,
      cpuInicial: 100, preparacion: 0,
      sinFin: true, sinChips: true, reservaAbajo: 1.5,
      defensas: ['nucleo', 'antivirus', 'firewall'],
      escalada: { vida: 1, velocidad: 1, fuerza: 0, mordisco: 1 },
      insignia: null,
      horda: { tipo: 'oleadas', oleadas: [] },
    }],
  };

  /* ---------- Qué resaltar: devuelven un rectángulo en píxeles de la ventana ---------- */
  const F = {
    elemento(selector) { const el = document.querySelector(selector); return el ? el.getBoundingClientRect() : null; },
    carta(id) { return F.elemento(`[data-carta="${id}"]`); },
    zona(x, y, ancho, alto) {   // rectángulo en coordenadas de tablero
      const a = CQ.render.aPantalla(x, y), b = CQ.render.aPantalla(x + ancho, y + alto);
      return { left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y };
    },
    casilla(fila, col) { return F.zona(col, fila, 1, 1); },
    ventana(fila) { return F.zona(-1.35, fila, 1.35, 1); },
  };

  /* ---------- Utilidades para los pasos ---------- */
  const tiene = (juego, tipo) => juego.defensas.find(d => d.tipo === tipo && !d.muerta);
  const asegurarCpu = (juego, minimo) => { juego.cpu = Math.max(juego.cpu, minimo); };
  const aparece = (juego, tipo, fila, espera) => juego.cola.push({ t: juego.tiempo + espera, tipo, fila });
  const resueltas = juego => juego.stats.eliminadas + juego.stats.coladas;
  const filaLibre = juego => [1, 0, 2].find(f => !juego.rejilla[f].some(Boolean)) ?? 0;

  const pasos = [
    {
      texto: '¡Hola, comandante! Las amenazas salen de <b>INTERNET</b>, a la izquierda, y quieren llegar a la <b>RED</b>, a la derecha. Tú las frenas desplegando defensas en las casillas.',
      hasta: 'boton',
    },
    {
      texto: 'Esto es tu <b>CPU</b>. Cada defensa que despliegas cuesta CPU.',
      foco: () => F.elemento('#cpu'),
      hasta: 'boton',
    },
    {
      texto: 'Elige el <b>Antivirus</b> haciendo clic en su carta.',
      foco: () => F.carta('antivirus'),
      hasta: juego => CQ.ui.vista.herramienta === 'antivirus' || tiene(juego, 'antivirus'),
    },
    {
      texto: 'Ahora haz clic en una casilla para desplegarlo. Esta es un buen sitio.',
      foco: () => F.casilla(1, 4),
      hasta: juego => tiene(juego, 'antivirus'),
    },
    {
      texto: 'Mira la ventana del navegador: la <b>barra de descarga</b> avisa de que viene una amenaza por ese carril. Tu antivirus dispara solo.',
      alEntrar(juego, memo) {
        memo.fila = tiene(juego, 'antivirus').fila;
        memo.meta = resueltas(juego) + 2;
        aparece(juego, 'spam', memo.fila, 3); aparece(juego, 'spam', memo.fila, 5);
      },
      foco: (juego, memo) => F.ventana(memo.fila),
      hasta: (juego, memo) => resueltas(juego) >= memo.meta,
    },
    {
      texto: 'Ha caído un <b>chip de CPU</b>. Se recoge solo y suma a tu contador. En una partida caen cada pocos segundos.',
      alEntrar(juego, memo) {
        juego.soltarChip(2.5, 1.6, 50, true);
        memo.chip = juego.chips[juego.chips.length - 1];
        memo.chip.vida = 9999;
      },
      // Resalta el chip mientras cae y, cuando se recoge, el contador de CPU.
      foco: (juego, memo) => juego.chips.includes(memo.chip)
        ? F.zona(memo.chip.x - 0.4, memo.chip.y - memo.chip.altura - 0.4, 0.8, 0.8) : F.elemento('#cpu'),
      hasta: 'boton',
    },
    {
      texto: 'El <b>Núcleo</b> fabrica chips él solo. Elígelo y colócalo a la derecha, lejos del peligro.',
      alEntrar: juego => asegurarCpu(juego, 50),
      foco: juego => CQ.ui.vista.herramienta === 'nucleo' ? F.casilla(1, 6) : F.carta('nucleo'),
      hasta: juego => tiene(juego, 'nucleo'),
    },
    {
      texto: 'El <b>Firewall</b> es un muro barato que frena y quema a las amenazas débiles. Colócalo en este carril vacío.',
      alEntrar(juego, memo) { asegurarCpu(juego, 50); memo.fila = filaLibre(juego); },
      foco: (juego, memo) => CQ.ui.vista.herramienta === 'firewall' ? F.casilla(memo.fila, 3) : F.carta('firewall'),
      hasta: juego => tiene(juego, 'firewall'),
    },
    {
      texto: 'Fíjate bien: el spam se quema contra el muro, pero el <b>gusano lo atraviesa</b>. Cada defensa tiene un punto débil.',
      alEntrar(juego, memo) {
        memo.fila = tiene(juego, 'firewall').fila;
        memo.meta = resueltas(juego) + 2;
        aparece(juego, 'spam', memo.fila, 2); aparece(juego, 'gusano', memo.fila, 5);
      },
      foco: (juego, memo) => F.zona(0, memo.fila, juego.columnas, 1),
      hasta: (juego, memo) => resueltas(juego) >= memo.meta,
    },
    {
      texto: 'Deja el ratón quieto sobre una carta para ver <b>contra qué sirve</b> y con qué flojea. Irás desbloqueando defensas nuevas al avanzar.',
      foco: () => F.elemento('#cartas'),
      hasta: 'boton',
    },
    {
      texto: 'En casa no puede colarse <b>ninguna</b> amenaza. Más adelante, lo que se cuele volverá en una segunda fase con más privilegios, y tendrás otra oportunidad.',
      hasta: 'boton',
    },
    {
      texto: 'Últimos trucos: <b>Esc</b> pausa y <b>Q</b> desinstala una defensa. Los <b>números</b> eligen la carta de esa posición. Ahora, el nivel de verdad. ¡Suerte!',
      hasta: 'boton', boton: '¡A jugar!',
    },
  ];

  /* ---------- Motor del tutorial ---------- */
  let activo = false, indice = 0, memo = {};

  function pintarCaja() {
    const p = pasos[indice], caja = $('tutorialCaja');
    caja.innerHTML = `<div class="paso">TUTORIAL · ${indice + 1} de ${pasos.length}</div><p>${p.texto}</p>
      ${p.hasta === 'boton' ? `<button class="boton" data-t="siguiente">${p.boton || 'Siguiente'}</button>` : ''}
      <button class="saltar" data-t="saltar">Saltar tutorial y jugar</button>`;
    caja.classList.remove('oculto');
    const siguiente = caja.querySelector('[data-t=siguiente]');
    if (siguiente) siguiente.addEventListener('click', avanzar);
    caja.querySelector('[data-t=saltar]').addEventListener('click', terminar);
  }

  function entrar(i) {
    indice = i; memo = {};
    const p = pasos[i];
    if (p.alEntrar) p.alEntrar(CQ.app.juego, memo);
    pintarCaja();
  }

  function avanzar() { if (indice + 1 >= pasos.length) terminar(); else entrar(indice + 1); }

  function ocultar() {
    activo = false;
    $('tutorialCaja').classList.add('oculto');
    $('tutorialAnillo').classList.add('oculto');
  }

  /* Fin o salto: marca el tutorial como visto y empieza el nivel de verdad. */
  function terminar() {
    ocultar();
    CQ.ajustes.guardar('tutorialVisto', true);
    CQ.app.entrarNivel();
  }

  function empezar() {
    CQ.app.nuevaPartida(nivel);
    activo = true;
    entrar(0);
  }

  /* Se llama cada fotograma: comprueba si el paso se ha cumplido y mueve el resaltado. */
  function actualizar() {
    if (!activo) return;
    const juego = CQ.app.juego, p = pasos[indice], anillo = $('tutorialAnillo');
    if (!juego || juego.nivel !== nivel) { ocultar(); return; }   // se reinició la partida desde otro sitio
    if (typeof p.hasta === 'function' && p.hasta(juego, memo)) { avanzar(); return; }
    const r = p.foco ? p.foco(juego, memo) : null;
    anillo.classList.toggle('oculto', !r || CQ.app.pausa);
    if (r) {
      const m = 6;
      Object.assign(anillo.style, { left: (r.left - m) + 'px', top: (r.top - m) + 'px', width: (r.width + m * 2) + 'px', height: (r.height + m * 2) + 'px' });
    }
  }

  return { empezar, actualizar, terminar, pasos, nivel };
})();
