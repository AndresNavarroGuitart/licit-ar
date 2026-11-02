/* Mi empresa: varias sociedades, sus datos y sus documentos, y lo que piden los pliegos cargados.
   Los datos ficticios de las tres empresas de ejemplo se siembran aca. */
(function () {
  var S = Store, inDays = S.inDays;

  /* nombre completo de cada tipo de documento */
  S.NOMBRE_DOC = {
    estatuto: 'Estatuto o contrato social y actas', poder: 'Poder y autorización del firmante', arca: 'Constancia de CUIT o inscripción fiscal', iibb: 'Ingresos Brutos o tributos provinciales',
    previsional: 'Libre deuda previsional', concursos: 'Certificado de concursos y quiebras', penales: 'Antecedentes penales', balance: 'Estados contables certificados',
    antecedentes: 'Antecedentes y referencias de proyectos', fabricante: 'Autorización del fabricante', folleteria: 'Folletería y manuales técnicos'
  };
  /* documentos que el pliego pide al adjudicatario como tarea, no como requisito de la oferta */
  var EXTRA = {};

  /* datos de la empresa que piden los pliegos: [grupo, clave, etiqueta, quien lo pide, tipo de campo] */
  S.CAMPOS = [
    ['Identificación', 'razon', 'Razón social', 'Todos los pliegos'],
    ['Identificación', 'cuit', 'CUIT o NIF', 'Todos los pliegos'],
    ['Identificación', 'anio', 'Año de registro', 'LPI: Formulario de Información del Oferente'],
    ['Identificación', 'objeto', 'Objeto social o actividad', 'Concesión: debe ser compatible con la concesión (Art. II.4.3)', 'area'],
    ['Domicilio y contacto', 'domicilio', 'Domicilio legal y real', 'Notas y declaraciones; LPI y comparación de precios: domicilio legal y real'],
    ['Domicilio y contacto', 'email', 'Correo para notificaciones', 'Notas, formularios de cotización y formulario de propuesta económica', 'email'],
    ['Domicilio y contacto', 'telefono', 'Teléfono', 'Formularios de cotización y de información del proveedor'],
    ['Representante y poder', 'representante', 'Representante legal', 'Notas de presentación y todas las declaraciones juradas'],
    ['Representante y poder', 'cargo', 'Cargo', 'Notas de presentación'],
    ['Representante y poder', 'dni', 'Documento del representante', 'Formularios de información; contrato'],
    ['Representante y poder', 'poder', 'Instrumento que acredita la personería', 'Concesión: Anexo II; LPI y comparación de precios: autorización al firmante'],
    ['Representante y poder', 'directores', 'Autoridades que deciden participar', 'Concesión: acta del órgano de dirección (Art. II.5.1 e)'],
    ['Integridad', 'benef', 'Beneficiarios finales', 'Concesión: declaración de integridad y transparencia (Art. II.5.1 g)', 'area'],
    ['Integridad', 'origen', 'Origen de los fondos', 'Concesión: origen lícito de los fondos de la inversión (Art. II.5.1 g)', 'area'],
    ['Datos financieros', 'ac', 'Activo corriente', 'Concesión: indicadores financieros (Art. II.5.1 m.1)', 'fin'],
    ['Datos financieros', 'pc', 'Pasivo corriente', 'Concesión: liquidez corriente', 'fin'],
    ['Datos financieros', 'pt', 'Pasivo total', 'Concesión: endeudamiento', 'fin'],
    ['Datos financieros', 'pn', 'Patrimonio neto', 'Concesión: endeudamiento y fuentes de financiación', 'fin'],
    ['Datos financieros', 'mb', 'Margen bruto', 'Concesión: margen operativo', 'fin'],
    ['Datos financieros', 'io', 'Ingresos operativos', 'Concesión: margen operativo', 'fin'],
    ['Experiencia y capacidad', 'ventas', 'Ventas anuales del mejor año (USD)', 'LPI: 1,6 veces el monto de cada lote (calificación posterior)', 'num'],
    ['Experiencia y capacidad', 'expEsp', 'Años de experiencia con el bien específico', 'LPI: 3 años en el bien específico', 'num'],
    ['Experiencia y capacidad', 'expSim', 'Años de experiencia con bienes similares', 'LPI: 5 años en bienes similares', 'num']
  ];

  S.empresaById = function (id) { return S.get().empresas.filter(function (e) { return e.id === id; })[0]; };
  S.empresaDe = function (l) { return S.empresaById(l.empresaId) || S.get().empresas[0]; };
  S.valorCampo = function (e, c) { return c[4] === 'fin' ? (e.fin || {})[c[1]] : e[c[1]]; };

  /* datos de la empresa que usan los borradores de una licitación, y cuáles de esos todavía están vacíos */
  S.plantillasDe = function (l) { return S.reqs(l).filter(function (r) { return r.origen === 'plantilla' && r.tpl; }); };
  S.camposUsados = function (l, tplIds) {
    var claves = {};
    tplIds.forEach(function (id) { Plantillas.campos(id, l).forEach(function (k) { claves[k] = true; }); });
    return S.CAMPOS.filter(function (c) { return c[4] !== 'fin' && claves[c[1]]; });
  };
  S.vacio = function (e, c) { var v = S.valorCampo(e, c); return v === '' || v == null; };
  S.datosFaltantes = function (l) {
    var e = S.empresaDe(l);
    return S.camposUsados(l, S.plantillasDe(l).map(function (r) { return r.tpl; })).filter(function (c) { return S.vacio(e, c); });
  };

  S.docsDeEmpresa = function (id) { return S.get().biblioteca.filter(function (d) { return d.empId === id; }); };
  S.licsDeEmpresa = function (id) { return S.get().licitaciones.filter(function (l) { return (l.empresaId || S.get().empresas[0].id) === id; }); };
  S.tieneDoc = function (id, tipo) { return S.docsDeEmpresa(id).some(function (d) { return d.tipo === tipo; }); };

  /* que tipos de documento piden los pliegos cargados y quien los pide; "propio" = lo pide alguna licitacion de esa empresa */
  S.catalogoDocs = function (empId) {
    var pid = {}, lics = S.get().licitaciones;
    lics.forEach(function (l) {
      l.requisitos.forEach(function (r) { if (r.origen === 'biblioteca' && r.docTipo) (pid[r.docTipo] = pid[r.docTipo] || []).push({ lic: l, req: r }); });
    });
    return ['estatuto', 'poder', 'arca', 'iibb', 'previsional', 'concursos', 'penales', 'balance', 'antecedentes', 'fabricante', 'folleteria']
      .map(function (t) {
        var x = EXTRA[t], extraLic = x && lics.filter(function (l) { return l.id === x.lic; })[0], pedido = pid[t] || [];
        var propio = !empId || pedido.some(function (p) { return (p.lic.empresaId) === empId; }) || !!(extraLic && extraLic.empresaId === empId);
        return { tipo: t, nombre: S.NOMBRE_DOC[t], pedido: pedido, extra: x ? x.txt : '', propio: propio };
      })
      .filter(function (x) { return x.pedido.length || x.extra; });
  };

  /* completitud de una empresa: datos cargados y documentos que piden SUS licitaciones, contra los que ya tiene */
  S.completitud = function (e) {
    var llenos = S.CAMPOS.filter(function (c) { var v = S.valorCampo(e, c); return v !== '' && v != null; }).length;
    var cat = S.catalogoDocs(e.id).filter(function (x) { return x.propio; }), tiene = cat.filter(function (x) { return S.tieneDoc(e.id, x.tipo); }).length;
    return { llenos: llenos, total: S.CAMPOS.length, datosPct: Math.round(100 * llenos / S.CAMPOS.length), docsTiene: tiene, docsTotal: cat.length, docsPct: cat.length ? Math.round(100 * tiene / cat.length) : 100, faltan: cat.filter(function (x) { return !S.tieneDoc(e.id, x.tipo); }) };
  };

  /* cambiar la empresa de una licitacion reasigna los documentos de la biblioteca por los de la nueva empresa */
  S.cambiarEmpresa = function (l, id) {
    l.empresaId = id;
    l.requisitos.forEach(function (r) {
      if (r.origen !== 'biblioteca') return;
      var nd = S.docsDeEmpresa(id).filter(function (d) { return d.tipo === r.docTipo; })[0];
      if (r.docId) { r.docId = nd ? nd.id : null; if (!nd) r.estado = 'pendiente'; }
    });
  };

  /* completar el pliego con lo que ya esta cargado: adjunta documentos y copia datos de la empresa */
  S.completarDesdeEmpresa = function (l) {
    var e = S.empresaDe(l), res = { docs: 0, faltan: [], datos: [] };
    l.requisitos.forEach(function (r) {
      if (r.origen !== 'biblioteca' || r.docId || (r.soloUT && l.modalidad !== 'ut')) return;
      var d = S.docsDeEmpresa(e.id).filter(function (x) { return x.tipo === r.docTipo; })[0];
      if (d) { r.docId = d.id; r.estado = 'listo'; res.docs++; } else res.faltan.push(S.NOMBRE_DOC[r.docTipo] || r.docTipo);
    });
    if ((l.tid || 'concesion') === 'concesion' && l.fin && e.fin && e.fin.ac !== '') { l.fin = JSON.parse(JSON.stringify(e.fin)); res.datos.push('datos financieros'); }
    if (l.tid === 'lpi_bienes' && l.calif && e.ventas !== '') { l.calif.ventas = e.ventas; l.calif.expEsp = e.expEsp; l.calif.expSim = e.expSim; res.datos.push('ventas y experiencia'); }
    return res;
  };

  /* ---------- las tres empresas de ejemplo (ficticias) ---------- */
  S.seedEmpresas = function () {
    return [
      { id: 'e1', razon: 'Delta Marina Desarrollos S.A. (ficticia)', cuit: '30-00000000-0', nif: '', anio: '2014', objeto: 'Construcción, administración, operación y explotación comercial de marinas, guarderías náuticas, astilleros y predios portuarios.',
        domicilio: 'Av. Ejemplo 1234, Rosario, Santa Fe', email: 'licitaciones@deltamarina.example', telefono: '0341 000-0000', representante: 'Mariana Ejemplo', cargo: 'Presidente', dni: '00.000.000',
        poder: 'Acta de Directorio N° 41 de designación de autoridades', directores: 'los tres directores titulares', visitaNro: 'V-0000/2026',
        benef: 'Marina Ejemplo Holding S.A. (60 %, CUIT 30-00000000-1, argentina) y Carla Ejemplo (40 %, DNI 00.000.001, argentina, domicilio en Rosario)', origen: 'aportes de capital de los socios, generación propia de fondos y financiamiento bancario',
        fin: { ac: 4200000000, pc: 3100000000, pt: 6000000000, pn: 5200000000, mb: 1800000000, io: 9000000000 }, ventas: 9500000, expEsp: 6, expSim: 12 },
      { id: 'e2', razon: 'Litoral Seguridad y Tecnología S.R.L. (ficticia)', cuit: '30-00000002-2', nif: '', anio: '2009', objeto: 'Comercialización, instalación y servicio técnico de equipos de inspección, seguridad, informática y comunicaciones.',
        domicilio: 'Bv. Ejemplo 500, Córdoba, Córdoba', email: 'licitaciones@litoralseguridad.example', telefono: '0351 000-0000', representante: 'Julián Ejemplo', cargo: 'Socio gerente', dni: '00.000.002',
        poder: 'Contrato social, cláusula sexta, y acta de gerencia N° 18', directores: 'los dos socios gerentes', visitaNro: 'V-0000/2026',
        benef: '', origen: '',
        fin: { ac: 2600000000, pc: 1700000000, pt: 3300000000, pn: 2900000000, mb: 1100000000, io: 5200000000 }, ventas: 10800000, expEsp: 7, expSim: 14 }
    ];
  };

  S.seedDocsExtra = function () {
    var d = function (id, emp, tipo, nombre, vence, archivo) { return { id: id, empId: emp, tipo: tipo, nombre: nombre, vence: vence, archivo: archivo }; };
    return [
      d('e2d1', 'e2', 'estatuto', 'Contrato social y actas de gerencia (certificados)', null, 'contrato_social.pdf'),
      d('e2d2', 'e2', 'arca', 'Constancia de inscripción ARCA', inDays(75), 'constancia_arca.pdf'),
      d('e2d3', 'e2', 'iibb', 'Constancia de Ingresos Brutos (Córdoba)', inDays(55), 'constancia_iibb.pdf'),
      d('e2d4', 'e2', 'previsional', 'Constancia de inexistencia de deuda previsional', inDays(50), 'libre_deuda_previsional.pdf'),
      d('e2d5', 'e2', 'concursos', 'Certificado de inexistencia de concursos y quiebras', inDays(60), 'certificado_concursos.pdf'),
      d('e2d6', 'e2', 'penales', 'Certificados de antecedentes penales de los socios', inDays(80), 'antecedentes_penales.pdf'),
      d('e2d7', 'e2', 'balance', 'Estados contables auditados, últimos 5 ejercicios', null, 'estados_contables_5_ejercicios.pdf'),
      d('e2d8', 'e2', 'antecedentes', 'Lista de contratos de equipos de inspección (5 años)', null, 'contratos_equipos_inspeccion.pdf'),
      d('e2d9', 'e2', 'poder', 'Poder y autorización del firmante (certificados)', inDays(280), 'poder_firmante.pdf'),
      d('e2d10', 'e2', 'fabricante', 'Autorización del fabricante Escáneres del Mundo (ejemplo)', inDays(140), 'autorizacion_fabricante.pdf'),
      d('e2d11', 'e2', 'folleteria', 'Folletería y manuales técnicos', null, 'folleteria_manuales.pdf')
    ];
  };

  /* asigna la empresa de cada licitacion de ejemplo y reasigna sus documentos a esa empresa */
  S.postSeed = function (st) {
    st.biblioteca.forEach(function (d) { if (!d.empId) d.empId = 'e1'; });
    var emp = { mangrullo: 'e1', 'lp-02-2026': 'e1', 'vuce-564': 'e2', 'vuce-643': 'e2', 'vuce-642': 'e2', 'vuce-663': 'e2' };
    st.licitaciones.forEach(function (l) {
      l.empresaId = emp[l.id] || 'e1';
      if (l.empresaId === 'e1') return;
      l.requisitos.forEach(function (r) {
        if (r.origen !== 'biblioteca') return;
        var nd = st.biblioteca.filter(function (d) { return d.empId === l.empresaId && d.tipo === r.docTipo; })[0];
        if (r.docId) { r.docId = nd ? nd.id : null; if (!nd && r.estado === 'listo') r.estado = 'pendiente'; }
        delete r.docPref;
      });
    });
    return st;
  };
})();
