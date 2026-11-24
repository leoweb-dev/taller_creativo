/* Módulo de dibujo.
 *
 * El lienzo funciona con dos capas:
 *  - capa base: los trazos (pincel, lápiz, spray, borrador, relleno, formas), en píxeles.
 *  - objetos:   texto, sellos e imágenes. Se dibujan encima de la base y se pueden
 *               seleccionar, mover y eliminar con la herramienta de selección.
 */
const Dibujo = (() => {
  const COLORES = [
    '#000000', '#ffffff', '#7f7f7f', '#8b4513',
    '#e63946', '#ff7b54', '#ffd23f', '#a7c957',
    '#2a9d8f', '#48cae4', '#3a5ccc', '#9b5de5',
    '#ff8fab', '#f4a261'
  ];
  const SELLOS = ['⭐', '❤️', '🌈', '☀️', '🌙', '🌸', '🐶', '🐱', '🦋', '🚀', '🏠', '🌳'];
  const MAX_HISTORIAL = 30;

  const MSG_FILE =
    'Para usar las imágenes de la carpeta img/ abre la aplicación con un servidor local ' +
    '(por ejemplo: python -m http.server 8000 y luego http://localhost:8000) o publícala en GitHub Pages. ' +
    'Las imágenes subidas con el botón sí funcionan.';

  const estado = {
    herramienta: 'pincel',
    color: '#e63946',
    grosor: 8,
    sello: SELLOS[0],
    fuente: 'Georgia, serif',
    tamTexto: 40,
    tamImagen: 180,
    imagen: null,          // imagen elegida para estampar
    dibujando: false,
    arrastrando: false,    // moviendo un objeto con la selección
    huboMovimiento: false,
    desplazamiento: null,  // distancia entre el clic y el centro/ancla del objeto
    inicio: null,
    ultimo: null,
    instantanea: null      // para previsualizar formas
  };

  let lienzo, ctx;           // lienzo visible
  let capaBase, cb;          // capa de trazos (fuera de pantalla)
  let objetos = [];          // texto, sellos e imágenes (el último se dibuja encima)
  let seleccionado = null;
  let entradaTexto = null;   // <input> flotante para escribir
  let textoActivo = null;    // datos del texto que se está escribiendo
  let temporizadorAviso;
  let historial = [];
  let indice = -1;

  /* ---------- Utilidades ---------- */
  function posicion(ev) {
    const r = lienzo.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (lienzo.width / r.width),
      y: (ev.clientY - r.top) * (lienzo.height / r.height)
    };
  }

  function mostrarAviso(texto) {
    const el = document.getElementById('aviso-imagenes');
    if (!el) return;
    el.textContent = texto;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { el.textContent = ''; }, 9000);
  }

  function hexARgba(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }

  /* ---------- Historial (base + objetos) ---------- */
  function guardarEstado() {
    const instantanea = {
      base: cb.getImageData(0, 0, capaBase.width, capaBase.height),
      objetos: objetos.map((o) => ({ ...o }))
    };
    historial = historial.slice(0, indice + 1);
    historial.push(instantanea);
    if (historial.length > MAX_HISTORIAL) historial.shift();
    indice = historial.length - 1;
  }

  function restaurar(i) {
    if (i < 0 || i >= historial.length) return;
    indice = i;
    cb.putImageData(historial[indice].base, 0, 0);
    objetos = historial[indice].objetos.map((o) => ({ ...o }));
    seleccionado = null;
    render();
  }

  /* ---------- Dibujo de la escena ---------- */
  function dibujarObjeto(o) {
    ctx.textBaseline = 'middle';
    if (o.tipo === 'texto') {
      ctx.font = o.tam + 'px ' + o.fuente;
      ctx.fillStyle = o.color;
      ctx.textAlign = 'left';
      ctx.fillText(o.texto, o.x, o.y);
    } else if (o.tipo === 'sello') {
      ctx.font = o.tam + 'px serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(o.emoji, o.x, o.y);
    } else if (o.tipo === 'imagen') {
      ctx.drawImage(o.img, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
  }

  // Rectángulo que ocupa un objeto: { x, y, w, h }
  function cajaDe(o) {
    if (o.tipo === 'texto') {
      ctx.font = o.tam + 'px ' + o.fuente;
      return { x: o.x, y: o.y - o.tam * 0.6, w: ctx.measureText(o.texto).width, h: o.tam * 1.2 };
    }
    if (o.tipo === 'sello') {
      const t = o.tam * 1.2;
      return { x: o.x - t / 2, y: o.y - t / 2, w: t, h: t };
    }
    return { x: o.x - o.w / 2, y: o.y - o.h / 2, w: o.w, h: o.h };
  }

  function dibujarSeleccion(o) {
    const c = cajaDe(o), m = 4;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(c.x - m, c.y - m, c.w + 2 * m, c.h + 2 * m);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#d9573a';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x - m, c.y - m, c.w + 2 * m, c.h + 2 * m);
    ctx.restore();
  }

  function render() {
    ctx.drawImage(capaBase, 0, 0);
    objetos.forEach(dibujarObjeto);
    if (seleccionado) dibujarSeleccion(seleccionado);
  }

  function objetoEn(p) {
    const m = 4;
    for (let i = objetos.length - 1; i >= 0; i--) {
      const c = cajaDe(objetos[i]);
      if (p.x >= c.x - m && p.x <= c.x + c.w + m && p.y >= c.y - m && p.y <= c.y + c.h + m) {
        return objetos[i];
      }
    }
    return null;
  }

  function agregarObjeto(o) {
    objetos.push(o);
    guardarEstado();
    render();
  }

  function eliminarSeleccion() {
    if (!seleccionado) {
      mostrarAviso('Primero selecciona un objeto con la herramienta 👆.');
      return;
    }
    objetos = objetos.filter((o) => o !== seleccionado);
    seleccionado = null;
    guardarEstado();
    render();
  }

  /* ---------- Herramientas de trazo (sobre la capa base) ---------- */
  function trazo(desde, hasta, color, ancho) {
    cb.strokeStyle = color;
    cb.lineWidth = ancho;
    cb.lineCap = 'round';
    cb.lineJoin = 'round';
    cb.beginPath();
    cb.moveTo(desde.x, desde.y);
    cb.lineTo(hasta.x, hasta.y);
    cb.stroke();
  }

  function spray(p) {
    const radio = estado.grosor * 1.5;
    cb.fillStyle = estado.color;
    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * radio;
      cb.fillRect(p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist, 1.5, 1.5);
    }
  }

  function rellenar(p, colorHex) {
    const ancho = capaBase.width, alto = capaBase.height;
    const img = cb.getImageData(0, 0, ancho, alto);
    const datos = img.data;
    const sx = Math.floor(p.x), sy = Math.floor(p.y);
    const idx0 = (sy * ancho + sx) * 4;
    const objetivo = [datos[idx0], datos[idx0 + 1], datos[idx0 + 2], datos[idx0 + 3]];
    const nuevo = hexARgba(colorHex);
    if (objetivo.every((v, i) => v === nuevo[i])) return;

    const tolerancia = 32;
    const coincide = (i) =>
      Math.abs(datos[i] - objetivo[0]) <= tolerancia &&
      Math.abs(datos[i + 1] - objetivo[1]) <= tolerancia &&
      Math.abs(datos[i + 2] - objetivo[2]) <= tolerancia &&
      Math.abs(datos[i + 3] - objetivo[3]) <= tolerancia;

    const pila = [[sx, sy]];
    while (pila.length) {
      let [x, y] = pila.pop();
      let i = (y * ancho + x) * 4;
      while (y >= 0 && coincide(i)) { y--; i -= ancho * 4; }
      y++; i += ancho * 4;
      let izq = false, der = false;
      while (y < alto && coincide(i)) {
        datos[i] = nuevo[0]; datos[i + 1] = nuevo[1]; datos[i + 2] = nuevo[2]; datos[i + 3] = 255;
        if (x > 0) {
          if (coincide(i - 4)) { if (!izq) { pila.push([x - 1, y]); izq = true; } }
          else izq = false;
        }
        if (x < ancho - 1) {
          if (coincide(i + 4)) { if (!der) { pila.push([x + 1, y]); der = true; } }
          else der = false;
        }
        y++; i += ancho * 4;
      }
    }
    cb.putImageData(img, 0, 0);
  }

  function dibujarForma(tipo, a, b) {
    cb.strokeStyle = estado.color;
    cb.lineWidth = estado.grosor;
    cb.lineCap = 'round';
    cb.lineJoin = 'round';
    cb.beginPath();
    if (tipo === 'linea') {
      cb.moveTo(a.x, a.y);
      cb.lineTo(b.x, b.y);
    } else if (tipo === 'rectangulo') {
      cb.rect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (tipo === 'circulo') {
      const rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2;
      cb.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, rx, ry, 0, 0, Math.PI * 2);
    }
    cb.stroke();
  }

  /* ---------- Objetos: sellos, texto, imágenes ---------- */
  function estampar(p) {
    agregarObjeto({
      tipo: 'sello',
      emoji: estado.sello,
      x: p.x,
      y: p.y,
      tam: Math.max(24, estado.grosor * 4)
    });
  }

  function abrirTexto(p) {
    const r = lienzo.getBoundingClientRect();
    const escala = r.width / lienzo.width;
    const izquierda = p.x * escala - 3;
    textoActivo = { x: p.x, y: p.y, color: estado.color, fuente: estado.fuente, tam: estado.tamTexto };

    entradaTexto.value = '';
    Object.assign(entradaTexto.style, {
      display: 'block',
      left: izquierda + 'px',
      top: (p.y * escala) + 'px',
      width: Math.max(120, Math.min(420, r.width - izquierda - 6)) + 'px',
      font: (estado.tamTexto * escala) + 'px ' + estado.fuente,
      color: estado.color
    });
    // Se enfoca después del clic para que el navegador no le quite el foco.
    setTimeout(() => entradaTexto.focus(), 0);
  }

  function ocultarEntradaTexto() {
    entradaTexto.style.display = 'none';
    entradaTexto.value = '';
  }

  function confirmarTexto() {
    if (!textoActivo) return;
    const t = textoActivo;
    const valor = entradaTexto.value.trim();
    textoActivo = null;           // antes de ocultar: ocultar dispara "blur"
    ocultarEntradaTexto();
    if (!valor) return;
    agregarObjeto({ tipo: 'texto', x: t.x, y: t.y, texto: valor, color: t.color, fuente: t.fuente, tam: t.tam });
  }

  function cancelarTexto() {
    textoActivo = null;
    ocultarEntradaTexto();
  }

  function estamparImagen(p) {
    const img = estado.imagen;
    if (!img) {
      mostrarAviso('Primero elige una imagen del panel o sube una desde tu equipo.');
      return;
    }
    const ancho0 = img.naturalWidth || 300;
    const alto0 = img.naturalHeight || 300;
    const k = estado.tamImagen / Math.max(ancho0, alto0);
    agregarObjeto({ tipo: 'imagen', img, x: p.x, y: p.y, w: ancho0 * k, h: alto0 * k });
  }

  /* ---------- Catálogo y subida de imágenes ---------- */
  function marcarMiniatura(boton) {
    document.querySelectorAll('#catalogo-imagenes .miniatura').forEach((b) => {
      b.classList.toggle('activa', b === boton);
    });
  }

  function seleccionarImagen(src, boton) {
    if (!src.startsWith('data:') && location.protocol === 'file:') {
      mostrarAviso(MSG_FILE);
      return;
    }
    const img = new Image();
    img.onload = () => {
      estado.imagen = img;
      elegirHerramienta('imagen');
      marcarMiniatura(boton);
    };
    img.onerror = () => mostrarAviso('No se pudo cargar la imagen: ' + src.slice(0, 60));
    img.src = src;
  }

  function agregarMiniatura(src, titulo) {
    const cont = document.getElementById('catalogo-imagenes');
    const b = document.createElement('button');
    b.className = 'miniatura';
    b.title = titulo;
    const im = document.createElement('img');
    im.src = src;
    im.alt = titulo;
    b.appendChild(im);
    b.addEventListener('click', () => seleccionarImagen(src, b));
    cont.appendChild(b);
    document.getElementById('catalogo-vacio').hidden = true;
    return b;
  }

  function construirImagenes() {
    const lista = (typeof CATALOGO_IMAGENES !== 'undefined') ? CATALOGO_IMAGENES : [];
    lista.forEach((item) => {
      let titulo = item.nombre || item.archivo;
      if (item.autor) titulo += ' — ' + item.autor;
      if (item.licencia) titulo += ' (' + item.licencia + ')';
      agregarMiniatura(item.archivo, titulo);
    });

    const entrada = document.getElementById('archivo-imagen');
    document.getElementById('btn-subir-imagen').addEventListener('click', () => entrada.click());
    entrada.addEventListener('change', () => {
      Array.from(entrada.files).forEach((archivo) => {
        if (!archivo.type.startsWith('image/')) {
          mostrarAviso('"' + archivo.name + '" no es una imagen.');
          return;
        }
        const lector = new FileReader();
        lector.onload = () => {
          const boton = agregarMiniatura(lector.result, archivo.name);
          seleccionarImagen(lector.result, boton);
        };
        lector.readAsDataURL(archivo);
      });
      entrada.value = '';   // permite volver a elegir el mismo archivo
    });
  }

  /* ---------- Eventos del puntero ---------- */
  function alPresionar(ev) {
    confirmarTexto();   // si había texto a medio escribir, se coloca primero
    const p = posicion(ev);

    if (estado.herramienta === 'texto') {
      abrirTexto(p);    // sin preventDefault para que el navegador no interfiera con el foco
      return;
    }

    ev.preventDefault();
    lienzo.setPointerCapture(ev.pointerId);
    estado.inicio = p;
    estado.ultimo = p;

    switch (estado.herramienta) {
      case 'seleccion': {
        seleccionado = objetoEn(p);
        if (seleccionado) {
          estado.arrastrando = true;
          estado.huboMovimiento = false;
          estado.desplazamiento = { x: p.x - seleccionado.x, y: p.y - seleccionado.y };
        }
        render();
        return;
      }
      case 'relleno':
        rellenar(p, estado.color);
        guardarEstado();
        render();
        return;
      case 'sello':
        estampar(p);
        return;
      case 'imagen':
        estamparImagen(p);
        return;
      case 'linea':
      case 'rectangulo':
      case 'circulo':
        estado.instantanea = cb.getImageData(0, 0, capaBase.width, capaBase.height);
        break;
      case 'spray':
        spray(p);
        break;
      case 'borrador':
        trazo(p, p, '#ffffff', estado.grosor * 2);
        break;
      case 'lapiz':
        trazo(p, p, estado.color, Math.max(1, estado.grosor / 3));
        break;
      default: // pincel
        trazo(p, p, estado.color, estado.grosor);
    }
    estado.dibujando = true;
    render();
  }

  function alMover(ev) {
    const p = posicion(ev);

    if (estado.arrastrando && seleccionado) {
      seleccionado.x = p.x - estado.desplazamiento.x;
      seleccionado.y = p.y - estado.desplazamiento.y;
      estado.huboMovimiento = true;
      render();
      return;
    }
    if (estado.herramienta === 'seleccion') {
      lienzo.style.cursor = objetoEn(p) ? 'move' : 'default';
      return;
    }
    if (!estado.dibujando) return;

    switch (estado.herramienta) {
      case 'linea':
      case 'rectangulo':
      case 'circulo':
        cb.putImageData(estado.instantanea, 0, 0);
        dibujarForma(estado.herramienta, estado.inicio, p);
        break;
      case 'spray':
        spray(p);
        break;
      case 'borrador':
        trazo(estado.ultimo, p, '#ffffff', estado.grosor * 2);
        break;
      case 'lapiz':
        trazo(estado.ultimo, p, estado.color, Math.max(1, estado.grosor / 3));
        break;
      default:
        trazo(estado.ultimo, p, estado.color, estado.grosor);
    }
    estado.ultimo = p;
    render();
  }

  function alSoltar() {
    if (estado.arrastrando) {
      estado.arrastrando = false;
      if (estado.huboMovimiento) {
        estado.huboMovimiento = false;
        guardarEstado();
      }
      return;
    }
    if (!estado.dibujando) return;
    estado.dibujando = false;
    estado.instantanea = null;
    guardarEstado();
  }

  /* ---------- Interfaz ---------- */
  function construirPaleta() {
    const cont = document.getElementById('paleta');
    COLORES.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'muestra-color' + (c === estado.color ? ' activa' : '');
      b.style.background = c;
      b.title = c;
      b.addEventListener('click', () => elegirColor(c));
      cont.appendChild(b);
    });
    document.getElementById('color-personalizado').addEventListener('input', (e) => elegirColor(e.target.value));
  }

  function elegirColor(c) {
    estado.color = c;
    document.querySelectorAll('.muestra-color').forEach((b) => {
      b.classList.toggle('activa', b.title.toLowerCase() === c.toLowerCase());
    });
  }

  function construirSellos() {
    const cont = document.getElementById('sellos');
    SELLOS.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'sello' + (i === 0 ? ' activo' : '');
      b.textContent = s;
      b.addEventListener('click', () => {
        estado.sello = s;
        elegirHerramienta('sello');
        cont.querySelectorAll('.sello').forEach((x) => x.classList.toggle('activo', x === b));
      });
      cont.appendChild(b);
    });
  }

  function marcarHerramienta() {
    document.querySelectorAll('.herramienta').forEach((b) => {
      b.classList.toggle('activa', b.dataset.herramienta === estado.herramienta);
    });
  }

  function elegirHerramienta(h) {
    confirmarTexto();
    estado.herramienta = h;
    if (h !== 'seleccion' && seleccionado) {
      seleccionado = null;
      render();
    }
    lienzo.style.cursor = h === 'seleccion' ? 'default' : (h === 'texto' ? 'text' : 'crosshair');
    marcarHerramienta();
  }

  function limpiar() {
    cb.fillStyle = '#ffffff';
    cb.fillRect(0, 0, capaBase.width, capaBase.height);
    objetos = [];
    seleccionado = null;
    guardarEstado();
    render();
  }

  // Imagen del dibujo completo (sin el recuadro de selección)
  function exportarDataURL() {
    const habia = seleccionado;
    seleccionado = null;
    render();
    try {
      return lienzo.toDataURL('image/png');
    } finally {
      seleccionado = habia;
      render();
    }
  }

  function guardarPNG() {
    const a = document.createElement('a');
    a.href = exportarDataURL();
    a.download = 'mi-dibujo.png';
    a.click();
  }

  function enlazarRango(idRango, idValor, alCambiar) {
    const rango = document.getElementById(idRango);
    const valor = document.getElementById(idValor);
    rango.addEventListener('input', () => {
      valor.textContent = rango.value;
      alCambiar(Number(rango.value));
    });
  }

  function iniciar() {
    lienzo = document.getElementById('lienzo');
    ctx = lienzo.getContext('2d');

    capaBase = document.createElement('canvas');
    capaBase.width = lienzo.width;
    capaBase.height = lienzo.height;
    cb = capaBase.getContext('2d', { willReadFrequently: true });
    cb.fillStyle = '#ffffff';
    cb.fillRect(0, 0, capaBase.width, capaBase.height);
    guardarEstado();
    render();

    // Caja de texto flotante sobre el lienzo
    entradaTexto = document.createElement('input');
    entradaTexto.type = 'text';
    entradaTexto.className = 'entrada-texto';
    entradaTexto.setAttribute('aria-label', 'Texto para el dibujo');
    document.getElementById('contenedor-lienzo').appendChild(entradaTexto);
    entradaTexto.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); confirmarTexto(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); cancelarTexto(); }
    });
    entradaTexto.addEventListener('blur', confirmarTexto);

    construirPaleta();
    construirSellos();
    construirImagenes();

    document.querySelectorAll('.herramienta').forEach((b) => {
      b.addEventListener('click', () => elegirHerramienta(b.dataset.herramienta));
    });

    enlazarRango('grosor', 'grosor-valor', (v) => { estado.grosor = v; });
    enlazarRango('tam-texto', 'tam-texto-valor', (v) => { estado.tamTexto = v; });
    enlazarRango('tam-imagen', 'tam-imagen-valor', (v) => { estado.tamImagen = v; });

    const selFuente = document.getElementById('fuente-texto');
    estado.fuente = selFuente.value;
    selFuente.addEventListener('change', () => { estado.fuente = selFuente.value; });

    lienzo.addEventListener('pointerdown', alPresionar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);

    document.getElementById('btn-deshacer').addEventListener('click', () => restaurar(indice - 1));
    document.getElementById('btn-rehacer').addEventListener('click', () => restaurar(indice + 1));
    document.getElementById('btn-eliminar-seleccion').addEventListener('click', eliminarSeleccion);
    document.getElementById('btn-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar todo el dibujo?')) limpiar();
    });
    document.getElementById('btn-guardar-png').addEventListener('click', guardarPNG);

    document.addEventListener('keydown', (ev) => {
      if (!document.getElementById('vista-dibujo').classList.contains('activa')) return;
      if (document.activeElement === entradaTexto) return;

      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        restaurar(ev.shiftKey ? indice + 1 : indice - 1);
        return;
      }
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if ((ev.key === 'Delete' || ev.key === 'Backspace') && seleccionado &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        ev.preventDefault();
        eliminarSeleccion();
      }
    });
  }

  return { iniciar, exportarDataURL };
})();
