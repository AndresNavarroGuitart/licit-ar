/* Resumen previo del pliego: pasos a completar, condiciones y plazos generales. Sirve para leer antes de empezar. */
(function () {
  var esc = UI.esc, mon = Store.mon, money = UI.money;
  var V = window.Views = window.Views || {};

  function sc(doc, ref, pag, texto, mark) { return V.srcBtn({ doc: doc, ref: ref, pag: pag, texto: texto, mark: mark }); }

  /* condiciones generales de cada tipo de licitacion: [titulo, detalle, fuente] */
  function condiciones(l) {
    var p = l.params, o = l.oferta || {}, m = o.moneda, PBC = Store.PBC;
    if (l.tid === 'lpi_bienes') {
      var D = 'Pliego LPI VUCE-564-LPI-B (BID)';
      return [
        ['Procedimiento', 'Licitación pública internacional financiada por el BID. Solo oferentes y bienes de países miembros; sin conflicto de interés ni sanciones del Banco.', ''],
        ['Presentación', 'Sobre físico: ' + p.copias + '. No hay presentación electrónica. Límite ' + l.fechas.horaPres + ' h y apertura pública ' + l.fechas.horaAper + ' h.', sc(D, 'DDL 22.1', 26, 'Además de la oferta original, el número de copias es: 2 (dos), Una copia Física y otra digital.', '2 (dos)')],
        ['Validez de la oferta', p.validez + ' días desde el límite de presentación. Una oferta con menos validez se rechaza.', sc(D, 'IAO 20.1', 13, 'Toda oferta con un período de validez menor será rechazada por el Comprador por incumplimiento.', 'será rechazada')],
        ['Garantía de oferta', 'No hay monto: se presenta una declaración de mantenimiento. Retirar la oferta o no firmar deja al oferente inelegible ' + p.inelegibleAnios + ' años.', sc(D, 'DDL 21.1', 26, 'La oferta deberá incluir una “Declaración de Mantenimiento de la Oferta” utilizando el formulario incluido en la Sección IV Formularios de la Oferta.', 'Declaración de Mantenimiento de la Oferta')],
        ['Lotes y precios', 'Se cotiza por lote completo, con todos los ítems y todas las cantidades; uno incompleto se descarta. Precio en ' + (o.incoterm || 'CIP') + ' (Incoterms 2020).', sc(D, 'DDL 14.8', 26, 'resultará descalificada para el lote en el cual haya realizado su oferta en forma incompleta.', 'resultará descalificada')],
        ['Calificación del oferente', 'Ventas anuales de ' + String(p.kVentas).replace('.', ',') + ' veces el monto de cada lote, ' + p.expEsp + ' años con el bien o ' + p.expSim + ' con similares, y cantidad anual mínima por lote. En APCA, el líder cumple 60 % y los demás 20 %.', sc(D, 'Criterios 4(a)', 32, 'El volumen de ventas anual en al menos 1 año dentro de los últimos 5 años deberá ser equivalente, como mínimo, a: 1,6 veces, el monto de cada lote ofertado.', '1,6 veces')],
        ['Autorización del fabricante', 'Se exige, y también servicios posteriores a la venta.', sc(D, 'DDL 19.1(a)', 26, 'SE REQUIERE la Autorización del Fabricante.', 'SE REQUIERE la Autorización del Fabricante')],
        ['Evaluación', 'Menor valor total CIP por lote, convertido a dólares al tipo de cambio vendedor del Banco Nación del día hábil anterior a la apertura.', sc(D, 'DDL 36.3(a)', 28, 'La evaluación se hará por el valor total CIP.', 'valor total CIP')],
        ['Si ganás', 'Garantía de cumplimiento del ' + p.pctGarantiaCumpl + ' % en ' + p.plazoGarantiaCumpl + ' días; anticipo del ' + p.anticipoPct + ' % contra garantía; multa de ' + p.multaPct + ' % por semana, máximo ' + p.multaMax + ' %; garantía de los bienes por 2 años.', sc(D, 'CEC 18.1', 98, 'El monto de la Garantía deberá ser equivalente al diez por ciento (10%) DEL MONTO TOTAL DEL CONTRATO', 'diez por ciento (10%)')]
      ];
    }
    if (l.tid === 'cp_bienes' || l.tid === 'cp_servicios') {
      var C = l.tid === 'cp_servicios' ? 'Pliego CP VUCE-642-CP-S (BID)' : 'Pliego CP VUCE-643-CP-B (BID)';
      return [
        ['Procedimiento', 'Comparación de precios financiada por el BID, abierta a proveedores de países miembros. Se cotiza por lote completo, por uno, varios o todos.', sc(C, 'Cláusula 29', 13, 'Los oferentes podrán cotizar por uno, varios o la totalidad de los lotes.', 'uno, varios o la totalidad')],
        ['Presentación', 'Solo por correo electrónico: un PDF de hasta ' + p.maxMB + ' MB, con índice, numerado, firmado (ológrafa o digital) y con clave. Sin zip, rar ni enlaces. Hasta las ' + l.fechas.horaPres + ' h.', sc(C, 'Cláusula 22', 10, 'La cotización deberá ser remitida en un solo archivo. El peso máximo de cada archivo será de 25 Megabytes.', '25 Megabytes')],
        ['Validez de la cotización', p.validez + ' días desde el límite. Declaración de mantenimiento (Formulario 6) obligatoria.', sc(C, 'Cláusula 19', 8, 'Las Cotizaciones permanecerán válidas por un período de 60 días desde la fecha de límite fijada para la recepción de cotizaciones.', '60 días')],
        ['Qué descarta la cotización', 'Falta de carta de cotización, formulario de precios, pliego firmado en todas sus hojas o declaración de mantenimiento.', sc(C, 'Cláusula 21', 9, 'si cualesquiera de los siguientes documentos o información faltaran al momento de la presentación de la Oferta, la misma será rechazada', 'será rechazada')],
        ['Una cotización por proveedor', 'Participar en más de una, aun en UTE o APCA, rechaza todas.', sc(C, 'Cláusula 17', 8, 'Los proveedores no podrán presentar más de una cotización; de hacerlo, todas las propuestas en las cuales participa serán rechazadas.', 'todas las propuestas')],
        ['Precios', 'Sin ajustes ni teoría de la imprevisión; incluyen todos los gastos y tributos. Bienes en pesos o dólares; evaluación convertida a USD al tipo de cambio billete vendedor del Banco Nación.', sc(C, 'Cláusula 18', 8, 'No se realizará ningún ajuste al monto del contrato.', 'ningún ajuste')],
        ['Evaluación', 'Gana el precio más bajo sin impuestos que cumpla sustancialmente, por lote completo. Si hay menos de ' + p.minCotizaciones + ' cotizaciones válidas, el comprador puede pedir nuevas.', sc(C, 'Cláusula 29', 13, 'Identificada la cotización con el precio más bajo, excluidos los impuestos', 'precio más bajo')],
        ['Si ganás', 'Garantía de cumplimiento del ' + p.pctGarantiaCumpl + ' % en ' + p.plazoGarantiaCumpl + ' días; cobro del 100 % contra entrega, a los ' + p.pagoDias + ' días de la recepción; multa de ' + p.multaPct + ' % por semana, máximo ' + p.multaMax + ' %.', sc(C, 'Cláusula 39', 15, 'El Comprador abonará cada factura dentro de los diez (10) días a partir de la fecha de recepción y aceptación/aprobación por el Comprador.', 'diez (10) días')]
      ];
    }
    /* concesion */
    return [
      ['Objeto y plazo', 'Concesión de uso por ' + p.plazoConcesion + ' años, prorrogable hasta ' + p.prorrogaMax + ' más a criterio exclusivo del ente.', sc(PBC, 'Art. I.6', 11, 'La concesión de uso se otorgará por el plazo de veinte (20) años contados desde la Fecha de Entrega de Tenencia.', 'veinte (20) años')],
      ['Presentación', 'Sobre único con tres carpetas (antecedentes, oferta técnica y oferta económica), en original y copia, con las páginas numeradas, sellado y firmado, sin identificar al oferente por fuera.', sc(PBC, 'Art. II.1', 15, 'Los oferentes presentarán sus ofertas en un Sobre único. Todas las hojas serán numeradas correlativamente', 'Sobre único')],
      ['Canon', 'Piso de ' + money(p.canonBase) + ' por mes a valores de apertura, actualizado por CER; bonificado 100 % los meses 1–12 y 50 % los 13–24. Por debajo del piso se desestima.', sc(PBC, 'Art. II.5.3 d)', 37, 'Se establece como Canon Base la suma de PESOS CUARENTA MILLONES ($40.000.000) mensuales, a valores del mes de apertura de ofertas.', 'PESOS CUARENTA MILLONES')],
      ['Inversión mínima', money(p.inversionMin) + ' netos de IVA, ejecutados en hasta ' + p.plazoObraMax + ' meses desde la entrega de tenencia, verificados en moneda constante.', sc(PBC, 'Art. II.5.3 a)', 35, 'no podrá ser inferior a PESOS DIEZ MIL MILLONES ($10.000.000.000) (neto de IVA)', 'PESOS DIEZ MIL MILLONES')],
      ['Qué descarta la oferta', 'Liquidez no mayor a 1, endeudamiento no menor a 1,5 o margen operativo no mayor a 0; canon bajo el piso; inversión o plazo fuera de lo exigido.', sc(PBC, 'Art. II.5.1 m.1)', 28, 'Si estos tres indicadores no alcanzaran los valores establecidos supra, se desestimará la Oferta.', 'se desestimará la Oferta')],
      ['Garantía de oferta', money(p.garantiaOferta) + ' por depósito, aval o seguro de caución; el original va a Asuntos Legales dentro de las 24 horas de la apertura. Oferta válida ' + p.mantenimiento + ' días, renovable.', sc(PBC, 'Art. II.6', 38, 'por el monto de $40.000.000 (pesos cuarenta millones)', 'monto de $40.000.000')],
      ['Visita técnica', 'Obligatoria y previa a la presentación; se acredita con el certificado del ente.', sc(PBC, 'Art. II.5.1 n)', 29, 'La visita técnica al Predio será obligatoria y deberá efectuarse con anterioridad a la presentación de la Oferta.', 'visita técnica al Predio será obligatoria')],
      ['Presentación conjunta', 'UT o consorcio de hasta 5 integrantes, con responsabilidad solidaria e ilimitada y representante común.', sc(PBC, 'Art. II.4.5', 21, 'Las UT o Consorcios podrán estar integrados por hasta cinco (5) miembros como máximo.', 'hasta cinco (5) miembros')],
      ['Cómo se adjudica', 'Integral y no escalonada: gana la oferta más conveniente, que no tiene por qué ser la de mayor canon.', sc(PBC, 'Art. II.8.2', 43, 'la cual no necesariamente deberá coincidir con la que ofrezca el mayor canon fijo.', 'no necesariamente')],
      ['Si ganás', 'Garantía de cumplimiento de 12 cánones y de ejecución de la inversión por ' + money(p.garantiaEjec) + ' en 5 días hábiles; seguros con responsabilidad civil mínima de USD 1 millón.', sc(PBC, 'Art. III.3 a)', 47, 'Garantía de Cumplimiento del Contrato equivalente a doce (12) Cánones Fijos Mensuales.', 'doce (12) Cánones Fijos Mensuales')],
      ['Jurisdicción', 'Tribunales ordinarios de la ciudad de Rosario.', sc(PBC, 'Art. I.10', 14, 'las partes se someterán voluntariamente a la jurisdicción de los Tribunales Ordinarios de la ciudad de Rosario', 'Tribunales Ordinarios de la ciudad de Rosario')]
    ];
  }

  V.pliego = function (l) {
    var cur = Store.etapa(l), T = V.tareas(l), tc = Store.T(l), rs = Store.reqs(l), fo = Store.folios(l), ro = Store.bloqueada(l);

    /* 1. pasos a completar, por etapa */
    var pasos = Store.ETAPAS.slice(1).map(function (e) {
      var ts = T[e.n] || [], hechas = ts.filter(function (t) { return V.tareaHecha(l, t); }).length;
      var estado = e.n < cur ? UI.pill('Hecha', 'ok') : e.n === cur ? UI.pill('Etapa actual', 'info') : UI.pill('Próxima', 'muted');
      var extra = e.n === 3 ? '<div class="row wrap" style="gap:6px;margin:8px 0 2px">' + tc.orden.map(function (k) { var a = rs.filter(function (r) { return r.carpeta === k; }); return '<a class="tag" style="text-decoration:none" href="#/l/' + l.id + '/requisitos">' + esc(UI.carpeta[k]) + ' ' + a.filter(function (r) { return r.estado === 'listo'; }).length + '/' + a.length + '</a>'; }).join('') + '<span class="tag">' + fo.total + ' páginas</span></div>' : '';
      var items = ts.map(function (t) {
        var d = V.tareaHecha(l, t);
        return '<li style="display:flex;gap:8px;align-items:flex-start"><span class="' + (d ? 'ok' : 'muted') + '" style="width:16px;flex:none;font-weight:700;color:' + (d ? 'var(--ok)' : 'var(--line)') + '">' + (d ? '✓' : '○') + '</span><span>' + esc(t.t) + '</span></li>';
      }).join('');
      return '<details class="card etapa"' + (e.n === cur || e.n === 3 ? ' open' : '') + '><summary><span class="n">' + e.n + '</span><span style="flex:1"><b class="ink">' + esc(e.t) + '</b><span class="muted" style="display:block;font-size:13px">' + esc(e.d) + '</span></span><span class="muted" style="font-size:13px">' + hechas + ' de ' + ts.length + '</span>' + estado + '</summary>' +
        '<div style="padding:12px 18px 16px">' + extra + '<ul style="list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px;font-size:13.5px">' + items + '</ul><p style="margin:10px 0 0"><a href="#/l/' + l.id + '/' + (e.n === 3 ? 'requisitos' : 'seguimiento') + '">' + (e.n === 3 ? 'Ver el checklist' : 'Ver el seguimiento') + ' →</a></p></div></details>';
    }).join('');

    /* 2. condiciones */
    var conds = condiciones(l).map(function (c) {
      return '<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="ink" style="font-weight:600">' + esc(c[0]) + '</div><div style="font-size:13.5px">' + esc(c[1]) + ' ' + c[2] + '</div></div>';
    }).join('');

    /* 3. plazos generales: todo lo que tiene un plazo o una fecha, en orden de etapa */
    var filas = '';
    Store.ETAPAS.slice(1).forEach(function (e) {
      (T[e.n] || []).filter(function (t) { return t.fecha || (t.plazo && /\d/.test(t.plazo)); }).forEach(function (t) {
        var hecha = V.tareaHecha(l, t);
        filas += '<tr><td class="muted" style="width:46px">' + e.n + '</td><td>' + esc(t.t) + '</td><td>' + esc(t.plazo || '') + '</td><td class="num" style="white-space:nowrap">' + (t.fecha ? UI.date(t.fecha) + (hecha ? ' ' + UI.pill('Hecha', 'ok') : (Store.daysLeft(t.fecha) < 0 ? ' ' + UI.pill('Pasó', 'muted') : '<div class="muted" style="font-size:12px">' + UI.countdown(t.fecha) + '</div>')) : '<span class="muted">según el avance</span>') + '</td><td>' + (t.src || '') + '</td></tr>';
      });
    });
    var plazos = '<div class="card" style="overflow-x:auto"><table class="t"><thead><tr><th>Etapa</th><th>Qué</th><th>Plazo</th><th>Fecha</th><th></th></tr></thead><tbody>' + filas + '</tbody></table></div>';

    /* empresa que presenta y cuanto de lo que pide el pliego ya esta cargado en Mi empresa */
    var emp = Store.empresaDe(l), tipos = [];
    rs.forEach(function (r) { if (r.origen === 'biblioteca' && r.docTipo && tipos.indexOf(r.docTipo) < 0) tipos.push(r.docTipo); });
    var faltan = tipos.filter(function (t) { return !Store.tieneDoc(emp.id, t); }), tienen = tipos.length - faltan.length;
    var opts = Store.get().empresas.map(function (e) { return '<option value="' + e.id + '"' + (e.id === emp.id ? ' selected' : '') + '>' + esc(e.razon.replace(/\s*\(ficticia\)/, '')) + '</option>'; }).join('');
    var cardEmp = '<div class="card pad row sb wrap" style="margin-bottom:16px;gap:16px"><label class="f" style="min-width:280px;flex:1">Empresa que presenta<select data-licemp="1"' + (ro ? ' disabled' : '') + '>' + opts + '</select></label>' +
      '<div style="flex:2;min-width:260px"><div class="ink" style="font-weight:600">' + tienen + ' de ' + tipos.length + ' tipos de documento que pide este pliego ya están en Mi empresa</div><div class="muted" style="font-size:13px">' + (faltan.length ? 'Faltan: ' + faltan.map(function (t) { return esc(Store.NOMBRE_DOC[t] || t); }).join(', ') + '.' : 'Se pueden adjuntar todos de una vez.') + ' Los datos de la sociedad completan las notas y declaraciones.</div></div>' +
      '<div class="row wrap"><button class="btn primary" data-act="completar-empresa"' + (ro ? ' disabled' : '') + '>Completar con los datos de Mi empresa</button><a class="btn" href="#/empresa/' + emp.id + '">Abrir Mi empresa</a></div></div>';
    return cardEmp + '<div class="row sb wrap" style="margin-bottom:16px"><div><h2>Resumen previo del pliego</h2><p class="muted">Qué hay que completar, bajo qué condiciones y en qué plazos. Para leer antes de empezar' + (ro ? ' o para consultar lo presentado' : '') + '.</p></div>' +
      '<div class="row wrap"><button class="btn" data-act="imprimir">Imprimir resumen</button><a class="btn primary" href="#/l/' + l.id + '/' + (ro ? 'resumen' : 'requisitos') + '">' + (ro ? 'Ver la oferta completa' : 'Empezar a armar') + '</a></div></div>' +
      '<div class="grid cols-2"><div><h3 style="margin-bottom:10px">1 · Pasos a completar</h3>' + pasos + '</div>' +
      '<div><h3 style="margin-bottom:6px">2 · Condiciones generales</h3><div class="card pad" style="padding-top:4px;padding-bottom:4px">' + conds + '</div></div></div>' +
      '<h3 style="margin:22px 0 10px">3 · Plazos generales</h3>' + plazos +
      '<p class="muted" style="margin-top:10px;font-size:13px">Las fechas se calculan con la fecha de presentación y los plazos del pliego. Las posteriores a la adjudicación aparecen cuando las cargás en Seguimiento.</p>';
  };
})();
