/* ============================================================
   INTERFAZ — cartas de defensas, marcador, menús y ratón/teclado.
   Habla con el juego solo a través de CQ.app (main.js) y de los
   eventos del motor.
   ============================================================ */
CQ.ui = (() => {
  const $ = id => document.getElementById(id);
  const vista = { herramienta: null, hover: null };   // lo que render.js necesita saber
  let cartas = [];                                     // { id, boton, recarga }
  let esperaFicha = null;                              // temporizador de la ficha de carta

  /* ---------------- Cartas ---------------- */
  function elegir(herramienta) {
    vista.herramienta = vista.herramienta === herramienta ? null : herramienta;
    const def = CQ.defensas[vista.herramienta];
    $('ayuda').textContent = def ? `${def.nombre}: ${def.descripcion}`
      : vista.herramienta === 'quitar' ? 'Quitar: pulsa una defensa para desinstalarla y recuperar parte de su CPU. Clic derecho cancela.' : '';
  }

  /* Ficha que aparece al pasar el ratón por una carta: qué hace y contra qué sirve.
     Lee los campos descripcion, bien y mal de la definición de la defensa. */
  function mostrarFicha(def, boton) {
    const ficha = $('ficha'), r = boton.getBoundingClientRect();
    ficha.innerHTML = `<b>${def.nombre}</b> · ${def.coste} CPU · recarga ${def.recarga} s
      <p>${def.descripcion}</p>
      ${def.bien ? `<p class="bien">Bien contra: ${def.bien}</p>` : ''}
      ${def.mal ? `<p class="mal">Flojea con: ${def.mal}</p>` : ''}`;
    ficha.classList.remove('oculto');
    ficha.style.left = Math.max(8, Math.min(window.innerWidth - ficha.offsetWidth - 8, r.left)) + 'px';
    ficha.style.top = (r.bottom + 12) + 'px';
  }
  function ocultarFicha() { clearTimeout(esperaFicha); $('ficha').classList.add('oculto'); }

  /* Crea el botón de una carta (dibujo, nombre, coste y ficha al dejar el ratón encima).
     Lo usan la barra de juego y la pantalla de equipo; cada una añade su propio clic. */
  function crearCarta(id, tecla) {
    const def = CQ.defensas[id];
    const boton = document.createElement('button');
    boton.className = 'carta'; boton.dataset.carta = id;
    boton.innerHTML = `<span class="tecla">${tecla}</span><canvas width="120" height="120"></canvas>
      <span class="nombre">${def.nombre}</span><span class="coste">${def.coste}</span><i class="recarga"></i>`;
    const c = boton.querySelector('canvas').getContext('2d');
    c.translate(60, 62); c.scale(1.05, 1.05);
    def.dibujar(c, CQ.crearDefensa(id, 0, 0), 0);
    boton.addEventListener('pointerenter', ev => {
      if (ev.pointerType === 'touch') return;   // en pantallas táctiles no hay "pasar por encima"
      clearTimeout(esperaFicha);
      esperaFicha = setTimeout(() => mostrarFicha(def, boton), CQ.config.interfaz.retardoFicha * 1000);
    });
    boton.addEventListener('pointerleave', ocultarFicha);
    boton.addEventListener('pointerdown', ocultarFicha);
    return boton;
  }

  /* Barra de cartas de la partida: una por defensa activa, en el orden del equipo. */
  function construirCartas(juego) {
    const caja = $('cartas'); caja.innerHTML = ''; cartas = [];
    juego.defensasActivas().forEach((id, i) => {
      const boton = crearCarta(id, (i + 1) % 10);
      boton.addEventListener('click', () => elegir(id));
      caja.appendChild(boton);
      cartas.push({ id, boton, recarga: boton.querySelector('.recarga') });
    });
    vista.herramienta = null; $('ayuda').textContent = '';
  }

  /* ---------------- Paneles (menú, intermedio, final, pausa) ---------------- */
  function panel(html, acciones, clase) {
    const capa = $('capa');
    ocultarFicha();
    capa.innerHTML = `<div class="panel ${clase || ''}">${html}</div>`;
    capa.classList.remove('oculto');
    capa.querySelectorAll('[data-accion]').forEach(b => b.addEventListener('click', () => acciones[b.dataset.accion]()));
  }
  function cerrarPanel() { $('capa').classList.add('oculto'); $('capa').innerHTML = ''; }

  /* La pantalla de inicio es el mapa de niveles (mapa.js). */
  function mostrarMenu() { cerrarPanel(); CQ.mapa.abrir(); }

  function contarPorTipo(lista) {
    const cuenta = {};
    lista.forEach(e => cuenta[e.tipo] = (cuenta[e.tipo] || 0) + 1);
    return Object.keys(cuenta).map(tipo => `${cuenta[tipo]} × ${CQ.amenazas[tipo].nombre}`).join(' · ');
  }

  function mostrarIntermedio(juego) {
    const siguiente = juego.nivel.fases[juego.indiceFase + 1];
    const ultima = juego.indiceFase + 1 === juego.nivel.fases.length - 1;
    panel(`
      <h2 class="alerta">¡Brecha en ${juego.fase.nombre}!</h2>
      <p>Se han colado <b>${juego.pasaron.length}</b> amenazas y escalan privilegios${siguiente.insignia ? ` a <b>${siguiente.insignia}</b>` : ''}.</p>
      <p class="lista">${contarPorTipo(juego.pasaron)}</p>
      <p>Volverán ${siguiente.horda.carril === 'mismo' ? 'por el <b>mismo carril</b>' : 'por <b>carriles al azar</b>'}, más duras y más rápidas.</p>
      <p class="traspaso">Te llevas <b>${juego.traspaso.total} CPU</b>: ${juego.traspaso.sobrante} sin gastar + ${juego.traspaso.defensas} de tus ${juego.traspaso.enPie} defensas en pie.</p>
      ${ultima ? '<p class="aviso">Última línea de defensa: si pasa una sola, pierdes.</p>' : ''}
      <button class="boton grande" data-accion="seguir">Defender: ${siguiente.nombre}</button>`,
      { seguir: () => { cerrarPanel(); juego.siguienteFase(); } });
  }

  function tablaResumen(juego) {
    return `<table class="resumen"><tr><th>Fase</th><th>Eliminadas</th><th>Coladas</th></tr>${
      juego.resumen.map(r => `<tr><td>${r.nombre}</td><td>${r.eliminadas}</td><td>${r.coladas}</td></tr>`).join('')}</table>`;
  }

  function mostrarFinal(juego, victoria) {
    const total = juego.nivel.fases.length;
    const indice = CQ.niveles.indexOf(juego.nivel), esCampana = indice >= 0;
    const siguiente = esCampana ? CQ.niveles[indice + 1] : null;
    if (victoria && esCampana && !siguiente) return mostrarCierre(juego);   // último nivel: pantalla de cierre
    const dificultad = CQ.app.dificultad();
    panel(`
      <h2 class="${victoria ? 'exito' : 'alerta'}">${victoria ? '¡Red a salvo!' : 'Datos comprometidos'}</h2>
      ${esCampana ? `<p>${CQ.mapa.insignias(juego.nivel.id, victoria ? dificultad.id : null, true)}</p>` : ''}
      ${victoria && esCampana ? `<p>Nivel superado en <b>${dificultad.nombre.toLowerCase()}</b>.</p>` : ''}
      <p>${victoria
        ? `Has frenado el ataque en <b>${juego.fase.nombre}</b> (fase ${juego.indiceFase + 1} de ${total}).`
        : `Una amenaza${juego.fase.insignia ? ' con privilegios de ' + juego.fase.insignia : ''} ha llegado hasta el final.`}</p>
      ${tablaResumen(juego)}
      <p class="puntos">${juego.puntos} puntos${juego.esRecord ? ' · ¡nuevo récord!' : ''}</p>
      ${victoria && siguiente ? `<button class="boton grande" data-accion="siguiente">Siguiente nivel</button>` : ''}
      <button class="boton ${victoria && siguiente ? '' : 'grande'}" data-accion="otra">${victoria ? 'Repetir nivel' : 'Reintentar'}</button>
      <button class="boton" data-accion="mapa">Volver al mapa</button>`,
      {
        siguiente: () => { CQ.app.nivelActual = indice + 1; cerrarPanel(); CQ.app.entrarNivel(); },
        otra: () => { cerrarPanel(); CQ.app.entrarNivel(); },
        mapa: () => CQ.app.salirAlMapa(),
      });
  }

  /* Tarjeta de novedades: lo que estrena el nivel (amenazas, defensas o avisos).
     Lee nivel.novedades. Se enseña sola la primera vez que se juega el nivel
     y deja la partida en pausa hasta pulsar el botón. */
  function mostrarNovedades(juego, alCerrar) {
    const items = juego.nivel.novedades || [];
    const bloques = items.map((n, i) => {
      const def = n.amenaza ? CQ.amenazas[n.amenaza] : n.defensa ? CQ.defensas[n.defensa] : null;
      if (!def) return `<div class="novedad"><div><b>${n.titulo}</b><p>${n.texto}</p></div></div>`;
      return `<div class="novedad"><canvas width="160" height="160" data-n="${i}"></canvas>
        <div><span class="etiqueta ${n.amenaza ? 'mala' : 'buena'}">${n.amenaza ? 'Amenaza nueva' : 'Defensa nueva'}</span>
        <b>${def.nombre}</b><p>${def.descripcion}</p></div></div>`;
    }).join('');
    panel(`<h2>Novedades</h2>${bloques}<button class="boton grande" data-accion="ok">¡Entendido!</button>`,
      { ok: () => { cerrarPanel(); if (alCerrar) alCerrar(); } });
    items.forEach((n, i) => {
      const lienzo = document.querySelector(`.novedad canvas[data-n="${i}"]`);
      if (!lienzo) return;
      const c = lienzo.getContext('2d'); c.translate(80, 84); c.scale(1.3, 1.3);
      if (n.amenaza) { const a = CQ.crearAmenaza(n.amenaza, 0); a.revelada = true; a.def.dibujar(c, a, 0); }
      else CQ.defensas[n.defensa].dibujar(c, CQ.crearDefensa(n.defensa, 0, 0), 0);
    });
  }

  /* Al empezar una partida: si el nivel estrena algo y aún no se ha visto, lo enseña. */
  function quizaNovedades(juego) {
    if (!juego.nivel.novedades || !juego.nivel.novedades.length) return;
    const vistas = CQ.ajustes.leer('novedadesVistas') || [];
    if (vistas.includes(juego.nivel.id)) return;
    CQ.ajustes.guardar('novedadesVistas', [...vistas, juego.nivel.id]);
    CQ.app.pausa = true;
    mostrarNovedades(juego, () => { CQ.app.pausa = false; });
  }

  /* Pantalla de cierre al ganar el último nivel: todo el equipo celebrando
     y el resumen de escudos de la campaña. */
  function mostrarCierre(juego) {
    const equipo = CQ.niveles[CQ.niveles.length - 1].defensas;
    const completos = CQ.niveles.filter(n => CQ.mapa.superado(n.id, CQ.config.dificultades[CQ.config.dificultades.length - 1].id)).length;
    panel(`
      <h1 class="titulo">¡INTERNET A SALVO!</h1>
      <canvas id="cierreEquipo" width="${equipo.length * 110}" height="150"></canvas>
      <p>Has parado a <b>Día Cero</b> y completado los ${CQ.niveles.length} niveles. De casa a la nube, todo sigue en pie gracias a ti.</p>
      <div class="cierreNiveles">${CQ.niveles.map((n, i) => `<span><b>${i + 1}</b>${CQ.mapa.insignias(n.id)}</span>`).join('')}</div>
      <p class="record">${completos === CQ.niveles.length ? 'Todos los niveles en oro. No queda nada por demostrar.'
        : `Niveles en oro: <b>${completos}</b> de ${CQ.niveles.length}. ¿Te atreves con el resto en difícil?`}</p>
      <p class="puntos">${juego.puntos} puntos${juego.esRecord ? ' · ¡nuevo récord!' : ''}</p>
      <button class="boton grande" data-accion="mapa">Volver al mapa</button>
      <button class="boton" data-accion="otra">Repetir el nivel final</button>`,
      { mapa: () => CQ.app.salirAlMapa(), otra: () => { cerrarPanel(); CQ.app.entrarNivel(); } }, 'ancho');
    const c = $('cierreEquipo').getContext('2d');
    equipo.forEach((id, i) => {
      c.save(); c.translate(55 + i * 110, 70 + (i % 2 ? 14 : 0)); c.rotate((i % 2 ? 1 : -1) * 0.08);
      CQ.defensas[id].dibujar(c, CQ.crearDefensa(id, 0, 0), 0);
      c.restore();
    });
  }

  function mostrarPausa() {
    const acciones = {
      seguir: () => CQ.app.alternarPausa(),
      reiniciar: () => { cerrarPanel(); CQ.app.reiniciar(); },
      mapa: () => CQ.app.salirAlMapa(),
    };
    // Herramientas del modo desarrollo (desarrollo.js), si está activo.
    const dev = CQ.desarrollo && CQ.desarrollo.activo() ? CQ.desarrollo.herramientas : [];
    dev.forEach((h, i) => { acciones['dev_' + i] = () => { CQ.app.alternarPausa(); h.hacer(CQ.app.juego); }; });
    panel(`<h2>Pausa</h2><p>Tómate tu tiempo para pensar.</p>
      <button class="boton grande" data-accion="seguir">Continuar</button>
      <button class="boton" data-accion="reiniciar">Reiniciar partida</button>
      <button class="boton" data-accion="mapa">Salir al mapa</button>
      ${dev.length ? `<p class="rotulo">Desarrollo</p><div class="opciones">${dev.map((h, i) =>
        `<button class="boton apagado" data-accion="dev_${i}">${h.texto}</button>`).join('')}</div>` : ''}`, acciones);
  }

  /* ---------------- Ratón y teclado ---------------- */
  function celdaDe(ev) {
    const lienzo = $('lienzo'), r = lienzo.getBoundingClientRect();
    const p = CQ.render.aTablero(ev.clientX - r.left, ev.clientY - r.top);
    return { x: p.x, y: p.y, fila: Math.floor(p.y), col: Math.floor(p.x) };
  }

  function alPulsar(ev) {
    const juego = CQ.app.juego;
    if (!juego || CQ.app.pausa || ev.button === 2) return;
    const c = celdaDe(ev);
    if (juego.recogerChipEn(c.x, c.y)) return;             // los chips tienen prioridad
    if (!vista.herramienta) return;
    if (c.fila < 0 || c.col < 0 || c.fila >= juego.filas || c.col >= juego.columnas) return;
    if (vista.herramienta === 'quitar') {
      if (juego.desinstalar(c.fila, c.col)) elegir(null);
      return;
    }
    colocarEn(juego, vista.herramienta, c.fila, c.col);
  }

  /* Intenta desplegar una defensa; si no se puede, muestra el motivo sobre la casilla. */
  function colocarEn(juego, id, fila, col) {
    const motivo = juego.colocar(id, fila, col);
    if (motivo) juego.fx.texto(col + 0.5, fila + 0.3, motivo, '#ff5d73');
    else if (vista.herramienta) elegir(null);
  }

  function alTeclear(ev) {
    const juego = CQ.app.juego;
    if (!juego) return;
    if (CQ.app.pausa && !document.querySelector('#capa [data-accion=seguir]')) return;   // hay una tarjeta abierta
    const k = ev.key.toLowerCase();
    if (k === 'escape') { if (vista.herramienta) elegir(null); CQ.app.alternarPausa(); return; }
    if (k === 'q') return elegir('quitar');
    // Números: eligen la carta de esa posición (el 0 es la décima). No colocan nada.
    if (k.length === 1 && k >= '0' && k <= '9') {
      const carta = cartas[(+k + 9) % 10];
      if (carta && vista.herramienta !== carta.id) elegir(carta.id);
    }
  }

  function iniciar() {
    const lienzo = $('lienzo');
    lienzo.addEventListener('pointerdown', alPulsar);
    lienzo.addEventListener('pointermove', ev => { vista.hover = celdaDe(ev); });
    lienzo.addEventListener('pointerleave', () => { vista.hover = null; });
    lienzo.addEventListener('contextmenu', ev => { ev.preventDefault(); if (vista.herramienta) elegir(null); });
    window.addEventListener('keydown', alTeclear);

    $('btnQuitar').addEventListener('click', () => elegir('quitar'));
    $('btnVenga').addEventListener('click', () => CQ.app.juego && CQ.app.juego.empezarHorda());
    $('btnPausa').addEventListener('click', () => CQ.app.alternarPausa());
    // Un botón por cada velocidad definida en config.js.
    CQ.config.velocidades.forEach((v, i) => {
      const b = document.createElement('button');
      b.className = 'boton'; b.textContent = 'x' + v;
      b.addEventListener('click', () => CQ.app.fijarVelocidad(i));
      $('velocidades').appendChild(b);
    });
    // Un botón por cada ajuste definido en config.js.
    for (const a of CQ.config.ajustes) {
      const b = document.createElement('button');
      const pintar = () => { const si = CQ.ajustes.leer(a.clave); b.textContent = a.texto + (si ? ': sí' : ': no'); b.classList.toggle('apagado', !si); };
      b.className = 'boton'; pintar();
      b.addEventListener('click', () => { CQ.audio.activar(); CQ.ajustes.alternar(a.clave); pintar(); });
      $('ajustes').appendChild(b);
    }

    // Solo se atiende a la partida que está en pantalla (no a simulaciones).
    const mia = d => d.juego === CQ.app.juego;
    CQ.eventos.on('partidaNueva', d => { construirCartas(d.juego); if (mia(d)) quizaNovedades(d.juego); });
    CQ.eventos.on('faseIniciada', d => { if (mia(d)) construirCartas(d.juego); });
    CQ.eventos.on('faseTerminada', d => { if (mia(d)) mostrarIntermedio(d.juego); });
    CQ.eventos.on('victoria', d => { if (mia(d)) mostrarFinal(d.juego, true); });
    CQ.eventos.on('derrota', d => { if (mia(d)) mostrarFinal(d.juego, false); });
    CQ.eventos.on('pausa', d => d.activa ? mostrarPausa() : cerrarPanel());

    mostrarMenu();
  }

  /* Se llama cada fotograma para refrescar marcadores. */
  function actualizar(juego) {
    $('cpuNum').textContent = Math.floor(juego.cpu);
    for (const c of cartas) {
      const def = CQ.defensas[c.id], recarga = juego.recargas[c.id] || 0;
      c.boton.classList.toggle('elegida', vista.herramienta === c.id);
      c.boton.classList.toggle('apagada', juego.cpu < def.coste || recarga > 0);
      c.recarga.style.height = (recarga / def.recarga * 100) + '%';
    }
    $('btnQuitar').classList.toggle('elegida', vista.herramienta === 'quitar');
    [...$('velocidades').children].forEach((b, i) => b.classList.toggle('apagado', i !== CQ.app.indiceVelocidad));

    const enPrep = juego.estado === 'preparacion';
    $('cartelPrep').classList.toggle('oculto', !enPrep);
    if (enPrep) $('prepNum').textContent = Math.ceil(juego.tPreparacion);

    $('faseNombre').textContent = `Fase ${juego.indiceFase + 1}/${juego.nivel.fases.length} · ${juego.fase.nombre}`;
    const total = juego.stats.total || 1;
    $('progresoBarra').style.width = ((1 - juego.restantes() / total) * 100) + '%';
    $('restantes').textContent = `Quedan ${juego.restantes()}`;
    $('coladas').textContent = `Coladas: ${juego.stats.coladas}`;
    $('coladas').classList.toggle('mal', juego.stats.coladas > 0);
  }

  return { iniciar, actualizar, vista, mostrarMenu, panel, cerrarPanel, crearCarta };
})();
