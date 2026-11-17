/* ============================================================
   ENCICLOPEDIA — fichas de todas las amenazas y defensas que el
   jugador ya ha encontrado. Se abre desde el mapa.

   No tiene datos propios: recorre los niveles abiertos y lee de
   cada definición su nombre, descripción y dibujo. Al añadir una
   amenaza o defensa a un nivel, aparece aquí sola.
   ============================================================ */
CQ.enciclopedia = (() => {
  let raiz = null;

  /* Ids de amenazas que salen en un nivel (mezcla y jefes de su primera fase). */
  function amenazasDe(nivel) {
    const horda = nivel.fases[0].horda;
    return [...(horda.mezcla || []), ...(horda.jefes || []), ...(horda.oleadas || [])].map(x => x.amenaza);
  }

  /* Reúne lo visto (niveles abiertos) y cuenta el total del juego. */
  function reunir() {
    const vistas = { amenazas: new Set(), defensas: new Set() }, total = { amenazas: new Set(), defensas: new Set() };
    for (const nivel of CQ.niveles) {
      const abierto = CQ.mapa.estadoNivel(nivel.id) === 'abierto';
      for (const id of amenazasDe(nivel)) { total.amenazas.add(id); if (abierto) vistas.amenazas.add(id); }
      for (const id of nivel.defensas) { total.defensas.add(id); if (abierto) vistas.defensas.add(id); }
    }
    return { vistas, total };
  }

  function ficha(tipo, id) {
    const def = (tipo === 'amenazas' ? CQ.amenazas : CQ.defensas)[id];
    const extra = tipo === 'defensas'
      ? `<p class="dato">${def.coste} CPU · recarga ${def.recarga} s</p>${def.bien ? `<p class="bien">Bien contra: ${def.bien}</p>` : ''}${def.mal ? `<p class="mal">Flojea con: ${def.mal}</p>` : ''}`
      : `<p class="dato">Vida ${def.vida} · ${def.fuerza >= 3 ? 'jefe' : def.fuerza === 2 ? 'cruza firewalls' : 'la frena un firewall'}</p>`;
    return `<div class="novedad"><canvas width="160" height="160" data-tipo="${tipo}" data-id="${id}"></canvas>
      <div><b>${def.nombre}</b><p>${def.descripcion}</p>${extra}</div></div>`;
  }

  function seccion(titulo, tipo, datos) {
    const vistas = [...datos.vistas[tipo]], faltan = datos.total[tipo].size - vistas.length;
    return `<h3>${titulo} · ${vistas.length} de ${datos.total[tipo].size}</h3>${vistas.map(id => ficha(tipo, id)).join('')}
      ${faltan ? `<p class="rotulo">Te quedan ${faltan} por descubrir.</p>` : ''}`;
  }

  function abrir() {
    cerrar();
    const datos = reunir();
    raiz = document.createElement('div');
    raiz.id = 'enciclopedia';
    raiz.innerHTML = `<div class="panel ancho"><button class="cerrar" aria-label="Cerrar">✕</button><h2>Enciclopedia</h2>
      ${seccion('Defensas', 'defensas', datos)}${seccion('Amenazas', 'amenazas', datos)}
      <button class="boton grande">Cerrar</button></div>`;
    document.body.appendChild(raiz);
    raiz.querySelectorAll('button').forEach(b => b.addEventListener('click', cerrar));
    raiz.addEventListener('click', ev => { if (ev.target === raiz) cerrar(); });
    raiz.querySelectorAll('canvas').forEach(lienzo => {
      const c = lienzo.getContext('2d'), id = lienzo.dataset.id;
      c.translate(80, 84); c.scale(1.3, 1.3);
      if (lienzo.dataset.tipo === 'amenazas') { const a = CQ.crearAmenaza(id, 0); a.revelada = true; a.def.dibujar(c, a, 0); }
      else CQ.defensas[id].dibujar(c, CQ.crearDefensa(id, 0, 0), 0);
    });
  }

  function cerrar() { if (raiz) { raiz.remove(); raiz = null; } }

  return { abrir, cerrar };
})();
