/* Onboarding: paso a paso desde cargar la empresa hasta presentar. Cada paso se tilda solo según lo que ya está cargado. */
(function () {
  var esc = UI.esc;
  var V = window.Views = window.Views || {};

  function ob() { var s = Store.get(); s.onb = s.onb || {}; s.onb.hechos = s.onb.hechos || {}; return s.onb; }
  function corto(e) { return (e.razon || 'Nueva sociedad').replace(/\s*\(ficticia\)\s*/i, ''); }
  function barra(pct) { return '<div class="bar wide" style="margin-top:6px"><i class="' + (pct >= 80 ? 'ok' : pct >= 40 ? '' : 'warn') + '" style="width:' + pct + '%"></i></div>'; }

  function empSel() { var s = Store.get(); return Store.empresaById(ob().empId) || s.empresas[0]; }
  /* todavía no se elige licitación: los pasos 4 a 8 siguen la primera de la empresa que no esté presentada */
  function licSel(emp) {
    var ls = Store.licsDeEmpresa(emp.id);
    return ls.filter(function (x) { return !x.presentada; })[0] || ls[0] || null;
  }

  /* grupos de datos de la sociedad, en el orden de Mi empresa */
  function grupos(e) {
    var out = [], idx = {};
    Store.CAMPOS.forEach(function (f) { if (idx[f[0]] == null) { idx[f[0]] = out.length; out.push({ g: f[0], campos: [] }); } out[idx[f[0]]].campos.push(f); });
    out.forEach(function (g) { g.faltan = g.campos.filter(function (f) { var v = Store.valorCampo(e, f); return v === '' || v == null; }); });
    return out;
  }

  /* documentos que hay que tener: los que piden sus licitaciones o, si todavía no presenta ninguna, todos los que suelen pedirse */
  function docsBase(e) {
    var todos = Store.catalogoDocs(e.id), propios = todos.filter(function (x) { return x.propio; });
    return { relevantes: propios.length ? propios : todos, otros: propios.length ? todos.filter(function (x) { return !x.propio; }) : [] };
  }

  /* el estado de cada paso se calcula con lo que hay cargado; dos pasos (revisar el resumen y cargar la oferta) los marca la persona */
  function pasos(e, l) {
    var c = Store.completitud(e), db = docsBase(e), ls = Store.licsDeEmpresa(e.id), h = ob().hechos, hk = function (k) { return !!(l && h[l.id + ':' + k]); };
    var p = l ? Store.progress(l) : { total: 0, done: 0, pct: 0 }, bloq = l && l.requisitos.length ? Store.bloqueantes(l).length : 0;
    return [
      { id: 'datos', t: 'Cargá los datos de tu empresa', done: c.llenos === c.total, nota: c.llenos + ' de ' + c.total + ' datos' },
      { id: 'docs', t: 'Subí los documentos de tu empresa', done: db.relevantes.length > 0 && db.relevantes.every(function (x) { return Store.tieneDoc(e.id, x.tipo); }), nota: db.relevantes.filter(function (x) { return Store.tieneDoc(e.id, x.tipo); }).length + ' de ' + db.relevantes.length + ' documentos' },
      { id: 'pliego', t: 'Subí el pliego de la licitación', done: ls.length > 0, nota: ls.length ? ls.length + ' licitación(es)' : 'Sin licitaciones' },
      { id: 'resumen', t: 'Revisá el resumen del pliego', done: hk('resumen'), manual: true, nota: l ? (hk('resumen') ? 'Revisado' : 'Pendiente') : 'Falta el pliego' },
      { id: 'reqs', t: 'Reuní lo que pide el pliego', done: !!l && p.total > 0 && p.done === p.total, nota: l ? p.done + ' de ' + p.total + ' requisitos' : 'Falta el pliego' },
      { id: 'oferta', t: 'Cargá tu oferta', done: hk('oferta'), manual: true, nota: l ? (hk('oferta') ? 'Cargada' : 'Pendiente') : 'Falta el pliego' },
      { id: 'revision', t: 'Revisá antes de presentar', done: !!l && p.total > 0 && p.pct === 100 && bloq === 0, nota: l ? (bloq ? bloq + ' punto(s) a resolver' : p.pct === 100 ? 'Sin puntos bloqueantes' : 'Faltan requisitos') : 'Falta el pliego' },
      { id: 'presentar', t: 'Presentá y seguí el proceso', done: !!l && !!l.presentada, nota: l ? (l.presentada ? 'Presentada' : 'Sin presentar') : 'Falta el pliego' }
    ];
  }

  /* resumen para el menú */
  V.onbResumen = function () {
    var e = empSel(), l = licSel(e), ps = pasos(e, l);
    return { hechos: ps.filter(function (x) { return x.done; }).length, total: ps.length };
  };

  function bloque(titulo, html) { return '<div class="ob-b"><h4>' + esc(titulo) + '</h4>' + html + '</div>'; }
  function lista(items, ordenada) { var t = ordenada ? 'ol' : 'ul'; return '<' + t + ' class="ob-list">' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</' + t + '>'; }
  function btn(txt, href, primary) { return '<a class="btn' + (primary ? ' primary' : '') + '" href="' + href + '">' + txt + '</a>'; }
  function sinLic() { return '<div class="ob-aviso">Todavía no hay una licitación de esta empresa. Hacé primero el paso 3: subí el pliego.</div>'; }
  function marcar(l, k, done, txtOk, txtNo) {
    return '<button class="btn' + (done ? '' : ' primary') + '" data-act="onb-hecho" data-lid="' + l.id + '" data-k="' + k + '">' + (done ? '✓ ' + txtOk + ' (deshacer)' : txtNo) + '</button>';
  }

  function filaDoc(x, e) {
    var tiene = Store.tieneDoc(e.id, x.tipo);
    var quien = x.pedido.map(function (p) { return '<a href="#/l/' + p.lic.id + '/requisitos">' + esc(p.lic.nro) + '</a>'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + (x.extra ? (x.pedido.length ? ' · ' : '') + esc(x.extra) : '');
    return '<div class="row sb" style="padding:9px 0;border-bottom:1px solid var(--line);gap:12px"><div style="flex:1;min-width:0"><div class="ink" style="font-weight:600"><span style="color:' + (tiene ? 'var(--ok)' : 'var(--bad)') + '">' + (tiene ? '✓' : '×') + '</span> ' + esc(x.nombre) + '</div>' + (quien ? '<div class="muted" style="font-size:12.5px">Lo piden: ' + quien + '</div>' : '') + '</div>' +
      (tiene ? UI.pill('Cargado', 'ok') : '<label class="btn sm primary">Cargar<input type="file" class="hide" data-newtipo="' + x.tipo + '" data-eid="' + e.id + '"></label>') + '</div>';
  }

  /* contenido de cada paso */
  function contenido(id, e, l) {
    var T = l ? Store.T(l) : null;
    if (id === 'datos') {
      var gs = grupos(e);
      var cuerpo = gs.map(function (g) {
        var ok = !g.faltan.length;
        return '<div class="ob-g"><div class="row sb"><span class="ink" style="font-weight:600"><span style="color:' + (ok ? 'var(--ok)' : 'var(--bad)') + '">' + (ok ? '✓' : '×') + '</span> ' + esc(g.g) + '</span><span class="muted" style="font-size:12.5px">' + (g.campos.length - g.faltan.length) + '/' + g.campos.length + '</span></div>' +
          (ok ? '' : '<div class="grid cols-eq" style="gap:14px;margin-top:10px">' + g.faltan.map(function (f) { return V.campoEmp(e, f); }).join('') + '</div>') + '</div>';
      }).join('');
      return bloque('Qué tenés que hacer', lista(['Completá los datos de la sociedad. Los pliegos los piden en cartas de presentación, declaraciones juradas y formularios, y Licit.AR los redacta solos con lo que cargues acá.', 'Lo que falta aparece abajo para completar en este mismo lugar; se guarda al salir del campo.'])) +
        bloque('Qué información necesitás', '<p class="muted" style="margin:0 0 8px;font-size:13px">Razón social y CUIT, domicilio y contacto, representante y poder, beneficiarios finales y origen de fondos, balances e indicadores, ventas y experiencia.</p>' + cuerpo) +
        '<div class="ob-acc">' + btn('Abrir Mi empresa', '#/empresa/' + e.id) + '</div>';
    }
    if (id === 'docs') {
      var db = docsBase(e);
      return bloque('Qué tenés que hacer', lista(['Subí cada documento de la empresa con su fecha de vencimiento, así Licit.AR avisa si alguno vence antes de la apertura.', 'Lo que ya está cargado se reutiliza en todas las licitaciones de esta empresa.', 'En la versión real se leen los archivos y se extraen sus datos. Acá se guarda solo el nombre del archivo.'])) +
        bloque(db.otros.length ? 'Documentos que piden sus licitaciones' : 'Documentos que suelen pedir los pliegos', db.relevantes.map(function (x) { return filaDoc(x, e); }).join('')) +
        (db.otros.length ? '<details class="ob-b"><summary class="muted" style="cursor:pointer">Otros documentos que piden pliegos cargados (' + db.otros.length + ')</summary>' + db.otros.map(function (x) { return filaDoc(x, e); }).join('') + '</details>' : '') +
        '<div class="ob-acc">' + btn('Abrir Mi empresa', '#/empresa/' + e.id) + '</div>';
    }
    if (id === 'pliego') {
      var ls = Store.licsDeEmpresa(e.id);
      return bloque('Qué tenés que hacer', lista(['Entrá a Nueva licitación y elegí el tipo: concesión, licitación internacional o comparación de precios. En la versión real se detecta solo.', 'Arrastrá el pliego y todos sus anexos.', 'Licit.AR arma la estructura: requisitos, fechas, sobres y qué hay que preparar.'], true)) +
        bloque('Qué archivos subir', lista(['Pliego general, bases y condiciones', 'Especificaciones técnicas', 'Circulares aclaratorias', 'Planillas y formularios modelo', 'Todos los anexos', '<span class="muted">Formatos: PDF, Word o Excel.</span>'])) +
        bloque('Licitaciones de esta empresa', ls.length ? ls.map(function (x) { var est = UI.estadoLic[x.estado]; return '<a class="lic" style="grid-template-columns:1fr auto" href="#/l/' + x.id + '/pliego"><div><div class="nro">' + esc(x.nro) + '</div><div class="t" style="font-size:15px">' + esc(x.titulo) + '</div></div>' + UI.pill(est[0], est[1]) + '</a>'; }).join('') : '<p class="muted" style="margin:0">Todavía no presenta ninguna.</p>') +
        '<div class="ob-acc">' + btn('Subir un pliego', '#/nueva', true) + '</div>';
    }
    if (!l) return sinLic() + '<div class="ob-acc">' + btn('Subir un pliego', '#/nueva', true) + '</div>';
    /* un pliego recién subido que todavía no tiene requisitos leídos */
    if (!l.requisitos.length && id !== 'resumen') return '<div class="ob-aviso">El pliego de ' + esc(l.nro) + ' todavía se está analizando: cuando termine vas a ver acá los requisitos y la oferta.</div>';
    var base = '#/l/' + l.id + '/';
    if (id === 'resumen') {
      var ap = l.fechas && l.fechas.apertura, dias = ap ? Store.daysLeft(ap) : null;
      return bloque('Qué tenés que hacer', lista(['Abrí la pestaña Pliego: ahí está el resumen con los pasos a completar, las condiciones y los plazos generales.', 'Confirmá que la empresa que presenta sea la correcta.', 'Anotá la fecha de apertura y las fechas de consultas y visita: son las que no se pueden mover.'], true)) +
        bloque('Lo que tenés que mirar', '<div class="ob-kv"><span class="muted">Licitación</span><b>' + esc(l.nro) + '</b><span class="muted">Tipo</span><b>' + esc(T.nombre) + '</b><span class="muted">Organismo</span><b>' + esc(l.organismo || '—') + '</b><span class="muted">Apertura</span><b>' + UI.date(ap) + (dias != null ? ' · ' + (dias >= 0 ? 'faltan ' + dias + ' d' : 'ya pasó') : '') + '</b><span class="muted">Presenta</span><b>' + esc(corto(e)) + '</b></div>') +
        '<div class="ob-acc">' + btn('Abrir el resumen del pliego', base + 'pliego', true) + marcar(l, 'resumen', ob().hechos[l.id + ':resumen'], 'Revisado', 'Marcar como revisado') + '</div>';
    }
    if (id === 'reqs') {
      var p = Store.progress(l), pend = Store.reqs(l).filter(function (r) { return !r.opcional && r.estado !== 'listo'; });
      return bloque('Qué tenés que hacer', lista(['En Requisitos ves todo lo que pide el pliego y la fuente de cada punto.', 'Usá “Completar con los datos de Mi empresa” para adjuntar de una vez los documentos que ya tiene y copiar los datos financieros y de experiencia.', 'Adjuntá o subí lo que falte y redactá las notas y declaraciones con las plantillas del Armado.'], true)) +
        bloque('Avance: ' + p.done + ' de ' + p.total + ' requisitos listos', barra(p.pct) + (pend.length ? '<div style="margin-top:10px">' + pend.slice(0, 8).map(function (r) { return '<div class="ob-pend"><span style="color:var(--bad)">×</span> <span>' + esc(r.titulo) + (r.docTipo && UI.tipoDoc[r.docTipo] ? ' <span class="tag">' + esc(UI.tipoDoc[r.docTipo]) + '</span>' : '') + '</span></div>'; }).join('') + (pend.length > 8 ? '<p class="muted" style="margin:8px 0 0;font-size:13px">y ' + (pend.length - 8) + ' más en Requisitos.</p>' : '') + '</div>' : '<p style="margin:10px 0 0">Todos los requisitos están listos.</p>')) +
        '<div class="ob-acc"><button class="btn primary" data-act="onb-completar" data-lid="' + l.id + '"' + (l.presentada && !l.editable ? ' disabled' : '') + '>Completar con los datos de Mi empresa</button>' + btn('Ver requisitos', base + 'requisitos') + btn('Ir al armado', base + 'armado') + '</div>';
    }
    if (id === 'oferta') {
      var que = { canon: 'Definí el canon, el plan de inversiones y los plazos. Los indicadores y las garantías se calculan solos.', lotes: 'Cotizá cada lote: precios unitarios, servicios conexos y plazo de entrega. Verificá la validez de la oferta.', servicio: 'Completá la propuesta económica y los puntos técnicos que suman en la evaluación.' }[T.oferta] || 'Completá los valores de tu oferta.';
      return bloque('Qué tenés que hacer', lista([que, 'Revisá que los importes coincidan con los formularios y con la garantía de oferta.', 'Cuando esté lista, marcá el paso.'], true)) +
        bloque('Qué información necesitás', lista(['Precios, importes y plazos de tu propuesta', 'Moneda y validez de la oferta', 'Datos para las garantías que pida el pliego'])) +
        '<div class="ob-acc">' + btn('Abrir la oferta', base + 'oferta', true) + marcar(l, 'oferta', ob().hechos[l.id + ':oferta'], 'Oferta cargada', 'Marcar como cargada') + '</div>';
    }
    if (id === 'revision') {
      var ch = Store.checks(l), malos = ch.filter(function (x) { return x.ok === 'bad'; }), avisos = ch.filter(function (x) { return x.ok === 'warn'; });
      return bloque('Qué tenés que hacer', lista(['Abrí Revisión: controla requisitos, vencimientos de documentos, garantías y las reglas del pliego.', 'Resolvé los puntos en rojo: son los que pueden dejar la oferta fuera.', 'Mirá los avisos en amarillo y decidí si hace falta corregir algo.'], true)) +
        bloque('Resultado de la revisión', '<div class="row" style="gap:8px;flex-wrap:wrap">' + UI.pill(malos.length + ' a resolver', malos.length ? 'bad' : 'ok') + UI.pill(avisos.length + ' aviso(s)', avisos.length ? 'warn' : 'ok') + '</div>' +
          (malos.concat(avisos).slice(0, 6).map(function (x) { return '<div class="ob-pend"><span style="color:var(--' + (x.ok === 'bad' ? 'bad' : 'warn') + ')">' + (x.ok === 'bad' ? '×' : '!') + '</span> <span>' + esc(x.titulo) + '</span></div>'; }).join(''))) +
        '<div class="ob-acc">' + btn('Abrir la revisión', base + 'revision', true) + btn('Ir al armado final', base + 'entrega') + '</div>';
    }
    /* presentar */
    var rest = Store.ETAPAS.filter(function (x) { return x.n >= 4; });
    return bloque('Qué tenés que hacer', lista(['En Presentación revisá el contenido final, con el orden y las páginas que define el pliego.', 'Completá el control final y descargá el documento a entregar (HTML para pasar a PDF, Word o el índice en CSV).', 'Entregalo como pide el pliego, en el plazo y con la garantía si corresponde.', 'Registrá la entrega: la licitación queda presentada y en solo lectura para no tocar nada por error.'], true)) +
      bloque('Después de presentar', '<p class="muted" style="margin:0 0 8px;font-size:13px">Seguimiento lleva los plazos del pliego para cada etapa:</p>' + lista(rest.map(function (x) { return '<b>' + esc(x.t) + '.</b> ' + esc(x.d); }))) +
      (l.presentada ? '<div class="ob-aviso ok">Esta licitación ya está presentada.</div>' : '') +
      '<div class="ob-acc">' + btn('Abrir el armado final', base + 'entrega', !l.presentada) + btn('Ver pliego completo', base + 'paquete') + btn('Abrir el seguimiento', base + 'seguimiento', l.presentada) + '</div>';
  }

  V.onboarding = function (n) {
    var S = Store.get(), e = empSel(), l = licSel(e), ps = pasos(e, l);
    var hechos = ps.filter(function (x) { return x.done; }).length, pct = Math.round(100 * hechos / ps.length);
    /* todos los pasos arrancan cerrados: se abre el que indica la ruta (#/onboarding/3) */
    var i = n >= 1 && n <= ps.length ? n - 1 : -1;

    var selEmp = '<div class="row wrap" style="gap:12px;align-items:flex-end"><label class="f" style="flex:1;min-width:220px;max-width:420px">Empresa<select data-onbemp>' + S.empresas.map(function (x) { return '<option value="' + x.id + '"' + (x.id === e.id ? ' selected' : '') + '>' + esc(corto(x)) + '</option>'; }).join('') + '</select></label>' +
      '<a class="btn" href="#/empresa/' + e.id + '">Ir a Mi empresa</a></div>';

    /* cada paso despliega su contenido justo debajo */
    var items = ps.map(function (x, k) {
      var abierto = k === i;
      var nav = '<div class="row sb ob-nav">' + (k > 0 ? '<a class="btn" href="#/onboarding/' + k + '">← Paso anterior</a>' : '<span></span>') +
        (k < ps.length - 1 ? '<a class="btn primary" href="#/onboarding/' + (k + 2) + '">Siguiente paso →</a>' : '<a class="btn primary" href="#/">Ir a mis licitaciones</a>') + '</div>';
      return '<div class="card ob-item' + (abierto ? ' on' : '') + (x.done ? ' done' : '') + '">' +
        '<a class="ob-s" href="#/onboarding/' + (abierto ? 'cerrar' : k + 1) + '" aria-expanded="' + abierto + '"><span class="ob-n">' + (x.done ? '✓' : (k + 1)) + '</span><span class="ob-t"><b>' + esc(x.t) + '</b><small>' + esc(x.nota) + '</small></span>' + (x.done ? UI.pill('Listo', 'ok') : UI.pill('Pendiente', 'warn')) + '<span class="chev" aria-hidden="true"></span></a>' +
        (abierto ? '<div class="ob-body">' + contenido(x.id, e, l) + nav + '</div>' : '') + '</div>';
    }).join('');

    return '<div class="head"><div><h1>Onboarding</h1><p>Paso a paso, desde cargar tu empresa hasta presentar la oferta. Cada paso se tilda solo según lo que ya cargaste.</p></div></div>' +
      '<div class="card pad ob-top">' + selEmp + '<div style="margin-top:14px"><div class="row sb"><span class="ink" style="font-weight:600">' + hechos + ' de ' + ps.length + ' pasos listos</span><span class="muted">' + pct + '%</span></div>' + barra(pct) + '</div></div>' +
      '<div class="ob">' + items + '</div>';
  };
})();
