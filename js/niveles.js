/* ============================================================
   NIVELES Y HORDAS
   Diez niveles en cinco zonas: casa, oficina, banco, centro de
   datos y la nube. La dificultad sube poco a poco y casi cada
   nivel estrena una amenaza y una defensa.

   Un nivel es:
     id, nombre, zona      identificación (la zona es la del mapa, mundo.js)
     filas, columnas       tamaño del tablero
     defensas              defensas disponibles en ese nivel (se van desbloqueando)
     ranuras               cuántas se pueden llevar a la vez
     novedades             lo que se estrena; se enseña en una tarjeta al entrar
     guia                  true = la primera vez se juega antes el tutorial
     (cada fase puede llevar "reglas" que cambian ajustes solo para ella)
     fases                 lista de fases. La última es la definitiva:
                           si se cuela una amenaza en ella, se pierde.

   Para añadir un nivel: copia un bloque nivel({...}) y añade su id a
   un nodo de mundo.js. Para equilibrar: toca "presion" y "pausa".
   ============================================================ */

/* ---------- Generadores de horda ----------
   Reciben la configuración de la horda y devuelven una lista de
   { t: segundo en que aparece, tipo: id de amenaza, fila: carril }. */

// "oleadas": lista fija escrita a mano.
//   carril: número de fila, 'azar' (todo el grupo por el mismo) o 'repartido' (cada una por uno)
CQ.registrarHorda('oleadas', (horda, juego) => {
  const cola = [];
  for (const o of horda.oleadas) {
    const filaGrupo = CQ.util.azarEntero(0, juego.filas - 1);
    for (let i = 0; i < (o.cantidad || 1); i++) {
      let fila = o.carril;
      if (fila === 'azar' || fila == null) fila = filaGrupo;
      if (fila === 'repartido') fila = CQ.util.azarEntero(0, juego.filas - 1);
      cola.push({ t: o.t + i * (o.cada == null ? 1.2 : o.cada), tipo: o.amenaza, fila });
    }
  }
  return cola;
});

// "ritmo": crea las oleadas a partir de una receta, sin escribirlas una a una.
//   duracion     segundos que dura la horda
//   pausa        [segundos entre oleadas al principio, al final]
//   mezcla       lista de { amenaza, peso, grupo: [min, max], desde, hasta }
//                (desde/hasta: tramo de la horda, de 0 a 1, en el que puede salir)
//   crecimiento  cuánto crecen los grupos hacia el final (0.5 = +50 %)
//   presion      multiplicador general de cantidades: el mando de dificultad del nivel
//   jefes        lista de { amenaza, en (0 a 1), cantidad }
//   semilla      número fijo: la composición es la misma en cada partida; los carriles no
CQ.registrarHorda('ritmo', (h, juego) => {
  let s = h.semilla || 1;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const oleadas = [];
  for (let t = 0; t < h.duracion; ) {
    const p = t / h.duracion;
    const posibles = h.mezcla.filter(m => p >= (m.desde || 0) && p <= (m.hasta == null ? 1 : m.hasta));
    let tirada = azar() * posibles.reduce((a, m) => a + m.peso, 0), elegida = posibles[0];
    for (const m of posibles) { tirada -= m.peso; if (tirada <= 0) { elegida = m; break; } }
    const [min, max] = elegida.grupo || [1, 1];
    const cantidad = Math.max(1, Math.round((min + azar() * (max - min)) * (1 + p * (h.crecimiento || 0)) * (h.presion || 1)));
    oleadas.push({ t, amenaza: elegida.amenaza, cantidad, carril: cantidad > 1 && azar() < 0.6 ? 'repartido' : 'azar', cada: elegida.cada || 1.3 });
    t += h.pausa[0] + (h.pausa[1] - h.pausa[0]) * p;
  }
  for (const j of h.jefes || []) {
    oleadas.push({ t: j.en * h.duracion, amenaza: j.amenaza, cantidad: j.cantidad || 1, carril: j.cantidad > 1 ? 'repartido' : 'azar', cada: 3 });
  }
  return CQ.generadoresHorda.oleadas({ oleadas }, juego);
});

