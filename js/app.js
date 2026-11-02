/* Router por hash y acciones. Todo el estado vive en Store (localStorage). */
(function () {
  var V = Views, S = Store;
  var nueva = { files: [], busy: false, step: 0 };

  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function toFiles(list) { return Array.prototype.map.call(list, function (f) { return { name: f.name, size: fmtSize(f.size) }; }); }

  function route() {
    var h = (location.hash || '#/').replace(/^#/, '').split('/').filter(Boolean);
    if (h[0] === 'l' && S.lic(h[1])) { var lic = S.lic(h[1]); UI.carpeta = S.T(lic).carpetas; return { page: 'detalle', lic: lic, tab: h[2] || 'resumen' }; }
    if (h[0] === 'onboarding') return { page: 'onboarding', paso: h[1] === 'cerrar' ? -1 : +h[1] || 0 };
    if (h[0] === 'biblioteca') return { page: 'biblioteca', filtro: h[1] || '' };
    if (h[0] === 'empresa') return { page: 'empresa', id: h[1] || '' };
    if (h[0] === 'nueva') return { page: 'nueva' };
    return { page: 'lista' };
  }

  function render() {
    var r = route(), main = document.getElementById('main'), html;
    if (r.page === 'detalle') html = r.tab === 'paquete' && r.lic.requisitos.length ? V.pkg(r.lic) : V.detalle(r.lic, r.tab);
    else if (r.page === 'nueva') html = V.nueva(nueva);
    else if (r.page === 'onboarding') html = V.onboarding(r.paso);
    else if (r.page === 'biblioteca') html = V.biblioteca(r.filtro);
    else if (r.page === 'empresa') html = V.empresa(r.id);
    else html = V.lista();
    main.innerHTML = html;
    /* solo lectura: en las pestañas de la oferta de una licitación presentada se bloquean los campos */
    var ro = r.page === 'detalle' && S.bloqueada(r.lic) && V.RO_TABS.indexOf(r.tab) > -1;
    main.classList.toggle('ro', ro);
    if (ro) main.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = true; });

    var on = r.page === 'detalle' || r.page === 'lista' ? 'lista' : r.page;
    var activas = S.get().licitaciones.filter(function (l) { return l.estado !== 'presentada'; }).length;
    var ob = V.onbResumen();
    document.getElementById('nav').innerHTML = [['onboarding', '#/onboarding', 'Onboarding', ob.hechos + '/' + ob.total], ['lista', '#/', 'Licitaciones', activas], ['biblioteca', '#/biblioteca', 'Biblioteca', S.get().biblioteca.length], ['empresa', '#/empresa', 'Mi empresa', S.get().empresas.length], ['nueva', '#/nueva', 'Nueva licitación', '+']].map(function (n) {
      return '<a href="' + n[1] + '" class="' + (on === n[0] ? 'on' : '') + (n[0] === 'nueva' ? ' nuevo' : '') + '">' + n[2] + '<span class="count">' + n[3] + '</span></a>';
    }).join('');
    document.title = (r.page === 'detalle' ? r.lic.nro + ' · ' : '') + 'Licit.AR';
  }

  /* ---------- analisis simulado ---------- */
  function simulate(done) {
    nueva.busy = true; nueva.step = 0; render();
    var t = setInterval(function () {
      nueva.step++;
      if (nueva.step >= 4) { clearInterval(t); nueva.busy = false; done(); } else render();
    }, 650);
  }
  function llenar(l, files) {
    var base = S.seedLicitacion();
    /* simulacion: en la version real los requisitos salen de leer los archivos subidos */
    l.requisitos = base.requisitos.map(function (r) { r.estado = r.origen === 'biblioteca' && r.docId ? 'listo' : 'pendiente'; return r; });
    l.params = base.params; l.oferta = base.oferta; l.fin = base.fin; l.modalidad = 'individual'; l.tipo = base.tipo;
    if (!l.fechas.apertura) l.fechas = S.fechasEjemplo();
    if (!l.fechas.visita) l.fechas.visita = S.addBusinessDays(l.fechas.apertura, -9);
    l.estado = 'preparacion';
    l.archivos = files.map(function (f, i) { return { id: 'a' + i, nombre: f.name, tipo: 'Archivo cargado', paginas: '—', peso: f.size, hallazgos: 'Analizado (simulado)' }; });
    S.save();
  }

  /* simulacion del armado: cada paso deja un requisito listo, en el orden del pliego */
  function simular(l) {
    corrida(l, Demo.pasos(l), 'Simulando el armado de la oferta', 'El sistema arma cada requisito en el orden del pliego.', function (bad, warn) {
      return '<p style="width:100%"><b>' + (bad ? bad + ' punto(s) a resolver.' : 'Oferta armada: ' + S.progress(l).total + ' requisitos listos y ' + S.folios(l).total + ' folios.') + '</b> ' + (warn ? warn + ' aviso(s).' : 'Sin avisos.') + '</p>' +
        '<a class="btn primary" href="#/l/' + l.id + '/paquete">Ver paquete completo</a><a class="btn" href="#/l/' + l.id + '/revision">Ver revisión</a><a class="btn" href="#/l/' + l.id + '/oferta">Ver oferta económica</a>';
    });
  }
  /* de la oferta armada hasta la ejecucion del contrato */
  function recorrido(l) {
    Demo.pasos(l).forEach(function (p) { p.run(); });
    corrida(l, Demo.pasosRecorrido(l), 'Simulando el recorrido completo', 'La oferta ya está armada. Ahora se simulan la apertura, la adjudicación y el arranque de la concesión.', function () {
      return '<p style="width:100%"><b>Concesión en ejecución.</b> Etapa 6 de 6, con las fechas posteriores a hoy simuladas.</p><a class="btn primary" href="#/l/' + l.id + '/seguimiento">Ver el seguimiento</a><a class="btn" href="#/l/' + l.id + '/paquete">Ver paquete completo</a>';
    });
  }
  function corrida(l, pasos, titulo, desc, fin) {
    var i = 0, ultima = '';
    UI.modal('<h2>' + titulo + '</h2><p class="muted">Empresa: ' + UI.esc(S.empresaDe(l).razon) + '. ' + desc + '</p>' +
      '<div class="bar wide" style="margin-top:12px"><i id="sim-bar" style="width:0%"></i></div><ul class="sim-log" id="sim-log"></ul><div id="sim-end" class="row wrap" style="margin-top:16px"></div>');
    var t = setInterval(function () {
      var log = document.getElementById('sim-log'), p = pasos[i];
      p.run();
      if (log) {
        if (p.c && p.c !== ultima) { ultima = p.c; log.insertAdjacentHTML('beforeend', '<li class="sep">' + (UI.carpeta[p.c] || p.c) + '</li>'); }
        log.insertAdjacentHTML('beforeend', '<li>' + UI.esc(p.txt) + '</li>'); log.scrollTop = log.scrollHeight;
        document.getElementById('sim-bar').style.width = Math.round(100 * (i + 1) / pasos.length) + '%';
      }
      i++;
      if (i < pasos.length) return;
      clearInterval(t); S.save(); render();
      var cs = S.checks(l), bad = cs.filter(function (c) { return c.ok === 'bad'; }).length, warn = cs.filter(function (c) { return c.ok === 'warn'; }).length, end = document.getElementById('sim-end');
      if (end) end.innerHTML = fin(bad, warn);
    }, 110);
  }

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (ev) {
    var o = document.getElementById('overlay');
    if (ev.target === o) return UI.close();
    var sc = ev.target.closest('[data-scroll]');
    if (sc) { ev.preventDefault(); var d = document.getElementById(sc.dataset.scroll); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.dataset.act, r = route(), l = r.lic, req = l && el.dataset.id && l.requisitos.filter(function (x) { return x.id === el.dataset.id; })[0];

    if (act === 'close') return UI.close();
    if (act === 'filtro-estado') { V.licEstado = el.dataset.e; return render(); }
    /* lo presentado se ve completo pero no se edita, salvo que se habilite la edición */
    if (act === 'desbloquear' || act === 'bloquear') { l.editable = act === 'desbloquear'; S.save(); return render(); }
    var MUT = { ciclo: 1, adjuntar: 1, 'elegir-doc': 1, simular: 1, 'tpl-listo': 1, modalidad: 1, presentada: 1, 'completar-empresa': 1 };
    if (act === 'add-empresa') {
      var ne = { id: 'e' + Date.now(), razon: '', cuit: '', nif: '', anio: '', objeto: '', domicilio: '', email: '', telefono: '', representante: '', cargo: '', dni: '', poder: '', directores: '', visitaNro: '', benef: '', origen: '', fin: { ac: '', pc: '', pt: '', pn: '', mb: '', io: '' }, ventas: '', expEsp: '', expSim: '' };
      S.get().empresas.push(ne); S.save(); UI.toast('Empresa agregada: completá sus datos.'); location.hash = '#/empresa/' + ne.id; return;
    }
    if (act === 'del-empresa') {
      var em = S.empresaById(el.dataset.id), usadas = S.licsDeEmpresa(el.dataset.id).length;
      if (S.get().empresas.length < 2) return UI.toast('Tiene que quedar al menos una empresa.');
      if (usadas) return UI.toast('No se puede eliminar: presenta ' + usadas + ' licitación(es). Cambiales la empresa primero.');
      if (!window.confirm('¿Eliminar ' + (em.razon || 'esta empresa') + ' y sus documentos?')) return;
      var s0 = S.get(); s0.biblioteca = s0.biblioteca.filter(function (d) { return d.empId !== em.id; }); s0.empresas = s0.empresas.filter(function (x) { return x.id !== em.id; }); S.save(); location.hash = '#/empresa'; return render();
    }
    if (act === 'del-doc') {
      var dd = S.doc(el.dataset.id), usado = S.get().licitaciones.some(function (x) { return x.requisitos.some(function (q) { return q.docId === dd.id; }); });
      if (usado) return UI.toast('Está en uso en una licitación: reemplazalo desde el armado antes de quitarlo.');
      var s1 = S.get(); s1.biblioteca = s1.biblioteca.filter(function (d) { return d.id !== dd.id; }); S.save(); UI.toast('Documento quitado.'); return render();
    }
    if (act === 'onb-hecho') { var oh = S.get().onb.hechos, ok = el.dataset.lid + ':' + el.dataset.k; oh[ok] = !oh[ok]; S.save(); return render(); }
    if (act === 'completar-empresa' || act === 'onb-completar') {
      if (act === 'onb-completar') l = S.lic(el.dataset.lid);
      if (S.bloqueada(l)) return UI.toast('La licitación está presentada: solo lectura. Habilitá la edición para cambiarla.');
      var rc = S.completarDesdeEmpresa(l); S.save(); render();
      return UI.toast((rc.docs || rc.datos.length ? 'Completado con los datos de ' + S.empresaDe(l).razon.replace(/\s*\(ficticia\)/, '') + ': ' + (rc.docs ? rc.docs + ' documento(s) adjuntados' : '') + (rc.docs && rc.datos.length ? ' y ' : '') + (rc.datos.length ? rc.datos.join(' y ') + ' copiados' : '') + '.' : 'No había nada para completar.') + (rc.faltan.length ? ' Faltan cargar: ' + rc.faltan.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + '.' : ''));
    }
    if (l && MUT[act] && S.bloqueada(l)) return UI.toast('La licitación está presentada: solo lectura. Habilitá la edición para cambiarla.');
    if (act === 'src') return UI.drawer(V.fuente(V.srcs[+el.dataset.i]));
    if (act === 'filtro') { V.reqFilter = el.dataset.f; return render(); }
    if (act === 'ciclo') { req.estado = { pendiente: 'en-curso', 'en-curso': 'listo', listo: 'pendiente' }[req.estado]; S.save(); return render(); }
    if (act === 'paquete') return UI.modal(V.paquete(l), true);
    if (act === 'exportar') return UI.toast('Preview: en la versión real acá se descarga el PDF foliado con índice, en original y copia.');
    if (act === 'presentada') { S.setEtapa(l, 4); S.save(); UI.toast('Marcada como presentada.'); return render(); }
    if (act === 'reset-demo') { S.reset(); nueva = { files: [], busy: false, step: 0 }; location.hash = '#/'; UI.toast('Datos de ejemplo restablecidos.'); return render(); }

    if (act === 'borrador') {
      /* los datos de la empresa que usa este borrador se editan en el mismo lugar; lo que falta va primero */
      var emb = S.empresaDe(l), usados = S.bloqueada(l) ? [] : S.camposUsados(l, [req.tpl]), vacios = usados.filter(function (c) { return S.vacio(emb, c); });
      var datos = usados.length ? '<details class="card pad no-print" style="margin:12px 0"' + (vacios.length ? ' open' : '') + '><summary style="cursor:pointer;font-weight:600;color:var(--ink)">Datos de ' + UI.esc(emb.razon.replace(/\s*\(ficticia\)\s*/i, '')) + ' que usa este documento' + (vacios.length ? ' · <span style="color:var(--bad)">faltan ' + vacios.length + '</span>' : '') + '</summary>' +
        '<p class="muted" style="margin:8px 0 12px;font-size:13px">Se guardan en <a href="#/empresa/' + emb.id + '" data-act="close">Mi empresa</a> y el borrador se actualiza al salir del campo.</p><div class="grid cols-eq" style="gap:14px">' +
        usados.map(function (c) { return V.campoEmp(emb, c, 'data-tpl="' + req.id + '"'); }).join('') + '</div></details>' : '';
      return UI.modal('<h2>' + Plantillas.titulo[req.tpl] + '</h2><p class="muted">Redactado con los datos de <a href="#/empresa/' + emb.id + '" data-act="close">Mi empresa</a> y de esta licitación. Lo resaltado se completó solo.</p>' + datos +
        Plantillas.render(req.tpl, emb, l) +
        '<div class="row"><button class="btn primary" data-act="tpl-listo" data-id="' + req.id + '">Marcar como firmado y listo</button><button class="btn" data-act="close">Cerrar</button></div>', true);
    }
    if (act === 'tpl-listo') { req.estado = 'listo'; S.save(); UI.close(); UI.toast('Documento marcado como listo.'); return render(); }

    if (act === 'adjuntar') {
      /* primero los de esta licitación y del mismo tipo, después el resto de la biblioteca */
      var rank = function (d) { return (d.licId === l.id ? 0 : 2) + (d.tipo === req.docTipo ? 0 : 1); };
      var docs = S.docsDeEmpresa(l.empresaId).filter(function (d) { return !d.licId || d.licId === l.id; }).sort(function (a, b) { return rank(a) - rank(b); });
      var li = function (d) {
        var e = S.docEstado(d, l.fechas.apertura), q = [d.nombre, d.archivo, UI.tipoDoc[d.tipo] || '', d.tipo].join(' ').toLowerCase();
        return '<div class="row sb" data-q="' + UI.esc(q) + '" style="padding:10px 0;border-bottom:1px solid var(--line)"><div><div class="ink" style="font-weight:600">' + UI.esc(d.nombre) + '</div><div class="muted" style="font-size:13px"><span class="tag">' + UI.esc(UI.tipoDoc[d.tipo] || d.tipo) + '</span> ' + (d.licId === l.id ? '<span class="tag">De esta licitación</span> ' : '') + (d.tipo === req.docTipo ? '<span class="tag">Mismo tipo</span> ' : '') + 'Vence: ' + UI.date(d.vence) + (e === 'vence-antes' ? ' · antes de la apertura' : '') + '</div></div>' +
          '<button class="btn sm" data-act="elegir-doc" data-id="' + req.id + '" data-doc="' + d.id + '">Usar este</button></div>';
      };
      var hay = docs.some(function (d) { return d.tipo === req.docTipo; });
      return UI.modal('<h2>Adjuntar documento</h2><p class="muted">' + UI.esc(req.titulo) + ' · documentos de ' + UI.esc(S.empresaDe(l).razon.replace(/\s*\(ficticia\)/, '')) + '</p>' +
        (hay ? '' : '<div class="banner" style="margin-top:10px"><span>!</span><span><b>Esta empresa todavía no tiene un documento de este tipo.</b> Cargalo en <a href="#/empresa/' + l.empresaId + '" data-act="close">Mi empresa</a> y queda disponible para todas sus licitaciones, o subí uno nuevo abajo.</span></div>') +
        '<input type="text" id="buscar-doc" placeholder="Buscar por nombre, archivo o tipo…" style="margin-top:10px" aria-label="Buscar documento"><div style="margin-top:6px">' +
        docs.map(li).join('') + '<p class="muted hide" id="sin-docs" style="padding:12px 0">Ningún documento coincide con la búsqueda.</p></div>' +
        '<label class="btn primary" style="margin-top:16px">Cargar uno nuevo<input type="file" class="hide" data-newdoc="' + req.id + '"></label>');
    }
    if (act === 'elegir-doc') { req.docId = el.dataset.doc; req.estado = 'listo'; S.save(); UI.close(); return render(); }

    if (act === 'simular') return simular(l);
    if (act === 'recorrido') return recorrido(l);
    if (act === 'tarea') { var ts = S.seg(l).tareas; ts[el.dataset.id] = !ts[el.dataset.id]; S.save(); return render(); }
    if (act === 'add-consulta' || act === 'add-circular') {
      var inp = document.getElementById(act === 'add-consulta' ? 'nueva-consulta' : 'nueva-circular'), txt = inp && inp.value.trim(), sg = S.seg(l);
      if (!txt) return UI.toast('Escribí el texto primero.');
      if (act === 'add-consulta') sg.consultas.push({ id: 'q' + Date.now(), fecha: S.inDays(0), texto: txt, estado: 'enviada' });
      else sg.circulares.push({ n: sg.circulares.length + 1, fecha: S.inDays(0), resumen: txt });
      S.save(); return render();
    }
    if (act === 'aplicar-mejora') { var sm = S.seg(l); sm.canonOriginal = sm.canonOriginal || l.oferta.canon; l.oferta.canon = Number(sm.mejora); S.save(); UI.toast('Canon de la oferta actualizado a ' + UI.money(sm.mejora) + '.'); return render(); }
    if (act === 'avanzar') {
      var cur = S.etapa(l);
      if (cur === 3 && !l.presentada) return UI.toast('Primero marcá la oferta como presentada en Revisión.');
      S.setEtapa(l, cur + 1); S.save(); return render();
    }
    if (act === 'imprimir') return window.print();
    if (act === 'ver-doc') {
      var fo = S.folios(l).byReq[req.id];
      return UI.modal('<h2>' + UI.esc(req.titulo) + '</h2><p class="muted">Folios ' + fo.from + '–' + fo.to + ' · ' + UI.esc(UI.carpeta[req.carpeta]) + ' · documento de ejemplo con datos ficticios</p>' + Demo.doc(l, req) +
        '<div class="row"><button class="btn" data-act="close">Cerrar</button></div>', true);
    }
    if (act === 'modalidad') { l.modalidad = el.dataset.m; S.save(); return render(); }
    if (act === 'anexo2') {
      var e4 = l.requisitos.filter(function (x) { return x.origen === 'anexo2'; })[0];
      return UI.modal('<h2>' + ({ lotes: 'Formulario de precios completado', servicio: 'Oferta económica completada' }[S.T(l).oferta] || 'Anexo II completado') + '</h2><p class="muted">Borrador con los datos de <a href="#/l/' + l.id + '/oferta" data-act="close">Oferta</a> y <a href="#/empresa/' + l.empresaId + '" data-act="close">Mi empresa</a>. Revisalo con asesoría legal y firmalo sin enmiendas.</p>' + Plantillas.anexo2(S.empresaDe(l), l) +
        '<div class="row"><button class="btn primary" data-act="tpl-listo" data-id="' + e4.id + '">Marcar como firmado y listo</button><button class="btn" data-act="close">Cerrar</button></div>', true);
    }

    if (act === 'rm-file') { nueva.files.splice(+el.dataset.i, 1); return render(); }
    if (act === 'tipo-nueva') { nueva.tid = el.dataset.t; return render(); }
    if (act === 'analizar-nueva') {
      var files = nueva.files.slice(), tid = nueva.tid || 'concesion', conc = tid === 'concesion', base = conc ? S.seedLicitacion() : S.TIPOS[tid].seed();
      simulate(function () {
        base.id = 'lic-' + Date.now(); base.nro = 'Licitación nueva (ejemplo analizado)'; base.titulo = S.TIPOS[tid].nombre + ' — estructura de ejemplo'; base.organismo = 'A confirmar al leer el pliego';
        if (conc) { base.fechas = S.fechasEjemplo(); llenar(base, files); }
        else base.archivos = files.map(function (f, i) { return { id: 'a' + i, nombre: f.name, tipo: 'Archivo cargado', paginas: '—', peso: f.size, hallazgos: 'Analizado (simulado)' }; });
        S.cambiarEmpresa(base, S.get().empresas[0].id);
        S.get().licitaciones.unshift(base); S.save();
        nueva = { files: [], busy: false, step: 0, tid: 'concesion' }; location.hash = '#/l/' + base.id + '/resumen'; UI.toast('Estructura armada: ' + S.reqs(base).length + ' requisitos en ' + S.T(base).orden.length + ' partes.');
      });
    }
  });

  /* ---------- inputs ---------- */
  function cargarEnLic(files) {
    var l = route().lic; if (!l || !files.length) return;
    if (l.requisitos.length) {
      toFiles(files).forEach(function (f) { l.archivos.push({ id: 'a' + Date.now() + f.name, nombre: f.name, tipo: 'Anexo / circular', paginas: '—', peso: f.size, hallazgos: 'Analizado (simulado)' }); });
      S.save(); UI.toast('Archivo agregado. En la versión real se recalcula el checklist.'); return render();
    }
    var fs = toFiles(files);
    UI.modal('<h2>Analizando el expediente…</h2><p class="muted">Leyendo pliego, circulares y anexos.</p>');
    setTimeout(function () { llenar(l, fs); UI.close(); UI.toast('Estructura armada.'); location.hash = '#/l/' + l.id + '/resumen'; render(); }, 1800);
  }

  document.addEventListener('change', function (ev) {
    var t = ev.target, l = route().lic;
    if (t.id === 'pick') { nueva.files = nueva.files.concat(toFiles(t.files)); return render(); }
    if (t.id === 'pick-lic') return cargarEnLic(t.files);
    if (t.dataset.bibemp) { V.bibEmp = t.value; return render(); }
    if (t.dataset.onbemp !== undefined) { var o1 = S.get().onb = S.get().onb || { hechos: {} }; o1.empId = t.value; return render(); }
    if (t.dataset.bibfiltro) { location.hash = '#/biblioteca' + (t.value ? '/' + t.value : ''); return; }
    if (t.id === 'pick-doc' && t.files[0]) {
      var fl = route().filtro, propia = fl && fl !== 'sin' ? fl : null, tipoSel = document.getElementById('tipo-doc'), empSel = document.getElementById('emp-doc');
      S.get().biblioteca.push({ id: 'd' + Date.now(), empId: propia ? S.empresaDe(S.lic(propia)).id : (empSel ? empSel.value : S.get().empresas[0].id), tipo: tipoSel ? tipoSel.value : 'estatuto', nombre: t.files[0].name.replace(/\.[^.]+$/, ''), vence: null, archivo: t.files[0].name, licId: propia });
      S.save(); UI.toast(propia ? 'Documento agregado a la licitación.' : 'Documento agregado a la biblioteca.'); return render();
    }
    if (t.dataset.up && t.files[0]) { var rq = l.requisitos.filter(function (x) { return x.id === t.dataset.up; })[0]; rq.archivo = t.files[0].name; rq.estado = 'listo'; S.save(); return render(); }
    if (t.dataset.newdoc && t.files[0]) {
      var rq2 = l.requisitos.filter(function (x) { return x.id === t.dataset.newdoc; })[0], id = 'd' + Date.now();
      S.get().biblioteca.push({ id: id, tipo: rq2.docTipo, nombre: t.files[0].name.replace(/\.[^.]+$/, ''), vence: null, archivo: t.files[0].name, licId: l.id, empId: l.empresaId });
      rq2.docId = id; rq2.estado = 'listo'; S.save(); UI.close(); return render();
    }
    if (t.dataset.eid && (t.dataset.emp || t.dataset.empfin)) {
      var ee = S.empresaById(t.dataset.eid), num = t.type === 'number', val = num ? (t.value === '' ? '' : Number(t.value)) : t.value;
      if (t.dataset.emp) ee[t.dataset.emp] = val; else { ee.fin = ee.fin || {}; ee.fin[t.dataset.empfin] = val; }
      S.save();
      /* con un borrador abierto no se vuelve a armar el modal (se perdería el foco): solo se rehace el texto y se quita la marca de "falta" */
      var paper = t.dataset.tpl && l && document.querySelector('#overlay .paper');
      if (paper) {
        var rt = l.requisitos.filter(function (x) { return x.id === t.dataset.tpl; })[0];
        paper.outerHTML = Plantillas.render(rt.tpl, S.empresaDe(l), l);
        var sm = document.querySelector('#overlay details > summary'), faltan = S.camposUsados(l, [rt.tpl]).filter(function (c) { return S.vacio(S.empresaDe(l), c); }).length;
        if (sm) sm.innerHTML = sm.innerHTML.replace(/\s*·\s*<span[^>]*>faltan \d+<\/span>/, '') + (faltan ? ' · <span style="color:var(--bad)">faltan ' + faltan + '</span>' : '');
      }
      return render();
    }
    /* documentos de la empresa: uno pedido por un pliego, o uno cualquiera con vencimiento */
    if (t.dataset.eid && (t.dataset.newtipo || t.id === 'pick-emp-doc') && t.files[0]) {
      var tipoE = t.dataset.newtipo || document.getElementById('tipo-emp-doc').value, vEl = document.getElementById('vence-emp-doc'), nm = t.files[0].name;
      S.get().biblioteca.push({ id: 'd' + Date.now(), empId: t.dataset.eid, tipo: tipoE, nombre: (S.NOMBRE_DOC[tipoE] || tipoE) + ' — ' + nm.replace(/\.[^.]+$/, ''), vence: !t.dataset.newtipo && vEl && vEl.value ? vEl.value : null, archivo: nm });
      S.save(); UI.toast('Documento guardado en la empresa.'); return render();
    }
    if (t.dataset.licemp) { S.cambiarEmpresa(l, t.value); S.save(); UI.toast('Empresa cambiada: los documentos se reasignaron a ' + S.empresaDe(l).razon.replace(/\s*\(ficticia\)/, '') + '.'); return render(); }
    if (t.dataset.of) {
      l.oferta[t.dataset.of] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value; S.save(); return render();
    }
    if (t.dataset.lote) {
      var L = l.oferta.lotes.filter(function (x) { return x.id === t.dataset.lote; })[0];
      L[t.dataset.k] = t.type === 'checkbox' ? t.checked : (t.value === '' ? '' : Number(t.value)); S.save(); return render();
    }
    if (t.dataset.item) {
      var ids = t.dataset.item.split(':'), L2 = l.oferta.lotes.filter(function (x) { return x.id === ids[0]; })[0], it = L2.items.filter(function (x) { return x.id === ids[1]; })[0];
      it[t.dataset.k] = t.value === '' ? '' : Number(t.value); S.save(); return render();
    }
    if (t.dataset.ofb) { l.oferta[t.dataset.ofb] = t.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value; S.save(); return render(); }
    if (t.dataset.cal) { l.calif[t.dataset.cal] = t.value === '' ? '' : Number(t.value); S.save(); return render(); }
    if (t.dataset.calu) { l.calif.unidades[t.dataset.calu] = t.value === '' ? '' : Number(t.value); S.save(); return render(); }
    if (t.dataset.seg) { S.seg(l)[t.dataset.seg] = t.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value; S.save(); return render(); }
    if (t.dataset.segap) { S.seg(l).apertura[t.dataset.segap] = t.value === '' ? '' : Number(t.value); S.save(); return render(); }
    if (t.dataset.fin) { l.fin[t.dataset.fin] = t.value === '' ? '' : Number(t.value); S.save(); return render(); }
    if (t.dataset.fecha && t.value) {
      l.fechas.apertura = t.value; l.fechas.presentacion = t.value; l.fechas.visita = S.addBusinessDays(t.value, -9); S.save(); return render();
    }
  });

  /* buscadores: el de la biblioteca recalcula solo los resultados (no pierde el foco) y el del selector filtra las filas */
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'buscar-lic') { V.licQ = t.value; document.getElementById('lic-res').innerHTML = V.licResultados(); }
    if (t.id === 'buscar-bib') { V.bibQ = t.value; document.getElementById('bib-res').innerHTML = V.bibResultados(route().filtro); }
    if (t.id === 'buscar-doc') {
      var q = t.value.trim().toLowerCase(), hay = 0;
      document.querySelectorAll('#overlay [data-q]').forEach(function (r) { var ok = !q || r.dataset.q.indexOf(q) > -1; r.classList.toggle('hide', !ok); if (ok) hay++; });
      var sin = document.getElementById('sin-docs'); if (sin) sin.classList.toggle('hide', hay > 0);
    }
  });

  /* arrastrar y soltar */
  document.addEventListener('dragover', function (ev) { var d = ev.target.closest && ev.target.closest('.drop'); if (d) { ev.preventDefault(); d.classList.add('over'); } });
  document.addEventListener('dragleave', function (ev) { var d = ev.target.closest && ev.target.closest('.drop'); if (d) d.classList.remove('over'); });
  document.addEventListener('drop', function (ev) {
    var d = ev.target.closest && ev.target.closest('.drop'); if (!d) return;
    ev.preventDefault(); d.classList.remove('over');
    if (route().page === 'nueva') { nueva.files = nueva.files.concat(toFiles(ev.dataTransfer.files)); render(); } else cargarEnLic(ev.dataTransfer.files);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') UI.close(); });
  window.addEventListener('hashchange', function () {
    UI.close(); render();
    /* en el onboarding se baja hasta el paso abierto; en el resto, arriba de todo */
    var paso = route().page === 'onboarding' && document.querySelector('.ob-item.on');
    if (paso) paso.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
  });
  render();
})();
