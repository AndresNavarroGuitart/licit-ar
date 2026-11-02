/* Vistas generales: licitaciones, nueva licitacion, biblioteca y datos de la empresa. */
(function () {
  var esc = UI.esc;
  var V = window.Views = window.Views || {};

  function kpi(v, l) { return '<div class="card kpi"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }

  /* ---------- lista de licitaciones, con buscador y filtro por estado ---------- */
  V.licQ = ''; V.licEstado = '';
  var ESTADOS = [['analisis', 'Por analizar'], ['preparacion', 'En preparación'], ['presentada', 'Presentada'], ['adjudicacion', 'Adjudicada'], ['ejecucion', 'En ejecución']];

  function ordenadas() { return Store.get().licitaciones.slice().sort(function (a, b) { return a.fechas.apertura < b.fechas.apertura ? -1 : 1; }); }

  function fila(l) {
    var p = Store.progress(l), est = UI.estadoLic[l.estado], u = UI.urgency(l.fechas.apertura), ro = !!l.presentada;
    var dl = ro
      ? '<div class="big past">Presentada</div><div class="muted">el ' + UI.date(l.fechas.apertura) + '</div>'
      : '<div class="big ' + (u === 'ok' ? '' : u) + '">' + UI.countdown(l.fechas.apertura) + '</div><div class="muted">' + UI.dateLong(l.fechas.apertura) + ' · ' + l.fechas.horaPres + ' h</div>';
    var prog = l.estado === 'analisis'
      ? '<span class="muted">Sin analizar</span>'
      : '<div class="bar"><i style="width:' + p.pct + '%"></i></div><div class="muted" style="margin-top:4px">' + p.done + ' de ' + p.total + ' requisitos</div>';
    return '<a class="lic" href="#/l/' + l.id + '/' + (l.estado === 'analisis' ? 'archivos' : 'pliego') + '">' +
      '<div><div class="nro">' + esc(l.nro) + ' · ' + esc(l.organismo) + '</div><div class="t">' + esc(l.titulo) + '</div>' +
      '<div class="row wrap" style="gap:8px">' + UI.pill(est[0], est[1]) + (ro ? '<span class="tag">🔒 Solo lectura · ver información</span>' : '') + '<span class="tag">🏢 ' + esc(Store.empresaDe(l).razon.replace(/\s*\(ficticia\)/, '')) + '</span><span class="tag">' + esc(l.tipo) + '</span>' + (l.estado === 'analisis' || l.resumenFijo && l.resumenFijo.total && !l.params ? '' : '<span class="tag">Etapa ' + Store.etapa(l) + ' · ' + esc(Store.ETAPAS[Store.etapa(l) - 1].t) + '</span>') + '<span class="tag">' + esc(l.ref.label) + ' ' + (l.ref.texto || UI.money(l.ref.monto)) + '</span></div></div>' +
      '<div>' + prog + '</div><div class="deadline">' + dl + '</div></a>';
  }

  V.licResultados = function () {
    var q = V.licQ.trim().toLowerCase();
    var ls = ordenadas().filter(function (l) {
      if (V.licEstado && l.estado !== V.licEstado) return false;
      return !q || [l.nro, l.titulo, l.organismo, l.tipo, l.expediente || '', UI.estadoLic[l.estado][0], Store.T(l).nombre || '', Store.empresaDe(l).razon].join(' ').toLowerCase().indexOf(q) > -1;
    });
    if (!ls.length) return '<div class="card empty">No hay licitaciones' + (q ? ' que coincidan con “' + esc(V.licQ) + '”' : '') + (V.licEstado ? ' en el estado “' + esc(UI.estadoLic[V.licEstado][0]) + '”' : '') + '.</div>';
    return '<div class="card">' + ls.map(fila).join('') + '</div>' + (q || V.licEstado ? '<p class="muted" style="margin-top:8px">' + ls.length + ' licitación(es).</p>' : '');
  };

  V.lista = function () {
    var S = Store.get(), ls = ordenadas();
    var activas = ls.filter(function (l) { return !l.presentada; });
    var prox = activas.filter(function (l) { return l.fechas.apertura && Store.daysLeft(l.fechas.apertura) >= 0; })[0];
    var garantias = activas.reduce(function (s, l) { return s + ((l.params && l.params.garantiaOferta) || 0); }, 0);
    var venc = S.biblioteca.filter(function (d) { var e = Store.docEstado(d); return e === 'vencido' || (d.vence && Store.daysLeft(d.vence) <= 15); }).length;
    var cuenta = function (e) { return ls.filter(function (l) { return !e || l.estado === e; }).length; };
    var chips = [['', 'Todas']].concat(ESTADOS).map(function (e) {
      return '<button class="chip ' + (V.licEstado === e[0] ? 'on' : '') + '" data-act="filtro-estado" data-e="' + e[0] + '">' + e[1] + ' <span style="opacity:.7">' + cuenta(e[0]) + '</span></button>';
    }).join('');

    return '<div class="head"><div><h1>Licitaciones</h1><p>Todo lo que estás armando o siguiendo. Las presentadas se pueden ver completas, en solo lectura.</p></div>' +
      '<a class="btn primary" href="#/nueva">+ Nueva licitación</a></div>' +
      '<div class="grid cols-4 kpis">' +
      kpi(activas.length, 'Por presentar') +
      kpi(prox ? Store.daysLeft(prox.fechas.apertura) + ' d' : '—', 'Hasta la próxima presentación') +
      kpi(UI.money(garantias), 'En garantías de oferta en dinero a constituir') +
      kpi(venc, 'Documentos por vencer o vencidos') + '</div>' +
      '<div class="card pad" style="margin-bottom:16px"><input type="text" id="buscar-lic" placeholder="Buscar por número, título, organismo o tipo…" value="' + esc(V.licQ) + '" aria-label="Buscar licitaciones"><div class="chips" style="margin:12px 0 0">' + chips + '</div></div>' +
      '<div id="lic-res">' + V.licResultados() + '</div>';
  };

  V.nueva = function (st) {
    st = st || { files: [], busy: false, step: 0 };
    var steps = ['Leyendo los archivos', 'Identificando requisitos y sobres', 'Extrayendo fechas y garantías', 'Armando el checklist y el índice del paquete'];
    var body;
    if (st.busy) {
      body = '<div class="card pad"><h3>Analizando el expediente…</h3><ul class="steps-an">' + steps.map(function (s, i) {
        var c = i < st.step ? 'done' : i === st.step ? 'doing' : '';
        return '<li class="' + c + '"><span class="dot">' + (i < st.step ? '✓' : '') + '</span>' + s + '</li>';
      }).join('') + '</ul></div>';
    } else {
      var files = st.files.map(function (f, i) {
        return '<div class="file"><div class="ic">PDF</div><div><div class="ink" style="font-weight:600">' + esc(f.name) + '</div><div class="muted">' + f.size + '</div></div><span></span><button class="btn sm ghost" data-act="rm-file" data-i="' + i + '">Quitar</button></div>';
      }).join('');
      body = '<label class="drop" id="drop"><input type="file" id="pick" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" class="hide">' +
        '<div class="big">Soltá acá el pliego y sus anexos</div><p class="muted" style="margin-top:6px">Pliego general, especificaciones técnicas, circulares, planillas modelo. PDF, Word o Excel.</p>' +
        '<span class="btn" style="margin-top:14px">Elegir archivos</span></label>' +
        (files ? '<div class="card" style="margin-top:16px">' + files + '</div>' : '') +
        '<div class="row" style="margin-top:16px"><button class="btn primary" data-act="analizar-nueva"' + (st.files.length ? '' : ' disabled') + '>Analizar y armar estructura</button><span class="muted">' + (st.files.length ? st.files.length + ' archivo(s)' : 'Cargá al menos el pliego general') + '</span></div>';
    }
    return '<a class="crumb" href="#/">← Licitaciones</a><div class="head"><div><h1>Nueva licitación</h1><p>Subí los archivos y el sistema arma la estructura: requisitos, fechas, sobres y el índice a presentar.</p></div></div>' +
      '<div class="banner info" style="margin-bottom:16px"><span>⚙</span><span><b>Preview:</b> el análisis está simulado. En la versión real un modelo de IA lee el pliego y cada requisito queda ligado al artículo y página de donde salió, para que lo puedas verificar.</span></div>' +
      (st.busy ? '' : '<div class="row wrap" style="margin-bottom:14px"><span class="muted">Tipo de licitación (en la versión real se detecta solo):</span>' + Object.keys(Store.TIPOS).map(function (k) {
        return '<button class="chip ' + ((st.tid || 'concesion') === k ? 'on' : '') + '" data-act="tipo-nueva" data-t="' + k + '">' + esc(Store.TIPOS[k].nombre) + '</button>';
      }).join('') + '</div>') + body;
  };

  /* ---------- biblioteca: los documentos de cada licitación, con buscador ---------- */
  V.bibQ = ''; V.bibEmp = '';

  function pillDoc(d, apertura) {
    var e = Store.docEstado(d, apertura);
    return e === 'vencido' ? UI.pill('Vencido', 'bad') : e === 'vence-antes' ? UI.pill('Vence antes de la apertura', 'warn') : e === 'sin-vto' ? UI.pill('Sin vencimiento', 'muted') : Store.daysLeft(d.vence) <= 15 ? UI.pill('Vence en ' + Store.daysLeft(d.vence) + ' d', 'warn') : UI.pill('Vigente', 'ok');
  }

  /* expediente, documentos de la biblioteca que cubren requisitos, archivos subidos y documentos propios de la licitación */
  function docsDe(l) {
    var rows = [], vistos = {};
    l.archivos.forEach(function (a) { rows.push({ kind: 'Pliego y anexos', nombre: a.nombre, archivo: a.tipo + (a.paginas && a.paginas !== '—' ? ' · ' + a.paginas + ' págs.' : ''), req: '', pill: UI.pill('Leído', 'ok'), vence: null, tipo: '' }); });
    Store.reqs(l).forEach(function (r) {
      var d = r.docId && Store.doc(r.docId);
      if (d) { vistos[d.id] = true; rows.push({ kind: 'Biblioteca', nombre: d.nombre, archivo: d.archivo, req: r.titulo, reqId: r.id, vence: d.vence, pill: pillDoc(d, l.fechas.apertura), docId: d.id, tipo: d.tipo }); }
      else if (r.archivo) rows.push({ kind: 'Subido', nombre: r.archivo, archivo: '', req: r.titulo, reqId: r.id, vence: null, pill: UI.pill('Subido', 'info'), tipo: '' });
    });
    Store.get().biblioteca.filter(function (d) { return d.licId === l.id && !vistos[d.id]; }).forEach(function (d) {
      rows.push({ kind: 'Biblioteca', nombre: d.nombre, archivo: d.archivo, req: '', vence: d.vence, pill: pillDoc(d, l.fechas.apertura), docId: d.id, tipo: d.tipo });
    });
    return rows;
  }
  V.docsDe = docsDe;

  V.bibResultados = function (filtro) {
    var S = Store.get(), q = V.bibQ.trim().toLowerCase(), usados = {}, grupos = [];
    var lics = S.licitaciones.filter(function (l) { return l.requisitos.length || l.archivos.length; });
    lics.forEach(function (l) { docsDe(l).forEach(function (r) { if (r.docId) usados[r.docId] = true; }); });
    var emp = function (id) { var e = Store.empresaById(id); return e ? e.razon.replace(/\s*\(ficticia\)/, '') : ''; };
    lics.forEach(function (l) { if ((!filtro || filtro === l.id) && (!V.bibEmp || l.empresaId === V.bibEmp)) grupos.push({ l: l, rows: docsDe(l) }); });
    if (!filtro || filtro === 'sin') {
      grupos.push({ l: null, rows: S.biblioteca.filter(function (d) { return !usados[d.id] && !d.licId && (!V.bibEmp || d.empId === V.bibEmp); }).map(function (d) {
        return { kind: 'Biblioteca', nombre: d.nombre, archivo: d.archivo, req: '', vence: d.vence, pill: pillDoc(d), docId: d.id, tipo: d.tipo, emp: emp(d.empId) };
      }) });
    }
    var total = 0, html = grupos.map(function (g) {
      var l = g.l, rows = g.rows.filter(function (r) {
        if (!q) return true;
        return [r.nombre, r.archivo, r.kind, r.req, UI.tipoDoc[r.tipo] || '', r.tipo || '', r.emp || '', l ? l.nro + ' ' + l.titulo + ' ' + emp(l.empresaId) : 'sin usar'].join(' ').toLowerCase().indexOf(q) > -1;
      });
      if (!rows.length && (q || !l)) return '';
      total += rows.length;
      var avisos = rows.filter(function (r) { return r.pill && (r.pill.indexOf('pill warn') > -1 || r.pill.indexOf('pill bad') > -1); }).length;
      var cab = '<summary class="bib-h"><span class="chev" aria-hidden="true"></span>' + (l
        ? '<div style="flex:1;min-width:0"><span class="ink" style="font-weight:600">' + esc(l.nro) + '</span> <span class="muted">· ' + esc(l.titulo.length > 70 ? l.titulo.slice(0, 69) + '…' : l.titulo) + '</span></div><div class="row"><span class="tag">🏢 ' + esc(emp(l.empresaId)) + '</span><span class="tag">' + esc(Store.T(l).corto || l.tipo) + '</span>'
        : '<div style="flex:1"><span class="ink" style="font-weight:600">Sin usar en ninguna licitación</span> <span class="muted">· reutilizables</span></div><div class="row">') +
        (avisos ? UI.pill(avisos + ' por vencer', 'warn') : '') + '<span class="muted" style="font-size:13px">' + rows.length + ' documento(s)</span></div></summary>';
      var filas = rows.map(function (r) {
        return '<tr><td><div class="ink" style="font-weight:600">' + esc(r.nombre) + '</div>' + (r.archivo ? '<div class="muted mono" style="font-size:12px">' + esc(r.archivo) + '</div>' : '') + '</td>' +
          '<td><span class="tag">' + esc(r.kind) + '</span>' + (r.tipo ? ' <span class="tag">' + esc(UI.tipoDoc[r.tipo] || r.tipo) + '</span>' : '') + (r.emp ? ' <span class="tag">🏢 ' + esc(r.emp) + '</span>' : '') + '</td>' +
          '<td>' + (r.req ? (l ? '<a href="#/l/' + l.id + '/armado">' + esc(r.req) + '</a>' : esc(r.req)) : '<span class="muted">—</span>') + '</td><td class="num">' + UI.date(r.vence) + '</td><td>' + r.pill + '</td></tr>';
      }).join('');
      var abierto = q || (filtro && filtro === (l && l.id)) || filtro === 'sin';
      return '<details class="card bib" style="margin-bottom:12px"' + (abierto ? ' open' : '') + '>' + cab + (rows.length ? '<div style="overflow-x:auto"><table class="t"><thead><tr><th>Documento</th><th>Origen</th><th>Requisito que cubre</th><th>Vence</th><th>Estado</th></tr></thead><tbody>' + filas + '</tbody></table></div>' : '<div class="empty">Esta licitación todavía no tiene documentos.</div>') + '</details>';
    }).join('');
    return (q && !total ? '<div class="card empty">No hay documentos que coincidan con “' + esc(V.bibQ) + '”.</div>' : html) +
      (q && total ? '<p class="muted" style="margin-top:-6px">' + total + ' resultado(s) para “' + esc(V.bibQ) + '”.</p>' : '');
  };

  V.biblioteca = function (filtro) {
    var S = Store.get(), lics = S.licitaciones.filter(function (l) { return l.requisitos.length || l.archivos.length; });
    var opts = '<option value="">Todas las licitaciones</option>' + lics.map(function (l) { return '<option value="' + l.id + '"' + (filtro === l.id ? ' selected' : '') + '>' + esc(l.nro) + '</option>'; }).join('') + '<option value="sin"' + (filtro === 'sin' ? ' selected' : '') + '>Sin usar en ninguna</option>';
    var tipos = Object.keys(UI.tipoDoc).map(function (k) { return '<option value="' + k + '">' + esc(UI.tipoDoc[k]) + ' · ' + k + '</option>'; }).join('');
    var propia = lics.filter(function (l) { return l.id === filtro; })[0];
    return '<div class="head"><div><h1>Documentos</h1><p>Los documentos de cada licitación: el expediente, lo que sacaste de la biblioteca y lo que subiste. Avisa cuando algo vence antes de la apertura.</p></div></div>' +
      '<div class="card pad" style="margin-bottom:16px"><div class="row wrap" style="gap:12px"><input type="text" id="buscar-bib" placeholder="Buscar por nombre, archivo, tipo, requisito o licitación…" value="' + esc(V.bibQ) + '" style="flex:2;min-width:240px" aria-label="Buscar documentos">' +
      '<select data-bibfiltro="1" style="flex:1;min-width:200px" aria-label="Licitación">' + opts + '</select>' +
      '<select data-bibemp="1" style="flex:1;min-width:200px" aria-label="Empresa"><option value="">Todas las empresas</option>' + S.empresas.map(function (e) { return '<option value="' + e.id + '"' + (V.bibEmp === e.id ? ' selected' : '') + '>' + esc(e.razon.replace(/\s*\(ficticia\)/, '')) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row wrap" style="margin-top:12px;gap:10px"><span class="muted" style="font-size:13px">Cargar documento' + (propia ? ' para ' + esc(propia.nro) : ' reutilizable de') + ':</span>' +
      (propia ? '' : '<select id="emp-doc" style="width:auto" aria-label="Empresa del documento">' + S.empresas.map(function (e) { return '<option value="' + e.id + '"' + ((V.bibEmp || S.empresas[0].id) === e.id ? ' selected' : '') + '>' + esc(e.razon.replace(/\s*\(ficticia\)/, '')) + '</option>'; }).join('') + '</select>') +
      '<select id="tipo-doc" style="width:auto" aria-label="Tipo de documento">' + tipos + '</select>' +
      '<label class="btn sm primary">+ Elegir archivo<input type="file" id="pick-doc" class="hide"></label></div></div>' +
      '<div id="bib-res">' + V.bibResultados(filtro) + '</div>';
  };

})();