// "supervivientes": las amenazas que se colaron en la fase anterior, en el mismo orden.
//   carril: 'azar'  -> cada una entra por un carril aleatorio (obliga a cubrir todo el tablero)
//           'mismo' -> entra por el carril por el que se coló
CQ.registrarHorda('supervivientes', (horda, juego, supervivientes) =>
  supervivientes.map((s, i) => ({
    t: i * horda.cada,
    tipo: s.tipo,
    fila: horda.carril === 'mismo' ? Math.min(s.fila, juego.filas - 1) : CQ.util.azarEntero(0, juego.filas - 1),
  })));

(() => {
  /* ---------- Plantillas de fase ----------
     Fase 1: llega la horda. Fases 2 y 3: vuelven las que se colaron, con más privilegios. */
  /* reglas (opcional): cambios solo para esa fase, p. ej. { avisoSegundos: 3, chipCada: 13 }. */
  const perimetro = (cpuInicial, preparacion, horda, reglas) => ({
    nombre: 'Perímetro', escenario: 'perimetro', musica: 'perimetro',
    cpuInicial, preparacion, reglas,
    escalada: { vida: 1, velocidad: 1, fuerza: 0, mordisco: 1 }, insignia: null,
    horda: { tipo: 'ritmo', mostrarCarriles: false, ...horda },
  });
  const redInterna = () => ({
    nombre: 'Red interna', escenario: 'redInterna', musica: 'redInterna',
    cpuInicial: 150, preparacion: 25,   // a la CPU se suma lo traspasado (config.traspaso)
    escalada: { vida: 2.2, velocidad: 1.15, fuerza: 0, mordisco: 1.3 }, insignia: 'ADMIN',
    horda: { tipo: 'supervivientes', cada: 3, carril: 'azar', mostrarCarriles: true },
  });
  const servidor = () => ({
    nombre: 'Servidor de datos', escenario: 'servidor', musica: 'servidor',
    cpuInicial: 150, preparacion: 30,
    // Con fuerza +1, los firewalls ya no frenan a casi nadie.
    escalada: { vida: 3.5, velocidad: 1.3, fuerza: 1, mordisco: 1.6 }, insignia: 'ROOT',
    horda: { tipo: 'supervivientes', cada: 4, carril: 'azar', mostrarCarriles: true },
  });

  /* Registra un nivel copiando el tamaño del tablero a cada fase. */
  function nivel(def) {
    def.ranuras = def.ranuras || 7;
    def.fases.forEach(f => { f.filas = def.filas; f.columnas = def.columnas; });
    def.fases[0].escenario = def.zona;   // la primera fase se ve como su zona del mapa (escenarios.js)
    CQ.registrarNivel(def);
  }

  /* Ingredientes de las mezclas (peso = frecuencia; grupo = cuántas vienen juntas). */
  const SPAM = { amenaza: 'spam', peso: 5, grupo: [2, 4], cada: 1 };
  const VIRUS = { amenaza: 'virus', peso: 4, grupo: [1, 3], cada: 2 };
  const GUSANO = { amenaza: 'gusano', peso: 2.5, grupo: [1, 3], cada: 1.5, desde: 0.15 };
  const PHISHING = { amenaza: 'phishing', peso: 2, grupo: [1, 2], cada: 2, desde: 0.25 };
  const TROYANO = { amenaza: 'troyano', peso: 2, grupo: [1, 2], cada: 3, desde: 0.3 };
  const KEYLOGGER = { amenaza: 'keylogger', peso: 2, grupo: [1, 2], cada: 2.5, desde: 0.2 };
  const BOTNET = { amenaza: 'botnet', peso: 0.8, grupo: [1, 1], desde: 0.35 };

  /* ==================== ZONA 1: CASA (una sola fase) ==================== */
  nivel({
    id: 'nivel1', nombre: 'El correo basura', zona: 'casa',
    filas: 3, columnas: 7, guia: true,
    defensas: ['nucleo', 'antivirus', 'firewall'],
    fases: [perimetro(200, 20, {
      semilla: 11, duracion: 65, pausa: [10, 7], presion: 0.8,
      mezcla: [{ ...SPAM, grupo: [1, 3] }, { ...VIRUS, peso: 2, grupo: [1, 1], desde: 0.35 }],
    })],
  });

  nivel({
    id: 'nivel2', nombre: 'Algo se arrastra', zona: 'casa',
    filas: 4, columnas: 8,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche'],
    novedades: [{ amenaza: 'gusano' }, { defensa: 'parche' }],
    fases: [perimetro(200, 20, {
      semilla: 22, duracion: 85, pausa: [9, 6.2], presion: 0.95, crecimiento: 0.25,
      mezcla: [SPAM, { ...VIRUS, grupo: [1, 2] }, { ...GUSANO, grupo: [1, 1], desde: 0.3 }],
    })],
  });

  /* ==================== ZONA 2: OFICINA (dos fases) ==================== */
  nivel({
    id: 'nivel3', nombre: 'Lunes en la oficina', zona: 'oficina',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor'],
    novedades: [
      { titulo: 'Escalada de privilegios', texto: 'Desde ahora, lo que se cuele no te hace perder: vuelve en una segunda fase como ADMIN, más duro y más rápido. En esa segunda fase ya no puede pasar ninguna.' },
      { amenaza: 'phishing' }, { defensa: 'dobleFactor' },
    ],
    fases: [perimetro(200, 20, {
      semilla: 33, duracion: 95, pausa: [8.5, 6], presion: 0.9, crecimiento: 0.3,
      mezcla: [SPAM, VIRUS, { ...GUSANO, grupo: [1, 2] }, { ...PHISHING, grupo: [1, 1] }],
    }), redInterna()],
  });

  nivel({
    id: 'nivel4', nombre: 'Un regalo sospechoso', zona: 'oficina',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox'],
    novedades: [{ amenaza: 'troyano' }, { defensa: 'sandbox' }],
    fases: [perimetro(200, 20, {
      semilla: 44, duracion: 110, pausa: [8.2, 5.8], presion: 0.92, crecimiento: 0.3,
      mezcla: [SPAM, VIRUS, { ...GUSANO, grupo: [1, 2] }, { ...PHISHING, grupo: [1, 1] }, { ...TROYANO, grupo: [1, 1] }],
    }), redInterna()],
  });

  /* ==================== ZONA 3: BANCO (dos fases) ==================== */
  nivel({
    id: 'nivel5', nombre: 'Secuestro en la cámara', zona: 'banco',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox', 'copia'],
    novedades: [{ amenaza: 'ransomware' }, { defensa: 'copia' }],
    fases: [perimetro(200, 20, {
      semilla: 55, duracion: 125, pausa: [8, 5.5], presion: 0.78, crecimiento: 0.35,
      mezcla: [SPAM, VIRUS, GUSANO, PHISHING, TROYANO],
      jefes: [{ amenaza: 'ransomware', en: 0.65 }],
    }), redInterna()],
  });

  nivel({
    id: 'nivel6', nombre: 'Alguien mira tus teclas', zona: 'banco',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox', 'copia', 'captcha'],
    novedades: [
      { titulo: 'Niebla', texto: 'En este nivel los avisos de las ventanas llegan muy tarde: apenas 4 segundos antes de que entre la amenaza. Cubre todos los carriles.' },
      { amenaza: 'keylogger' }, { defensa: 'captcha' },
    ],
    fases: [perimetro(200, 20, {
      semilla: 66, duracion: 140, pausa: [8, 5.2], presion: 0.72, crecimiento: 0.4,
      mezcla: [SPAM, VIRUS, GUSANO, PHISHING, TROYANO, KEYLOGGER],
      jefes: [{ amenaza: 'ransomware', en: 0.6 }],
    }, { avisoSegundos: 4 }), redInterna()],
  });

  /* ==================== ZONA 4: CENTRO DE DATOS (tres fases) ==================== */
  nivel({
    id: 'nivel7', nombre: 'El ejército zombi', zona: 'datos',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox', 'copia', 'captcha', 'honeypot'],
    novedades: [
      { titulo: 'Tres fases', texto: 'En el centro de datos hay más capas: lo que se cuele pasa a ADMIN, y lo que vuelva a colarse llega a ROOT. La tercera fase es la última línea.' },
      { amenaza: 'botnet' }, { defensa: 'honeypot' },
    ],
    fases: [perimetro(200, 20, {
      semilla: 77, duracion: 155, pausa: [7.5, 5], presion: 0.88, crecimiento: 0.45,
      mezcla: [SPAM, VIRUS, GUSANO, PHISHING, TROYANO, KEYLOGGER, BOTNET],
      jefes: [{ amenaza: 'ransomware', en: 0.55 }],
    }), redInterna(), servidor()],
  });

  nivel({
    id: 'nivel8', nombre: 'Sobrecarga', zona: 'datos',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox', 'copia', 'captcha', 'honeypot', 'formateo'],
    novedades: [
      { titulo: 'Sobrecarga', texto: 'El centro de datos va al límite: empiezas con mucha CPU, pero los chips caen mucho más despacio. Gasta con cabeza y protege tus núcleos.' },
      { defensa: 'formateo' },
    ],
    fases: [perimetro(350, 20, {
      semilla: 88, duracion: 170, pausa: [7.8, 5.2], presion: 0.7, crecimiento: 0.55,
      mezcla: [SPAM, VIRUS, GUSANO, PHISHING, TROYANO, KEYLOGGER, BOTNET],
      jefes: [{ amenaza: 'ransomware', en: 0.5 }, { amenaza: 'ransomware', en: 0.85 }],
    }, { chipCada: 14 }), redInterna(), servidor()],
  });

  /* ==================== ZONA 5: LA NUBE (tres fases) ==================== */
  nivel({
    id: 'nivel9', nombre: 'Tormenta en la nube', zona: 'nube',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox', 'copia', 'captcha', 'honeypot', 'formateo'],
    fases: [perimetro(200, 20, {
      semilla: 99, duracion: 180, pausa: [7.5, 5], presion: 0.72, crecimiento: 0.6,
      mezcla: [SPAM, VIRUS, GUSANO, PHISHING, TROYANO, KEYLOGGER, BOTNET],
      jefes: [{ amenaza: 'ransomware', en: 0.4 }, { amenaza: 'ransomware', en: 0.75 }],
    }), redInterna(), servidor()],
  });

  nivel({
    id: 'nivel10', nombre: 'Día Cero', zona: 'nube',
    filas: 5, columnas: 9,
    defensas: ['nucleo', 'antivirus', 'firewall', 'parche', 'dobleFactor', 'sandbox', 'copia', 'captcha', 'honeypot', 'formateo'],
    novedades: [{ amenaza: 'diaCero' }],
    fases: [perimetro(225, 20, {
      semilla: 100, duracion: 185, pausa: [7.5, 5.2], presion: 0.65, crecimiento: 0.55,
      mezcla: [SPAM, VIRUS, GUSANO, PHISHING, TROYANO, KEYLOGGER, BOTNET],
      jefes: [{ amenaza: 'ransomware', en: 0.35 }, { amenaza: 'diaCero', en: 0.72 }],
    }), redInterna(), servidor()],
  });
})();
