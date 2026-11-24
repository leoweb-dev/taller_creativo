# Taller Creativo

Aplicación web para niños y niñas con dos espacios:

- **🖌️ Dibujo**: lienzo con pincel, lápiz, spray, borrador, relleno, líneas, rectángulos, círculos, sellos, **texto**, **imágenes**, deshacer/rehacer y guardado en PNG.
- **📖 Historias**: editor de texto con plantillas, ideas al azar, lectura en voz alta, inserción de dibujos, guardado automático, exportación a .txt e impresión.

Es un proyecto original, inspirado en la idea general de los programas creativos infantiles de los años 90. No usa código, personajes, gráficos, sonidos ni nombres de ningún producto de terceros.

## Cómo usarlo

Abre `index.html` en el navegador para dibujar, escribir y subir imágenes desde tu equipo.

Para usar el **catálogo de imágenes de la carpeta `img/`** necesitas un servidor local, porque los navegadores bloquean el guardado/deshacer cuando el lienzo usa archivos locales (`file://`):

```
python -m http.server 8000
```

y abre <http://localhost:8000>. También funciona publicándolo gratis en GitHub Pages.

## Selección y objetos movibles

El lienzo tiene dos capas: los **trazos** (pincel, lápiz, spray, borrador, relleno y formas) y los **objetos** (texto, sellos e imágenes), que se dibujan encima.

- Con 👆 haz clic en un objeto para seleccionarlo (aparece un recuadro) y arrástralo para moverlo.
- **Suprimir** o el botón **Quitar objeto** lo elimina.
- El borrador y el relleno actúan solo sobre los trazos, no sobre los objetos.
- Los objetos se apilan en el orden en que se colocan; el último queda arriba.
- Deshacer/rehacer incluye los movimientos y eliminaciones de objetos.

## Herramienta de texto

Elige 🔤, haz clic en el lienzo, escribe y pulsa **Enter** (o haz clic en otro lugar) para colocarlo. **Esc** cancela. Se puede cambiar la fuente, el tamaño y el color antes de hacer clic.

## Agregar imágenes (OpenGameArt, Kenney.nl, OpenClipart…)

1. Copia el archivo (PNG, JPG, SVG o WebP) a `img/`.
2. Agrega una línea en `js/catalogo.js`:
   ```js
   { nombre: 'Árbol', archivo: 'img/arbol.png', autor: 'Kenney', licencia: 'CC0', fuente: 'https://kenney.nl' },
   ```
3. Recarga la página: aparece una miniatura en el panel **Imágenes**. Elígela, ajusta el tamaño y haz clic en el lienzo para estamparla.
4. Anota autor, licencia y fuente en `img/LEEME.md`. Verifica la licencia de cada recurso: algunas (CC-BY) exigen dar crédito.

## Estructura

```
taller-creativo/
├── index.html
├── css/
│   └── styles.css
├── img/
│   └── LEEME.md            # registro de créditos de las imágenes
└── js/
    ├── almacenamiento.js   # guardado local (localStorage)
    ├── catalogo.js         # lista de imágenes de img/
    ├── dibujo.js           # lienzo, herramientas, texto e imágenes
    ├── escritura.js        # editor de historias
    └── app.js              # pestañas e inicio
```

## Ideas para seguir

- Mascota propia que dé consejos (con arte original o de licencia libre, como CC0).
- Más sellos y fondos (OpenGameArt, Kenney.nl, OpenClipart).
- Varias historias guardadas y una galería de dibujos (IndexedDB).
- Animaciones sencillas con los dibujos.
- Sonidos y música libres de derechos.
- Versión instalable (PWA) para usar sin conexión.

## Notas

- Los emojis de los sellos dependen del sistema operativo; si quieres un aspecto idéntico en todos lados, sustitúyelos por imágenes propias.
- `document.execCommand` (usado en el editor) está en desuso pero funciona en todos los navegadores. Más adelante se puede migrar a Quill o TipTap.
