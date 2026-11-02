/* Detalle de una licitacion: resumen, archivos, requisitos, armado, oferta y revision. */
(function () {
  var esc = UI.esc, money = UI.money;
  var V = window.Views = window.Views || {};
  V.RO_TABS = ['resumen', 'archivos', 'requisitos', 'armado', 'oferta', 'revision'];   /* pestañas que se bloquean en una licitación presentada */
  var TABS = [['pliego', 'Pliego'], ['resumen', 'Resumen'], ['archivos', 'Archivos'], ['requisitos', 'Requisitos'], ['armado', 'Armado'], ['oferta', 'Oferta'], ['revision', 'Revisión'], ['seguimiento', 'Seguimiento']];

  /* registro de fuentes: el boton "§" abre el panel con el texto del pliego */
  V.srcs = [];
  V.TV = {};   /* vistas por tipo de oferta (lotes): resumen, oferta, reglas, portada, tareas, extras */
  function srcBtn(src) {
    V.srcs.push(src);
    return '<button class="src" data-act="src" data-i="' + (V.srcs.length - 1) + '" title="Ver el texto del pliego">' + esc(src.ref) + ' · p. ' + src.pag + '</button>';
  }
  V.srcBtn = srcBtn;
  function S(doc, ref, pag, texto, mark) { return { doc: doc, ref: ref, pag: pag, texto: texto, mark: mark }; }

  /* linea de tiempo con los hitos del cronograma, espaciados parejo; "hoy" se ubica entre dos hitos segun la fecha */
  function lineaTiempo(l) {
    var ev = Store.cronograma(l), n = ev.length, hoy = Store.inDays(0);
    if (n < 2) return '';
    var pos, sig = -1;
    ev.forEach(function (e, i) { if (sig < 0 && e.date >= hoy) sig = i; });
    if (sig === 0) pos = -0.35;
    else if (sig < 0) pos = n - 1 + 0.35;
    else {
      var a = ev[sig - 1].date, b = ev[sig].date, span = Store.daysLeft(b) - Store.daysLeft(a);
      pos = sig - 1 + (span ? (0 - Store.daysLeft(a)) / span : 0);
    }
    var left = ((pos + 0.5) / n * 100).toFixed(2);
    var items = ev.map(function (e, i) {
      var past = e.date < hoy, cls = (past ? 'past ' : '') + (e.key ? 'key ' : '') + (i === sig ? 'next' : '');
      return '<li class="' + cls + '" title="' + esc(e.label + ' · ' + e.nota) + '"><span class="dot"></span><b>' + esc(e.corto) + '</b><span class="d">' + UI.dateLong(e.date) + (e.hora ? ' · ' + e.hora + ' h' : '') + '</span><span class="c">' + (past ? 'Pasó' : UI.countdown(e.date)) + '</span></li>';
    }).join('');
    return '<div class="tl-wrap" aria-label="Línea de tiempo"><div class="tl" style="--n:' + n + '"><div class="tl-track"><i style="width:' + left + '%"></i></div><span class="tl-hoy" style="left:' + left + '%">Hoy</span><ol>' + items + '</ol></div></div>';
  }

  /* las seis etapas de una licitacion; la 1 la hace la entidad */
  function etapas(l) {
    var cur = Store.etapa(l);
    return '<ol class="etapas" aria-label="Etapas del proceso">' + Store.ETAPAS.map(function (e) {
      var c = e.ext ? 'ext' : e.n < cur ? 'done' : e.n === cur ? 'now' : 'todo';
      var tab = e.n === 3 ? 'requisitos' : 'seguimiento';
      var inner = '<span class="n">' + (c === 'done' ? '✓' : e.n) + '</span><span class="t">' + esc(e.t) + '</span>' + (e.ext ? '<span class="s">Lo hace la entidad</span>' : '');
      return '<li class="' + c + '">' + (e.ext ? inner : '<a href="#/l/' + l.id + '/' + tab + '">' + inner + '</a>') + '</li>';
    }).join('') + '</ol>';
  }

  V.fuente = function (src) {
    var t = esc(src.texto), m = esc(src.mark);
    if (m && t.indexOf(m) > -1) t = t.replace(m, '<mark>' + m + '</mark>');
    return '<p class="muted" style="font-size:12.5px;text-transform:uppercase;letter-spacing:.05em">Fuente</p>' +
      '<h2 style="margin:4px 0 2px">' + esc(src.ref) + '</h2><p class="muted">' + esc(src.doc) + ' · página ' + src.pag + '</p>' +
      '<div class="pdfpage"><span class="pn">Página ' + src.pag + '</span>…' + t + '…</div>' +
      '<p class="muted" style="margin-top:14px;font-size:13px">Cada requisito del checklist se liga a su artículo. Si llega una circular que lo cambia, se marca la diferencia.</p>';
  };

  V.detalle = function (l, tab) {
    V.srcs = [];
    var p = Store.progress(l), est = UI.estadoLic[l.estado], analizada = l.requisitos.length > 0;
    var bloq = analizada ? Store.bloqueantes(l).length : 0, left = l.fechas.apertura ? Store.daysLeft(l.fechas.apertura) : null;
    var u = left == null ? 'ok' : UI.urgency(l.fechas.apertura);

    var hero = '<a class="crumb" href="#/">← Licitaciones</a><div class="card hero">' +
      '<div><div class="muted">' + esc(l.nro) + (l.expediente ? ' · ' + esc(l.expediente) : '') + '</div><h1 style="margin:4px 0 2px">' + esc(l.titulo) + '</h1><div class="muted">' + esc(l.organismo) + '</div>' +
      '<div class="meta">' + UI.pill(est[0], est[1]) + '<a class="tag" style="text-decoration:none" href="#/empresa/' + Store.empresaDe(l).id + '" title="Ver Mi empresa">🏢 ' + esc(Store.empresaDe(l).razon.replace(/\s*\(ficticia\)/, '')) + '</a><span class="tag">' + esc(l.tipo) + '</span><span class="tag">' + esc(l.ref.label) + ' ' + (l.ref.texto || money(l.ref.monto)) + '</span>' + (l.params ? Store.T(l).tags(l).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') : '') + '</div></div>' +
      '<div class="cd"><div class="muted">Presentación y apertura</div><div class="big ' + (u === 'ok' ? '' : u) + '">' + (l.presentada ? 'Presentada' : left == null ? 'Sin fecha' : UI.countdown(l.fechas.apertura)) + '</div><div class="muted">' + (left == null ? 'Cargá la fecha del llamado' : UI.dateLong(l.fechas.apertura) + ' · ' + l.fechas.horaPres + ' h') + '</div></div>' +
      '<div>' + UI.ring(p.pct, 72) + '</div>' + (l.params ? lineaTiempo(l) : '') + '</div>';

    var nav = '<nav class="steps" aria-label="Pasos">' + TABS.map(function (t, i) {
      var badge = t[0] === 'revision' && bloq ? '<span class="badge">' + bloq + '</span>' : '';
      return '<a href="#/l/' + l.id + '/' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '"><span class="n">' + (i + 1) + '</span>' + t[1] + badge + '</a>';
    }).join('') + '</nav>';

    var body;
    if (!analizada && tab !== 'archivos') body = sinAnalizar(l);
    else body = ({ pliego: V.pliego, resumen: resumen, archivos: archivos, requisitos: requisitos, armado: armado, oferta: oferta, revision: revision, seguimiento: V.seguimiento }[tab] || resumen)(l);
    var aviso = '';
    if (analizada && l.presentada && V.RO_TABS.indexOf(tab) > -1) {
      aviso = l.editable
        ? '<div class="banner" style="margin-bottom:16px"><span>✎</span><span style="flex:1"><b>Edición habilitada.</b> Esta licitación ya está presentada: lo que cambies no modifica lo entregado.</span><button class="btn sm" data-act="bloquear">Volver a solo lectura</button></div>'
        : '<div class="banner info" style="margin-bottom:16px"><span>🔒</span><span style="flex:1"><b>Oferta presentada: solo lectura.</b> Podés ver toda la información, abrir los documentos y el paquete. Los cambios están bloqueados.</span><button class="btn sm" data-act="desbloquear">Habilitar edición</button></div>';
    }
    return hero + (l.params ? etapas(l) : '') + nav + aviso + body;
  };

  function sinAnalizar(l) {
    if (l.presentada) return '<div class="card empty"><h2>Licitación presentada</h2><p style="margin-top:6px">Esta carga histórica no tiene detalle en el preview.</p></div>';
    return '<div class="card empty"><h2>Todavía no está analizada</h2><p style="margin:6px 0 16px">Subí los archivos del pliego y generamos el checklist, el cronograma y el índice del paquete.</p><a class="btn primary" href="#/l/' + l.id + '/archivos">Ir a Archivos</a></div>';
  }

  /* ---------------- 1. Resumen ---------------- */
  function resumen(l) {
    if (V.TV[Store.T(l).oferta]) return V.TV[Store.T(l).oferta].resumen(l);
    var rs = Store.reqs(l), falta = rs.filter(function (r) { return r.estado !== 'listo'; }), fo = Store.folios(l), par = l.params, c = Store.canon(l);
    function cnt(k) { var a = rs.filter(function (r) { return r.carpeta === k; }); return a.filter(function (r) { return r.estado === 'listo'; }).length + '/' + a.length; }
    var ahora = falta.slice(0, 5).map(function (r) {
      return '<li><span class="i"></span><div style="flex:1"><div class="ink" style="font-weight:600">' + esc(r.titulo) + '</div><div class="muted" style="font-size:13px">' + esc(UI.origen[r.origen]) + ' · ' + r.folios + ' fol. ' + srcBtn(r.src) + '</div></div>' + UI.pill(UI.estadoReq[r.estado][0], UI.estadoReq[r.estado][1]) + '</li>';
    }).join('');

    var adj = [
      ['Acreditar la constitución del Concesionario', '20 días hábiles desde la notificación', S(Store.PBC, 'Art. III.1', 44, 'Dentro de los veinte (20) días hábiles de producida la notificación de la adjudicación el adjudicatario deberá acreditar la formalización del Concesionario.', 'veinte (20) días hábiles')],
      ['Garantía de cumplimiento del contrato', money(c.garantiaCumplimiento) + ' (12 cánones, sin bonificación) · 5 días hábiles', S(Store.PBC, 'Art. III.3 a)', 47, 'Garantía de Cumplimiento del Contrato equivalente a doce (12) Cánones Fijos Mensuales.', 'doce (12) Cánones Fijos Mensuales')],
      ['Garantía de ejecución de la inversión', money(par.garantiaEjec) + ' · 5 días hábiles', S(Store.PBC, 'Art. III.3 b)', 48, 'una Garantía de Ejecución de la Inversión por la suma de PESOS MIL MILLONES ($1.000.000.000).', 'PESOS MIL MILLONES')],
      ['Seguros', 'Responsabilidad civil e incendio; accidentes de trabajo', S(Store.PBC, 'Art. IV.13', 78, 'Seguros: a) Responsabilidad Civil e Incendio; b) Accidentes de trabajo y fallecimiento.', 'Seguros')],
      ['Canon bonificado al inicio', '100 % los meses 1–12 · 50 % los meses 13–24 · pleno desde el 25', S(Store.PBC, 'Art. IV.4 c)', 62, 'durante los primeros doce (12) meses: cien por ciento (100 %); desde el mes trece (13) hasta el mes veinticuatro (24): cincuenta por ciento (50 %).', 'cien por ciento (100 %)')]
    ].map(function (a) { return '<li><span class="i"></span><div style="flex:1"><div class="ink" style="font-weight:600">' + a[0] + '</div><div class="muted" style="font-size:13px">' + a[1] + ' ' + srcBtn(a[2]) + '</div></div></li>'; }).join('');

    var mod = '<div class="row wrap" style="margin:4px 0 16px"><span class="muted">Cómo se presenta:</span>' +
      '<button class="chip ' + (l.modalidad !== 'ut' ? 'on' : '') + '" data-act="modalidad" data-m="individual">Individual</button>' +
      '<button class="chip ' + (l.modalidad === 'ut' ? 'on' : '') + '" data-act="modalidad" data-m="ut">Conjunta (UT / consorcio)</button>' +
      '<span class="muted" style="font-size:13px">' + (l.modalidad === 'ut' ? 'Hasta 5 integrantes; cada uno cumple los requisitos de habilidad.' : 'Con presentación conjunta se suman 4 requisitos.') + '</span></div>';

    return '<div class="grid cols-2"><div class="grid">' +
      '<div class="card pad"><div class="row sb"><h3>Qué hay que armar</h3><a class="btn sm" href="#/l/' + l.id + '/armado">Ir al armado</a></div>' +
      '<div class="grid cols-4" style="margin:6px 0 14px">' + mini('Carpeta 1', 'Antecedentes', cnt('A')) + mini('Carpeta 2', 'Oferta técnica', cnt('T')) + mini('Carpeta 3', 'Oferta económica', cnt('E')) + mini('Folios', 'Sobre único · 2 ejemplares', fo.total) + '</div>' + mod +
      '<h3 style="font-size:14px">' + (falta.length ? 'Lo que falta (' + falta.length + ')' : 'Todo listo') + '</h3>' +
      (falta.length ? '<ul class="todo" style="margin-top:8px">' + ahora + '</ul>' + (falta.length > 5 ? '<p class="muted" style="margin-top:10px">y ' + (falta.length - 5) + ' más en <a href="#/l/' + l.id + '/requisitos">Requisitos</a>.</p>' : '') : '<p class="muted">Pasá a la revisión final.</p>') + '</div>' +
      '<div class="card pad"><h3>Si resultás adjudicatario</h3><p class="muted" style="margin:-4px 0 10px;font-size:13px">Lo que viene después, con plazos cortos. Conviene tenerlo previsto desde la oferta.</p><ul class="todo">' + adj + '</ul></div></div>' +
      '<div class="grid"><div class="card pad"><h3>Fechas del llamado</h3><p class="muted" style="margin:-4px 0 12px;font-size:13px">La línea de tiempo de arriba se arma con esta fecha: el resto sale de los plazos del pliego. Pasá el mouse por cada hito para ver el detalle.</p>' +
      '<label class="f">Fecha de apertura (la trae el aviso del llamado, no el pliego)<input type="date" data-fecha="apertura" value="' + esc(l.fechas.apertura) + '"></label>' +
      '<p class="muted" style="margin-top:10px;font-size:12.5px">Los plazos del pliego se cuentan en días hábiles; el cálculo no descuenta feriados.</p></div>' +
      '<div class="card pad"><h3>Datos clave</h3><dl class="kv">' +
      '<dt>Procedimiento</dt><dd>Licitación pública nacional, etapa única, sobre único ' + srcBtn(S(Store.PBC, 'Art. I.2', 5, 'Licitación Pública de etapa única de alcance nacional.', 'etapa única')) + '</dd>' +
      '<dt>Plazo</dt><dd>' + par.plazoConcesion + ' años, prorrogable hasta ' + par.prorrogaMax + ' más ' + srcBtn(S(Store.PBC, 'Art. I.6 y I.7', 11, 'La concesión de uso se otorgará por el plazo de veinte (20) años contados desde la Fecha de Entrega de Tenencia.', 'veinte (20) años')) + '</dd>' +
      '<dt>Canon base</dt><dd>' + money(par.canonBase) + ' por mes, ajustado por CER ' + srcBtn(S(Store.PBC, 'Art. II.5.3 d)', 37, 'Se establece como Canon Base la suma de PESOS CUARENTA MILLONES ($40.000.000) mensuales, a valores del mes de apertura de ofertas.', 'PESOS CUARENTA MILLONES')) + '</dd>' +
      '<dt>Inversión mínima</dt><dd>' + money(par.inversionMin) + ' netos, en ' + par.plazoObraMax + ' meses</dd>' +
      '<dt>Garantía de oferta</dt><dd>' + money(par.garantiaOferta) + '</dd>' +
      '<dt>Mantenimiento</dt><dd>' + par.mantenimiento + ' días corridos, renovable</dd>' +
      '<dt>Presentación</dt><dd>Oficinas del ENAPRO, Av. Belgrano 341, lunes a viernes 9–15 h ' + srcBtn(S(Store.PBC, 'Art. II.7', 40, 'en las Oficinas del ENAPRO, de lunes a viernes en el horario de 9:00 a 15:00 horas hasta el día y hora de la apertura de ofertas.', 'de 9:00 a 15:00 horas')) + '</dd>' +
      '</dl></div></div></div>';
  }
  function mini(a, b, c) { return '<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px"><div class="muted" style="font-size:12px">' + a + '</div><div class="serif" style="font-size:24px;color:var(--ink)">' + c + '</div><div class="muted" style="font-size:12.5px">' + b + '</div></div>'; }

  /* ---------------- 2. Archivos ---------------- */
  function archivos(l) {
    if (!l.archivos.length) {
      return '<div class="card pad"><h3>Subí los archivos del pliego</h3><label class="drop"><input type="file" id="pick-lic" multiple class="hide"><div class="big">Soltá acá el pliego y sus anexos</div><p class="muted" style="margin-top:6px">Se analizan y se arma la estructura.</p><span class="btn" style="margin-top:14px">Elegir archivos</span></label></div>';
    }
    var rows = l.archivos.map(function (a) {
      return '<div class="file"><div class="ic">PDF</div><div><div class="ink" style="font-weight:600">' + esc(a.nombre) + '</div><div class="muted">' + esc(a.tipo) + ' · ' + a.paginas + ' págs. · ' + a.peso + '</div></div>' +
        '<div class="muted" style="font-size:13px;max-width:240px">' + esc(a.hallazgos) + '</div>' + UI.pill('Leído', 'ok') + '</div>';
    }).join('');
    return '<div class="row sb" style="margin-bottom:12px"><div><h2>Archivos del expediente</h2><p class="muted">Si llega una circular nueva, subila y se recalcula el checklist marcando qué cambió.</p></div>' +
      '<label class="btn">+ Agregar archivo<input type="file" id="pick-lic" multiple class="hide"></label></div><div class="card">' + rows + '</div>' +
      '<div class="banner info" style="margin-top:16px"><span>⚙</span><span><b>Preview:</b> el contenido del checklist de este caso fue armado leyendo estos cuatro archivos. La lectura automática de archivos nuevos todavía es una simulación.</span></div>';
  }

  /* ---------------- 3. Requisitos ---------------- */
  V.reqFilter = 'todos';
  function requisitos(l) {
    var f = V.reqFilter, rs = Store.reqs(l).filter(function (r) { return f === 'todos' || (f === 'pendientes' ? r.estado !== 'listo' : r.estado === 'listo'); });
    var chips = [['todos', 'Todos'], ['pendientes', 'Pendientes'], ['listos', 'Listos']].map(function (c) {
      return '<button class="chip ' + (f === c[0] ? 'on' : '') + '" data-act="filtro" data-f="' + c[0] + '">' + c[1] + '</button>';
    }).join('');
    var groups = [], seen = {};
    rs.forEach(function (r) { var k = r.carpeta + '|' + r.grupo; if (!seen[k]) { seen[k] = []; groups.push({ carpeta: r.carpeta, grupo: r.grupo, items: seen[k] }); } seen[k].push(r); });
    var html = groups.map(function (g) {
      return '<div class="group"><div class="group-h"><h3>' + esc(UI.carpeta[g.carpeta]) + ' · ' + esc(g.grupo) + '</h3><span class="muted">' + g.items.filter(function (r) { return r.estado === 'listo'; }).length + ' de ' + g.items.length + '</span></div><div class="card">' +
        g.items.map(function (r) {
          return '<div class="req"><button class="stbtn ' + r.estado + '" data-act="ciclo" data-id="' + r.id + '" title="Cambiar estado" aria-label="Estado: ' + UI.estadoReq[r.estado][0] + '">✓</button>' +
            '<div><div class="t">' + esc(r.titulo) + '</div><div class="d">' + esc(r.detalle) + (r.elim ? ' ' + UI.pill('Si falta, se rechaza', 'bad') : '') + '</div></div>' + srcBtn(r.src) + UI.pill(UI.estadoReq[r.estado][0], UI.estadoReq[r.estado][1]) + '</div>';
        }).join('') + '</div></div>';
    }).join('');
    return '<div class="row sb wrap" style="margin-bottom:14px"><div><h2>Checklist de requisitos</h2><p class="muted">Lo que el pliego exige, ordenado por carpeta del sobre único. Tocá <b>§</b> para ver de dónde sale cada uno.</p></div><div class="chips" style="margin:0">' + chips + '</div></div>' +
      (html || '<div class="card empty">No hay requisitos en este filtro.</div>');
  }

  /* ---------------- 4. Armado ---------------- */
  function armado(l) {
    var fo = Store.folios(l);
    function bloque(c) {
      var rs = Store.reqs(l).filter(function (r) { return r.carpeta === c; });
      var rows = rs.map(function (r) {
        var d = r.docId && Store.doc(r.docId), extra = '', btn = '';
        if (r.origen === 'biblioteca') {
          if (d) { var e = Store.docEstado(d, l.fechas.apertura); extra = '<div class="muted" style="font-size:13px">' + esc(d.nombre) + (e === 'vence-antes' ? ' ' + UI.pill('Vence antes de la apertura', 'warn') : e === 'vencido' ? ' ' + UI.pill('Vencido', 'bad') : '') + '</div>'; }
          /* sin documento: se puede adjuntar uno de Mi empresa o subir el archivo ahí mismo, que queda guardado en la empresa */
          btn = '<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn sm ' + (d ? '' : 'primary') + '" data-act="adjuntar" data-id="' + r.id + '">' + (d ? 'Cambiar' : 'Adjuntar de biblioteca') + '</button>' +
            (d ? '' : '<label class="btn sm">Subir archivo<input type="file" class="hide" data-newdoc="' + r.id + '"></label>') + '</div>';
        } else if (r.origen === 'plantilla') {
          btn = '<button class="btn sm primary" data-act="borrador" data-id="' + r.id + '">Ver borrador</button>';
        } else if (r.origen === 'oferta' || r.origen === 'indicadores') {
          btn = '<a class="btn sm primary" href="#/l/' + l.id + '/oferta">Ir a la oferta</a>';
        } else if (r.origen === 'anexo2') {
          btn = '<button class="btn sm primary" data-act="anexo2">Ver formulario</button>';
        } else {
          extra = r.archivo ? '<div class="muted" style="font-size:13px">' + esc(r.archivo) + '</div>' : '';
          btn = '<label class="btn sm ' + (r.archivo ? '' : 'primary') + '">' + (r.archivo ? 'Reemplazar' : 'Subir archivo') + '<input type="file" class="hide" data-up="' + r.id + '"></label>';
        }
        return '<div class="req" style="grid-template-columns:96px 1fr auto auto"><span class="folio">fol. ' + fo.byReq[r.id].from + '–' + fo.byReq[r.id].to + '</span>' +
          '<div><div class="t">' + esc(r.titulo) + '</div>' + (extra || '<div class="d">' + esc(UI.origen[r.origen]) + '</div>') + (r.estado !== 'pendiente' ? '<button class="linkb" data-act="ver-doc" data-id="' + r.id + '">Ver documento</button>' : '') + '</div>' + UI.pill(UI.estadoReq[r.estado][0], UI.estadoReq[r.estado][1]) + btn + '</div>';
      }).join('');
      return '<div class="group"><div class="group-h"><h3>' + esc(UI.carpeta[c]) + '</h3><span class="muted">' + fo.porCarpeta[c] + ' folios</span></div><div class="card">' + rows + '</div></div>';
    }
    var reglas = [
      'Todo en español; documentos extranjeros legalizados o con apostilla, y traducción de traductor público matriculado.',
      'Un único sobre cerrado que identifica el procedimiento pero <b>no al oferente</b>, con las tres carpetas.',
      'Dos ejemplares idénticos: original y una copia. Si difieren, prevalece el original.',
      'Hojas numeradas en forma correlativa, con un índice de lo presentado.',
      'Sellado y firmado en todas las hojas por el representante legal.',
      'Sin textos entre líneas, raspaduras ni tachaduras; los errores se salvan con la firma.'
    ];
    /* datos de la empresa que los borradores necesitan y todavía no están cargados: se completan acá y quedan en Mi empresa */
    var emp = Store.empresaDe(l), falt = Store.bloqueada(l) ? [] : Store.datosFaltantes(l);
    var faltan = falt.length ? '<div class="card pad" style="margin-bottom:18px"><h3 style="margin-bottom:4px">Faltan datos de ' + esc((emp.razon || 'la empresa').replace(/\s*\(ficticia\)\s*/i, '')) + ' para redactar los borradores (' + falt.length + ')</h3>' +
      '<p class="muted" style="margin:0 0 12px;font-size:13px">Cargalos acá mismo: se guardan en <a href="#/empresa/' + emp.id + '">Mi empresa</a> y se usan en todas sus licitaciones.</p><div class="grid cols-eq" style="gap:14px">' + falt.map(function (c) { return V.campoEmp(emp, c); }).join('') + '</div></div>' : '';
    return '<div class="row sb wrap" style="margin-bottom:14px"><div><h2>Armado del paquete</h2><p class="muted">Cada requisito se resuelve con un documento de tu biblioteca, un borrador redactado o un archivo que subís.</p></div>' +
      '<div class="row wrap"><button class="btn primary" data-act="simular">Simular el armado de la oferta</button><button class="btn" data-act="paquete">Índice del paquete</button><a class="btn" href="#/l/' + l.id + '/paquete">Ver paquete completo</a><a class="btn" href="#/biblioteca/' + l.id + '">Documentos de la licitación</a></div></div>' +
      faltan +
      (V.TV[Store.T(l).oferta] ? V.TV[Store.T(l).oferta].reglas(l) : '<details class="card pad" style="margin-bottom:18px"><summary style="cursor:pointer;font-weight:600;color:var(--ink)">Reglas de forma del sobre ' + srcBtn(S(Store.PBC, 'Art. II.1', 15, 'Los oferentes presentarán sus ofertas en un Sobre único. Todas las hojas serán numeradas correlativamente, debiendo incluirse un índice en el que se detalle el contenido de la presentación.', 'Sobre único')) + '</summary>' +
      '<ul style="margin:10px 0 0;padding-left:20px;display:grid;gap:4px">' + reglas.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul></details>') +
      Store.T(l).orden.map(bloque).join('');
  }

  /* ---------------- 5. Oferta ---------------- */
  function pill(ok, a, b) { return ok ? UI.pill(a, 'ok') : UI.pill(b, 'bad'); }
  function num(label, key, val, hint, grp) {
    return '<label class="f">' + label + '<input type="number" min="0" value="' + (val === 0 || val ? val : '') + '" placeholder="0" data-' + grp + '="' + key + '">' + (Number(val) > 999 ? '<span class="ink num" style="font-weight:600">' + money(val) + '</span>' : '') + (hint ? '<span style="font-weight:400">' + hint + '</span>' : '') + '</label>';
  }
  function oferta(l) {
    if (V.TV[Store.T(l).oferta]) return V.TV[Store.T(l).oferta].oferta(l);
    var o = l.oferta, p = l.params, c = Store.canon(l), r = Store.ratios(l), min = Store.garantiaVenceMin(l);
    var okCanon = Number(o.canon) >= p.canonBase, okInv = o.inversion >= p.inversionMin && o.plazoMeses > 0 && o.plazoMeses <= p.plazoObraMax;
    var fmt = function (x, d) { return x == null ? '—' : x.toFixed(d).replace('.', ','); };

    var canonCard = '<div class="card pad stack"><div class="row sb"><h3 style="margin:0">Canon fijo mensual</h3>' + pill(okCanon, 'Cumple el piso', 'Bajo el Canon Base') + '</div>' +
      num('Canon ofertado (pesos por mes, neto de IVA, a valores de apertura)', 'canon', o.canon, 'Piso: ' + money(p.canonBase) + '. Si queda vacío se toma el Canon Base.', 'of') +
      '<div class="banner info" style="margin:0"><span>✎</span><span><b>En letras:</b> pesos ' + esc(Store.enLetras(Number(o.canon) || p.canonBase)) + '. Si difieren números y letras, prevalecen las letras; el sistema las genera para que coincidan.</span></div>' +
      '<table class="t" style="margin-top:4px"><thead><tr><th>Período</th><th>Bonificación</th><th class="right">Pagás por mes</th></tr></thead><tbody>' +
      '<tr><td>Meses 1–12</td><td>100 %</td><td class="right num">' + money(0) + '</td></tr><tr><td>Meses 13–24</td><td>50 %</td><td class="right num">' + money(c.mensualAno2) + '</td></tr><tr><td>Desde el mes 25</td><td>—</td><td class="right num">' + money(c.canon) + '</td></tr></tbody></table>' +
      '<p class="muted" style="font-size:13px">Total del plazo (' + p.plazoConcesion + ' años) a valores de apertura, sin CER: <b class="ink">' + money(c.totalPlazo) + '</b>. Se actualiza por CER cada mes ' + srcBtn(S(Store.PBC, 'Art. II.5.3 d)', 38, 'Canon Mes t = Canon Ofertado × (CER_t / CER_base)', 'CER_t / CER_base')) + '</p></div>';

    var invCard = '<div class="card pad stack"><div class="row sb"><h3 style="margin:0">Inversión comprometida</h3>' + pill(okInv, 'Cumple el mínimo', 'No cumple') + '</div>' +
      num('Monto del plan de inversiones (pesos netos de IVA, a valores de apertura)', 'inversion', o.inversion, 'Mínimo: ' + money(p.inversionMin) + '.', 'of') +
      num('Plazo de ejecución (meses desde la entrega de tenencia)', 'plazoMeses', o.plazoMeses, 'Máximo: ' + p.plazoObraMax + ' meses.', 'of') +
      '<div class="banner info" style="margin:0"><span>✎</span><span><b>En letras:</b> pesos ' + esc(Store.enLetras(o.inversion)) + '.</span></div>' +
      '<p class="muted" style="font-size:13px">La inversión se verifica en moneda constante con el CER, solo con certificados de obra aprobados o comprobantes fiscales; no cuentan canon, seguros, garantías ni gastos de operación ' + srcBtn(S(Store.PBC, 'Art. II.5.3 a)', 36, 'No se computarán el canon, los seguros, las garantías ni los gastos de operación.', 'No se computarán')) + '</p></div>';

    var forma = ['Seguro de caución', 'Aval bancario', 'Depósito bancario'].map(function (t) { return '<option' + (o.forma === t ? ' selected' : '') + '>' + t + '</option>'; }).join('');
    var garCard = '<div class="card pad stack"><h3 style="margin:0">Garantía de mantenimiento de oferta</h3>' +
      '<dl class="kv" style="grid-template-columns:120px 1fr"><dt>Monto</dt><dd class="num">' + money(p.garantiaOferta) + '</dd><dt>Cubrir hasta</dt><dd>' + UI.date(min) + ' <span class="muted">(apertura + ' + p.mantenimiento + ' días)</span></dd></dl>' +
      '<label class="f">Forma<select data-of="forma">' + forma + '</select></label>' +
      (o.forma === 'Depósito bancario' ? '' : '<label class="f">Vigencia de la garantía hasta<input type="date" data-of="garantiaVence" value="' + esc(o.garantiaVence) + '"></label>') +
      '<label class="row" style="gap:8px"><input type="checkbox" data-of="garantiaConstituida"' + (o.garantiaConstituida ? ' checked' : '') + '> Ya está constituida / tengo el comprobante</label>' +
      '<p class="muted" style="font-size:13px">El seguro de caución debe estar certificado por escribano y emitido por aseguradora habilitada por la Superintendencia de Seguros de la Nación, a favor del ENAPRO. El original va al Departamento de Asuntos Legales <b>dentro de las 24 h de la apertura</b> o se desestima la oferta ' + srcBtn(S(Store.PBC, 'Art. II.6', 40, 'El original o el certificado de la garantía constituida deberá ser entregada en el Departamento de Asuntos Legales del ENAPRO, dentro del plazo de 24 horas, contado a partir del Acto de Apertura.', 'dentro del plazo de 24 horas')) + '</p></div>';

    var finCard = '<div class="card pad stack"><h3 style="margin:0">Indicadores financieros</h3><p class="muted" style="margin:-4px 0 0;font-size:13px">Del último balance. Si alguno no cumple, se desestima la oferta. Se acreditan por cada integrante.</p>' +
      '<div class="grid" style="grid-template-columns:1fr 1fr">' + num('Activo corriente', 'ac', l.fin.ac, '', 'fin') + num('Pasivo corriente', 'pc', l.fin.pc, '', 'fin') + num('Pasivo total', 'pt', l.fin.pt, '', 'fin') + num('Patrimonio neto', 'pn', l.fin.pn, '', 'fin') + num('Margen bruto', 'mb', l.fin.mb, '', 'fin') + num('Ingresos operativos', 'io', l.fin.io, '', 'fin') + '</div>' +
      '<table class="t"><tbody>' +
      '<tr><td>Liquidez corriente <span class="muted">(debe ser &gt; 1)</span></td><td class="right num">' + fmt(r.liquidez, 2) + '</td><td>' + pill(r.liquidez > 1, 'Cumple', 'No cumple') + '</td></tr>' +
      '<tr><td>Endeudamiento <span class="muted">(debe ser &lt; 1,50)</span></td><td class="right num">' + fmt(r.endeudamiento, 2) + '</td><td>' + pill(r.endeudamiento != null && r.endeudamiento < 1.5, 'Cumple', 'No cumple') + '</td></tr>' +
      '<tr><td>Margen operativo <span class="muted">(debe ser &gt; 0)</span></td><td class="right num">' + (r.margen == null ? '—' : fmt(r.margen * 100, 1) + ' %') + '</td><td>' + pill(r.margen > 0, 'Cumple', 'No cumple') + '</td></tr></tbody></table></div>';

    return '<div class="grid"><div class="grid cols-eq">' + canonCard + invCard + '</div><div class="grid cols-eq">' + garCard + finCard + '</div>' +
      '<div class="row wrap"><button class="btn primary" data-act="anexo2">Ver el Anexo II completado</button><span class="muted">Se arma con estos datos y los de <a href="#/empresa">Empresa</a>.</span></div></div>';
  }

  /* ---------------- 6. Revision ---------------- */
  function revision(l) {
    var cs = Store.checks(l), bloq = cs.filter(function (c) { return c.ok === 'bad'; }), avisos = cs.filter(function (c) { return c.ok === 'warn'; });
    var rows = cs.slice().sort(function (a, b) { return ({ bad: 0, warn: 1, ok: 2 })[a.ok] - ({ bad: 0, warn: 1, ok: 2 })[b.ok]; }).map(function (c) {
      return '<div class="check"><span class="ico ' + c.ok + '">' + (c.ok === 'ok' ? '✓' : c.ok === 'warn' ? '!' : '×') + '</span><div><div class="t">' + esc(c.titulo) + '</div><div class="muted">' + esc(c.detalle) + '</div></div>' +
        (c.ok === 'ok' ? '' : '<a class="btn sm" href="#/l/' + l.id + '/' + c.tab + '">Resolver</a>') + '</div>';
    }).join('');
    var lista = !bloq.length;
    return '<div class="banner ' + (lista ? 'info' : '') + '" style="margin-bottom:16px"><span>' + (lista ? '✓' : '!') + '</span><span>' + (lista ? '<b>Sin bloqueos.</b> ' + (avisos.length ? 'Revisá los ' + avisos.length + ' aviso(s) y generá el paquete.' : 'Podés generar el paquete final.') : '<b>' + bloq.length + ' punto(s) a resolver</b> antes de presentar.') + '</span></div>' +
      '<div class="card">' + rows + '</div>' +
      '<div class="row wrap" style="margin-top:18px"><button class="btn" data-act="paquete">Índice del paquete</button>' +
      (lista ? '<a class="btn primary" href="#/l/' + l.id + '/paquete">Generar paquete final</a>' : '<button class="btn primary" disabled>Generar paquete final</button>') +
      '<button class="btn" data-act="presentada"' + (lista && !l.presentada ? '' : ' disabled') + '>' + (l.presentada ? 'Ya marcada como presentada' : 'Marcar como presentada') + '</button></div>' +
      '<p class="muted" style="margin-top:10px;font-size:13px">El paquete se arma con datos ficticios y se puede imprimir o guardar como PDF desde el navegador. La versión real lo genera foliado, en original y copia, para firmar y sellar.</p>';
  }

  /* ---------------- paquete final: todo el sobre en orden ---------------- */
  V.pkg = function (l) {
    var fo = Store.folios(l), p = Store.progress(l), bloq = Store.bloqueantes(l).length;
    var toc = Store.T(l).orden.map(function (c) {
      return '<div class="grp">' + esc(UI.carpeta[c]) + '</div>' + Store.reqs(l).filter(function (r) { return r.carpeta === c; }).map(function (r) {
        return '<a href="#doc-' + r.id + '" data-scroll="doc-' + r.id + '"><span class="mono">' + fo.byReq[r.id].from + '–' + fo.byReq[r.id].to + '</span><span>' + esc(r.titulo.length > 38 ? r.titulo.slice(0, 37) + '…' : r.titulo) + '</span></a>';
      }).join('');
    }).join('');
    return '<a class="crumb" href="#/l/' + l.id + '/revision">← Volver a la revisión</a>' +
      '<div class="head"><div><h1>Paquete final</h1><p>' + esc(l.nro) + ' · ' + esc(l.titulo) + '</p></div>' +
      '<div class="row wrap"><button class="btn primary" data-act="imprimir">Imprimir o guardar como PDF</button></div></div>' +
      '<div class="banner' + (bloq || p.done < p.total ? '' : ' info') + ' no-print" style="margin-bottom:16px"><span>' + (bloq || p.done < p.total ? '!' : '✓') + '</span><span>' + (p.done < p.total ? '<b>Borrador:</b> faltan ' + (p.total - p.done) + ' requisito(s). Los pendientes figuran vacíos.' : bloq ? '<b>Hay ' + bloq + ' punto(s) sin resolver en la revisión.</b>' : '<b>Paquete completo,</b> ' + fo.total + ' folios.') + ' Todo el contenido es un ejemplo con datos ficticios.</span></div>' +
      '<div class="pkg-layout"><nav class="pkg-toc" aria-label="Contenido del paquete">' + toc + '</nav><div>' + V.paquete(l).replace(/<h2>Vista previa del paquete<\/h2><p class="muted">[^<]*<\/p>/, '') + Demo.paqueteCompleto(l) + '</div></div>';
  };

  /* ---------------- modales ---------------- */
  V.paquete = function (l) {
    var fo = Store.folios(l);
    function idx(c) {
      return '<h3 style="margin:14px 0 4px;font-family:Inter,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#666">' + esc(UI.carpeta[c]) + '</h3><table class="idx">' + Store.reqs(l).filter(function (r) { return r.carpeta === c; }).map(function (r) {
        return '<tr><td>' + esc(r.titulo) + '</td><td>' + fo.byReq[r.id].from + '–' + fo.byReq[r.id].to + '</td></tr>';
      }).join('') + '</table>';
    }
    var tv = V.TV[Store.T(l).oferta], lotes = !!tv;
    return '<h2>Vista previa del paquete</h2><p class="muted">' + (lotes ? 'Portada, índice y numeración generados automáticamente.' : 'Rótulo del sobre e índice generados automáticamente, con las hojas numeradas en forma correlativa.') + '</p>' +
      (lotes ? tv.portada(l) :'<div class="paper cover"><div class="kicker">Sobre único · Original</div><h2>' + esc(l.nro) + '</h2><p style="text-align:center">' + esc(l.titulo) + '</p><p style="text-align:center;margin-top:24px">' + esc(l.organismo) + '</p>' +
      '<p style="text-align:center;margin-top:24px" class="muted">Apertura: ' + UI.date(l.fechas.apertura) + ' · ' + l.fechas.horaAper + ' h</p><p style="text-align:center;font-size:13px;color:#888;margin-top:30px">Sin identificación del oferente, según el pliego.</p></div>') +
      '<div class="paper"><h2>Índice</h2>' + Store.T(l).orden.map(idx).join('') + '<p style="text-align:right;margin-top:14px;font-size:13px;color:#666">Total: ' + fo.total + ' folios' + (lotes ? '' : ' · 2 ejemplares') + '</p></div>';
  };
})();
