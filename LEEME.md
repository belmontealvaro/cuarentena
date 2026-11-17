# Cuarentena — guía de arquitectura

Juego de defensa por carriles con temática de ciberseguridad. HTML + JavaScript sin dependencias ni compilación: se abre `index.html`.

## Idea central

**El motor no conoce ninguna amenaza, defensa ni nivel concretos.** Todo el contenido son objetos de datos que se registran en `CQ` (el espacio de nombres global). Para añadir contenido se añade un objeto; no se toca el motor.

Los módulos no se llaman entre sí: el motor **emite eventos** y la interfaz, el sonido, la música y los efectos **escuchan**. Borrar `espectaculo.js`, `musica.js` o `tutorial.js` no rompe el juego.

## Mapa de archivos

| Archivo | Qué contiene | Tocar para… |
|---|---|---|
| `js/nucleo.js` | `CQ`: registros, bus de eventos, ajustes guardados, utilidades | añadir un tipo de registro nuevo |
| `js/config.js` | Números globales: economía, dificultades, puntuación, efectos, ajustes | equilibrar o añadir un interruptor |
| `js/dibujo.js` | Utilidades de dibujo cartoon (`D.caja`, `D.ojos`, `D.boca`…) | cambiar el estilo de trazo o las caras |
| `js/escenarios.js` | Colores y rótulos de cada escenario | cambiar el aspecto de una fase |
| `js/decorados.js` | Dibujo de la zona de entrada (ventanas de navegador) | crear otra zona de entrada |
| `js/amenazas.js` | Una entrada por amenaza: estadísticas, habilidad, dibujo, muerte | crear o ajustar una amenaza |
| `js/defensas.js` | Una entrada por defensa: coste, habilidad, dibujo, ficha | crear o ajustar una defensa |
| `js/niveles.js` | Generadores de horda y niveles (lista de fases) | crear niveles, fases u oleadas |
| `js/motor.js` | Clase `CQ.Juego`: reglas genéricas y bucle de simulación | cambiar una regla del juego |
| `js/render.js` | Pinta el estado en el lienzo. No cambia reglas | cambiar cómo se ve el tablero |
| `js/audio.js` | Tabla de sonidos por capas y sintetizador | cambiar o añadir un sonido |
| `js/musica.js` | Partituras por fase y secuenciador | componer otra música |
| `js/espectaculo.js` | Sacudida, destellos, carteles, muertes, chips voladores, transición | cambiar efectos de pantalla |
| `js/ui.js` | Cartas, fichas, marcador, menús, ratón y teclado | cambiar la interfaz |
| `js/equipo.js` | Pantalla previa: elegir y ordenar las defensas del nivel | cambiar la selección de equipo |
| `js/mundo.js` | Datos del mapa: zonas del paisaje y nodos del camino | añadir un nivel al camino o una zona |
| `js/mundoDetalles.js` | Decoración extra de cada zona del mapa | añadir adornos al paisaje |
| `js/desarrollo.js` | Modo desarrollo: niveles abiertos y herramientas en la pausa | añadir un atajo de pruebas |
| `js/mapa.js` | Pantalla de inicio: mapa desplazable, ficha de nivel, progreso | cambiar el comportamiento del mapa |
| `js/enciclopedia.js` | Fichas de amenazas y defensas ya vistas | cambiar la enciclopedia |
| `js/pantalla.js` | Botón de pantalla completa (móvil) | cambiar el modo pantalla completa |
| `js/tutorial.js` | Nivel de prácticas y lista de pasos del tutorial | añadir o reescribir pasos |
| `js/main.js` | `CQ.app`: partida actual, pausa, bucle de fotogramas | cambiar el arranque |
| `herramientas/solapes.js` | Recorre todas las pantallas y avisa si algo se tapa o se sale (úsalo emulando un móvil) | revisar la interfaz tras cambiarla |
| `herramientas/simulador.js` | Bots que juegan sin pantalla para medir la dificultad | equilibrar con datos |

## Recetas

**Amenaza nueva** — en `amenazas.js`, copia un bloque `CQ.registrarAmenaza({...})`. Campos: `id`, `nombre`, `vida`, `velocidad` (casillas/s), `fuerza` (1 a 3), `mordisco` (daño/s), `radio`, `etiquetas`, `sigilosa`, `web`, `muerte`, `entrada` (opcional, para jefes), `actualizar(a, dt, juego)` (opcional, habilidad) y `dibujar(ctx, a, t)`. Después úsala en una oleada de `niveles.js`.

**Defensa nueva** — en `defensas.js`, copia un bloque `CQ.registrarDefensa({...})`. Campos: `id`, `nombre`, `descripcion`, `bien`, `mal`, `coste`, `recarga`, `vida`, `bloquea`, `mordible`, `inmuneA`, `deteccion`, `valiente`, `actualizar(d, dt, juego)`, `alTocar(d, a, dt, juego)`, `eventos: {...}` y `dibujar(ctx, d, t)`. Añade su `id` a la lista `defensas` del nivel para que aparezca en la pantalla de equipo (`ranuras` fija cuántas se pueden llevar). Una fase puede imponer las suyas con su propio campo `defensas`, como hace el tutorial.

