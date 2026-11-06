/* Panel "Cargar / editar" de un requisito o de un paso de las etapas: lo que hay que cargar (archivos), notas y estado, en el mismo lugar.
   Los archivos se guardan de verdad en este navegador (ver archivos.js). */
(function () {
  var esc = UI.esc;
  var V = window.Views = window.Views || {};

  /* dónde se guardan notas y archivos: en el propio requisito o en la "carga" de una tarea del seguimiento */
  V.cargaDe = function (l, kind, id) {
    var c;
    if (kind === 'r') c = l.requisitos.filter(function (r) { return r.id === id; })[0];
    else { var s = Store.seg(l); s.cargas = s.cargas || {}; c = s.cargas[id] = s.cargas[id] || { nota: '', fecha: '', archivos: [] }; }
    if (c && !c.archivos) c.archivos = [];
    return c;
  };

  V.tareaPorId = function (l, id) {
    var T = V.tareas(l), out;
    Object.keys(T).forEach(function (k) { T[k].forEach(function (t) { if (t.id === id) out = t; }); });
    return out;
  };

  function archivosBloque(kind, id, c, ro, titulo, ayuda) {
    var filas = c.archivos.map(function (a) {
      return '<div class="row sb" style="padding:9px 0;border-bottom:1px solid var(--line);gap:10px"><div style="min-width:0"><div class="ink" style="font-weight:600;overflow-wrap:anywhere">' + esc(a.nombre) + '</div><div class="muted" style="font-size:12.5px">' + Store.archivos.tam(a.tam) + ' · cargado el ' + UI.date(a.fecha) + (a.sinContenido ? ' · <span style="color:var(--bad)">sin contenido guardado</span>' : '') + '</div></div>' +
        '<div class="row" style="gap:6px;flex:none">' + (a.sinContenido ? '' : '<button class="btn sm" data-act="ver-archivo" data-fid="' + a.id + '" data-nombre="' + esc(a.nombre) + '">Abrir</button>') + (ro ? '' : '<button class="btn sm ghost" data-act="quitar-archivo" data-k="' + kind + '" data-id="' + esc(id) + '" data-fid="' + a.id + '">Quitar</button>') + '</div></div>';
    }).join('');
    return '<div class="ob-b"><h4>' + esc(titulo) + '</h4>' + (ayuda ? '<p class="muted" style="margin:0 0 6px;font-size:13px">' + ayuda + '</p>' : '') +
      (filas || '<p class="muted" style="margin:0 0 8px">Todavía no cargaste ningún archivo.</p>') +
      (ro ? '' : '<label class="btn sm primary" style="margin-top:8px">+ Agregar archivo<input type="file" multiple class="hide" data-cfile="' + kind + ':' + esc(id) + '"></label>') + '</div>';
  }

  function notaBloque(kind, id, c, ro) {
    return '<div class="ob-b"><h4>Notas</h4><textarea rows="3" data-cnota="' + kind + ':' + esc(id) + '" placeholder="Lo que tengas que recordar de este punto"' + (ro ? ' disabled' : '') + ' style="width:100%">' + esc(c.nota || '') + '</textarea></div>';
  }

  /* requisito */
  V.cargaReq = function (l, r) {
    var ro = Store.bloqueada(l), c = V.cargaDe(l, 'r', r.id), est = ['pendiente', 'en-curso', 'listo'];
    var chips = est.map(function (e) { return '<button class="chip ' + (r.estado === e ? 'on' : '') + '" data-act="req-estado" data-id="' + r.id + '" data-e="' + e + '"' + (ro ? ' disabled' : '') + '>' + UI.estadoReq[e][0] + '</button>'; }).join('');
    var main = '';
    if (r.origen === 'biblioteca') {
      var d = r.docId && Store.doc(r.docId);
      if (d) {
        var e = Store.docEstado(d, l.fechas.apertura);
        main = '<div class="ob-b"><h4>Documento adjunto</h4><div class="card pad" style="box-shadow:none"><div class="row sb wrap" style="gap:10px"><div style="min-width:0"><div class="ink" style="font-weight:600">' + esc(d.nombre) + '</div><div class="muted" style="font-size:12.5px">' + esc(d.archivo) + ' · Vence: ' + UI.date(d.vence) + '</div></div>' +
          '<div class="row wrap" style="gap:6px">' + (e === 'vencido' ? UI.pill('Vencido', 'bad') : e === 'vence-antes' ? UI.pill('Vence antes de la apertura', 'warn') : '') + (d.fileId ? '<button class="btn sm" data-act="ver-archivo" data-fid="' + d.fileId + '" data-nombre="' + esc(d.archivo) + '">Abrir</button>' : '') + (ro ? '' : '<button class="btn sm" data-act="adjuntar" data-id="' + r.id + '">Cambiar</button><button class="btn sm ghost" data-act="quitar-doc" data-id="' + r.id + '">Quitar</button>') + '</div></div></div></div>';
      } else {
        main = '<div class="ob-b"><h4>Documento</h4><p class="muted" style="margin:0 0 8px;font-size:13px">Elegí uno de Mi empresa o subí el archivo: queda guardado en la empresa para sus otras licitaciones.</p>' + (ro ? '' : '<div class="row wrap" style="gap:8px"><button class="btn sm primary" data-act="adjuntar" data-id="' + r.id + '">Adjuntar de Mi empresa</button><label class="btn sm">Subir archivo<input type="file" class="hide" data-newdoc="' + r.id + '"></label></div>') + '</div>';
      }
    } else if (r.origen === 'plantilla') {
      main = '<div class="ob-b"><h4>Borrador</h4><p class="muted" style="margin:0 0 8px;font-size:13px">' + (r.textoHtml ? 'El texto fue editado a mano.' : 'Redactado con los datos de Mi empresa y de la licitación.') + ' Podés completar los datos y retocar el texto.</p><button class="btn sm primary" data-act="borrador" data-id="' + r.id + '">Ver y editar el borrador</button></div>';
    } else if (r.origen === 'oferta' || r.origen === 'indicadores') {
      main = '<div class="ob-b"><h4>Se completa en la pestaña Oferta</h4><a class="btn sm primary" href="#/l/' + l.id + '/oferta" data-act="close">Ir a la oferta</a></div>';
    } else if (r.origen === 'anexo2') {
      main = '<div class="ob-b"><h4>Formulario con tus precios</h4><button class="btn sm primary" data-act="anexo2">Ver el formulario</button></div>';
    }
    var tituloArch = r.origen === 'externo' ? 'Archivos' : 'Archivos de respaldo';
    var ayuda = r.origen === 'externo' ? 'Subí lo que pide este punto. Si hay más de un archivo, agregalos todos.' : r.origen === 'plantilla' ? 'Por ejemplo, la versión firmada y escaneada.' : 'Opcional: lo que quieras guardar junto a este requisito.';
    return '<h2>' + esc(r.titulo) + '</h2><p class="muted" style="margin:0 0 6px">' + esc(UI.carpeta[r.carpeta]) + ' · ' + esc(r.grupo) + ' · ' + esc(UI.origen[r.origen]) + '</p><p style="margin:0 0 8px">' + esc(r.detalle) + '</p><div style="margin-bottom:6px">' + (r.src ? V.srcBtn(r.src) : '') + '</div>' +
      (ro ? '<div class="banner info" style="margin:10px 0"><span>🔒</span><span>La licitación está presentada: solo lectura. Habilitá la edición para cambiar algo.</span></div>' : '') +
      '<div class="ob-b"><h4>Estado</h4><div class="chips" style="margin:0">' + chips + '</div></div>' + main +
      archivosBloque('r', r.id, c, ro, tituloArch, ayuda) + notaBloque('r', r.id, c, ro) +
      '<div class="row" style="margin-top:20px"><button class="btn primary" data-act="close">Listo</button></div>';
  };

  /* paso de una etapa (seguimiento) */
  V.cargaTarea = function (l, id) {
    var t = V.tareaPorId(l, id);
    if (!t) return '<h2>Paso no encontrado</h2><button class="btn" data-act="close">Cerrar</button>';
    var c = V.cargaDe(l, 't', id), hecha = V.tareaHecha(l, t);
    var estado = t.auto !== undefined
      ? '<div class="ob-b"><h4>Estado</h4><p style="margin:0">' + UI.pill(hecha ? 'Hecho' : 'Pendiente', hecha ? 'ok' : 'warn') + ' <span class="muted" style="font-size:13px">Se marca solo según lo que ya cargaste.</span></p></div>'
      : '<div class="ob-b"><h4>Estado</h4><label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" data-ctarea="' + esc(id) + '"' + (hecha ? ' checked' : '') + '> Ya lo hice</label></div>';
    return '<h2>' + esc(t.t) + '</h2>' + (t.plazo ? '<p class="muted" style="margin:0 0 6px">' + esc(t.plazo) + '</p>' : '') + (t.fecha ? '<p style="margin:0 0 6px"><b>Fecha límite:</b> ' + UI.date(t.fecha) + '</p>' : '') + '<div style="margin-bottom:6px">' + (t.src || '') + '</div>' +
      estado + '<div class="ob-b"><h4>Fecha en que lo hiciste</h4><input type="date" data-cfecha="' + esc(id) + '" value="' + esc(c.fecha || '') + '" style="max-width:220px"></div>' +
      archivosBloque('t', id, c, false, 'Lo que cargaste', 'Comprobantes, constancias, el escrito presentado: lo que corresponda a este paso.') + notaBloque('t', id, c, false) +
      '<div class="row" style="margin-top:20px"><button class="btn primary" data-act="close">Listo</button></div>';
  };

  /* marcas que se ven en la fila: cantidad de archivos y si hay nota */
  V.cargaMarcas = function (c) {
    if (!c) return '';
    var n = (c.archivos || []).length;
    return (n ? '<span class="tag" title="Archivos cargados">📎 ' + n + '</span> ' : '') + (c.nota ? '<span class="tag" title="Tiene notas">✎ Nota</span> ' : '');
  };
})();
