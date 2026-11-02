/* Mi empresa: varias sociedades, con los datos y documentos que piden los pliegos para usarlos de base. */
(function () {
  var esc = UI.esc;
  var V = window.Views = window.Views || {};

  /* qué grupos de datos están abiertos: se conserva al volver a dibujar la pantalla tras editar un campo */
  var empOpen = {};
  document.addEventListener('toggle', function (ev) { var d = ev.target; if (d && d.dataset && d.dataset.g) empOpen[d.dataset.g] = d.open; }, true);

  function corto(e) { return (e.razon || 'Nueva sociedad').replace(/\s*\(ficticia\)\s*/i, ''); }

  function pillDoc(d) {
    var e = Store.docEstado(d);
    return e === 'vencido' ? UI.pill('Vencido', 'bad') : e === 'sin-vto' ? UI.pill('Sin vencimiento', 'muted') : Store.daysLeft(d.vence) <= 30 ? UI.pill('Vence en ' + Store.daysLeft(d.vence) + ' d', 'warn') : UI.pill('Vigente', 'ok');
  }

  function barra(pct) { return '<div class="bar wide" style="margin-top:4px"><i class="' + (pct >= 80 ? 'ok' : pct >= 40 ? '' : 'warn') + '" style="width:' + pct + '%"></i></div>'; }

  function tarjeta(e, sel) {
    var c = Store.completitud(e), n = Store.licsDeEmpresa(e.id).length;
    return '<a class="card pad emp-card' + (e.id === sel ? ' on' : '') + '" href="#/empresa/' + e.id + '"><div class="ink" style="font-weight:600;font-size:15px">' + esc(corto(e)) + '</div><div class="muted" style="font-size:12.5px">' + esc(e.cuit || 'Sin CUIT o NIF') + ' · ' + esc((e.domicilio || '').split(',').slice(-2)[0] || 'Sin domicilio').trim() + '</div>' +
      '<div style="margin-top:10px;font-size:12.5px" class="row sb"><span class="muted">Datos</span><b class="ink">' + c.llenos + '/' + c.total + '</b></div>' + barra(c.datosPct) +
      '<div style="margin-top:8px;font-size:12.5px" class="row sb"><span class="muted">Documentos que piden los pliegos</span><b class="ink">' + c.docsTiene + '/' + c.docsTotal + '</b></div>' + barra(c.docsPct) +
      '<div class="muted" style="margin-top:8px;font-size:12.5px">' + n + ' licitación(es)</div></a>';
  }

  /* x: atributos extra para el campo (por ejemplo, el borrador abierto que se actualiza al guardar) */
  function campo(e, c, x) {
    var v = Store.valorCampo(e, c), attr = (x || '') + ' ' + (c[4] === 'fin' ? 'data-empfin' : 'data-emp'), type = c[4] === 'email' ? 'email' : (c[4] === 'fin' || c[4] === 'num') ? 'number' : 'text';
    var inp = c[4] === 'area' ? '<textarea rows="3" ' + attr + '="' + c[1] + '" data-eid="' + e.id + '">' + esc(v == null ? '' : v) + '</textarea>'
      : '<input type="' + type + '" ' + (type === 'number' ? 'min="0" step="any" ' : '') + attr + '="' + c[1] + '" data-eid="' + e.id + '" value="' + esc(v == null ? '' : v) + '">';
    return '<label class="f"' + (c[4] === 'area' ? ' style="grid-column:1/-1"' : '') + '>' + esc(c[2]) + inp + '<span style="font-weight:400;font-size:12px">Lo piden: ' + esc(c[3]) + '</span></label>';
  }

  V.campoEmp = campo;

  V.empresa = function (id) {
    var S = Store.get(), sel = Store.empresaById(id) || S.empresas[0], c = Store.completitud(sel), lics = Store.licsDeEmpresa(sel.id), docs = Store.docsDeEmpresa(sel.id);

    var cards = S.empresas.map(function (e) { return tarjeta(e, sel.id); }).join('') +
      '<button class="card pad emp-card emp-add" data-act="add-empresa"><span style="font-size:26px;line-height:1">+</span><span class="ink" style="font-weight:600">Agregar empresa o sociedad</span><span class="muted" style="font-size:12.5px">Para presentar licitaciones con otra razón social</span></button>';

    /* datos, agrupados */
    var grupos = [], idx = {};
    Store.CAMPOS.forEach(function (f) { if (idx[f[0]] == null) { idx[f[0]] = grupos.length; grupos.push({ g: f[0], campos: [] }); } grupos[idx[f[0]]].campos.push(f); });
    var datos = grupos.map(function (g) {
      var llenos = g.campos.filter(function (f) { var v = Store.valorCampo(sel, f); return v !== '' && v != null; }).length, completo = llenos === g.campos.length, key = sel.id + '|' + g.g;
      var cab = '<summary class="bib-h"><span class="chev" aria-hidden="true"></span><span style="font-weight:700;font-size:16px;color:' + (completo ? 'var(--ok)' : 'var(--bad)') + '" aria-hidden="true">' + (completo ? '✓' : '×') + '</span><span class="ink" style="font-weight:600">' + esc(g.g) + '</span><span class="muted" style="font-size:12.5px;margin-left:auto">' +
        (completo ? 'Completo' : 'Falta información') + ' · ' + llenos + '/' + g.campos.length + '</span></summary>';
      return '<details class="card bib" data-g="' + esc(key) + '"' + (empOpen[key] ? ' open' : '') + '>' + cab + '<div class="pad"><div class="grid cols-eq" style="gap:14px">' + g.campos.map(function (f) { return campo(sel, f); }).join('') + '</div></div></details>';
    }).join('');

    /* lo que piden los pliegos, contra lo que ya tiene la empresa */
    var fila = function (x) {
      var tiene = Store.tieneDoc(sel.id, x.tipo);
      var quien = x.pedido.map(function (p) { return '<a href="#/l/' + p.lic.id + '/requisitos">' + esc(p.lic.nro) + '</a>'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + (x.extra ? (x.pedido.length ? ' · ' : '') + esc(x.extra) : '');
      return '<div class="row sb" style="padding:10px 0;border-bottom:1px solid var(--line);gap:12px"><div style="flex:1;min-width:0"><div class="ink" style="font-weight:600"><span style="color:' + (tiene ? 'var(--ok)' : 'var(--bad)') + '">' + (tiene ? '✓' : '×') + '</span> ' + esc(x.nombre) + '</div><div class="muted" style="font-size:12.5px">Lo piden: ' + quien + '</div></div>' +
        (tiene ? UI.pill('Cargado', 'ok') : '<label class="btn sm primary">Cargar<input type="file" class="hide" data-newtipo="' + x.tipo + '" data-eid="' + sel.id + '"></label>') + '</div>';
    };
    var todos = Store.catalogoDocs(sel.id), propios = todos.filter(function (x) { return x.propio; }), otros = todos.filter(function (x) { return !x.propio; });
    var cat = (propios.length ? propios.map(fila).join('') : '<p class="muted" style="padding:10px 0">Esta empresa todavía no presenta licitaciones que pidan documentos.</p>') +
      (otros.length ? '<details style="margin-top:12px"><summary class="muted" style="cursor:pointer">Lo que piden otros pliegos cargados (' + otros.length + ')</summary>' + otros.map(fila).join('') + '</details>' : '');

    var tipos = Object.keys(Store.NOMBRE_DOC).map(function (k) { return '<option value="' + k + '">' + esc(Store.NOMBRE_DOC[k]) + '</option>'; }).join('');
    var filas = docs.map(function (d) {
      var usos = []; lics.forEach(function (l) { l.requisitos.forEach(function (r) { if (r.docId === d.id && usos.indexOf(l.id) < 0) usos.push(l.id); }); });
      var usoTxt = usos.map(function (lid) { var l = Store.lic(lid); return '<a href="#/l/' + lid + '/armado">' + esc(l.nro) + '</a>'; }).join(', ') || '<span class="muted">sin usar</span>';
      return '<tr><td><div class="ink" style="font-weight:600">' + esc(d.nombre) + '</div><div class="muted mono" style="font-size:12px">' + esc(d.archivo) + '</div></td><td><span class="tag">' + esc(UI.tipoDoc[d.tipo] || d.tipo) + '</span></td><td class="num">' + UI.date(d.vence) + '</td><td>' + pillDoc(d) + '</td><td style="font-size:13px">' + usoTxt + '</td>' +
        '<td class="right"><button class="btn sm ghost" data-act="del-doc" data-id="' + d.id + '" aria-label="Quitar documento">Quitar</button></td></tr>';
    }).join('');

    var misLics = lics.length ? lics.map(function (l) { var est = UI.estadoLic[l.estado]; return '<a class="lic" style="grid-template-columns:1fr auto" href="#/l/' + l.id + '/pliego"><div><div class="nro">' + esc(l.nro) + '</div><div class="t" style="font-size:15px">' + esc(l.titulo) + '</div></div>' + UI.pill(est[0], est[1]) + '</a>'; }).join('') : '<div class="empty">Todavía no presenta ninguna licitación.</div>';

    return '<div class="head"><div><h1>Mi empresa</h1><p>Cargá una vez los datos y documentos que piden los pliegos, y se usan de base para completar cada licitación. Podés tener más de una empresa o sociedad.</p></div></div>' +
      '<div class="emp-cards">' + cards + '</div>' +
      '<div class="row sb wrap" style="margin:26px 0 14px"><div><h2>' + esc(corto(sel)) + '</h2><p class="muted">Datos completos: ' + c.llenos + ' de ' + c.total + ' · Documentos que piden los pliegos: ' + c.docsTiene + ' de ' + c.docsTotal + '</p></div>' +
      '<button class="btn" data-act="del-empresa" data-id="' + sel.id + '">Eliminar esta empresa</button></div>' +
      '<h3 style="margin-bottom:10px">Datos de la sociedad</h3><p class="muted" style="margin:-4px 0 12px;font-size:13px">Cada campo indica en qué pliegos se pide. Los cambios se guardan al salir del campo.</p><div class="grid">' + datos + '</div>' +
      '<h3 style="margin:26px 0 10px">Documentos</h3><div class="grid cols-eq"><div class="card pad"><h3>Lo que piden sus pliegos</h3><p class="muted" style="margin:-4px 0 4px;font-size:13px">Según las licitaciones que presenta esta empresa. Los que faltan se pueden subir acá mismo.</p>' + cat + '</div>' +
      '<div class="card pad stack"><h3 style="margin:0">Subir otro documento</h3><label class="f">Tipo de documento<select id="tipo-emp-doc">' + tipos + '</select></label><label class="f">Vencimiento (si tiene)<input type="date" id="vence-emp-doc"></label>' +
      '<label class="btn primary">+ Elegir archivo<input type="file" class="hide" id="pick-emp-doc" data-eid="' + sel.id + '"></label><p class="muted" style="font-size:13px">Queda guardado en esta empresa y se ofrece al adjuntar documentos en sus licitaciones.</p></div></div>' +
      '<div class="card" style="margin-top:16px;overflow-x:auto"><table class="t"><thead><tr><th>Documento</th><th>Tipo</th><th>Vence</th><th>Estado</th><th>Se usa en</th><th></th></tr></thead><tbody>' + (filas || '<tr><td colspan="6" class="empty">Esta empresa todavía no tiene documentos.</td></tr>') + '</tbody></table></div>' +
      '<h3 style="margin:26px 0 10px">Licitaciones que presenta</h3><div class="card">' + misLics + '</div>';
  };
})();
