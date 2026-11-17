/* ============================================================
   MAPA — pantalla de inicio: un camino de niveles sobre el paisaje
   definido en mundo.js. Se desplaza en vertical, de abajo arriba.

   Reparto de trabajo:
     - El lienzo pinta el paisaje (zonas) y el camino.
     - Los nodos son botones HTML colocados encima (clic y teclado).
     - La ficha inferior muestra el nodo elegido y lanza la partida.
   El progreso (dificultades superadas y récord por nivel) se guarda en los ajustes
   del navegador bajo la clave 'progreso'.
   ============================================================ */
CQ.mapa = (() => {
  const $ = id => document.getElementById(id);
  const D = CQ.dibujo;
  let raiz, lienzo, ctx, capaNodos, ficha, puntos = [], visible = false, montado = false;

  /* ---------------- Progreso ---------------- */
  const progreso = () => CQ.ajustes.leer('progreso') || {};
  function apuntarVictoria(juego) {
    if (!CQ.niveles.includes(juego.nivel)) return;   // el tutorial no cuenta
    const p = progreso(), id = juego.nivel.id, dif = CQ.app.dificultad().id;
    const actual = p[id] || {};
    actual.ganado = actual.ganado || {}; actual.puntos = actual.puntos || {};
    actual.ganado[dif] = true;
    juego.esRecord = juego.puntos > (actual.puntos[dif] || 0);   // la pantalla final lo anuncia
    actual.puntos[dif] = Math.max(actual.puntos[dif] || 0, juego.puntos);
    p[id] = actual;
    CQ.ajustes.guardar('progreso', p);
  }

  /* ¿Cuenta este nivel como superado en esta dificultad? Sí, si se ganó en ella
     o en una más difícil: el oro da también plata y bronce. El orden de dificultad
     es el de CQ.config.dificultades. (Los datos antiguos solo guardaban puntos.) */
  function superado(idNivel, idDificultad) {
    const d = progreso()[idNivel];
    if (!d) return false;
    const ganado = id => !!((d.ganado && d.ganado[id]) || (d.puntos && d.puntos[id]));
    const lista = CQ.config.dificultades, desde = lista.findIndex(x => x.id === idDificultad);
    return lista.slice(desde).some(x => ganado(x.id));
  }
  const superadoEnAlguna = idNivel => CQ.config.dificultades.some(d => superado(idNivel, d.id));

  /* Insignias de un nivel: una por dificultad, en su color si está superada y en gris si no.
     nueva: id de la dificultad recién conseguida, para resaltarla. conNombre: añade el rótulo. */
  function insignias(idNivel, nueva, conNombre) {
    return `<span class="insignias">${CQ.config.dificultades.map(d => {
      const si = superado(idNivel, d.id);
      return `<span class="insignia ${si ? 'si' : ''} ${nueva === d.id ? 'nueva' : ''}" title="${d.nombre}${si ? ': superado' : ''}">
        <svg viewBox="0 0 24 26" aria-hidden="true"><path d="${CQ.config.insignia}" fill="${si ? d.color : '#e9ecef'}"/>
        ${si ? '<path d="M7.5 12.5 l3.2 3.4 l6-7" fill="none" class="visto"/>' : ''}</svg>${conNombre ? `<small>${d.nombre}</small>` : ''}</span>`;
    }).join('')}</span>`;
  }

  /* Estado de cada nodo: 'tutorial', 'abierto' o 'bloqueado'. Un nivel se abre si
     existe y es el primero, o si el anterior se ha superado en cualquier dificultad. */
  function estadoDe(indice) {
    const nodo = CQ.mundo.nodos[indice];
    if (nodo.tipo === 'tutorial') return 'tutorial';
    if (nodo.tipo !== 'nivel' || !CQ.niveles.some(n => n.id === nodo.nivel)) return 'bloqueado';
    if (CQ.desarrollo && CQ.desarrollo.activo()) return 'abierto';   // modo desarrollo: todo abierto
    const anteriores = CQ.mundo.nodos.slice(0, indice).filter(n => n.tipo === 'nivel');
    if (!anteriores.length) return 'abierto';
    return superadoEnAlguna(anteriores[anteriores.length - 1].nivel) ? 'abierto' : 'bloqueado';
  }

  /* ---------------- Geometría ---------------- */
  const altoMundo = () => CQ.mundo.zonas.length * CQ.mundo.altoZona;

  /* Los nodos se reparten de abajo arriba, serpenteando. */
  function calcularPuntos() {
    const n = CQ.mundo.nodos.length, alto = altoMundo(), ancho = raiz.clientWidth;
    const margen = Math.min(0.3, 170 / Math.max(320, ancho) + 0.08);
    // Reparto uniforme: con dos nodos por zona, cada pareja cae en su paisaje.
    puntos = CQ.mundo.nodos.map((nodo, i) => ({
      x: ancho * (0.5 + (0.5 - margen) * Math.sin(i * 1.25 + 0.5)),
      y: alto - (i + 0.5) * alto / n,
    }));
  }

  /* ---------------- Montaje (una sola vez) ---------------- */
  function montar() {
    if (montado) return;
    montado = true;
    raiz = document.createElement('div'); raiz.id = 'mapa'; raiz.className = 'oculto';
    raiz.innerHTML = `
      <div id="mapaMundo"><canvas id="mapaLienzo"></canvas><div id="mapaNodos"></div></div>
      <h1 id="mapaTitulo" class="titulo">CUARENTENA</h1>
      <div id="mapaFicha" class="panel oculto"></div>
      <div id="mapaBotones">
        <button id="mapaEnciclopedia" class="boton">Enciclopedia</button>
        <button id="mapaBorrar" class="boton apagado" title="Empezar de cero">Borrar progreso</button>
        <button id="mapaDev" class="boton oculto" title="Modo desarrollo: abre todos los niveles y añade herramientas en la pausa"></button>
      </div>`;
    document.body.appendChild(raiz);
    lienzo = $('mapaLienzo'); ctx = lienzo.getContext('2d'); capaNodos = $('mapaNodos'); ficha = $('mapaFicha');
    window.addEventListener('resize', () => { if (visible) colocarNodos(); });
    $('mapaEnciclopedia').addEventListener('click', () => CQ.enciclopedia && CQ.enciclopedia.abrir());
    $('mapaBorrar').addEventListener('click', confirmarBorrado);
    if (CQ.pantalla) CQ.pantalla.boton($('mapaBotones'));
    if (CQ.desarrollo && CQ.desarrollo.disponible) {   // el botón DEV solo sale con ?dev
      const b = $('mapaDev');
      b.classList.remove('oculto');
      b.addEventListener('click', () => { CQ.desarrollo.alternar(); pintarDev(); cerrarFicha(); colocarNodos(); });
    }
  }

  function pintarDev() {
    if (!CQ.desarrollo || !CQ.desarrollo.disponible) return;
    const si = CQ.desarrollo.activo();
    $('mapaDev').textContent = 'DEV: ' + (si ? 'sí' : 'no');
    $('mapaDev').classList.toggle('apagado', !si);
  }

  const CANDADO = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="4.5" y="10.5" width="15" height="11" rx="3" fill="currentColor"/></svg>';

  function colocarNodos() {
    $('mapaMundo').style.height = altoMundo() + 'px';
    calcularPuntos();
    capaNodos.innerHTML = '';
    let numero = 0, destacado = null, porSuperar = null, ultimoAbierto = null;
    CQ.mundo.nodos.forEach((nodo, i) => {
      const estado = estadoDe(i), b = document.createElement('button');
      if (nodo.tipo !== 'tutorial') numero++;
      const datos = nodo.tipo === 'nivel' ? progreso()[nodo.nivel] : null;
      b.className = 'nodo ' + estado;
      b.style.left = puntos[i].x + 'px'; b.style.top = puntos[i].y + 'px';
      b.innerHTML = estado === 'bloqueado' ? CANDADO : estado === 'tutorial' ? '?' : numero;
      b.setAttribute('aria-label', estado === 'tutorial' ? 'Tutorial' : `Nivel ${numero}${estado === 'bloqueado' ? ', próximamente' : ''}`);
      if (estado === 'abierto') b.insertAdjacentHTML('beforeend', insignias(nodo.nivel));
      const miNumero = numero;   // copia: "numero" sigue creciendo con los nodos siguientes
      b.addEventListener('click', () => abrirFicha(i, miNumero, estado, b));
      capaNodos.appendChild(b);
      // Se destaca el siguiente paso lógico: el tutorial si no se ha visto, o el último nivel abierto.
      if (estado === 'tutorial' && !CQ.ajustes.leer('tutorialVisto')) destacado = destacado || b;
      if (estado === 'abierto' && !porSuperar && !superadoEnAlguna(nodo.nivel)) { porSuperar = b; }
      if (estado === 'abierto') ultimoAbierto = b;
    });
    destacado = destacado || porSuperar || ultimoAbierto;
    if (destacado) destacado.classList.add('destacado');
  }

  /* ---------------- Ficha del nodo elegido ---------------- */
  function cerrarFicha() { ficha.classList.add('oculto'); }

  function abrirFicha(indice, numero, estado, boton) {
    const nodo = CQ.mundo.nodos[indice];
    if (estado === 'bloqueado') {
      boton.classList.remove('no'); void boton.offsetWidth; boton.classList.add('no');
      pintarFicha(`<h2>Nivel ${numero}</h2><p>Próximamente. Este tramo del camino aún está en obras.</p>`, {});
      return;
    }
    if (estado === 'tutorial') {
      pintarFicha(`<h2>${nodo.nombre}</h2><p>${nodo.texto}</p>
        <button class="boton grande" data-accion="ir">Empezar</button>`,
        { ir: () => { cerrar(); CQ.tutorial.empezar(); } });
      return;
    }
    const nivel = CQ.niveles.find(n => n.id === nodo.nivel), datos = { puntos: {}, ...progreso()[nivel.id] };
    const elegida = CQ.app.dificultad();
    const acciones = {
      ir: () => { CQ.app.nivelActual = CQ.niveles.indexOf(nivel); cerrar(); CQ.app.entrarNivel(); },
      tutorial: () => { CQ.app.nivelActual = CQ.niveles.indexOf(nivel); cerrar(); CQ.tutorial.empezar(); },
    };
    const estrena = (nivel.novedades || []).map(n => (CQ.amenazas[n.amenaza] || CQ.defensas[n.defensa] || {}).nombre || n.titulo).join(' · ');
    for (const d of CQ.config.dificultades) acciones['dif_' + d.id] = () => { CQ.ajustes.guardar('dificultad', d.id); abrirFicha(indice, numero, estado, boton); };
    pintarFicha(`
      <h2>Nivel ${numero} · ${nivel.nombre}</h2>
      <p>${insignias(nivel.id, null, true)}</p>
      <div class="opciones">${CQ.config.dificultades.map(d =>
        `<button class="boton ${d.id === elegida.id ? '' : 'apagado'}" data-accion="dif_${d.id}">${d.nombre}</button>`).join('')}</div>
      <p class="record">${datos.puntos[elegida.id] ? `Récord en ${elegida.nombre.toLowerCase()}: <b>${datos.puntos[elegida.id]}</b>` : 'Aún sin récord en esta dificultad'}</p>
      ${estrena ? `<p class="estrena">Estrena: <b>${estrena}</b></p>` : ''}
      <button class="boton grande" data-accion="ir">Jugar</button>
      ${nivel.guia && CQ.ajustes.leer('tutorialVisto') ? '<button class="boton" data-accion="tutorial">Repetir tutorial</button>' : ''}`, acciones);
  }

  function pintarFicha(html, acciones) {
    ficha.innerHTML = `<button class="cerrar" data-accion="cerrar" aria-label="Cerrar">✕</button>${html}`;
    acciones.cerrar = cerrarFicha;
    ficha.querySelectorAll('[data-accion]').forEach(b => b.addEventListener('click', () => acciones[b.dataset.accion]()));
    ficha.classList.remove('oculto');
  }

  /* Borrar progreso: dos pasos, y en los dos el botón grande es el que NO borra. */
  function confirmarBorrado() {
    const superados = CQ.niveles.filter(n => superadoEnAlguna(n.id)).length;
    pintarFicha(`<h2>¿Borrar tu progreso?</h2>
      <p>Perderás los escudos de <b>${superados}</b> ${superados === 1 ? 'nivel' : 'niveles'}, los récords y el orden de tu equipo.</p>
      <button class="boton grande" data-accion="cancelar">No, conservarlo</button>
      <button class="boton apagado" data-accion="seguir">Sí, quiero borrarlo</button>`,
      {
        cancelar: cerrarFicha,
        seguir: () => pintarFicha(`<h2 class="alerta">¿Seguro del todo?</h2>
          <p>Esto <b>no se puede deshacer</b>. Volverás a empezar desde el nivel 1.</p>
          <button class="boton grande" data-accion="cancelar">No, me arrepiento</button>
          <button class="boton peligro" data-accion="borrar">Borrar definitivamente</button>`,
          {
            cancelar: cerrarFicha,
            borrar: () => { CQ.ajustes.borrar(['progreso', 'novedadesVistas', 'tutorialVisto', 'equipo']); abrir(); },
          }),
      });
  }

  /* ---------------- Abrir y cerrar ---------------- */
  function abrir() {
    montar();
    visible = true;
    raiz.classList.remove('oculto');
    cerrarFicha();
    pintarDev();
    colocarNodos();
    // Empieza mostrando el nodo destacado (abajo del todo la primera vez).
    const destacado = capaNodos.querySelector('.destacado');
    raiz.scrollTop = destacado ? parseFloat(destacado.style.top) - raiz.clientHeight * 0.55 : altoMundo();
  }
  function cerrar() { visible = false; if (raiz) raiz.classList.add('oculto'); }

  /* ---------------- Dibujo (lo llama main.js cada fotograma) ---------------- */
  function camino(t) {
    ctx.beginPath();
    puntos.forEach((p, i) => {
      if (!i) { ctx.moveTo(p.x, p.y + 90); ctx.lineTo(p.x, p.y); return; }
      const a = puntos[i - 1], medio = (a.y + p.y) / 2;
      ctx.bezierCurveTo(a.x, medio, p.x, medio, p.x, p.y);
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 34; ctx.strokeStyle = D.TINTA; ctx.stroke();
    ctx.lineWidth = 24; ctx.strokeStyle = '#fff7e6'; ctx.stroke();
    ctx.setLineDash([4, 26]); ctx.lineDashOffset = t * 40;      // datos que suben por el cable
    ctx.lineWidth = 8; ctx.strokeStyle = '#ffb703'; ctx.stroke();
    ctx.setLineDash([]);
  }

  function dibujar(t) {
    if (!visible) return;
    const dpr = window.devicePixelRatio || 1, w = raiz.clientWidth, h = raiz.clientHeight;
    if (lienzo.width !== Math.round(w * dpr) || lienzo.height !== Math.round(h * dpr)) {
      lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr); calcularPuntos();
    }
    const desplazado = raiz.scrollTop, zonas = CQ.mundo.zonas, altoZona = CQ.mundo.altoZona;
    ctx.setTransform(dpr, 0, 0, dpr, 0, -desplazado * dpr);

    // Zonas de arriba abajo; cada una remata su borde superior con una onda sobre la anterior.
    for (let i = zonas.length - 1; i >= 0; i--) {
      const zona = CQ.zonasMapa[zonas[i]], y = (zonas.length - 1 - i) * altoZona;
      if (y > desplazado + h + 60 || y + altoZona < desplazado - 60) continue;   // fuera de pantalla
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, y + altoZona + 40);
      ctx.lineTo(0, y);
      for (let x = 0; x <= w + 40; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 2) * 16);
      ctx.lineTo(w, y + altoZona + 40); ctx.closePath();
      ctx.fillStyle = zona.color; ctx.fill();
      if (i < zonas.length - 1) { ctx.lineWidth = 5; ctx.strokeStyle = D.TINTA; ctx.stroke(); }
      ctx.clip();
      zona.dibujar(ctx, { y, ancho: w, alto: altoZona }, t, D);
      if (zona.detalles) zona.detalles(ctx, { y, ancho: w, alto: altoZona }, t, D);   // atrezo (mundoDetalles.js)
      ctx.restore();
      // Rótulo de la zona.
      ctx.save(); ctx.font = '700 17px Fredoka, sans-serif';
      ctx.translate(18 + ctx.measureText(zona.nombre).width / 2, y + altoZona - 76); ctx.rotate(-0.03);
      D.texto(ctx, zona.nombre, 0, 0, 17, '#fff'); ctx.restore();
    }
    ctx.textAlign = 'left';
    camino(t);
  }

  CQ.eventos.on('victoria', d => { if (CQ.app && d.juego === CQ.app.juego) apuntarVictoria(d.juego); });
  CQ.eventos.on('partidaNueva', d => { if (CQ.app && d.juego === CQ.app.juego) cerrar(); });

  /* Estado de un nivel por su id ('abierto' o 'bloqueado'); lo usa la enciclopedia. */
  const estadoNivel = idNivel => estadoDe(CQ.mundo.nodos.findIndex(n => n.nivel === idNivel));

  return { abrir, cerrar, dibujar, insignias, superado, estadoNivel, abierto: () => visible };
})();