**Nivel o fase nuevos** — en `niveles.js`, copia un bloque `nivel({...})`. Campos del nivel: `id`, `nombre`, `zona`, `filas`, `columnas`, `defensas` (las desbloqueadas en ese nivel), `ranuras`, `novedades` (lo que estrena; se enseña en una tarjeta), `guia` (tutorial previo) y `fases`. Las fases salen de las plantillas `perimetro(cpu, preparacion, horda)`, `redInterna()` y `servidor()`. La horda de la primera fase es una receta `ritmo`: `presion` y `pausa` son los mandos de dificultad. La última fase es la definitiva. Opciones de fase: `filas`, `columnas`, `cpuInicial`, `preparacion`, `defensas`, `escalada`, `insignia`, `escenario`, `musica`, `horda`, `sinFin`, `sinChips`, `reservaAbajo`.

**Nivel en el mapa** — en `mundo.js`, añade `{ tipo: 'nivel', nivel: 'idDelNivel' }` a `nodos`. Hay dos nodos por zona (casa, oficina, banco, centro de datos, la nube). Se desbloquea al superar el nivel anterior en cualquier dificultad. Bajo cada nodo hay tres insignias (una por dificultad, con el color de `CQ.config.dificultades` y el dibujo de `CQ.config.insignia`).

**Otra forma de generar hordas** — `CQ.registrarHorda('tipo', (horda, juego, supervivientes) => [{ t, tipo, fila }])`.

**Sonido** — añade una entrada a `CQ.sonidos` y lánzalo con `juego.sonido('nombre')`.

**Interruptor de ajustes** — añade una línea a `CQ.config.ajustes`; se consulta con `CQ.ajustes.leer('clave')`.

## API del motor que usan las definiciones

Consultas: `amenazasEnFila(fila)`, `esVisible(a)`, `defensaEn(fila, col)`, `proximas(fila)`, `restantes()`, `tiene(obj, estado)`.

Acciones: `invocar(tipo, fila, x)`, `herirAmenaza(a, n)`, `herirDefensa(d, n)`, `revelar(a)`, `bloquearDefensa(d, seg, idOrigen)`, `poner / quitar(obj, estado)`, `disparar({...})`, `soltarChip(x, y, valor, cae)`, `colocarGratis(id, fila, col, vida)`, `retirarDefensa(d)`, `programar(seg, fn)`, `sonido(nombre)`.

Efectos visuales: `fx.particulas`, `fx.lanzar` (trozos con forma), `fx.texto`, `fx.rayo`, `fx.onda`.

Estados temporales en uso: `bloqueada` (defensa); `atrapada`, `vulnerable` y `lenta` (amenaza; `lenta` usa `a.factorLenta`).

## Eventos

`partidaNueva`, `faseIniciada`, `hordaIniciada`, `faseTerminada`, `victoria`, `derrota`, `amenazaAparece`, `amenazaEliminada`, `amenazaColada`, `defensaColocada`, `defensaDestruida`, `chipRecogido`, `explosion`, `sonido`, `pausa`, `ajusteCambiado`.

Todos llevan `juego` en sus datos. Los oyentes deben comprobar `d.juego === CQ.app.juego`, porque el simulador y el decorado del menú crean partidas que no están en pantalla.

## Coordenadas

- Tablero: `x` en columnas (0 = borde izquierdo, `columnas` = la red) e `y` en filas (`fila + 0.5` = centro del carril).
- Dibujo de personajes: 100 unidades = 1 casilla, origen en el centro. Las amenazas miran a la derecha y las defensas a la izquierda.

## Convenciones

- Identificadores y comentarios en español, sin eñes ni tildes en los nombres de función (`herirAmenaza`).
- Un archivo, una responsabilidad. Cada archivo empieza con un comentario que explica qué es y cómo ampliarlo.
- Los números de equilibrio viven en los datos, nunca incrustados en el motor.

## Publicar cambios

Los archivos se cargan con `?v=N` en `index.html` para saltarse la caché del navegador. Al publicar una versión nueva, sube ese número en todas las líneas.

## Modo desarrollo

Abre el juego con `?dev` en la dirección (por ejemplo `index.html?dev` o la web pública terminada en `/?dev`). Sin eso no existe, así que no aparece a los jugadores. Con `?dev` sale el botón **DEV** en el mapa para encenderlo o apagarlo. Abre todos los niveles y añade al menú de pausa: ganar el nivel, +500 CPU, limpiar amenazas y saltar la preparación. Las herramientas son una lista en `desarrollo.js`.

## Probar

Servidor local: `python -m http.server 8766` dentro de la carpeta, y abrir `http://localhost:8766`. Si un cambio no aparece, recarga con Ctrl+F5.

Para medir la dificultad, carga el simulador desde la consola del navegador (las instrucciones están al principio de `herramientas/simulador.js`).
