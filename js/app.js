/* Punto de entrada: cambio de pestañas e inicio de los módulos. */
document.addEventListener('DOMContentLoaded', () => {
  Dibujo.iniciar();
  Escritura.iniciar();

  const pestanas = document.querySelectorAll('.pestana');
  const vistas = document.querySelectorAll('.vista');

  pestanas.forEach((p) => {
    p.addEventListener('click', () => {
      pestanas.forEach((x) => x.classList.toggle('activa', x === p));
      vistas.forEach((v) => v.classList.toggle('activa', v.id === 'vista-' + p.dataset.vista));
    });
  });
});
