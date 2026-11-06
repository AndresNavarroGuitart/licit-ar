/* Archivos que sube la persona: el contenido se guarda en este navegador (IndexedDB) y en el estado queda solo la ficha.
   Nada sale de la computadora. Si el navegador no deja guardar, la ficha queda marcada "sin contenido". */
(function () {
  var NOMBRE = 'licitar-archivos', TABLA = 'f', MAX = 50 * 1024 * 1024;
  var abierta;

  function abrir() {
    if (!abierta) abierta = new Promise(function (ok, mal) {
      if (!window.indexedDB) return mal(new Error('sin IndexedDB'));
      var rq = indexedDB.open(NOMBRE, 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore(TABLA); };
      rq.onsuccess = function () { ok(rq.result); };
      rq.onerror = function () { mal(rq.error); };
    });
    return abierta;
  }
  function tx(modo, fn) {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var t = db.transaction(TABLA, modo), r = fn(t.objectStore(TABLA));
        t.oncomplete = function () { ok(r && r.result); };
        t.onerror = t.onabort = function () { mal(t.error); };
      });
    });
  }

  var A = Store.archivos = {
    MAX: MAX,
    /* guarda el archivo y devuelve su ficha; nunca falla: sin lugar en el navegador, la ficha dice "sinContenido" */
    guardar: function (file) {
      var meta = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre: file.name, tam: file.size, tipo: file.type || '', fecha: new Date().toISOString().slice(0, 10) };
      if (file.size > MAX) { meta.sinContenido = true; return Promise.resolve(meta); }
      return tx('readwrite', function (st) { return st.put(file, meta.id); }).then(function () { return meta; }, function () { meta.sinContenido = true; return meta; });
    },
    obtener: function (id) { return tx('readonly', function (st) { return st.get(id); }); },
    borrar: function (id) { return id ? tx('readwrite', function (st) { return st.delete(id); }).catch(function () {}) : Promise.resolve(); },
    vaciar: function () { return tx('readwrite', function (st) { return st.clear(); }).catch(function () {}); },
    /* abre el archivo en otra pestaña si el navegador lo muestra (PDF, imagen, texto); si no, lo descarga */
    abrir: function (id, nombre) {
      var visible = /\.(pdf|png|jpe?g|gif|webp|txt)$/i.test(nombre || '');
      var ventana = visible ? window.open('', '_blank') : null;
      return A.obtener(id).then(function (blob) {
        if (!blob) { if (ventana) ventana.close(); return UI.toast('El contenido de este archivo no está guardado en este navegador.'); }
        var url = URL.createObjectURL(blob);
        if (ventana) { ventana.location = url; return; }
        var a = document.createElement('a'); a.href = url; a.download = nombre || 'archivo'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      }, function () { if (ventana) ventana.close(); UI.toast('No se pudo abrir el archivo.'); });
    },
    tam: function (b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  };

  /* al restablecer la demo también se borran los archivos guardados */
  var reset = Store.reset;
  Store.reset = function () { A.vaciar(); return reset.apply(this, arguments); };
})();
