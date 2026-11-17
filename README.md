# Cuarentena

Juego de estrategia cartoon sobre ciberseguridad. Las amenazas salen de internet y avanzan por carriles; tú despliegas defensas casilla a casilla para que no lleguen a la red. Lo que se cuela vuelve en la fase siguiente con más privilegios.

- **10 niveles** en cinco zonas: casa, oficina, banco, centro de datos y la nube.
- **10 defensas** que se desbloquean al avanzar y **9 amenazas**, con jefe final.
- Tres dificultades, con un escudo de bronce, plata u oro por nivel.
- Funciona en ordenador y en móvil (mejor en horizontal), con botón de pantalla completa. En iPhone, usa **Compartir → Añadir a pantalla de inicio** para jugar a pantalla completa.

## Jugar

Abre `index.html` con doble clic. No hay que instalar nada ni hace falta conexión (sin internet solo cambia el tipo de letra).

## Controles

| Acción | Ratón o toque | Teclado |
|---|---|---|
| Elegir una defensa | Clic en su carta | Números 1 a 0 |
| Desplegarla | Clic en una casilla | |
| Soltar la carta | Clic derecho | |
| Desinstalar una defensa | Botón Quitar y clic en ella | Q |
| Pausa | Botón Pausa | Esc |

Deja el ratón quieto sobre una carta para ver contra qué sirve.

## Compartirlo

- **Como carpeta**: comprime la carpeta entera y envíala. Quien la reciba la descomprime y abre `index.html`.
- **Como página web**: es una web estática, así que sirve cualquier alojamiento de archivos. En GitHub: sube la carpeta a un repositorio y activa GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).

Al publicar una versión nueva, sube el número `?v=` de las líneas de `index.html` para que los navegadores no usen la copia antigua.

## Para modificarlo

El juego está hecho con HTML y JavaScript sin dependencias ni compilación. Todo el contenido (amenazas, defensas, niveles, música, mapa) son datos independientes del motor. La guía completa está en [LEEME.md](LEEME.md).

## Licencia

Código abierto bajo licencia [MIT](LICENSE): puedes usarlo, modificarlo y compartirlo citando al autor.
