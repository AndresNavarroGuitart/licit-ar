/* Armado final y presentación: lo último antes de entregar el documento a quien licita.
   Reúne el contenido, el formato de entrega del pliego, la lista de control, la descarga del documento y el registro de la entrega. */
(function () {
  var esc = UI.esc;
  var V = window.Views = window.Views || {};

  Store.entrega = function (l) {
    if (!l.entrega) l.entrega = { ctl: {}, lugar: '', responsable: '', fecha: '', medio: '', comprobante: '' };
    return l.entrega;
  };

  /* cómo se entrega según el tipo de pliego */
  function formato(l) {
    var T = Store.T(l), p = l.params || {}, f = l.fechas || {};
    var limite = (f.presentacion || f.apertura) ? UI.date(f.presentacion || f.apertura) + (f.horaPres ? ' · ' + f.horaPres + ' h' : '') : 'Sin fecha cargada';
    if (T.presentacion === 'correo') return { titulo: 'Correo electrónico con un PDF único', detalle: 'Un solo PDF, numerado, con índice y firmado, de hasta ' + p.maxMB + ' MB y protegido con clave. Cuenta la hora en que el correo entra al servidor del comprador.', lugar: 'adquisicionesvuce@produccion.gob.ar', limite: limite, correo: true };
    if (l.tid === 'lpi_bienes') return { titulo: 'Sobre físico cerrado', detalle: 'Sobre exterior con las leyendas del pliego. ' + (p.copias ? p.copias.charAt(0).toUpperCase() + p.copias.slice(1) + '.' : 'Original y copias.'), lugar: l.organismo, limite: limite };
    return { titulo: 'Sobre único cerrado y rotulado', detalle: 'Original y copia idénticos, con las hojas numeradas en forma correlativa, índice, sellado y firmado por el representante legal. El rótulo no identifica al oferente.', lugar: 'Oficinas del ENAPRO, Av. Belgrano 341, lunes a viernes de 9 a 15 h', limite: limite };
  }

  /* controles: los que se calculan solos y los que tiene que tildar la persona */
  function controles(l) {
    var T = Store.T(l), pr = Store.progress(l), bloq = Store.bloqueantes(l), docs = Store.checkDocs(l), o = l.oferta || {}, par = l.params || {}, en = Store.entrega(l);
    var auto = [
      { ok: pr.total > 0 && pr.done === pr.total, t: 'Todos los requisitos están listos', d: pr.done + ' de ' + pr.total + ' requisitos', tab: 'requisitos' },
      { ok: !bloq.length, t: 'La revisión no tiene puntos bloqueantes', d: bloq.length ? bloq.length + ' punto(s) a resolver' : 'Sin bloqueos', tab: 'revision' },
      { ok: !docs.some(function (c) { return c.ok === 'bad'; }), t: 'Los documentos están vigentes a la fecha de apertura', d: docs.length ? docs.length + ' aviso(s) de vencimiento' : 'Todos vigentes', tab: 'armado' }
    ], manual;
    if (T.presentacion === 'correo') {
      auto.push({ ok: Number(o.pesoMB) > 0 && Number(o.pesoMB) <= par.maxMB, t: 'El PDF entra en el límite de ' + par.maxMB + ' MB', d: o.pesoMB ? o.pesoMB + ' MB' : 'Sin peso cargado', tab: 'oferta' });
      auto.push({ ok: !!o.firma, t: 'Está definida la forma de firma', d: o.firma || 'Sin definir', tab: 'oferta' });
      manual = [['pdf', 'Es un solo PDF, legible, numerado y con índice (sin .zip, .rar ni enlaces)'], ['firma', 'Todos los formularios están firmados'], ['clave', 'El archivo tiene clave y está anotada para mandarla después de la apertura'], ['correo', 'El destinatario y el asunto coinciden con lo que pide el pliego']];
    } else {
      if ('garantiaConstituida' in o) auto.push({ ok: !!o.garantiaConstituida, t: 'La garantía de mantenimiento de oferta está constituida', d: o.garantiaConstituida ? 'Con comprobante' : 'Falta constituirla', tab: 'oferta' });
      manual = [['hojas', 'Las hojas están numeradas en forma correlativa y el índice coincide'], ['firma', 'Cada hoja está firmada y sellada por el representante legal'], ['tachaduras', 'No hay textos entre líneas, raspaduras ni tachaduras (o están salvados con firma)'],
        [l.tid === 'lpi_bienes' ? 'juegos' : 'copia', l.tid === 'lpi_bienes' ? 'Están listos el original, la copia física y la copia digital' : 'El original y la copia son idénticos'], ['sobre', 'El sobre está cerrado y rotulado como pide el pliego']];
    }
    var m = manual.map(function (x) { return { k: x[0], t: x[1], ok: !!en.ctl[x[0]] }; });
    return { auto: auto, manual: m, listo: auto.every(function (x) { return x.ok; }) && m.every(function (x) { return x.ok; }) };
  }

  function slug(l) { return String(l.nro).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, ''); }
  function bajar(nombre, mime, contenido) {
    var url = URL.createObjectURL(new Blob([contenido], { type: mime })), a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function cuerpo(l) { return V.paquete(l).replace(/<h2>Vista previa del pliego<\/h2><p class="muted">[^<]*<\/p>/, '') + Demo.paqueteCompleto(l); }

  /* descarga real del documento a entregar: HTML autónomo (se imprime a PDF), Word editable o índice en CSV */
  V.descargar = function (l, fmt) {
    var nombre = slug(l);
    if (fmt === 'csv') {
      var fo = Store.folios(l), filas = [['Carpeta', 'Documento', 'Página desde', 'Página hasta', 'Estado', 'Origen']];
      Store.T(l).orden.forEach(function (c) {
        Store.reqs(l).filter(function (r) { return r.carpeta === c; }).forEach(function (r) { filas.push([UI.carpeta[c], r.titulo, fo.byReq[r.id].from, fo.byReq[r.id].to, UI.estadoReq[r.estado][0], UI.origen[r.origen]]); });
      });
      bajar(nombre + '_indice.csv', 'text/csv;charset=utf-8', '﻿' + filas.map(function (f) { return f.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n'));
      return UI.toast('Índice descargado (CSV).');
    }
    var titulo = esc(l.nro + ' · ' + l.titulo);
    if (fmt === 'doc') {
      var css = 'body{font-family:Georgia,serif;font-size:11pt;color:#1d1d1d}.paper{padding:0 0 18pt}h2{text-align:center;text-transform:uppercase;font-size:13pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:3pt 5pt;font-size:10pt}.pkg-sep{page-break-before:always;font:bold 10pt Arial;text-transform:uppercase;margin-top:12pt}.pkg-doc{page-break-before:always}.fill{background:#fff3c4}.muted{color:#777}.pill{font:9pt Arial}';
      bajar(nombre + '_pliego.doc', 'application/msword', '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + titulo + '</title><style>' + css + '</style></head><body>' + cuerpo(l) + '</body></html>');
      return UI.toast('Documento descargado (Word). Se abre y se edita en Word o Google Docs.');
    }
    /* HTML autónomo: lleva los estilos de la app dentro del archivo */
    fetch('styles.css').then(function (r) { return r.text(); }).catch(function () { return ''; }).then(function (estilos) {
      var extra = '.pkg-doc,.pkg-sep{break-inside:avoid-page}.pkg-doc{break-before:page}body{background:#f4f2ec;margin:0;padding:24px}.doc{max-width:860px;margin:0 auto}';
      bajar(nombre + '_pliego.html', 'text/html;charset=utf-8', '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + titulo + '</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>' + estilos + extra + '</style></head><body><div class="doc">' + cuerpo(l) + '</div></body></html>');
      UI.toast('Archivo descargado (HTML). Abrilo y elegí Imprimir → Guardar como PDF.');
    });
  };

  function correo(l) {
    var e = Store.empresaDe(l), asunto = 'Comparación de Precios Nº ' + String(l.nro).replace('CP ', '') + ' — ' + l.titulo;
    var cuerpoTxt = 'Proveedor: ' + e.razon.replace(/\s*\(ficticia\)\s*/i, '') + ' · CUIT ' + e.cuit + '\nContacto: ' + e.representante + ' · ' + e.telefono + '\nSe adjunta la cotización en un único archivo PDF, firmado y con clave. La clave se enviará luego de la apertura.';
    return '<div class="card pad stack"><h3 style="margin:0">Texto del correo</h3><p class="muted" style="margin:-4px 0 0;font-size:13px">Listo para copiar. Adjuntá el PDF y mandalo antes de las ' + esc(l.fechas.horaPres) + ' h.</p>' +
      '<div id="mail-texto" class="mono" style="white-space:pre-wrap;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.6">' + esc('Para: adquisicionesvuce@produccion.gob.ar\nAsunto: ' + asunto + '\n\n' + cuerpoTxt) + '</div>' +
      '<div><button class="btn" data-act="copiar" data-target="mail-texto">Copiar texto</button></div></div>';
  }

  V.entrega = function (l) {
    var fo = Store.folios(l), pr = Store.progress(l), fm = formato(l), en = Store.entrega(l), ct = controles(l), ro = Store.bloqueada(l);
    var N = function (n, t, s) { return '<div class="row" style="gap:12px;margin-bottom:12px"><span class="ob-n">' + n + '</span><div><h3 style="margin:0">' + t + '</h3>' + (s ? '<div class="muted" style="font-size:13px">' + s + '</div>' : '') + '</div></div>'; };

    /* 1. contenido en orden */
    var filas = Store.T(l).orden.map(function (c) {
      var rs = Store.reqs(l).filter(function (r) { return r.carpeta === c; });
      return '<tr><td colspan="4" style="background:var(--surface-2);font-weight:600">' + esc(UI.carpeta[c]) + ' <span class="muted" style="font-weight:400">· ' + rs.filter(function (r) { return r.estado === 'listo'; }).length + ' de ' + rs.length + ' listos</span></td></tr>' + rs.map(function (r) {
        return '<tr><td class="mono" style="white-space:nowrap">' + fo.byReq[r.id].from + '–' + fo.byReq[r.id].to + '</td><td>' + esc(r.titulo) + '</td><td>' + UI.pill(UI.estadoReq[r.estado][0], UI.estadoReq[r.estado][1]) + '</td><td class="right"><a class="btn sm" href="#/l/' + l.id + '/armado">Ver</a></td></tr>';
      }).join('');
    }).join('');
    var contenido = '<div class="card pad">' + N(1, 'Contenido del documento', 'El orden y las páginas las define el pliego. ' + fo.total + ' páginas en total · ' + pr.done + ' de ' + pr.total + ' requisitos listos.') +
      '<div style="overflow-x:auto"><table class="t"><tbody>' + filas + '</tbody></table></div></div>';

    /* 2. formato de entrega */
    var formatoCard = '<div class="card pad stack">' + N(2, 'Cómo y dónde se entrega') +
      '<dl class="kv"><dt>Formato</dt><dd><b>' + esc(fm.titulo) + '</b><div class="muted" style="font-size:13px">' + esc(fm.detalle) + '</div></dd><dt>' + (fm.correo ? 'Enviar a' : 'Entregar en') + '</dt><dd>' + esc(fm.lugar) + '</dd><dt>Hasta</dt><dd>' + esc(fm.limite) + (l.presentada ? '' : ' <span class="muted">(' + (l.fechas.presentacion || l.fechas.apertura ? UI.countdown(l.fechas.presentacion || l.fechas.apertura) : '') + ')</span>') + '</dd></dl>' +
      '<label class="f">Quién lo entrega<input type="text" data-ent="responsable" value="' + esc(en.responsable) + '" placeholder="Nombre de la persona responsable"></label></div>';

    /* 3. lista de control */
    var auto = ct.auto.map(function (x) {
      return '<div class="check"><span class="ico ' + (x.ok ? 'ok' : 'bad') + '">' + (x.ok ? '✓' : '×') + '</span><div><div class="t">' + esc(x.t) + '</div><div class="muted">' + esc(x.d) + '</div></div>' + (x.ok ? '' : '<a class="btn sm" href="#/l/' + l.id + '/' + x.tab + '">Resolver</a>') + '</div>';
    }).join('');
    var manual = ct.manual.map(function (x) {
      return '<label class="check" style="cursor:pointer"><input type="checkbox" data-entctl="' + x.k + '"' + (x.ok ? ' checked' : '') + ' style="margin:2px 6px 0 2px"><div><div class="t">' + esc(x.t) + '</div></div></label>';
    }).join('');
    var control = '<div class="card">' + '<div style="padding:18px 18px 4px">' + N(3, 'Control final', 'Lo primero se calcula solo; lo segundo lo confirmás vos mirando el documento impreso.') + '</div>' + auto + manual + '</div>';

    /* 4. generar el documento */
    var generar = '<div class="card pad stack">' + N(4, 'Generar el documento a entregar', 'Se arma con todos los documentos en orden, con la carátula y el índice. En esta versión el contenido es de ejemplo.') +
      '<div class="row wrap"><a class="btn primary" href="#/l/' + l.id + '/paquete">Ver el pliego completo</a><button class="btn" data-act="descargar" data-fmt="html">Descargar archivo (HTML)</button><button class="btn" data-act="descargar" data-fmt="doc">Descargar Word (.doc)</button><button class="btn" data-act="descargar" data-fmt="csv">Descargar índice (CSV)</button></div>' +
      '<p class="muted" style="margin:0;font-size:13px">El archivo HTML se abre en cualquier navegador y se pasa a PDF con Imprimir → Guardar como PDF. El Word sirve para ajustar algo antes de firmar.</p></div>';

    /* 5. registrar la entrega */
    var reg;
    if (l.presentada) {
      reg = '<div class="banner info" style="margin:0"><span>✓</span><span style="flex:1"><b>Entrega registrada.</b> ' + (en.fecha ? 'El ' + esc(en.fecha.replace('T', ' a las ')) + ' h' : 'Presentada') + (en.medio ? ', ' + esc(en.medio) : '') + (en.comprobante ? ' · Comprobante: ' + esc(en.comprobante) : '') + '.</span><a class="btn sm" href="#/l/' + l.id + '/seguimiento">Ir al seguimiento</a></div>';
    } else {
      reg = '<div class="grid cols-eq" style="gap:14px"><label class="f">Fecha y hora de entrega<input type="datetime-local" data-ent="fecha" value="' + esc(en.fecha) + '"></label><label class="f">Cómo se entregó<input type="text" data-ent="medio" value="' + esc(en.medio) + '" placeholder="Ej.: en mano, correo, mensajería"></label>' +
        '<label class="f">Comprobante o número de recepción<input type="text" data-ent="comprobante" value="' + esc(en.comprobante) + '" placeholder="Ej.: sello de recepción, acuse"></label></div>' +
        '<div class="row wrap"><button class="btn primary" data-act="registrar-entrega"' + (ct.listo ? '' : ' disabled') + '>Registrar la entrega y marcar como presentada</button>' + (ct.listo ? '' : '<span class="muted" style="font-size:13px">Se habilita cuando el control final está completo.</span>') + '</div>';
    }
    var registro = '<div class="card pad stack">' + N(5, 'Registrar la entrega', 'Deja constancia de cuándo y cómo se presentó. Después sigue el seguimiento del proceso.') + reg + '</div>';

    return '<div class="row sb wrap" style="margin-bottom:14px"><div><h2>Armado final y presentación</h2><p class="muted">Lo último antes de entregar: revisá el contenido, controlá, generá el documento y registrá la entrega.</p></div>' +
      '<div>' + UI.pill(ct.listo ? 'Listo para entregar' : 'Falta completar el control', ct.listo ? 'ok' : 'warn') + '</div></div>' +
      '<div class="grid">' + contenido + '<div class="grid cols-eq">' + formatoCard + generar + '</div>' + (fm.correo ? correo(l) : '') + control + registro + '</div>';
  };
})();
