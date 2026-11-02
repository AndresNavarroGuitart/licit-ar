/* Vistas de los tipos con oferta por lotes: licitacion internacional de bienes y comparacion de precios (BID). */
(function () {
  var esc = UI.esc, mon = Store.mon;
  var V = window.Views = window.Views || {};

  function s(doc, ref, pag, texto, mark) { return V.srcBtn({ doc: doc, ref: ref, pag: pag, texto: texto, mark: mark }); }
  function docDe(l) { return l.tid === 'lpi_bienes' ? 'Pliego LPI VUCE-564-LPI-B (BID)' : l.tid === 'cp_servicios' ? 'Pliego CP VUCE-642-CP-S (BID)' : 'Pliego CP VUCE-643-CP-B (BID)'; }
  function mini(a, b, c) { return '<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px"><div class="muted" style="font-size:12px">' + a + '</div><div class="serif" style="font-size:24px;color:var(--ink)">' + c + '</div><div class="muted" style="font-size:12.5px">' + b + '</div></div>'; }
  function num(label, attr, key, val, hint, extra) {
    return '<label class="f">' + label + '<input type="number" min="0" step="any" value="' + (val === 0 || val ? val : '') + '" placeholder="0" data-' + attr + '="' + key + '"' + (extra || '') + '>' + (hint ? '<span style="font-weight:400">' + hint + '</span>' : '') + '</label>';
  }
  function pillOk(ok, a, b) { return ok ? UI.pill(a, 'ok') : UI.pill(b, 'bad'); }

  /* ---------------- resumen ---------------- */
  V.resumenBid = function (l) {
    var T = Store.T(l), rs = Store.reqs(l), falta = rs.filter(function (r) { return r.estado !== 'listo'; }), fo = Store.folios(l), p = l.params, o = l.oferta, lpi = l.tid === 'lpi_bienes', doc = docDe(l);
    function cnt(k) { var a = rs.filter(function (r) { return r.carpeta === k; }); return a.filter(function (r) { return r.estado === 'listo'; }).length + '/' + a.length; }
    var minis = T.orden.map(function (k, i) { return mini('Parte ' + (i + 1), T.carpetas[k], cnt(k)); }).join('') + mini('Folios', lpi ? 'Original + 2 copias' : 'PDF único', fo.total);
    var ahora = falta.slice(0, 5).map(function (r) {
      return '<li><span class="i"></span><div style="flex:1"><div class="ink" style="font-weight:600">' + esc(r.titulo) + '</div><div class="muted" style="font-size:13px">' + esc(UI.origen[r.origen]) + ' · ' + r.folios + ' fol. ' + V.srcBtn(r.src) + '</div></div>' + UI.pill(UI.estadoReq[r.estado][0], UI.estadoReq[r.estado][1]) + '</li>';
    }).join('');
    var tot = Store.totalLotes(l);
    var mod = T.soportaUT ? '<div class="row wrap" style="margin:4px 0 16px"><span class="muted">Cómo se presenta:</span>' +
      '<button class="chip ' + (l.modalidad !== 'ut' ? 'on' : '') + '" data-act="modalidad" data-m="individual">Individual</button>' +
      '<button class="chip ' + (l.modalidad === 'ut' ? 'on' : '') + '" data-act="modalidad" data-m="ut">Conjunta (APCA / UT)</button>' +
      '<span class="muted" style="font-size:13px">' + (l.modalidad === 'ut' ? 'El líder cumple 60 % de cada requisito y los demás 20 %.' : 'Con APCA o UT se suma un formulario.') + '</span></div>' : '';

    var adj = lpi ? [
      ['Notificación de la adjudicación', 'Antes de que venza la validez de la oferta (' + p.validez + ' días)', s(doc, 'IAO 42.1', 21, 'Antes de la expiración del período de validez de las ofertas, el Comprador notificará por escrito al Oferente seleccionado que su oferta ha sido aceptada.', 'notificará por escrito')],
      ['Garantía de cumplimiento', p.pctGarantiaCumpl + ' % del contrato (' + mon(tot.base * p.pctGarantiaCumpl / 100, o.moneda) + ' si ganás todo), en ' + p.plazoGarantiaCumpl + ' días', s(doc, 'IAO 44.1', 22, 'Dentro de los veintiocho (28) días siguientes al recibo de la notificación de adjudicación de parte del Comprador, el Oferente seleccionado deberá presentar la Garantía de Cumplimiento del Contrato.', 'veintiocho (28) días')],
      ['Firma del convenio de contrato', p.plazoFirma + ' días desde que recibís el formulario', s(doc, 'IAO 43.2', 22, 'El Oferente seleccionado tendrá un plazo de 28 días después de la fecha de recibo del formulario del Convenio de Contrato para ejecutarlo, fecharlo y devolverlo al Comprador.', '28 días')],
      ['Anticipo', p.anticipoPct + ' % a los 30 días de la firma, contra una garantía del 100 % del anticipo', s(doc, 'CEC 16.1', 96, 'Anticipo: El veinte por ciento (20%) del monto total del Contrato se pagará dentro de los treinta (30) días siguientes a la firma del contrato.', 'veinte por ciento (20%)')],
      ['Entrega y pagos', 'Plazos de 300 y 180 días; 50 % contra entrega y 30 % con la recepción definitiva', s(doc, 'CEC 16.1', 97, 'Contra entrega: El cincuenta por ciento (50%) del monto total del contrato se pagará mediante presentación de factura, remito firmado, acta de recepción provisoria.', 'cincuenta por ciento (50%)')],
      ['Garantía de los bienes', '2 años; reparar o reemplazar en 60 días. Multa por demora: 1 % por semana, máximo 10 %', s(doc, 'CEC 28.3', 99, 'El período de validez de la Garantía será dos (2) Años.', 'dos (2) Años')]
    ] : [
      ['Notificación de la adjudicación', 'Antes de que venza la validez de la cotización (' + p.validez + ' días)', s(doc, 'Cláusula 33', 14, 'Antes de la expiración de la validez de la Cotización, el Comprador notificará por escrito la decisión de adjudicación del contrato al Proveedor cuya Cotización haya sido aceptada.', 'notificará por escrito')],
      ['Documentación para firmar', 'DNI del firmante y poder o estatuto', s(doc, 'Cláusula 34', 14, 'Documentación legal y administrativa: DNI del Firmante. Poder legal o estatuto, que acredite la capacidad del firmante para contraer obligaciones.', 'DNI del Firmante')],
      ['Garantía de cumplimiento', p.pctGarantiaCumpl + ' % del contrato, en ' + p.plazoGarantiaCumpl + ' días' + (l.tid === 'cp_servicios' ? ' (el modelo de contrato de VUCE-642 la marca "No aplica")' : ''), s(doc, 'Cláusula 34', 14, 'Dentro de los veintiocho (28) días siguientes al recibo de la notificación de adjudicación de parte del Comprador, el Oferente seleccionado deberá presentar la Garantía de Cumplimiento de Contrato.', 'veintiocho (28) días')],
      ['Entrega y recepción', 'Recepción en ' + p.recepcionDias + ' días hábiles; reemplazo de lo defectuoso en menos de 5 días', s(doc, 'Cláusula 38', 15, 'El Comprador expedirá el certificado de recepción y aceptación de cada lote en un plazo no mayor de siete (7) días hábiles a partir de la fecha de entrega.', 'siete (7) días hábiles')],
      ['Cobro', '100 % contra entrega; se paga dentro de los ' + p.pagoDias + ' días de la recepción', s(doc, 'Cláusula 39', 15, 'El Comprador abonará cada factura dentro de los diez (10) días a partir de la fecha de recepción y aceptación/aprobación por el Comprador.', 'diez (10) días')],
      ['Multa por demora', p.multaPct + ' % por semana, máximo ' + p.multaMax + ' % del contrato', s(doc, 'Cláusula 39 d)', 16, 'una multa por daños y perjuicios equivalente al 1% del valor del contrato por semana de retraso respecto del plan de entrega.', '1% del valor del contrato por semana')]
    ];
    var adjHtml = adj.map(function (a) { return '<li><span class="i"></span><div style="flex:1"><div class="ink" style="font-weight:600">' + a[0] + '</div><div class="muted" style="font-size:13px">' + a[1] + ' ' + a[2] + '</div></div></li>'; }).join('');

    var datos = [
      ['Procedimiento', lpi ? 'Licitación pública internacional, financiada por el BID' : 'Comparación de precios financiada por el BID'],
      ['Lotes', Store.lotes(l).length + ' · se cotiza cada lote completo' + (lpi ? '' : ', por uno, varios o todos')],
      ['Presentación', lpi ? 'Sobre físico: ' + p.copias + '. Límite ' + l.fechas.horaPres + ' h, apertura ' + l.fechas.horaAper + ' h' : 'Solo por correo electrónico, hasta las ' + l.fechas.horaPres + ' h; un solo PDF de hasta ' + p.maxMB + ' MB'],
      ['Garantía de oferta', 'Declaración de mantenimiento: ' + p.validez + ' días de validez'],
      ['Evaluación', lpi ? 'Menor precio evaluado por lote (CIP), y después calificación del oferente' : 'Menor precio sin impuestos, por lote completo; "cumple / no cumple"'],
      ['Moneda', o.moneda === 'USD' ? 'Dólares estadounidenses (tipo de cambio vendedor del Banco Nación del día hábil anterior a la apertura)' : 'Pesos argentinos']
    ].map(function (d) { return '<dt>' + d[0] + '</dt><dd>' + d[1] + '</dd>'; }).join('');

    return '<div class="grid cols-2"><div class="grid">' +
      '<div class="card pad"><div class="row sb"><h3>Qué hay que armar</h3><a class="btn sm" href="#/l/' + l.id + '/armado">Ir al armado</a></div>' +
      '<div class="minis" style="margin:6px 0 14px">' + minis + '</div>' + mod +
      '<h3 style="font-size:14px">' + (falta.length ? 'Lo que falta (' + falta.length + ')' : 'Todo listo') + '</h3>' +
      (falta.length ? '<ul class="todo" style="margin-top:8px">' + ahora + '</ul>' + (falta.length > 5 ? '<p class="muted" style="margin-top:10px">y ' + (falta.length - 5) + ' más en <a href="#/l/' + l.id + '/requisitos">Requisitos</a>.</p>' : '') : '<p class="muted">Pasá a la revisión final.</p>') + '</div>' +
      '<div class="card pad"><h3>Si resultás adjudicatario</h3><p class="muted" style="margin:-4px 0 10px;font-size:13px">Lo que viene después, con plazos cortos.</p><ul class="todo">' + adjHtml + '</ul></div></div>' +
      '<div class="grid"><div class="card pad"><h3>Fechas del llamado</h3><p class="muted" style="margin:-4px 0 12px;font-size:13px">En este tipo de pliego las fechas están dentro del documento. La línea de tiempo se arma con la fecha límite.</p>' +
      '<label class="f">Fecha límite de presentación<input type="date" data-fecha="apertura" value="' + esc(l.fechas.apertura) + '"></label>' +
      '<p class="muted" style="margin-top:10px;font-size:12.5px">' + (lpi ? 'Los plazos de las instrucciones se cuentan en días corridos.' : 'En el documento, "día" significa día corrido.') + '</p></div>' +
      '<div class="card pad"><h3>Datos clave</h3><dl class="kv">' + datos + '</dl></div></div></div>';
  };

  /* ---------------- oferta por lotes ---------------- */
  V.ofertaLotes = function (l) {
    var T = Store.T(l), o = l.oferta, ls = Store.lotes(l), tot = Store.totalLotes(l), m = o.moneda, lpi = l.tid === 'lpi_bienes', par = l.params, doc = docDe(l);
    var lotesHtml = o.lotes.map(function (L, i) {
      var x = ls[i], items = L.items.map(function (it) {
        return '<tr><td>' + esc(it.desc) + '</td><td class="right" style="width:84px"><input type="number" min="0" value="' + it.cant + '" data-item="' + L.id + ':' + it.id + '" data-k="cant" aria-label="Cantidad"></td><td class="muted" style="width:50px">' + esc(it.unidad || 'u') + '</td><td style="width:150px"><input type="number" min="0" step="any" value="' + (it.precio || '') + '" placeholder="0" data-item="' + L.id + ':' + it.id + '" data-k="precio" aria-label="Precio unitario"></td><td class="right num" style="width:150px">' + mon((Number(it.cant) || 0) * (Number(it.precio) || 0), m) + '</td></tr>';
      }).join('');
      var estado = !x.cotiza ? UI.pill('No cotizado', 'muted') : x.faltan ? UI.pill('Incompleto: se descarta', 'bad') : UI.pill('Lote completo', 'ok');
      var pres = x.presupuesto ? '<span class="muted" style="font-size:13px"> · presupuesto ' + mon(x.presupuesto, m) + '</span>' : '';
      return '<div class="card" style="' + (x.cotiza ? '' : 'opacity:.6') + '"><div class="row sb wrap" style="padding:14px 18px;border-bottom:1px solid var(--line)"><label class="row" style="gap:10px;font-weight:600;color:var(--ink)"><input type="checkbox" data-lote="' + L.id + '" data-k="cotiza"' + (x.cotiza ? ' checked' : '') + '> Lote ' + esc(L.id) + ' · ' + esc(L.nombre) + '</label><div class="row">' + (L.entrega ? '<span class="tag">' + esc(L.entrega) + '</span>' : '') + estado + '</div></div>' +
        '<table class="t"><thead><tr><th>Ítem</th><th class="right">Cant.</th><th></th><th>Precio unitario</th><th class="right">Subtotal</th></tr></thead><tbody>' + items + '</tbody></table>' +
        '<div class="row sb wrap" style="padding:12px 18px;border-top:1px solid var(--line);background:var(--surface-2)"><label class="row" style="gap:8px">Servicios conexos <input type="number" min="0" step="any" style="width:130px" value="' + (L.servicios || '') + '" placeholder="0" data-lote="' + L.id + '" data-k="servicios"></label>' +
        '<div class="right"><span class="muted">Total sin impuestos </span><b class="ink num">' + mon(x.base, m) + '</b> · <span class="muted">con impuestos </span><b class="ink num">' + mon(x.conIva, m) + '</b>' + pres + '</div></div></div>';
    }).join('');

    var generales = '<div class="card pad stack"><h3 style="margin:0">Moneda, impuestos y validez</h3>' +
      '<div class="grid cols-eq"><label class="f">Moneda<select data-ofb="moneda"><option' + (m === 'USD' ? ' selected' : '') + ' value="USD">Dólares (USD)</option><option' + (m === 'ARS' ? ' selected' : '') + ' value="ARS">Pesos (ARS)</option></select></label>' + num('Impuestos (%)', 'ofb', 'iva', o.iva, '') + '</div>' +
      (lpi ? '<label class="f">Incoterm<select data-ofb="incoterm">' + ['CIP', 'CPT', 'DAP', 'DDP'].map(function (t) { return '<option' + (o.incoterm === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select><span style="font-weight:400">Edición Incoterms 2020; precio en el lugar de destino convenido ' + s(docDe(l), 'DDL 14.5', 25, 'La edición de Incoterms es, “Incoterms 2020”', 'Incoterms 2020') + '</span></label>' : '') +
      (m === 'ARS' ? num('Tipo de cambio para evaluar (pesos por USD)', 'ofb', 'tc', o.tc, 'Vendedor divisa del Banco Nación, día hábil anterior a la apertura.') : '') +
      num('Validez de la oferta (días)', 'ofb', 'validez', o.validez, 'El pliego exige ' + par.validez + ' días desde el límite. Menos que eso se rechaza.') +
      '<p class="muted" style="font-size:13px">Garantía: no hay monto. Va una <b>declaración de mantenimiento</b> ' + s(docDe(l), lpi ? 'DDL 21.1' : 'Cláusula 20', lpi ? 26 : 8, lpi ? 'La oferta deberá incluir una “Declaración de Mantenimiento de la Oferta” utilizando el formulario incluido en la Sección IV Formularios de la Oferta.' : 'La cotización deberá venir acompañada de una Declaración de Mantenimiento de la Cotización según el formato del Formulario 6.', 'Declaración de Mantenimiento') + '</p></div>';

    var resumenTot = '<div class="card pad stack"><h3 style="margin:0">Total de la oferta</h3><div class="serif" style="font-size:30px;color:var(--ink)">' + mon(tot.base, m) + '</div><p class="muted" style="margin:-6px 0 0">sin impuestos · ' + tot.n + ' de ' + ls.length + ' lote(s) · con impuestos ' + mon(tot.conIva, m) + '</p>' +
      (m === 'ARS' && Number(o.tc) ? '<p class="muted">Equivale a USD ' + Math.round(tot.base / o.tc).toLocaleString('es-AR') + ' al tipo de cambio cargado.</p>' : '') +
      '<p class="muted" style="font-size:13px">Cada lote se cotiza completo: todos los ítems y todas las cantidades. Un lote incompleto se descarta; podés cotizar uno, varios o todos ' + s(docDe(l), lpi ? 'DDL 14.8' : 'Cláusula 29', lpi ? 26 : 13, lpi ? 'Si alguna oferta no cotizara los artículos que conforman el/los lote/s, o cotizara cantidades menores a las especificadas para cada artículo, resultará descalificada para el lote en el cual haya realizado su oferta en forma incompleta.' : 'Las Ofertas por lotes incompletos o con cantidades distintas de las especificadas, serán rechazadas.', lpi ? 'resultará descalificada' : 'serán rechazadas') + '</p></div>';

    var extra = lpi ? calificacion(l) : archivo(l);
    return '<div class="grid">' + lotesHtml + '<div class="grid cols-eq">' + generales + resumenTot + '</div>' + extra +
      '<div class="row wrap"><button class="btn primary" data-act="anexo2">Ver ' + (lpi ? 'las listas de precios' : 'el Formulario 2') + ' completado</button><span class="muted">Se arma con estos datos y los de <a href="#/empresa">Empresa</a>.</span></div></div>';
  };

  function calificacion(l) {
    var q = Store.calif(l), c = l.calif, par = l.params, m = l.oferta.moneda;
    var cap = q.capacidad.map(function (x) {
      return '<tr><td>Lote ' + x.id + '</td><td class="right" style="width:120px"><input type="number" min="0" value="' + x.tiene + '" data-calu="' + x.id + '" aria-label="Unidades por año"></td><td class="right num">' + x.min + '</td><td>' + pillOk(x.ok, 'Cumple', 'No cumple') + '</td></tr>';
    }).join('');
    return '<div class="grid cols-eq"><div class="card pad stack"><div class="row sb"><h3 style="margin:0">Calificación del oferente</h3>' + pillOk(q.ventasOk && q.expOk, 'Cumple', 'No cumple') + '</div>' +
      '<p class="muted" style="margin:-4px 0 0;font-size:13px">Se verifica solo para la oferta más baja, pero conviene llegar con todo probado ' + s(docDe(l), 'Criterios 4(a)', 32, 'El volumen de ventas anual en al menos 1 año dentro de los últimos 5 años deberá ser equivalente, como mínimo, a: 1,6 veces, el monto de cada lote ofertado.', '1,6 veces') + '</p>' +
      num('Volumen de ventas anual, mejor año de los últimos 5 (' + m + ')', 'cal', 'ventas', c.ventas, 'Exigido: ' + String(par.kVentas).replace('.', ',') + ' veces el mayor lote cotizado = ' + mon(q.necesaria, m) + '.') +
      '<div class="grid cols-eq">' + num('Años con el bien específico', 'cal', 'expEsp', c.expEsp, 'Exigido: ' + par.expEsp + ' años.') + num('Años con bienes similares', 'cal', 'expSim', c.expSim, 'Exigido: ' + par.expSim + ' años.') + '</div>' +
      '<p class="muted" style="font-size:12.5px">Alcanza con cumplir uno de los dos plazos. Con APCA o UT, el líder cumple el 60 % y los demás el 20 %.</p></div>' +
      '<div class="card pad stack"><h3 style="margin:0">Capacidad técnica por lote</h3><p class="muted" style="margin:-4px 0 0;font-size:13px">Unidades producidas o vendidas en al menos un año de los últimos 5.</p><table class="t"><thead><tr><th>Lote</th><th class="right">Tenés</th><th class="right">Mínimo</th><th></th></tr></thead><tbody>' + cap + '</tbody></table></div></div>';
  }

  function archivo(l) {
    var o = l.oferta, par = l.params, ok = Number(o.pesoMB) <= par.maxMB;
    return '<div class="card pad stack"><div class="row sb"><h3 style="margin:0">Envío por correo electrónico</h3>' + pillOk(ok && !!o.firma, 'Listo para enviar', 'Revisar') + '</div>' +
      '<div class="grid cols-eq">' + num('Peso del PDF (MB)', 'ofb', 'pesoMB', o.pesoMB, 'Máximo ' + par.maxMB + ' MB por archivo; si no entra, se divide en "libros".') +
      '<label class="f">Cómo se firma<select data-ofb="firma">' + ['Firma ológrafa escaneada', 'Firma digital'].map(function (t) { return '<option' + (o.firma === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select><span style="font-weight:400">Todas las hojas deben estar firmadas; los formularios son declaración jurada.</span></label></div>' +
      '<ul style="margin:0;padding-left:20px;display:grid;gap:3px;font-size:13.5px"><li>Un solo archivo PDF, legible, ordenado y numerado, con índice. Sin .zip, .rar, ejecutables ni enlaces ' + s(docDe(l), 'Cláusula 22', 10, 'No serán de recibo archivos enviados con extensión .zip o .rar, asimismo, no se aceptará la presentación de propuestas a través de archivos ejecutables o vínculos.', '.zip o .rar') + '</li>' +
      '<li>Con una clave: se manda por correo <b>después</b> de la apertura ' + s(docDe(l), 'Cláusula 22.12', 11, 'Los ficheros deberán incluir una clave que será remitida al correo electrónico adquisicionesvuce@produccion.gob.ar luego del plazo de la apertura de ofertas', 'incluir una clave') + '</li>' +
      '<li>Cuenta la hora en que el correo entra al servidor del comprador, no la del envío ' + s(docDe(l), 'Cláusula 24', 11, 'la hora de recepción de la cotización no será la del envío por parte del Proveedor, sino la hora de recibo de la cotización', 'hora de recibo') + '</li>' +
      '<li>Si no llegan al menos ' + par.minCotizaciones + ' cotizaciones válidas, el comprador puede pedir nuevas</li></ul></div>';
  }

  /* ---------------- reglas de forma ---------------- */
  V.reglasBid = function (l) {
    var lpi = l.tid === 'lpi_bienes', par = l.params, doc = docDe(l);
    var lista = lpi ? [
      'Todo en español. Las ofertas se presentan en <b>sobre físico</b>: ' + par.copias + '. No hay presentación electrónica.',
      'Los sobres interior y exterior llevan las leyendas del llamado y "NO ABRIR ANTES DE" la fecha y hora de apertura.',
      'El Formulario de Oferta se completa sin alterar su forma; no se aceptan sustitutos y no puede quedar ningún espacio en blanco.',
      'Las celdas en blanco o con guiones en las listas de precios se consideran ausencia de cotización.',
      'Retiro, sustitución o modificación: solo antes del límite, con el sobre marcado "RETIRO", "SUSTITUCIÓN" o "MODIFICACIÓN".',
      'Presentación a nombre del licitante: no se admiten formularios ni declaración de mantenimiento a nombre de un agente.'
    ] : [
      'Todo en español. Los folletos pueden estar en otro idioma si se acompañan con traducción al español.',
      'Solo cotizaciones electrónicas: un PDF de hasta ' + par.maxMB + ' MB, con índice, numerado y firmado.',
      'Todas las hojas inicialadas, y la última y la de la oferta económica con firma completa.',
      'El pliego completo, firmado en original en todas sus hojas por quien puede obligar a la firma.',
      'Se rechaza si falta: carta de cotización, formulario de precios, pliego firmado o declaración de mantenimiento.',
      'Una cotización por proveedor: si participás en más de una, se rechazan todas, incluso en UTE o APCA.'
    ];
    var ref = lpi ? s(doc, 'DDL 22.1', 26, 'Además de la oferta original, el número de copias es: 2 (dos), Una copia Física y otra digital.', 'Una copia Física y otra digital') : s(doc, 'Cláusula 22', 10, 'Los Proveedores podrán presentar únicamente Cotizaciones electrónicas.', 'únicamente Cotizaciones electrónicas');
    return '<details class="card pad" style="margin-bottom:18px"><summary style="cursor:pointer;font-weight:600;color:var(--ink)">Reglas de forma de la ' + (lpi ? 'oferta' : 'cotización') + ' ' + ref + '</summary><ul style="margin:10px 0 0;padding-left:20px;display:grid;gap:4px">' + lista.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul></details>';
  };

  /* ---------------- portada del paquete ---------------- */
  V.portadaBid = function (l) {
    var lpi = l.tid === 'lpi_bienes', par = l.params, e = Store.empresaDe(l), fo = Store.folios(l).total, o = l.oferta;
    if (lpi) {
      return '<div class="paper cover"><div class="kicker">Sobre exterior · Original</div><h2>Licitación Pública Internacional</h2><p style="text-align:center"><b>' + esc(l.nro) + '</b><br>' + esc(l.titulo) + '</p><p style="text-align:center;margin-top:18px">' + esc(l.organismo) + '</p>' +
        '<p style="text-align:center;margin-top:22px"><b>FECHA DE APERTURA:</b> ' + UI.date(l.fechas.apertura) + ', ' + l.fechas.horaAper + ' h<br><b>NO ABRIR ANTES DE:</b> ' + UI.date(l.fechas.apertura) + ', ' + l.fechas.horaAper + ' h</p>' +
        '<p style="text-align:center;font-size:13px;color:#888;margin-top:26px">Se entregan 3 juegos: original, copia física y copia digital, con las leyendas del DDL 23.2(c).</p></div>';
    }
    var cuerpoMail = '<table class="ptab"><tbody><tr><th>Para</th><td>adquisicionesvuce@produccion.gob.ar</td></tr><tr><th>Asunto</th><td>Comparación de Precios Nº ' + esc(l.nro.replace('CP ', '')) + ' — ' + esc(l.titulo) + '</td></tr><tr><th>Cuerpo</th><td>Proveedor: ' + esc(e.razon) + ' · CUIT ' + esc(e.cuit) + '<br>Contacto: ' + esc(e.representante) + ' · ' + esc(e.telefono) + '<br>Documento del representante: ' + esc(e.dni) + '<br>Archivos: 1 (' + (Number(o.pesoMB) || 0) + ' MB)</td></tr><tr><th>Adjunto</th><td class="mono">Cotizacion_' + esc(l.nro.replace(/[^A-Z0-9]+/gi, '_')) + '.pdf (con clave, ' + fo + ' folios, firmado)</td></tr></tbody></table>';
    return '<div class="paper"><h2>Correo de envío</h2><p>Se manda a más tardar a las ' + l.fechas.horaPres + ' h del ' + UI.date(l.fechas.apertura) + ', hora de recepción en el servidor del comprador.</p>' + cuerpoMail + '<p style="font-size:13px;color:#777">Después de la apertura se envía la clave del archivo al mismo correo.</p></div>';
  };

  /* ---------------- seguimiento: tareas por tipo ---------------- */
  V.tareasBid = function (l) {
    var s2 = Store.seg(l), f = l.fechas, p = l.params, o = l.oferta, pr = Store.progress(l), tot = Store.totalLotes(l), A = s2.adjudicacion, F = s2.tenencia, doc = docDe(l), lpi = l.tid === 'lpi_bienes';
    var sinBloq = Store.bloqueantes(l).length === 0, ap = f.apertura, m = o.moneda;
    var d = function (base, n) { return base ? Store.addDaysTo(base, n) : ''; };
    var contrato = tot.base;
    function t(id, t2, plazo, fecha, srcHtml, auto) { var x = { id: id, t: t2, plazo: plazo, fecha: fecha, src: srcHtml }; if (auto !== undefined) x.auto = auto; return x; }

    if (lpi) return {
      2: [
        t('b2a', 'Obtener los documentos de licitación y dejar un contacto para las respuestas', 'Las respuestas se envían a quienes retiraron los documentos', '', s(doc, 'IAO 7.1', 8, 'El Comprador enviará copia de las respuestas, incluyendo una descripción de las consultas realizadas, sin identificar su fuente, a todos los que hubiesen adquirido los Documentos de Licitación.', 'sin identificar su fuente')),
        t('b2b', 'Enviar las consultas por escrito al Comprador', '21 días antes de la fecha límite', d(ap, -p.consultasDias), s(doc, 'IAO 7.1', 8, 'siempre que dichas solicitudes sean recibidas al menos veintiún (21) días antes de la fecha límite para la presentación de ofertas.', 'veintiún (21) días')),
        t('b2c', 'Revisar las enmiendas: pueden prorrogar el plazo', 'En cualquier momento antes del vencimiento', '', s(doc, 'IAO 8.1', 9, 'El Comprador podrá, en cualquier momento antes del vencimiento del plazo para presentación de ofertas, enmendar los Documentos de Licitación mediante la emisión de una enmienda.', 'enmendar los Documentos de Licitación'))
      ],
      3: [
        t('b3a', 'Completar los requisitos de la oferta (' + pr.done + ' de ' + pr.total + ')', 'Formularios, elegibilidad, conformidad técnica y calificaciones', '', '', pr.done === pr.total),
        t('b3b', 'Preparar original y 2 copias (una física y otra digital)', 'Si difieren, prevalece el original', '', s(doc, 'DDL 22.1', 26, 'Además de la oferta original, el número de copias es: 2 (dos), Una copia Física y otra digital.', '2 (dos)')),
        t('b3c', 'Rotular los sobres interior y exterior con las leyendas del llamado', 'Incluye "NO ABRIR ANTES DE" la fecha y hora de apertura', '', s(doc, 'DDL 23.2(c)', 27, 'FECHA DE APERTURA: NO ABRIR ANTES DE:', 'NO ABRIR ANTES DE')),
        t('b3d', 'Pasar la revisión final sin puntos bloqueantes', 'Lotes completos, validez, calificación y documentos', '', '', sinBloq),
        t('b3e', 'Entregar el sobre físico antes del límite (' + f.horaPres + ' h)', 'No hay presentación electrónica; las ofertas tardías se rechazan', ap, s(doc, 'DDL 23.1', 26, 'Los Oferentes NO TENDRÁN la opción de presentar sus ofertas electrónicamente.', 'NO TENDRÁN la opción'), !!l.presentada),
        t('b3f', 'Si hace falta, retirar, sustituir o modificar la oferta', 'Solo antes del límite; con el sobre marcado RETIRO, SUSTITUCIÓN o MODIFICACIÓN', ap, s(doc, 'IAO 26.1', 16, 'Adicionalmente, los respectivos sobres deberán estar claramente marcados “RETIRO”, “SUSTITUCIÓN” o “MODIFICACIÓN”', 'RETIRO'))
      ],
      4: [
        t('b4a', 'Asistir al acto público de apertura (' + f.horaAper + ' h)', 'Se leen en voz alta los precios', ap, s(doc, 'IAO 27.1', 16, 'El Comprador llevará a cabo el acto de apertura de las ofertas en público en la dirección, fecha y hora establecidas en los DDL.', 'en público')),
        t('b4b', 'Responder los pedidos de aclaración, sin cambiar precios ni la esencia', 'Solo si el Comprador los pide; por escrito', '', s(doc, 'IAO 29.1', 18, 'No se solicitará, ofrecerá o permitirá cambios en los precios o a la esencia de la oferta, excepto para confirmar correcciones de errores aritméticos.', 'cambios en los precios')),
        t('b4c', 'Mantener la oferta durante ' + p.validez + ' días', 'No se puede retirar, sustituir ni modificar en ese período', d(ap, p.validez), s(doc, 'IAO 20.1', 13, 'Las ofertas se deberán mantener válidas por el período especificado en los DDL a partir de la fecha límite para la presentación de ofertas establecida por el Comprador.', 'mantener válidas')),
        t('b4d', 'Aceptar o rechazar una prórroga de la validez, si la piden', 'Se puede rechazar sin que se ejecute la declaración', '', s(doc, 'IAO 20.2', 13, 'Un Oferente puede rehusar a tal solicitud sin que se le haga efectiva su Garantía de la Oferta.', 'rehusar')),
        t('b4e', 'Presentar la evidencia de calificación si tu oferta es la más baja', 'Después se decide si estás calificado para ejecutar el contrato', '', s(doc, 'IAO 38.1', 20, 'El Comprador determinará, a su entera satisfacción, si el Oferente seleccionado como el que ha presentado la oferta evaluada más baja está calificado para ejecutar el Contrato satisfactoriamente.', 'oferta evaluada más baja'))
      ],
      5: [
        t('b5a', 'Recibir la notificación de adjudicación', 'Antes de que venza la validez de la oferta', '', s(doc, 'IAO 42.1', 21, 'Antes de la expiración del período de validez de las ofertas, el Comprador notificará por escrito al Oferente seleccionado que su oferta ha sido aceptada.', 'notificará por escrito')),
        t('b5b', 'Presentar la garantía de cumplimiento (' + p.pctGarantiaCumpl + ' %: ' + mon(contrato * p.pctGarantiaCumpl / 100, m) + ')', '28 días desde la notificación; garantía bancaria o póliza de caución, en la moneda del contrato', d(A, p.plazoGarantiaCumpl), s(doc, 'IAO 44.1', 22, 'Dentro de los veintiocho (28) días siguientes al recibo de la notificación de adjudicación de parte del Comprador, el Oferente seleccionado deberá presentar la Garantía de Cumplimiento del Contrato.', 'veintiocho (28) días')),
        t('b5c', 'Ejecutar, fechar y devolver el convenio de contrato', '28 días desde que lo recibís', d(A, p.plazoFirma), s(doc, 'IAO 43.2', 22, 'El Oferente seleccionado tendrá un plazo de 28 días después de la fecha de recibo del formulario del Convenio de Contrato para ejecutarlo, fecharlo y devolverlo al Comprador.', '28 días')),
        t('b5d', 'Pedir el anticipo del ' + p.anticipoPct + ' % con garantía por el 100 % del anticipo', 'A los 30 días de la firma, con factura', '', s(doc, 'CEC 16.1', 96, 'Anticipo: El veinte por ciento (20%) del monto total del Contrato se pagará dentro de los treinta (30) días siguientes a la firma del contrato con la presentación de la factura y presentación de una garantía bancaria o póliza de caución.', 'veinte por ciento (20%)'))
      ],
      6: [
        t('b6a', 'Entregar los bienes: 300 días (lotes 1 y 2) y 180 días (lote 3) desde la firma', 'Plazo máximo de entrega de cada lote', d(F, 180), s(doc, 'DDL 1.1', 23, 'Plazo máximo de Entrega: 300 días desde la Firma de Contrato', '300 días desde la Firma de Contrato'), undefined),
        t('b6b', 'Inspecciones y pruebas según el pliego', 'Antes de la recepción', '', s(doc, 'CGC 26.1', 99, 'Las inspecciones y pruebas serán como se indica a continuación: Según lo indicado en el apartado “Inspecciones y Pruebas”', 'Inspecciones y Pruebas')),
        t('b6c', 'Cobrar: 50 % contra entrega y 30 % con la recepción definitiva (importados)', 'Con factura, remito firmado y acta de recepción', '', s(doc, 'CEC 16.1', 97, 'Contra entrega: El cincuenta por ciento (50%) del monto total del contrato se pagará mediante presentación de factura, remito firmado, acta de recepción provisoria.', 'cincuenta por ciento (50%)')),
        t('b6d', 'Evitar multas por demora: 1 % por semana, hasta un máximo del 10 %', 'Se descuenta de la factura', '', s(doc, 'CEC 27.1', 99, 'El valor de la liquidación por daños y perjuicios será: 1 % por semana. El monto máximo de la liquidación por daños y perjuicios será: 10 %.', '1 % por semana')),
        t('b6e', 'Garantía de los bienes: 2 años; reparar o reemplazar en 60 días', 'Desde la recepción', '', s(doc, 'CEC 28.3', 99, 'El período de validez de la Garantía será dos (2) Años.', 'dos (2) Años')),
        t('b6f', 'Recuperar la garantía de cumplimiento', '30 días después del pago final', '', s(doc, 'CEC 18.4', 99, 'La liberación de la Garantía de Cumplimiento tendrá lugar: 30 días después de del efectivo pago final', '30 días después'))
      ]
    };

    /* comparacion de precios */
    return {
      2: [
        t('c2a', 'Confirmar por escrito si se va a cotizar', '3 días hábiles de recibida la invitación', '', s(doc, 'Carta de invitación', 3, 'Solicitamos que, por escrito, e-mail o carta, nos comuniquen dentro de los 3 (tres) días hábiles de recibida esta Invitación, si presentarán o no su Cotización.', '3 (tres) días hábiles')),
        t('c2b', 'Enviar las consultas escritas por correo', p.consultasDias + ' días antes del límite', d(ap, -p.consultasDias), s(doc, 'Cláusula 15', 8, 'podrán formular consultas escritas hasta ' + p.consultasDias + ' días antes de la fecha límite fijada para la recepción de Cotizaciones', p.consultasDias + ' días antes')),
        t('c2c', 'Revisar las circulares y actualizar el checklist', 'Se envían a más tardar ' + p.circularesDias + ' días antes del límite', d(ap, -p.circularesDias), s(doc, 'Cláusula 15', 8, 'a más tardar 3 días antes vencimiento del plazo para la presentación de las Cotizaciones', '3 días antes')),
        t('c2d', 'Revisar las enmiendas: pueden prorrogar el plazo', 'Antes del vencimiento del plazo de presentación', '', s(doc, 'Cláusula 16', 8, 'El Comprador podrá, en cualquier momento antes del vencimiento del plazo para la presentación de las Cotizaciones, modificar el Documento de Comparación de Precios mediante la emisión de Enmiendas.', 'modificar el Documento'))
      ],
      3: [
        t('c3a', 'Completar los requisitos de la cotización (' + pr.done + ' de ' + pr.total + ')', 'Carta, formularios, documentación del proveedor y técnica', '', '', pr.done === pr.total),
        t('c3b', 'Firmar cada formulario y el pliego', 'Firma ológrafa o digital certificada', '', s(doc, 'Cláusula 21', 10, 'Los formularios solicitados tienen el carácter de declaración jurada; deben tener firma ológrafa o digital certificada.', 'firma ológrafa o digital certificada')),
        t('c3c', 'Armar un solo PDF numerado, con índice (máx. ' + p.maxMB + ' MB, sin zip ni enlaces)', 'Si pesa más, se divide en libros', '', s(doc, 'Cláusula 22', 10, 'La cotización deberá ser remitida en un solo archivo. El peso máximo de cada archivo será de 25 Megabytes.', '25 Megabytes'), Number(o.pesoMB) > 0 && Number(o.pesoMB) <= p.maxMB),
        t('c3d', 'Proteger el archivo con una clave', 'La clave se manda después de la apertura', '', s(doc, 'Cláusula 22.12', 11, 'Los ficheros deberán incluir una clave que será remitida al correo electrónico adquisicionesvuce@produccion.gob.ar luego del plazo de la apertura de ofertas', 'incluir una clave')),
        t('c3e', 'Pasar la revisión final sin puntos bloqueantes', 'Lotes completos, validez y documentos que descartan', '', '', sinBloq),
        t('c3f', 'Enviar el correo antes de las ' + f.horaPres + ' h', 'No se reciben cotizaciones en modalidad física', ap, s(doc, 'Cláusula 23', 11, 'No se recibirán cotizaciones en modalidad física.', 'modalidad física'), !!l.presentada),
        t('c3g', 'Comprobar que entró: cuenta la hora del servidor, no la del envío', 'Mandalo con margen', ap, s(doc, 'Cláusula 24', 11, 'la hora de recepción de la cotización no será la del envío por parte del Proveedor, sino la hora de recibo de la cotización', 'hora de recibo'))
      ],
      4: [
        t('c4a', 'Enviar la clave del archivo luego de la apertura', 'Las cotizaciones se abren apenas cierra la recepción', ap, s(doc, 'Cláusula 22.12', 11, 'Los ficheros deberán incluir una clave que será remitida al correo electrónico luego del plazo de la apertura de ofertas', 'luego del plazo de la apertura')),
        t('c4b', 'Responder los pedidos de aclaración en el plazo fijado', 'Solo si el comprador los pide; por escrito', '', s(doc, 'Cláusula 30', 13, 'Si un Proveedor no entrega las aclaraciones a su Cotización en plazo fijado en la solicitud de aclaración, su Cotización podría ser rechazada.', 'podría ser rechazada')),
        t('c4c', 'Aceptar la corrección de errores aritméticos', 'Prevalece el precio unitario y, entre letras y cifras, las letras', '', s(doc, 'Cláusula 28', 12, 'Si el Proveedor no estuviera de acuerdo con el monto corregido, la Cotización será rechazada.', 'será rechazada')),
        t('c4d', 'Mantener la cotización ' + p.validez + ' días', 'Desde el límite de presentación', d(ap, p.validez), s(doc, 'Cláusula 19', 8, 'Las Cotizaciones permanecerán válidas por un período de 60 días desde la fecha de límite fijada para la recepción de cotizaciones.', '60 días')),
        t('c4e', 'Resultado: gana el precio más bajo sin impuestos, por lote completo', 'Se evalúa "cumple / no cumple"', '', s(doc, 'Cláusula 29', 13, 'Identificada la cotización con el precio más bajo, excluidos los impuestos, después de la revisión de eventuales aritméticos de las cotizaciones.', 'precio más bajo'))
      ],
      5: [
        t('c5a', 'Recibir la notificación de adjudicación', 'Antes de que venza la validez', '', s(doc, 'Cláusula 33', 14, 'Antes de la expiración de la validez de la Cotización, el Comprador notificará por escrito la decisión de adjudicación del contrato.', 'notificará por escrito')),
        t('c5b', 'Presentar DNI del firmante y poder o estatuto', 'Para firmar el contrato', '', s(doc, 'Cláusula 34', 14, 'DNI del Firmante. Poder legal o estatuto, que acredite la capacidad del firmante para contraer obligaciones en nombre de la empresa.', 'DNI del Firmante')),
        t('c5c', 'Constituir la garantía de cumplimiento (' + p.pctGarantiaCumpl + ' %: ' + mon(contrato * p.pctGarantiaCumpl / 100, m) + ')', '28 días desde la notificación' + (l.tid === 'cp_servicios' ? '; en VUCE-642 el modelo de contrato la marca "No aplica"' : ''), d(A, p.plazoGarantiaCumpl), s(doc, 'Cláusula 34', 14, 'Dentro de los veintiocho (28) días siguientes al recibo de la notificación de adjudicación de parte del Comprador, el Oferente seleccionado deberá presentar la Garantía de Cumplimiento de Contrato.', 'veintiocho (28) días')),
        t('c5d', 'Firmar el contrato u orden de compra', 'Si no firmás ni das la garantía, se ejecuta la declaración de mantenimiento', '', s(doc, 'Cláusula 20', 9, 'si el Proveedor seleccionado no cumple dentro del plazo estipulado con: firmar el Contrato; o suministrar la Garantía de Cumplimiento solicitada.', 'firmar el Contrato'))
      ],
      6: [
        t('c6a', 'Entregar según el plan de entrega, con factura (original y copia), remito y DDJJ de origen', 'La entrega se hace en el lugar y horario del plan', d(F, 0), s(doc, 'Cláusula 38', 15, 'Original y copia de la factura indicando descripción de los bienes, marca, país de origen, precio unitario, cantidad y monto total.', 'Original y copia de la factura')),
        t('c6b', 'Recepción y aceptación del comprador', p.recepcionDias + ' días hábiles desde la entrega', '', s(doc, 'Cláusula 38 f)', 15, 'El Comprador expedirá el certificado de recepción y aceptación de cada lote en un plazo no mayor de siete (7) días hábiles a partir de la fecha de entrega.', 'siete (7) días hábiles')),
        t('c6c', 'Reemplazar lo defectuoso en menos de 5 días de notificado', 'Sin costo para el comprador', '', s(doc, 'Cláusula 38 g)', 15, 'el proveedor deberá reemplazar los mismos en un plazo menor a los cinco (5) días contados a partir de la notificación que el Comprador realice.', 'cinco (5) días')),
        t('c6d', 'Cobrar el 100 % contra entrega', 'Se paga dentro de los ' + p.pagoDias + ' días de la recepción, por transferencia en pesos', '', s(doc, 'Cláusula 39', 15, 'El Comprador abonará cada factura dentro de los diez (10) días a partir de la fecha de recepción y aceptación/aprobación por el Comprador.', 'diez (10) días')),
        t('c6e', 'Evitar la multa por demora: 1 % por semana, máximo 10 %', 'Se deduce de la factura', '', s(doc, 'Cláusula 39 d)', 16, 'una multa por daños y perjuicios equivalente al 1% del valor del contrato por semana de retraso respecto del plan de entrega.', '1% del valor del contrato por semana')),
        t('c6f', 'Garantía de los bienes: reparar o reemplazar en 15 días', 'Nuevos, sin uso y del último modelo vigente', '', s(doc, 'Cláusula 37', 14, 'el Proveedor reparará o reemplazará los bienes defectuosos en todo o en parte, sin costo para el Comprador dentro de los 15 días, de notificado en forma fehaciente.', 'dentro de los 15 días'))
      ]
    };
  };

  V.TV.lotes = { resumen: function (l) { return V.resumenBid(l); }, oferta: function (l) { return V.ofertaLotes(l); }, reglas: function (l) { return V.reglasBid(l); }, portada: function (l) { return V.portadaBid(l); }, tareas: function (l) { return V.tareasBid(l); }, get extras() { return V.extrasBid; } };

  /* bloques extra de cada etapa para los tipos por lotes */
  V.extrasBid = {
    2: function (l) { return V.extraConsultas(l); },
    4: function (l) {
      var s2 = Store.seg(l), a = s2.apertura, lpi = l.tid === 'lpi_bienes';
      var orden = ['', '1.º', '2.º', '3.º', '4.º', '5.º'].map(function (x, i) { return '<option value="' + i + '"' + (String(a.orden || 0) === String(i) ? ' selected' : '') + '>' + (i ? 'Puesto ' + x : 'Sin resultado todavía') + '</option>'; }).join('');
      return '<div class="card pad stack" style="box-shadow:none;margin-top:14px"><h3 style="margin:0">Resultado de la apertura</h3><div class="grid cols-eq"><label class="f">Ofertas presentadas<input type="number" min="0" data-segap="oferentes" value="' + esc(a.oferentes || '') + '"></label><label class="f">Tu posición por precio<select data-segap="orden">' + orden + '</select></label></div>' +
        '<p class="muted" style="font-size:13px">' + (lpi ? 'Se evalúa cada lote por separado; podés ganar uno o más lotes.' : 'Si no llegan ' + l.params.minCotizaciones + ' cotizaciones válidas, el comprador puede pedir nuevas.') + '</p></div>';
    },
    5: function (l) {
      var s2 = Store.seg(l), p = l.params, tot = Store.totalLotes(l), m = l.oferta.moneda;
      return '<div class="grid cols-eq" style="margin-top:14px"><label class="f">Fecha de notificación de la adjudicación<input type="date" data-seg="adjudicacion" value="' + esc(s2.adjudicacion) + '"></label>' +
        '<div class="banner info" style="margin:0"><span>$</span><span>Si ganás todos los lotes, la garantía de cumplimiento es de <b>' + mon(tot.base * p.pctGarantiaCumpl / 100, m) + '</b> (' + p.pctGarantiaCumpl + ' % de ' + mon(tot.base, m) + '). Cargá la fecha y los plazos se calculan solos.</span></div></div>';
    },
    6: function (l) {
      var s2 = Store.seg(l), p = l.params, tot = Store.totalLotes(l), m = l.oferta.moneda, lpi = l.tid === 'lpi_bienes', base = tot.base;
      var fila = function (a, b, c) { return '<tr><td>' + a + '</td><td>' + b + '</td><td class="right num">' + mon(c, m) + '</td></tr>'; };
      var pagos = lpi ? fila('Anticipo, a los 30 días de la firma', p.anticipoPct + ' %', base * p.anticipoPct / 100) + fila('Contra entrega', '50 %', base * 0.5) + fila('Recepción definitiva', '30 %', base * 0.3) :
        fila('Contra entrega, a los ' + p.pagoDias + ' días de la recepción', '100 %', base);
      return '<div class="grid cols-eq" style="margin-top:14px"><div class="stack"><label class="f">Fecha de firma del contrato<input type="date" data-seg="tenencia" value="' + esc(s2.tenencia) + '"></label>' +
        '<p class="muted" style="font-size:13px">Desde la firma corren los plazos de entrega' + (lpi ? ' de cada lote' : '') + '.</p></div>' +
        '<div><table class="t"><thead><tr><th>Cobro</th><th>Porcentaje</th><th class="right">Monto sin impuestos</th></tr></thead><tbody>' + pagos + '</tbody></table></div></div>';
    }
  };
})();
