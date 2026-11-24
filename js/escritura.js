/* Módulo de escritura: editor de historias, ideas, plantillas, voz y exportación. */
const Escritura = (() => {
  const IDEAS = {
    personajes: ['un dragón tímido', 'una robot cocinera', 'un pirata que le teme al mar', 'una niña que habla con las nubes', 'un gato astronauta', 'un abuelo inventor'],
    lugares: ['en una isla flotante', 'dentro de un reloj gigante', 'en el fondo de un lago mágico', 'en una biblioteca sin final', 'en la luna', 'en un bosque de colores'],
    problemas: ['perdió su sombra', 'encontró un mapa misterioso', 'debe entregar una carta muy importante', 'descubrió que puede volar', 'se quedó sin voz', 'tiene que ayudar a un amigo']
  };

  const PLANTILLAS = [
    {
      nombre: '🗺️ Cuento de aventura',
      html: '<p><b>Había una vez</b> un personaje que vivía en…</p><p>Un día, ocurrió algo inesperado:</p><p>Para resolverlo, tuvo que…</p><p><b>Y colorín colorado,</b> este cuento…</p>'
    },
    {
      nombre: '✉️ Carta a un amigo',
      html: '<p>Querido/a …,</p><p>Te escribo para contarte que…</p><p>Lo mejor de esta semana fue…</p><p>Un abrazo grande,<br>…</p>'
    },
    {
      nombre: '📰 Noticia fantástica',
      html: '<h2>¡Titular de la noticia!</h2><p><b>¿Qué pasó?</b> …</p><p><b>¿Dónde?</b> …</p><p><b>¿Quién estuvo ahí?</b> …</p><p><b>¿Por qué es increíble?</b> …</p>'
    }
  ];

  let editor, titulo, estado, temporizador;

  function azar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function mostrarEstado(texto) {
    estado.textContent = texto;
  }

  /* ---------- Guardado ---------- */
  function guardar(silencioso) {
    const ok = Almacen.guardar('historia', { titulo: titulo.value, html: editor.innerHTML });
    mostrarEstado(ok
      ? (silencioso ? 'Guardado automáticamente ✔' : 'Historia guardada ✔')
      : 'No se pudo guardar (¿almacenamiento lleno?). Prueba exportar a .txt.');
  }

  function guardarConRetraso() {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => guardar(true), 1200);
  }

  function cargar() {
    const h = Almacen.cargar('historia');
    if (h) {
      titulo.value = h.titulo || '';
      editor.innerHTML = h.html || '';
    }
  }

  /* ---------- Funciones del editor ---------- */
  function darIdea() {
    document.getElementById('idea').textContent =
      `Escribe sobre ${azar(IDEAS.personajes)} ${azar(IDEAS.lugares)} que ${azar(IDEAS.problemas)}.`;
  }

  function construirPlantillas() {
    const cont = document.getElementById('plantillas');
    PLANTILLAS.forEach((p) => {
      const b = document.createElement('button');
      b.textContent = p.nombre;
      b.addEventListener('click', () => {
        if (editor.innerText.trim() && !confirm('Esto reemplazará el texto actual. ¿Continuar?')) return;
        editor.innerHTML = p.html;
        guardarConRetraso();
      });
      cont.appendChild(b);
    });
  }

  function leerEnVozAlta() {
    if (!('speechSynthesis' in window)) {
      mostrarEstado('Tu navegador no admite lectura en voz alta.');
      return;
    }
    speechSynthesis.cancel();
    const texto = (titulo.value ? titulo.value + '. ' : '') + editor.innerText;
    if (!texto.trim()) return;
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'es-ES';
    speechSynthesis.speak(voz);
  }

  function exportarTxt() {
    const contenido = (titulo.value ? titulo.value + '\n\n' : '') + editor.innerText;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (titulo.value.trim() || 'mi-historia') + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function insertarDibujo() {
    editor.focus();
    document.execCommand('insertImage', false, Dibujo.exportarDataURL());
    guardarConRetraso();
  }

  function iniciar() {
    editor = document.getElementById('editor');
    titulo = document.getElementById('titulo-historia');
    estado = document.getElementById('estado-historia');

    cargar();
    construirPlantillas();

    document.getElementById('btn-idea').addEventListener('click', darIdea);

    document.querySelectorAll('[data-cmd]').forEach((b) => {
      b.addEventListener('mousedown', (e) => e.preventDefault()); // conserva la selección
      b.addEventListener('click', () => document.execCommand(b.dataset.cmd));
    });

    document.getElementById('fuente').addEventListener('change', (e) => { editor.style.fontFamily = e.target.value; });
    document.getElementById('tamano').addEventListener('change', (e) => { editor.style.fontSize = e.target.value; });

    document.getElementById('btn-leer').addEventListener('click', leerEnVozAlta);
    document.getElementById('btn-parar').addEventListener('click', () => speechSynthesis.cancel());
    document.getElementById('btn-guardar-historia').addEventListener('click', () => guardar(false));
    document.getElementById('btn-exportar-txt').addEventListener('click', exportarTxt);
    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
    document.getElementById('btn-insertar-dibujo').addEventListener('click', insertarDibujo);

    editor.addEventListener('input', guardarConRetraso);
    titulo.addEventListener('input', guardarConRetraso);
  }

  return { iniciar };
})();
