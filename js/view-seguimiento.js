/* Seguimiento del proceso completo: convocatoria, presentacion, apertura, adjudicacion y ejecucion.
   Los plazos salen del pliego de Mangrullo y se calculan a partir de las fechas que se van cargando. */
(function () {
  var esc = UI.esc, money = UI.money;
  var V = window.Views = window.Views || {};
  var P = Store.PBC;

  function src(ref, pag, texto, mark) { return V.srcBtn({ doc: P, ref: ref, pag: pag, texto: texto, mark: mark }); }
  function dmy(d) { return d ? UI.date(d) : ''; }

  /* tareas por etapa; "auto" las marca el sistema segun lo ya cargado */
  V.tareas = function (l) {
    if (V.TV[Store.T(l).oferta]) return V.TV[Store.T(l).oferta].tareas(l);
    var s = Store.seg(l), f = l.fechas, p = l.params, o = l.oferta, c = Store.canon(l), A = s.adjudicacion, T = s.tenencia, pr = Store.progress(l);
    var hab = function (base, n) { return base ? Store.addBusinessDays(base, n) : ''; };
    var sinBloqueos = Store.bloqueantes(l).length === 0;
    return {
      2: [
        { id: 't2a', t: 'Descargar el pliego, los anexos y las circulares del portal del ENAPRO', plazo: 'Sin costo', src: src('Art. II.3', 19, 'El Pliego se encuentra a disposición de los interesados para su consulta y descarga en el portal web del ENAPRO, sin costo alguno.', 'sin costo alguno') },
        { id: 't2b', t: 'Enviar las consultas por correo electrónico', plazo: '7 días hábiles antes de la apertura', fecha: hab(f.apertura, -7), src: src('Art. II.3', 19, 'Los Interesados podrán formular consultas al correo electrónico hasta siete (7) días previos a la fecha fijada para la apertura de las ofertas.', 'siete (7) días previos') },
        { id: 't2c', t: 'Revisar las circulares y actualizar el checklist', plazo: 'Se emiten hasta 2 días hábiles antes de la presentación', fecha: hab(f.apertura, -2), src: src('Art. II.3', 19, 'Las Circulares serán emitidas con dos (2) días como mínimo de anticipación a la fecha fijada para la presentación de las ofertas.', 'dos (2) días como mínimo') },
        { id: 't2d', t: 'Coordinar y hacer la visita técnica obligatoria', plazo: 'Antes de presentar; la acredita el Certificado de Visita', fecha: f.visita, src: src('Art. II.5.1 n)', 29, 'La visita técnica al Predio será obligatoria y deberá efectuarse con anterioridad a la presentación de la Oferta.', 'obligatoria') }
      ],
      3: [
        { id: 't3a', t: 'Completar los requisitos del sobre (' + pr.done + ' de ' + pr.total + ')', plazo: 'Antecedentes, oferta técnica y oferta económica', auto: pr.done === pr.total },
        { id: 't3b', t: 'Constituir la garantía de mantenimiento de oferta (' + money(p.garantiaOferta) + ')', plazo: 'Vigente hasta apertura + ' + p.mantenimiento + ' días', auto: !!o.garantiaConstituida, src: src('Art. II.6', 38, 'una garantía de mantenimiento de la misma o la constancia de haberla constituido, por el monto de $40.000.000 (pesos cuarenta millones).', 'monto de $40.000.000') },
        { id: 't3c', t: 'Pasar la revisión final sin puntos bloqueantes', plazo: 'Canon, inversión, indicadores, garantía y vigencias', auto: sinBloqueos },
        { id: 't3d', t: 'Entregar el sobre único en las oficinas del ENAPRO', plazo: 'Lunes a viernes de 9 a 15 h, hasta la hora de apertura', fecha: f.apertura, auto: !!l.presentada, src: src('Art. II.7', 40, 'en las Oficinas del ENAPRO, de lunes a viernes en el horario de 9:00 a 15:00 horas hasta el día y hora de la apertura de ofertas.', 'de 9:00 a 15:00 horas') }
      ],
      4: [
        { id: 't4a', t: 'Asistir al acto de apertura y firmar el acta si se desea', plazo: 'Acta notarial con número de oferta y cantidad de hojas', fecha: f.apertura, src: src('Art. II.7', 41, 'Del resultado del acto se labrará un acta notarial donde se dejará constancia del nombre de cada oferente, del número que corresponde a su oferta y de la cantidad de hojas.', 'acta notarial') },
        { id: 't4b', t: 'Entregar el original de la garantía en el Departamento de Asuntos Legales', plazo: 'Dentro de las 24 h de la apertura; si no, se desestima', fecha: f.apertura ? Store.addDaysTo(f.apertura, 1) : '', src: src('Art. II.6', 40, 'El original o el certificado de la garantía constituida deberá ser entregada en el Departamento de Asuntos Legales del ENAPRO, dentro del plazo de 24 horas.', 'dentro del plazo de 24 horas') },
        { id: 't4c', t: 'Responder los pedidos de aclaración de la Comisión', plazo: '48 horas desde la notificación; solo precisan lo ya presentado', src: src('Art. II.8.1', 41, 'Los Oferentes estarán obligados a responder los pedidos de aclaración dentro de las cuarenta y ocho (48) horas contadas desde su notificación fehaciente.', 'cuarenta y ocho (48) horas') },
        { id: 't4d', t: 'Decidir si se mejora la oferta cuando la Comisión lo solicite', plazo: 'Solo puede subir el canon; el silencio mantiene la oferta original', src: src('Art. II.8.3', 43, 'La mejora sólo podrá consistir en un incremento del Canon Fijo Mensual. El silencio del Oferente invitado a mejorar se considerará como mantenimiento de su oferta original.', 'incremento del Canon Fijo Mensual') },
        { id: 't4e', t: 'Presentar observaciones si corresponde', plazo: 'No suspenden los plazos del procedimiento', src: src('Art. II.11', 44, 'La interposición de las mismas en ningún caso suspenderá los plazos del procedimiento.', 'ningún caso suspenderá los plazos') },
        { id: 't4f', t: 'Renovar o retirar la oferta antes de los ' + p.mantenimiento + ' días', plazo: 'Se renueva sola, salvo aviso con 10 días corridos de antelación', fecha: f.apertura ? Store.addDaysTo(f.apertura, p.mantenimiento - 10) : '', src: src('Art. II.6', 39, 'las ofertas serán renovadas automáticamente por idéntico plazo, de no mediar notificación expresa en contrario de parte de los oferentes con una antelación de DIEZ (10) días corridos.', 'renovadas automáticamente') },
        { id: 't4g', t: 'Recibir el dictamen de la Comisión (orden de mérito)', plazo: 'Es no vinculante: decide el Consejo Directivo', src: src('Art. II.8.1', 42, 'La Comisión Evaluadora elaborará un Dictamen. Dicho informe contendrá un orden de mérito.', 'orden de mérito') }
      ],
      5: [
        { id: 't5a', t: 'Recibir la notificación de la adjudicación', plazo: 'El ENAPRO notifica dentro de los 3 días de resuelto', src: src('Art. II.8.2', 43, 'La adjudicación será notificada al adjudicatario y al resto de los oferentes, dentro de los tres (3) días de resuelto el acto respectivo.', 'tres (3) días') },
        { id: 't5b', t: 'Desistir de los litigios contra el ENAPRO, si los hubiera', plazo: '10 días hábiles de notificada la adjudicación', fecha: hab(A, 10), src: src('Art. II.5.1 f)', 25, 'quedará condicionada a que el adjudicatario desista, en forma expresa e irrevocable, tanto de la acción como del proceso en trámite, dentro del plazo de diez (10) días hábiles.', 'diez (10) días hábiles') },
        { id: 't5c', t: 'Constituir la garantía de cumplimiento del contrato (' + money(c.garantiaCumplimiento) + ', 12 cánones)', plazo: '5 días hábiles de notificada la adjudicación', fecha: hab(A, 5), src: src('Art. III.3 a)', 48, 'La garantía deberá constituirse dentro del término de cinco (5) días hábiles de notificada la adjudicación y, en todos los casos, como condición previa a la firma del Contrato de Concesión.', 'cinco (5) días hábiles') },
        { id: 't5d', t: 'Constituir la garantía de ejecución de la inversión (' + money(p.garantiaEjec) + ')', plazo: '5 días hábiles de notificada la adjudicación', fecha: hab(A, 5), src: src('Art. III.3 b)', 49, 'La Garantía de Ejecución de la Inversión deberá constituirse dentro del término de cinco (5) días hábiles de notificada la adjudicación.', 'cinco (5) días hábiles') },
        { id: 't5e', t: 'Acreditar la constitución del Concesionario (sociedad o UT)', plazo: '20 días hábiles de notificada la adjudicación', fecha: hab(A, 20), src: src('Art. III.1', 44, 'Dentro de los veinte (20) días hábiles de producida la notificación de la adjudicación el adjudicatario deberá acreditar la formalización del Concesionario.', 'veinte (20) días hábiles') },
        { id: 't5f', t: 'Presentar los modelos de pólizas de seguro para su aprobación', plazo: '15 días antes de su vigencia; responsabilidad civil mínima USD 1 millón', src: src('Art. IV.13', 76, 'quince (15) días antes del inicio de su vigencia, los modelos de pólizas serán entregados al ENAPRO para su consideración.', 'quince (15) días antes') },
        { id: 't5g', t: 'Firmar el contrato de concesión', plazo: 'Dentro de 30 días hábiles; el ENAPRO avisa con 5 días hábiles de anticipación', fecha: hab(A, 30), src: src('Art. III.2', 47, 'El Contrato de Concesión se suscribirá dentro de los treinta (30) días hábiles de notificada la adjudicación.', 'treinta (30) días hábiles') },
        { id: 't5h', t: 'Recuperar la garantía de mantenimiento de oferta', plazo: '10 días de firmado el contrato y constituida la garantía de cumplimiento', src: src('Art. II.6', 39, 'La garantía del adjudicatario será devuelta dentro de los diez (10) días de firmado el Contrato de Concesión.', 'diez (10) días') }
      ],
      6: [
        { id: 't6a', t: 'Replanteo, inventario y acta de entrega de tenencia', plazo: 'Dentro de los 10 días de la firma; desde acá corren los plazos', fecha: T, auto: !!T, src: src('Art. III.5', 52, 'Dentro de los diez (10) días contados a partir de la firma del Contrato de Concesión, el ENAPRO procederá a poner al Concesionario en tenencia del Predio. Los plazos de la concesión se computan desde la Fecha de Entrega de Tenencia.', 'Fecha de Entrega de Tenencia') },
        { id: 't6b', t: 'Pagar el canon del 1 al 5 de cada mes, por adelantado', plazo: 'Bonificado 100 % los meses 1–12 y 50 % los meses 13–24', src: src('Art. IV.4 a)', 62, 'se abonará por mes adelantado, en pesos, en cuotas mensuales y consecutivas pagaderas del 1 al 5 de cada mes, con la bonificación prevista en el inciso c).', 'del 1 al 5 de cada mes') },
        { id: 't6c', t: 'Contratar y mantener los seguros (RC con cláusula cruzada)', plazo: 'Desde la entrega de tenencia y todo el plazo', src: src('Art. IV.13', 75, 'El Concesionario contará, desde la entrega de tenencia y durante todo el período de la concesión, con un seguro de responsabilidad civil a nombre conjunto del Concesionario y del ENAPRO.', 'desde la entrega de tenencia') },
        { id: 't6d', t: 'Ejecutar la inversión mínima con certificados de obra', plazo: 'Hasta 30 meses desde la entrega de tenencia', fecha: T ? Store.addMonths(T, p.plazoObraMax) : '', src: src('Art. IV.12', 74, 'el ENAPRO verificará el cumplimiento de la Inversión Mínima Obligatoria, en moneda constante conforme el Art. II.5.3 a), y el cumplimiento del cronograma.', 'Inversión Mínima Obligatoria') },
        { id: 't6e', t: 'Presentar informes: trimestrales y balance anual', plazo: 'Trimestral: 10 días hábiles luego del trimestre. Anual: 5 meses del cierre', src: src('Art. IV.3', 60, 'Con frecuencia trimestral (a más tardar diez (10) días hábiles luego de finalizado el trimestre).', 'frecuencia trimestral') },
        { id: 't6f', t: 'Recuperar la garantía de ejecución de la inversión', plazo: 'Cuando el ENAPRO certifique la inversión mínima', src: src('Art. III.3 b)', 49, 'La garantía deberá mantenerse vigente desde su constitución y hasta que el ENAPRO verifique y certifique el cumplimiento íntegro de la Inversión Mínima Obligatoria.', 'certifique el cumplimiento íntegro') },
        { id: 't6g', t: 'Solicitar la prórroga, si se quiere', plazo: 'Con 18 meses de antelación como mínimo al vencimiento', fecha: T ? Store.addMonths(T, p.plazoConcesion * 12 - 18) : '', src: src('Art. I.7', 11, 'La Concesionaria podrá solicitar la Prórroga con una antelación no menor a dieciocho (18) meses al vencimiento del plazo contractual.', 'dieciocho (18) meses') },
        { id: 't6h', t: 'Reintegrar el predio al vencer el plazo de ' + p.plazoConcesion + ' años', plazo: 'Dentro de los 10 días corridos de extinguido el contrato', fecha: T ? Store.addMonths(T, p.plazoConcesion * 12) : '', src: src('Art. I.6', 11, 'El Predio deberá ser entregado dentro de los diez (10) días corridos de extinguido el contrato, en las condiciones establecidas en el presente Pliego.', 'diez (10) días corridos') }
      ]
    };
  };

  V.tareaHecha = function (l, t) { return t.auto !== undefined ? t.auto : !!Store.seg(l).tareas[t.id]; };

  function filaTarea(l, t) {
    var done = V.tareaHecha(l, t), tone = t.fecha && !done ? UI.urgency(t.fecha) : '';
    var chk = t.auto !== undefined
      ? '<span class="stbtn ' + (done ? 'listo' : '') + '" title="Se marca solo según lo cargado" style="cursor:default">✓</span>'
      : '<button class="stbtn ' + (done ? 'listo' : '') + '" data-act="tarea" data-id="' + t.id + '" aria-label="' + (done ? 'Hecha' : 'Pendiente') + '">✓</button>';
    var cg = Store.seg(l).cargas && Store.seg(l).cargas[t.id];
    return '<div class="req" style="grid-template-columns:34px 1fr auto auto auto">' + chk +
      '<div><div class="t">' + esc(t.t) + '</div><div class="d">' + esc(t.plazo || '') + '</div>' + (cg && (cg.archivos.length || cg.nota) ? '<div style="margin-top:4px">' + V.cargaMarcas(cg) + '</div>' : '') + '</div>' +
      '<div class="right">' + (t.fecha ? '<div class="ink num" style="font-weight:600">' + dmy(t.fecha) + '</div>' + (done ? '' : '<div style="font-size:12.5px" class="' + (tone === 'bad' ? '' : 'muted') + '">' + (tone === 'bad' ? UI.pill(UI.countdown(t.fecha), 'bad') : UI.countdown(t.fecha)) + '</div>') : '') + '</div>' +
      '<div>' + (t.src || '') + '</div><div><button class="btn sm" data-act="cargar-tarea" data-id="' + esc(t.id) + '">Cargar / editar</button></div></div>';
  }

  function consultas(l) {
    var s = Store.seg(l);
    var cs = s.consultas.map(function (q) {
      return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row sb"><span class="muted" style="font-size:12.5px">' + UI.date(q.fecha) + '</span>' + UI.pill(q.estado === 'respondida' ? 'Respondida' : 'Enviada', q.estado === 'respondida' ? 'ok' : 'warn') + '</div><div class="ink">' + esc(q.texto) + '</div>' + (q.resp ? '<div class="muted" style="font-size:13px;margin-top:2px">↳ ' + esc(q.resp) + '</div>' : '') + '</div>';
    }).join('') || '<p class="muted" style="padding:8px 0">Todavía no enviaste consultas.</p>';
    var ci = s.circulares.map(function (c) {
      return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row sb"><b class="ink">Circular N° ' + c.n + '</b><span class="muted" style="font-size:12.5px">' + UI.date(c.fecha) + '</span></div><div class="muted" style="font-size:13px">' + esc(c.resumen) + '</div></div>';
    }).join('') || '<p class="muted" style="padding:8px 0">No se registraron circulares.</p>';
    return '<div class="grid cols-eq" style="margin-top:14px"><div><h3 style="margin-bottom:4px">Consultas</h3>' + cs +
      '<div class="row" style="margin-top:10px"><input type="text" id="nueva-consulta" placeholder="Escribí la consulta para el ENAPRO"><button class="btn sm" data-act="add-consulta">Registrar</button></div></div>' +
      '<div><h3 style="margin-bottom:4px">Circulares</h3>' + ci +
      '<div class="row" style="margin-top:10px"><input type="text" id="nueva-circular" placeholder="Qué cambia la circular"><button class="btn sm" data-act="add-circular">Registrar</button></div>' +
      '<p class="muted" style="font-size:12.5px;margin-top:6px">En la versión real, subir la circular recalcula el checklist y marca lo que cambió.</p></div></div>';
  }

  function aperturaYMejora(l) {
    var s = Store.seg(l), a = s.apertura, c = Number(l.oferta.canon) || l.params.canonBase, piso = Math.max(l.params.canonBase, c);
    var m = Number(s.mejora), okM = m >= piso, orden = ['', '1.º', '2.º', '3.º', '4.º', '5.º'].map(function (x, i) { return '<option value="' + i + '"' + (String(a.orden || 0) === String(i) ? ' selected' : '') + '>' + (i ? 'Puesto ' + x : 'Sin dictamen todavía') + '</option>'; }).join('');
    return '<div class="grid cols-eq" style="margin-top:14px"><div class="card pad stack" style="box-shadow:none"><h3 style="margin:0">Resultado del acto de apertura</h3>' +
      '<div class="grid cols-eq"><label class="f">N° de tu oferta<input type="number" min="0" data-segap="nro" value="' + esc(a.nro || '') + '"></label><label class="f">Ofertas presentadas<input type="number" min="0" data-segap="oferentes" value="' + esc(a.oferentes || '') + '"></label></div>' +
      '<div class="grid cols-eq"><label class="f">Hojas de tu sobre<input type="text" readonly value="' + Store.folios(l).total + '"></label><label class="f">Orden de mérito<select data-segap="orden">' + orden + '</select></label></div></div>' +
      '<div class="card pad stack" style="box-shadow:none"><div class="row sb"><h3 style="margin:0">Mejora de la oferta</h3>' + (m ? UI.pill(okM ? 'Válida' : 'No válida', okM ? 'ok' : 'bad') : UI.pill('Sin pedido', 'muted')) + '</div>' +
      '<label class="f">Nuevo canon mensual<input type="number" min="0" data-seg="mejora" value="' + (s.mejora === '' ? '' : esc(s.mejora)) + '" placeholder="' + c + '"></label>' +
      '<p class="muted" style="font-size:13px">Solo puede subir el canon: no puede ser menor al Canon Base ni a tu canon actual (' + money(piso) + '). Si no hay respuesta, queda tu oferta original.</p>' +
      '<div class="row"><button class="btn sm primary" data-act="aplicar-mejora"' + (m && okM ? '' : ' disabled') + '>Aplicar al canon de la oferta</button>' + (s.canonOriginal ? '<span class="muted" style="font-size:13px">Canon original: ' + money(s.canonOriginal) + '</span>' : '') + '</div></div></div>';
  }

  function adjudicacion(l) {
    var s = Store.seg(l), c = Store.canon(l);
    return '<div class="grid cols-eq" style="margin-top:14px"><label class="f">Fecha de notificación de la adjudicación<input type="date" data-seg="adjudicacion" value="' + esc(s.adjudicacion) + '"></label>' +
      '<div class="banner info" style="margin:0"><span>$</span><span>Al ganar hay que tener listos <b>' + money(c.garantiaCumplimiento + l.params.garantiaEjec) + '</b> en garantías (cumplimiento + ejecución de la inversión), más los seguros. Cargá la fecha y los plazos de abajo se calculan solos.</span></div></div>';
  }

  function ejecucion(l) {
    var s = Store.seg(l), p = l.params, c = Store.canon(l), T = s.tenencia, inv = Number(s.invertido) || 0, pct = Math.min(100, Math.round(100 * inv / p.inversionMin));
    var fila = function (a, b, m) { return '<tr><td>' + a + '</td><td>' + b + '</td><td class="right num">' + money(m) + '</td></tr>'; };
    var dd = function (n) { return T ? ' · hasta ' + UI.date(Store.addMonths(T, n)) : ''; };
    return '<div class="grid cols-eq" style="margin-top:14px"><div class="stack"><label class="f">Fecha de entrega de tenencia<input type="date" data-seg="tenencia" value="' + esc(T) + '"></label>' +
      '<label class="f">Inversión certificada hasta hoy (pesos, a valores de apertura)<input type="number" min="0" data-seg="invertido" value="' + (s.invertido === '' ? '' : esc(s.invertido)) + '" placeholder="0"></label>' +
      '<div><div class="row sb" style="font-size:13px"><span class="muted">Avance de la inversión mínima</span><b class="ink">' + pct + ' % de ' + money(p.inversionMin) + '</b></div><div class="bar wide" style="margin-top:4px"><i style="width:' + pct + '%"></i></div></div></div>' +
      '<div><table class="t"><thead><tr><th>Período</th><th>Bonificación</th><th class="right">Canon mensual</th></tr></thead><tbody>' +
      fila('Meses 1–12' + dd(12), '100 %', 0) + fila('Meses 13–24' + dd(24), '50 %', c.mensualAno2) + fila('Desde el mes 25', '—', c.canon) + '</tbody></table>' +
      '<p class="muted" style="font-size:12.5px;margin-top:6px">A valores de apertura; cada mes se actualiza por CER.</p></div></div>';
  }

  var EXTRA = { 2: consultas, 4: aperturaYMejora, 5: adjudicacion, 6: ejecucion };
  V.extraConsultas = consultas;

  /* qué etapas dejó abiertas la persona: se conserva al volver a dibujar la pantalla tras cargar algo */
  V.etapasAbiertas = {};
  document.addEventListener('toggle', function (ev) { var d = ev.target; if (d && d.dataset && d.dataset.etapa) V.etapasAbiertas[d.dataset.etapa] = d.open; }, true);

  V.seguimiento = function (l) {
    var cur = Store.etapa(l), T = V.tareas(l), sec = '', EX = V.TV[Store.T(l).oferta] ? V.TV[Store.T(l).oferta].extras : EXTRA;
    Store.ETAPAS.slice(1).forEach(function (e) {
      var ts = T[e.n], hechas = ts.filter(function (t) { return V.tareaHecha(l, t); }).length;
      var pill = e.n < cur ? (hechas === ts.length ? UI.pill('Hecha', 'ok') : UI.pill('Quedan pendientes', 'warn')) : e.n === cur ? UI.pill('Etapa actual', 'info') : UI.pill('Próxima', 'muted');
      var clave = l.id + ':' + e.n, abierta = clave in V.etapasAbiertas ? V.etapasAbiertas[clave] : e.n === cur;
      sec += '<details class="card etapa" data-etapa="' + clave + '"' + (abierta ? ' open' : '') + '><summary><span class="n">' + e.n + '</span><span style="flex:1"><b class="ink">' + esc(e.t) + '</b><span class="muted" style="display:block;font-size:13px">' + esc(e.d) + '</span></span><span class="muted" style="font-size:13px">' + hechas + ' de ' + ts.length + '</span>' + pill + '</summary><div class="etapa-b">' +
        ts.map(function (t) { return filaTarea(l, t); }).join('') + (EX[e.n] ? '<div style="padding:0 16px 16px">' + EX[e.n](l) + '</div>' : '') + '</div></details>';
    });
    var pend = T[cur] ? T[cur].filter(function (t) { return !V.tareaHecha(l, t); }) : [];
    var sig = cur < 6 ? Store.ETAPAS[cur] : null;
    var ahora = '<div class="card pad" style="margin-bottom:16px"><div class="row sb wrap"><div><div class="muted" style="font-size:12.5px;text-transform:uppercase;letter-spacing:.05em">Dónde estás</div><h2 style="margin-top:2px">Etapa ' + cur + ' · ' + esc(Store.ETAPAS[cur - 1].t) + '</h2></div>' +
      '<div class="row wrap"><button class="btn primary" data-act="recorrido">Simular el recorrido completo</button>' + (sig ? '<button class="btn" data-act="avanzar">Pasar a la etapa ' + sig.n + '</button>' : '') + '</div></div>' +
      (pend.length ? '<p class="muted" style="margin-top:10px">Lo próximo: ' + pend.slice(0, 3).map(function (t) { return '<b class="ink">' + esc(t.t) + '</b>'; }).join(' · ') + '</p>' : '<p class="muted" style="margin-top:10px">Todo lo de esta etapa está hecho.</p>') + '</div>';
    return ahora + sec;
  };
})();
