/* Almacenamiento sencillo sobre localStorage (con protección ante errores). */
const Almacen = {
  prefijo: 'tallerCreativo.',

  guardar(clave, valor) {
    try {
      localStorage.setItem(this.prefijo + clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.warn('No se pudo guardar', clave, e);
      return false;
    }
  },

  cargar(clave, porDefecto = null) {
    try {
      const crudo = localStorage.getItem(this.prefijo + clave);
      return crudo === null ? porDefecto : JSON.parse(crudo);
    } catch (e) {
      return porDefecto;
    }
  },

  borrar(clave) {
    try { localStorage.removeItem(this.prefijo + clave); } catch (e) { /* nada */ }
  }
};
