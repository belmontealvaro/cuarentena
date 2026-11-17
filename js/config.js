/* ============================================================
   CONFIGURACIÓN GENERAL — ajustes que afectan a todo el juego.
   Cambia aquí números sin tocar nada más.
   ============================================================ */
CQ.config = {
  // Multiplica la vida de todas las amenazas. Lo fija el selector del menú
  // con el valor "vida" de la dificultad elegida.
  dificultad: 1,
  dificultades: [
    // color: el de su insignia en el mapa cuando el nivel se supera en esa dificultad.
    { id: 'facil',   nombre: 'Fácil',   vida: 0.75, color: '#cd7f32' },   // bronce
    { id: 'normal',  nombre: 'Normal',  vida: 1,    color: '#cfd8dc' },   // plata
    { id: 'dificil', nombre: 'Difícil', vida: 1.3,  color: '#ffd60a' },   // oro
  ],
  // Dibujo de la insignia (trazado SVG en un lienzo de 24 x 26). Ahora es un escudo;
  // para usar otro símbolo, cambia solo este trazado.
  insignia: 'M12 1.5 L22 4.5 V12 C22 19 17 23 12 25 C7 23 2 19 2 12 V4.5 Z',

  cpu: {
    chipValor: 25,        // CPU que da cada chip que cae del cielo
    chipCada: 9,          // segundos entre chips del cielo
    chipDuracion: 11,     // segundos antes de que un chip desaparezca
    enPreparacion: false, // ¿caen chips durante la fase de preparación?
    recogidaAutomatica: true,  // true = los chips se recogen solos; false = hay que hacer clic
    retardoRecogida: 0.7,      // segundos que el chip espera en el suelo antes de recogerse solo
  },

  // Al pasar de fase: qué parte de la CPU sin gastar y del valor de las defensas
  // que siguen en pie se convierte en CPU para la fase siguiente (0 a 1).
  traspaso: { cpuSobrante: 1, defensas: 0.5 },

  reembolsoAlQuitar: 0.5, // fracción del coste que se devuelve al desinstalar una defensa
  avisoSegundos: 6,       // con cuánta antelación se ve qué amenaza viene por cada carril
  vulnerableMult: 1.5,    // daño extra a las amenazas con el estado "vulnerable"
  velocidades: [1, 2, 4], // un botón por cada velocidad de juego

  interfaz: {
    retardoFicha: 0.45,   // segundos con el ratón quieto sobre una carta antes de mostrar su ficha
    equipoSinElegir: 3,   // con estas defensas o menos, el nivel empieza sin pasar por la pantalla de equipo
  },

  puntuacion: {
    // Puntos por ganar según la fase en la que ganes (1ª, 2ª, 3ª...).
    porFaseGanada: [10000, 6000, 3000],
    porEliminada: 50,     // por cada amenaza eliminada
    porColada: -150,      // por cada amenaza que se cuela (en cualquier fase)
    porCpu: 0,            // por cada punto de CPU sin gastar al ganar
  },

  // Interruptores que aparecen como botones en el pie. Para añadir uno,
  // pon otra línea y consúltalo con CQ.ajustes.leer('clave').
  ajustes: [
    { clave: 'sonido',   texto: 'Efectos',  porDefecto: true },
    { clave: 'musica',   texto: 'Música',   porDefecto: true },
    { clave: 'sacudida', texto: 'Sacudida', porDefecto: true },
  ],

  // Intensidad de los efectos de pantalla y volúmenes.
  efectos: {
    sacudidaColada: 14,      // píxeles de sacudida cuando se cuela una amenaza
    sacudidaDestruida: 7,    // cuando cae una defensa
    distanciaMiedo: 1.5,     // casillas a las que una defensa se asusta de una amenaza
    volumenMusica: 0.2,
    variacionTono: 0.14,     // cuánto cambia el tono de un efecto de una vez a otra (0 = siempre igual)
    volumenSonido: 0.9,
  },

};
