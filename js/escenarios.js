/* ============================================================
   ESCENARIOS — solo aspecto visual. Para crear uno nuevo,
   copia un bloque y cambia colores y textos.
     fondo            color de la placa de circuito de fondo
     casillaA/B       los dos tonos del tablero
     colorOrigen      panel de la zona de entrada (izquierda)
     decoradoOrigen   id de un decorado de decorados.js
     colorDestino     panel de la zona que hay que proteger (derecha)
   ============================================================ */
CQ.registrarEscenario({
  id: 'perimetro',
  fondo: '#2f9e6e',
  casillaA: '#f1f8d8', casillaB: '#dcefb9',
  origen: 'INTERNET', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'RED', colorDestino: '#ffd166',
});

CQ.registrarEscenario({
  id: 'redInterna',
  fondo: '#8a5fc7',
  casillaA: '#f3e8ff', casillaB: '#e2ccfb',
  origen: 'BRECHA', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'SERVIDOR', colorDestino: '#80ed99',
});

CQ.registrarEscenario({
  id: 'servidor',
  fondo: '#d95d4e',
  casillaA: '#ffeede', casillaB: '#ffd9c4',
  origen: 'RED', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'DATOS', colorDestino: '#ffd60a',
});

/* ---------- Escenarios de zona ----------
   Los usa la primera fase de cada nivel (niveles.js copia nivel.zona a su escenario),
   para que el tablero se parezca a su zona del mapa. */
CQ.registrarEscenario({
  id: 'casa', fondo: '#d9894f',
  casillaA: '#fff1dc', casillaB: '#ffe0bd',
  origen: 'INTERNET', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'TU PC', colorDestino: '#a8e6ff',
});
CQ.registrarEscenario({
  id: 'oficina', fondo: '#5aa487',
  casillaA: '#f2fbf6', casillaB: '#dcf1e6',
  origen: 'INTERNET', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'RED', colorDestino: '#ffd166',
});
CQ.registrarEscenario({
  id: 'banco', fondo: '#b3923a',
  casillaA: '#fffbea', casillaB: '#f6ecc4',
  origen: 'INTERNET', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'CUENTAS', colorDestino: '#95d5b2',
});
CQ.registrarEscenario({
  id: 'datos', fondo: '#5a4a8a',
  casillaA: '#f1ebff', casillaB: '#ded3f7',
  origen: 'INTERNET', colorOrigen: '#2b2140', decoradoOrigen: 'navegadores',
  destino: 'SERVIDORES', colorDestino: '#c77dff',
});
CQ.registrarEscenario({
  id: 'nube', fondo: '#8f7fe0',
  casillaA: '#ffffff', casillaB: '#ebe7ff',
  origen: 'INTERNET', colorOrigen: '#3d2f63', decoradoOrigen: 'navegadores',
  destino: 'LA NUBE', colorDestino: '#fff3b0',
});
