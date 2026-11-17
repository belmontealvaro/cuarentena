/* ============================================================
   NÚCLEO — espacio de nombres, registros y bus de eventos.
   Todo lo demás se "enchufa" aquí. Ningún archivo depende de
   otro directamente: solo de CQ y de los registros.
   ============================================================ */
window.CQ = {
  amenazas: {},          // id -> definición de amenaza
  defensas: {},          // id -> definición de defensa
  escenarios: {},        // id -> aspecto visual de un escenario
  generadoresHorda: {},  // tipo -> función que crea la cola de amenazas
  niveles: [],           // lista de niveles
  sonidos: {},           // nombre -> capas del sonido
  musicas: {},           // id -> partitura de una música
  decorados: {},         // id -> dibujo de la zona de entrada (ventanas de navegador…)

  registrarAmenaza(def)   { this.amenazas[def.id] = def; },
  registrarDefensa(def)   { this.defensas[def.id] = def; },
  registrarEscenario(def) { this.escenarios[def.id] = def; },
  registrarHorda(tipo, fn){ this.generadoresHorda[tipo] = fn; },
  registrarNivel(def)     { this.niveles.push(def); },
  registrarDecorado(def)  { this.decorados[def.id] = def; },
  registrarMusica(def)    { this.musicas[def.id] = def; },

  /* Ajustes del jugador (sonido, música, sacudida…). Se guardan en el navegador.
     Los valores por defecto y la lista están en config.js (CQ.config.ajustes). */
  ajustes: {
    _valores: null,
    _cargar() {
      if (this._valores) return;
      this._valores = {};
      try { this._valores = JSON.parse(localStorage.getItem('cuarentena_ajustes')) || {}; } catch (e) { /* sin almacenamiento */ }
    },
    leer(clave) {
      this._cargar();
      if (clave in this._valores) return this._valores[clave];
      const def = CQ.config.ajustes.find(a => a.clave === clave);
      return def ? def.porDefecto : false;
    },
    guardar(clave, valor) {
      this._cargar();
      this._valores[clave] = valor;
      try { localStorage.setItem('cuarentena_ajustes', JSON.stringify(this._valores)); } catch (e) { /* sin almacenamiento */ }
    },
    borrar(claves) {
      this._cargar();
      for (const c of claves) delete this._valores[c];
      try { localStorage.setItem('cuarentena_ajustes', JSON.stringify(this._valores)); } catch (e) { /* sin almacenamiento */ }
    },
    alternar(clave) {
      const nuevo = !this.leer(clave);
      this._valores[clave] = nuevo;
      try { localStorage.setItem('cuarentena_ajustes', JSON.stringify(this._valores)); } catch (e) { /* sin almacenamiento */ }
      CQ.eventos.emitir('ajusteCambiado', { clave, valor: nuevo });
      return nuevo;
    },
  },

  /* Bus de eventos: el motor emite, la interfaz y el sonido escuchan. */
  eventos: {
    _mapa: {},
    on(nombre, fn) { (this._mapa[nombre] = this._mapa[nombre] || []).push(fn); },
    emitir(nombre, datos) { (this._mapa[nombre] || []).forEach(fn => fn(datos)); },
  },

  util: {
    azar(a, b) { return a + Math.random() * (b - a); },
    azarEntero(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    elegir(lista) { return lista[Math.floor(Math.random() * lista.length)]; },
    limitar(v, min, max) { return Math.max(min, Math.min(max, v)); },
  },
};
