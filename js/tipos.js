/* Tipos de licitacion ademas de la concesion: licitacion publica internacional de bienes (BID) y
   comparacion de precios de bienes o servicios (BID). Requisitos, reglas y plazos salen de los pliegos
   VUCE-564-LPI-B y VUCE-643-CP-B / VUCE-642-CP-S (Programa VUCEA, prestamo BID 3869/OC-AR). */
(function () {
  var S = Store, add = S.addDaysTo, inDays = S.inDays, daysLeft = S.daysLeft;
  var mon = function (n, m) { var v = Math.round(n).toLocaleString('es-AR'); return m === 'USD' ? 'USD ' + v : m === 'EUR' ? v + ' €' : '$ ' + v; };
  S.mon = mon;
  S.daysBetween = function (a, b) { return Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5); };

  function req(id, carpeta, grupo, titulo, detalle, origen, folios, estado, src, extra) {
    var r = { id: id, carpeta: carpeta, grupo: grupo, titulo: titulo, detalle: detalle, origen: origen, folios: folios, estado: estado, src: src };
    for (var k in (extra || {})) r[k] = extra[k];
    return r;
  }
  function src(doc) { return function (ref, pag, texto, mark) { return { doc: doc, ref: ref, pag: pag, texto: texto, mark: mark }; }; }

  /* ---------- lotes: precio por lote, completo o descartado ---------- */
  S.lotes = function (l) {
    var o = l.oferta, iva = (Number(o.iva) || 0) / 100;
    return o.lotes.map(function (L) {
      var neto = L.items.reduce(function (s, i) { return s + (Number(i.cant) || 0) * (Number(i.precio) || 0); }, 0);
      var serv = Number(L.servicios) || 0, base = neto + serv;
      return { id: L.id, nombre: L.nombre, cotiza: !!L.cotiza, neto: neto, serv: serv, base: base, conIva: Math.round(base * (1 + iva)), faltan: L.items.filter(function (i) { return !(Number(i.precio) > 0); }).length, presupuesto: L.presupuesto || 0 };
    });
  };
  S.totalLotes = function (l) {
    var ls = S.lotes(l).filter(function (x) { return x.cotiza; });
    return { base: ls.reduce(function (s, x) { return s + x.base; }, 0), conIva: ls.reduce(function (s, x) { return s + x.conIva; }, 0), n: ls.length };
  };

  /* ---------- LPI de bienes (VUCE-564-LPI-B) ---------- */
  function reqsLPI() {
    var s = src('Pliego LPI VUCE-564-LPI-B (BID)');
    var F = 'Formularios y precios', E = 'Elegibilidad y documentación legal', T = 'Conformidad técnica', C = 'Calificaciones del oferente';
    return [
      req('lp1', 'A', F, 'Formulario de Presentación de Oferta', 'Sin alterar su forma; no se aceptan sustitutos. Incluye la declaración de elegibilidad del oferente.', 'plantilla', 3, 'en-curso',
        s('IAO 12.1', 10, 'Este formulario deberá ser debidamente llenado sin alterar su forma y no se aceptarán sustitutos.', 'no se aceptarán sustitutos'), { tpl: 'bid_oferta', elim: true }),
      req('lp2', 'A', F, 'Formulario de Información del Oferente', 'Nombre jurídico, año de registro y datos del representante autorizado.', 'plantilla', 2, 'pendiente',
        s('Sección IV', 35, 'Formulario de Información del Oferente: Año de registro del Oferente. Información del representante autorizado del Oferente.', 'Año de registro del Oferente'), { tpl: 'bid_info' }),
      req('lp3', 'A', F, 'Información de los miembros de la APCA o UT', 'El líder cumple como mínimo el 60 % de cada requisito y los demás el 20 %.', 'plantilla', 2, 'pendiente',
        s('Sección IV', 36, 'Formulario de Información de Miembros de la Asociación en Participación o Consorcio.', 'Miembros de la Asociación en Participación o Consorcio'), { tpl: 'bid_apca', soloUT: true }),
      req('lp4', 'A', F, 'Listas de precios por lote, con el origen de los bienes', 'Una lista según el origen (importados, ya importados o locales) y el precio de los servicios conexos.', 'anexo2', 4, 'pendiente',
        s('IAO 12.2', 10, 'El Oferente presentará la Lista de Precios de los Bienes y Servicios Conexos, según corresponda a su origen y utilizando los formularios suministrados en la Sección IV.', 'según corresponda a su origen'), { elim: true }),
      req('lp5', 'A', F, 'Cuadro de gastos asociados a la importación', 'Obligatorio si cotizás bienes fabricados fuera del país que deben importarse.', 'externo', 1, 'pendiente',
        s('DDL 11.1(h)', 24, 'deberá presentar como parte de su oferta “el cuadro Gastos asociados a la Importación de los bienes a ser importados”', 'Gastos asociados a la Importación')),
      req('lp6', 'A', F, 'Cuadro de impuestos internos por lote', 'Impuesto, base imponible, alícuota y valor del impuesto, para cada lote cotizado.', 'externo', 1, 'pendiente',
        s('DDL 11.1(h)', 25, 'Cuadro con detalle, informando los impuestos internos involucrados en la cotización a la fecha de la presentación de la oferta.', 'impuestos internos')),
      req('lp7', 'A', F, 'Declaración de Mantenimiento de la Oferta (120 días)', 'Reemplaza a la garantía en dinero. Si retirás la oferta o no firmás, quedás inelegible 5 años.', 'plantilla', 1, 'pendiente',
        s('DDL 21.1', 26, 'La oferta deberá incluir una “Declaración de Mantenimiento de la Oferta” utilizando el formulario incluido en la Sección IV Formularios de la Oferta.', 'Declaración de Mantenimiento de la Oferta'), { tpl: 'bid_mantenimiento', elim: true }),

      req('lp8', 'B', E, 'Autorización escrita al firmante de la oferta', 'Confirma que puede comprometer al oferente.', 'biblioteca', 3, 'listo',
        s('IAO 11.1(c)', 9, 'confirmación escrita que autorice al signatario de la oferta a comprometer al Oferente', 'autorice al signatario'), { docTipo: 'poder', docId: 'd11', elim: true }),
      req('lp9', 'B', E, 'Documentación constitutiva o estatutos', 'De cada firma. Para APCA o UT, también la de la asociación o el compromiso de formalizarla.', 'biblioteca', 18, 'listo',
        s('DDL 11.1(h)', 24, 'Documentación constitutiva o estatutos - según corresponda - de la persona jurídica oferente.', 'Documentación constitutiva o estatutos'), { docTipo: 'estatuto', docId: 'd1' }),
      req('lp10', 'B', E, 'Domicilio legal y domicilio real', 'País, provincia, ciudad, calle y número. Las comunicaciones valen en el domicilio legal.', 'plantilla', 1, 'pendiente',
        s('DDL 11.1(h)', 25, 'Detalle del domicilio legal. Serán válidas todas las comunicaciones que el comprador dirija al oferente con motivo de la presente Licitación.', 'Detalle del domicilio legal'), { tpl: 'bid_domicilio' }),

      req('lp11', 'C', T, 'Autorización del Fabricante', 'Obligatoria si no fabricás los bienes que ofrecés.', 'biblioteca', 2, 'listo',
        s('DDL 19.1(a)', 26, 'SE REQUIERE la Autorización del Fabricante.', 'SE REQUIERE la Autorización del Fabricante'), { docTipo: 'fabricante', docId: 'd12' }),
      req('lp12', 'C', T, 'Compromiso de servicios posteriores a la venta', 'Mantenimiento, reparaciones y repuestos en el país, por sí o mediante un agente equipado.', 'plantilla', 2, 'pendiente',
        s('DDL 19.1(b)', 26, 'SE REQUIEREN Servicios posteriores a la venta.', 'SE REQUIEREN Servicios posteriores a la venta'), { tpl: 'bid_posventa' }),
      req('lp13', 'C', T, 'Folletería, manuales y hojas técnicas de los bienes', 'De cada bien cotizado.', 'biblioteca', 60, 'pendiente',
        s('DDL 11.1(h)', 25, 'Folletería, manuales y hojas con descripción técnica de los bienes cotizados.', 'Folletería, manuales'), { docTipo: 'folleteria', docPref: 'd13' }),
      req('lp14', 'C', T, 'Evidencia de conformidad con las especificaciones técnicas', 'Con una declaración de variaciones y excepciones, si las hay.', 'externo', 20, 'en-curso',
        s('IAO 18.1', 12, 'los Oferentes deberán proporcionar como parte de la oferta evidencia documentada acreditando que los Bienes cumplen con las especificaciones técnicas y los estándares especificados.', 'cumplen con las especificaciones técnicas')),
      req('lp15', 'C', T, 'Lista de repuestos y herramientas especiales (2 años)', 'Disponibilidad y precios actuales, desde la recepción definitiva.', 'externo', 4, 'pendiente',
        s('IAO 18.3', 12, 'una lista detallada que incluya disponibilidad y precios actuales de repuestos, herramientas especiales, etc. necesarias para el adecuado y continuo funcionamiento de los bienes.', 'repuestos, herramientas especiales')),

      req('lp16', 'D', C, 'Estados contables auditados de los últimos 5 ejercicios', 'Copia simple de los ejercicios cerrados antes de la fecha límite.', 'biblioteca', 120, 'pendiente',
        s('DDL 11.1(h)', 25, 'Copia simple de los Estados Contables Auditados correspondientes a los últimos cinco (5) ejercicios contables cerrados con anterioridad a la fecha límite de presentación de oferta.', 'últimos cinco (5) ejercicios'), { docTipo: 'balance', docPref: 'd10' }),
      req('lp17', 'D', C, 'Lista de contratos de bienes iguales o similares (5 años)', 'Cliente, bienes, cantidades y fecha de venta; o copias de contratos o facturas.', 'biblioteca', 10, 'en-curso',
        s('DDL 11.1(h)', 25, 'Lista de contratos para bienes iguales y similares a los del lote o lotes ofertado/s correspondientes a los últimos cinco (5) ejercicios contables.', 'bienes iguales y similares'), { docTipo: 'antecedentes' }),
      req('lp18', 'D', C, 'Declaración jurada de ventas anuales y capacidad de producción', 'Del oferente y, si no es el fabricante, también del fabricante (capacidad anual instalada).', 'plantilla', 2, 'pendiente',
        s('Criterios 4(b)', 33, 'Se acreditará mediante Declaración Jurada de ventas del oferente, detallando las cantidades de ventas anuales de cada uno de los bienes ofertados.', 'Declaración Jurada de ventas del oferente'), { tpl: 'bid_ventas' }),
      req('lp19', 'D', C, 'Acreditación de ventas, experiencia y capacidad técnica', 'Ventas anuales de 1,6 veces el monto de cada lote; 3 años en el bien o 5 en similares; cantidad anual mínima por lote.', 'indicadores', 1, 'pendiente',
        s('Criterios 4(a)', 32, 'El volumen de ventas anual en al menos 1 año dentro de los últimos 5 años deberá ser equivalente, como mínimo, a: 1,6 veces, el monto de cada lote ofertado.', '1,6 veces'))
    ];
  }

  function seedLPI() {
    var ap = S.nextWeekday(inDays(30));
    return {
      id: 'vuce-564', tid: 'lpi_bienes', nro: 'LPI VUCE-564-LPI-B',
      titulo: 'Adquisición de escáneres de rayos X para control en puertos, pasos fronterizos, zonas francas y terminales aeroportuarias',
      organismo: 'Programa VUCEA · Ministerio de Economía · BID 3869/OC-AR', expediente: '',
      tipo: 'Licitación pública internacional · bienes', estado: 'preparacion', ref: { label: 'Lotes', texto: '3' },
      params: { validez: 120, consultasDias: 21, pctGarantiaCumpl: 10, plazoGarantiaCumpl: 28, plazoFirma: 28, anticipoPct: 20, multaPct: 1, multaMax: 10, kVentas: 1.6, expEsp: 3, expSim: 5, unidadesMin: { L1: 1, L2: 3, L3: 9 }, inelegibleAnios: 5, copias: 'original y 2 copias (una física y otra digital)' },
      fechas: { visita: '', presentacion: ap, horaPres: '12:00', apertura: ap, horaAper: '13:30' }, modalidad: 'individual',
      archivos: [{ id: 'a1', nombre: 'LPI_VUCE-564_Escaneres_rayos_X.pdf', tipo: 'Documentos de licitación (BID)', paginas: 115, peso: '1,2 MB', hallazgos: '19 requisitos · 3 lotes · calificación posterior · validez 120 días' }],
      requisitos: reqsLPI(),
      oferta: { moneda: 'USD', iva: 0, incoterm: 'CIP', validez: 120, tc: '',
        lotes: [
          { id: 'L1', nombre: 'Escáner de rayos X para contenedores fijos — portal sin desplazamiento', entrega: '300 días desde la firma', cotiza: true, servicios: 120000, items: [{ id: 'i1', desc: 'Escáner de portal fijo', cant: 1, precio: 2450000 }] },
          { id: 'L2', nombre: 'Equipos de inspección móviles (tráiler desmontable, sin tractor)', entrega: '300 días desde la firma', cotiza: true, servicios: 150000, items: [{ id: 'i1', desc: 'Equipo móvil tipo tráiler', cant: 2, precio: 1380000 }] },
          { id: 'L3', nombre: 'Escáner de bultos y cargas voluminosas — doble vista 180x180', entrega: '180 días desde la firma', cotiza: true, servicios: 90000, items: [{ id: 'i1', desc: 'Escáner doble vista', cant: 3, precio: 610000 }] }
        ] },
      calif: { ventas: 9500000, expEsp: 6, expSim: 12, unidades: { L1: 2, L2: 4, L3: 11 } },
      presentada: false,
      seg: { tareas: { b2a: true }, apertura: {}, adjudicacion: '', tenencia: '', circulares: [], consultas: [] }
    };
  }

  /* ---------- Comparacion de precios (VUCE-643-CP-B bienes / VUCE-642-CP-S servicios) ---------- */
  function reqsCP(servicio, nombreDoc) {
    var s = src(nombreDoc);
    var A = 'Cotización', B = 'Documentación del proveedor', T = 'Técnica';
    var rs = [
      req('cp1', 'A', A, 'Carta de la Cotización', 'Reservas, conformidad, precio, descuentos, validez, elegibilidad y declaraciones del proveedor.', 'plantilla', 3, 'en-curso',
        s('Cláusula 21', 9, 'si cualesquiera de los siguientes documentos o información faltaran al momento de la presentación de la Oferta, la misma será rechazada: Carta de cotización.', 'será rechazada'), { tpl: 'cp_carta', elim: true }),
      req('cp2', 'A', A, 'Formulario 2 — Cotización y lista de precios' + (servicio ? ' del servicio' : ' de bienes'), 'Precio por lote completo, con impuestos discriminados.', 'anexo2', 2, 'pendiente',
        s('Cláusula 21', 9, 'Formulario 2 Formulario de Cotización y Lista de Precios Bienes', 'Formulario 2'), { elim: true }),
      req('cp3', 'A', A, 'Formulario 6 — Declaración de Mantenimiento de la Cotización', 'Se ejecuta si retirás la cotización durante la validez o no firmás el contrato.', 'plantilla', 1, 'pendiente',
        s('Cláusula 20', 8, 'La cotización deberá venir acompañada de una Declaración de Mantenimiento de la Cotización según el formato del Formulario 6.', 'Declaración de Mantenimiento de la Cotización'), { tpl: 'cp_f6', elim: true }),
      req('cp4', 'A', A, 'El pliego completo, firmado en original en todas sus hojas', 'Por una persona con capacidad para obligar a la firma. Se escanea para el envío.', 'externo', 52, 'pendiente',
        s('Cláusula 21', 9, 'El presente pliego de bases y condiciones con la totalidad de sus hojas firmadas en original por persona con capacidad suficiente para obligar a la firma.', 'firmadas en original'), { elim: true }),
      req('cp5', 'B', B, 'Formulario 1 — Información del Proveedor', 'Con los documentos que se indican al final del formulario.', 'plantilla', 2, 'pendiente',
        s('Cláusula 21', 9, 'Formulario 1 Información del Proveedor. Deberán adjuntarse los documentos que se indican al final del formulario.', 'Información del Proveedor'), { tpl: 'cp_f1' }),
      req('cp6', 'B', B, 'Estatuto, contrato social y/o poder', 'Copia simple, o los documentos de registro de la entidad legal.', 'biblioteca', 18, 'listo',
        s('Cláusula 21', 9, 'Una copia simple del estatuto, contrato social y/o poder, según corresponda.', 'estatuto, contrato social y/o poder'), { docTipo: 'estatuto', docId: 'd1' }),
      req('cp7', 'B', B, 'Autorización al signatario de la cotización', 'Para representar a la firma.', 'biblioteca', 3, 'listo',
        s('Cláusula 21', 9, 'Autorización al signatario de la cotización para representar la firma.', 'signatario'), { docTipo: 'poder', docId: 'd11' }),
      req('cp8', 'B', B, 'Constancia de CUIT vigente', 'Emitida por AFIP (hoy ARCA).', 'biblioteca', 2, 'listo',
        s('Cláusula 21', 9, 'Constancia de CUIT, emitida por la AFIP, Vigente.', 'Constancia de CUIT'), { docTipo: 'arca', docId: 'd2' }),
      req('cp9', 'B', B, 'Autorización del fabricante (si no sos el fabricante)', 'Con el formulario del pliego.', 'biblioteca', 2, 'pendiente',
        s('Cláusula 21', 9, 'Formulario de autorización del fabricante (en caso de no ser fabricante).', 'autorización del fabricante'), { docTipo: 'fabricante', docPref: 'd12' }),
      req('cp10', 'B', B, 'Declaración jurada del origen de los bienes', 'Debe provenir de un país miembro del BID.', 'plantilla', 1, 'pendiente',
        s('Cláusula 21', 9, 'Declaración jurada certificando el origen de los bienes.', 'origen de los bienes'), { tpl: 'cp_origen' })
    ];
    if (servicio) {
      rs.push(req('cp11', 'T', T, 'Descripción detallada del servicio, en hoja membretada', 'Alcance, tiempos de respuesta y repuestos, según las especificaciones técnicas.', 'externo', 4, 'en-curso',
        s('Cláusula 21', 9, 'Descripción en hoja membretada del servicio que prestará, de forma detallada.', 'hoja membretada')));
    }
    rs.push(req('cp12', 'T', T, 'Folletería con los datos técnicos' + (servicio ? ' y guía de usuario' : ' del equipo ofertado'), 'Puede estar en otro idioma si se adjunta la traducción al español.', 'biblioteca', 12, 'pendiente',
      s('Cláusula 21', 9, 'Folletería con los datos técnicos del equipo ofertado.', 'Folletería'), { docTipo: 'folleteria', docPref: 'd13' }));
    rs.push(req('cp13', 'T', T, 'Documentación pedida en las especificaciones técnicas', 'Todo lo que la Sección IV exija para los lotes cotizados.', 'externo', 4, 'pendiente',
      s('Cláusula 21', 9, 'Y toda documentación requerida en las especificaciones técnicas.', 'especificaciones técnicas')));
    return rs;
  }

  function paramsCP(consultasDias) {
    return { validez: 60, consultasDias: consultasDias, circularesDias: 3, confirmarDias: 3, maxMB: 25, minCotizaciones: 3, pctGarantiaCumpl: 10, plazoGarantiaCumpl: 28, pagoDias: 10, recepcionDias: 7, multaPct: 1, multaMax: 10 };
  }

  function seedCP643() {
    var ap = S.nextWeekday(inDays(18));
    return {
      id: 'vuce-643', tid: 'cp_bienes', nro: 'CP VUCE-643-CP-B', titulo: 'Adquisición de repuestos para ultrabooks VUCE',
      organismo: 'Programa VUCEA · Ministerio de Economía · BID 3869/OC-AR', expediente: '', tipo: 'Comparación de precios · bienes', estado: 'preparacion',
      ref: { label: 'Presupuesto del llamado', texto: 'USD 25.000' }, params: paramsCP(10),
      fechas: { visita: '', presentacion: ap, horaPres: '12:00', apertura: ap, horaAper: '12:00' }, modalidad: 'individual',
      archivos: [{ id: 'a1', nombre: 'CP_VUCE-643_Repuestos_ultrabooks.pdf', tipo: 'Solicitud de cotización (BID)', paginas: 52, peso: '900 KB', hallazgos: '12 requisitos · 4 lotes con presupuesto · envío electrónico' }],
      requisitos: reqsCP(false, 'Pliego CP VUCE-643-CP-B (BID)'),
      oferta: { moneda: 'USD', iva: 21, validez: 60, pesoMB: 18, firma: 'Firma ológrafa escaneada', tc: '',
        lotes: [
          { id: 'L1', nombre: 'Cargador de batería para laptop Dell Latitude 7390', cotiza: true, presupuesto: 1800, servicios: 0, items: [{ id: 'i1', desc: 'Cargador de batería', cant: 10, precio: 150 }] },
          { id: 'L2', nombre: 'Batería para laptop Dell Latitude 7390', cotiza: true, presupuesto: 8300, servicios: 0, items: [{ id: 'i1', desc: 'Batería', cant: 30, precio: 250 }] },
          { id: 'L3', nombre: 'Disipador térmico y ventilador para Dell Latitude 7390', cotiza: true, presupuesto: 12000, servicios: 0, items: [{ id: 'i1', desc: 'Disipador y ventilador', cant: 50, precio: 220 }] },
          { id: 'L4', nombre: 'Pantalla para Dell Latitude 7390', cotiza: true, presupuesto: 2900, servicios: 0, items: [{ id: 'i1', desc: 'Pantalla', cant: 5, precio: 520 }] }
        ] },
      presentada: false,
      seg: { tareas: { c2a: true }, apertura: {}, adjudicacion: '', tenencia: '', circulares: [],
        consultas: [{ id: 'q1', fecha: inDays(-3), texto: '¿Se aceptan baterías de marca equivalente con certificación original del fabricante?', estado: 'enviada' }] }
    };
  }

  function seedCP642() {
    var ap = S.nextWeekday(inDays(26));
    return {
      id: 'vuce-642', tid: 'cp_servicios', nro: 'CP VUCE-642-CP-S', titulo: 'Servicio de mantenimiento de impresoras de las oficinas de la Unidad Ejecutora VUCE',
      organismo: 'Programa VUCEA · Ministerio de Economía · BID 3869/OC-AR', expediente: '', tipo: 'Comparación de precios · servicios', estado: 'preparacion',
      ref: { label: 'Presupuesto del llamado', texto: 'USD 6.000 (12 meses)' }, params: paramsCP(14),
      fechas: { visita: '', presentacion: ap, horaPres: '12:00', apertura: ap, horaAper: '12:00' }, modalidad: 'individual',
      archivos: [{ id: 'a1', nombre: 'CP_VUCE-642_Mantenimiento_impresoras.pdf', tipo: 'Solicitud de cotización (BID)', paginas: 53, peso: '860 KB', hallazgos: '13 requisitos · 1 lote de 12 meses · atención en menos de 96 h' }],
      requisitos: reqsCP(true, 'Pliego CP VUCE-642-CP-S (BID)'),
      oferta: { moneda: 'USD', iva: 21, validez: 60, pesoMB: 11, firma: 'Firma digital', tc: '',
        lotes: [{ id: 'L1', nombre: 'Servicio de mantenimiento de impresoras de las oficinas de la Unidad Ejecutora VUCE', cotiza: true, presupuesto: 6000, servicios: 0, items: [{ id: 'i1', desc: 'Servicio mensual: insumos (sin papel), servicio técnico, diagnóstico y gestión de repuestos', cant: 12, unidad: 'mes', precio: 430 }] }] },
      presentada: false, seg: { tareas: {}, apertura: {}, adjudicacion: '', tenencia: '', circulares: [], consultas: [] }
    };
  }

  /* VUCE-663-CP-S, ya presentada: ejemplo para ver toda la informacion en solo lectura */
  function seedCP663() {
    var l = seedCP642(), ap = S.addBusinessDays(inDays(0), -8), docs = { estatuto: 'd1', poder: 'd11', arca: 'd2', fabricante: 'd12', folleteria: 'd13' };
    l.id = 'vuce-663'; l.nro = 'CP VUCE-663-CP-S'; l.titulo = 'Servicio de mantenimiento y provisión de tóners para impresoras 2024';
    l.params = paramsCP(7); l.fechas = { visita: '', presentacion: ap, horaPres: '12:00', apertura: ap, horaAper: '12:00' };
    l.archivos = [{ id: 'a1', nombre: 'CP_VUCE-663_Mantenimiento_toners.pdf', tipo: 'Solicitud de cotización (BID)', paginas: 49, peso: '800 KB', hallazgos: '13 requisitos · 1 lote de 12 meses · consultas hasta 7 días antes' }];
    l.requisitos.forEach(function (r) {
      r.estado = 'listo';
      if (r.origen === 'biblioteca' && !r.docId) r.docId = docs[r.docTipo];
      if (r.origen === 'externo') r.archivo = r.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) + '.pdf';
    });
    l.oferta.pesoMB = 14; l.oferta.lotes[0].nombre = 'Servicio de mantenimiento y provisión de tóners para impresoras 2024';
    l.presentada = true; l.estado = 'presentada'; l.etapa = 4;
    l.seg = { tareas: { c2a: true, c2b: true, c2c: true, c2d: true, c3b: true, c3d: true, c3g: true }, apertura: { oferentes: 4, orden: 0 }, adjudicacion: '', tenencia: '', circulares: [],
      consultas: [{ id: 'q1', fecha: add(ap, -12), texto: '¿Se acepta la firma digital en lugar de la ológrafa?', estado: 'respondida', resp: 'Sí. El pliego admite firma ológrafa o digital certificada (cláusula 21).' }] };
    return l;
  }

  S.seedExtra = function () { return [seedLPI(), seedCP643(), seedCP642(), seedCP663()]; };

  /* ---------- controles comunes de los pliegos BID ---------- */
  function checksBid(l) {
    var c = [], p = S.progress(l), o = l.oferta, par = l.params, ls = S.lotes(l), left = daysLeft(l.fechas.apertura), cot = ls.filter(function (x) { return x.cotiza; }), m = o.moneda;
    c.push({ ok: p.done === p.total ? 'ok' : 'bad', titulo: 'Requisitos completos', detalle: p.done + ' de ' + p.total + ' requisitos listos.', tab: 'requisitos' });
    var elim = S.reqs(l).filter(function (r) { return r.elim && r.estado !== 'listo'; });
    if (elim.length) c.push({ ok: 'bad', titulo: 'Faltan documentos que descartan la oferta', detalle: elim.map(function (r) { return r.titulo; }).join('; ') + '.', tab: 'requisitos' });
    c = c.concat(S.checkDocs(l));

    if (!cot.length) c.push({ ok: 'bad', titulo: 'No cotizaste ningún lote', detalle: 'Podés cotizar uno, varios o todos.', tab: 'oferta' });
    else {
      var inc = cot.filter(function (x) { return x.faltan > 0; });
      if (inc.length) c.push({ ok: 'bad', titulo: 'Hay lotes incompletos', detalle: 'Un lote sin todos sus ítems o con cantidades distintas se descarta: ' + inc.map(function (x) { return x.id; }).join(', ') + '.', tab: 'oferta' });
      else c.push({ ok: 'ok', titulo: 'Lotes cotizados completos', detalle: cot.length + ' de ' + ls.length + ' lote(s), ' + mon(S.totalLotes(l).base, m) + ' sin impuestos.', tab: 'oferta' });
      cot.filter(function (x) { return x.presupuesto && x.base > x.presupuesto; }).forEach(function (x) {
        c.push({ ok: 'warn', titulo: 'El lote ' + x.id + ' supera el presupuesto del llamado', detalle: mon(x.base, m) + ' contra ' + mon(x.presupuesto, m) + '. Gana el precio más bajo.', tab: 'oferta' });
      });
    }
    if (!(Number(o.validez) >= par.validez)) c.push({ ok: 'bad', titulo: 'Validez menor a la exigida', detalle: 'El pliego pide ' + par.validez + ' días y ofrecés ' + (o.validez || 0) + '. Se rechaza por incumplimiento.', tab: 'oferta' });
    else c.push({ ok: 'ok', titulo: 'Validez de la oferta: ' + o.validez + ' días', detalle: 'Cumple los ' + par.validez + ' días del pliego, contados desde el límite de presentación.', tab: 'oferta' });

    c = c.concat(S.T(l).checksExtra(l));

    var cons = add(l.fechas.apertura, -par.consultasDias);
    if (daysLeft(cons) >= 0 && daysLeft(cons) <= 3) c.push({ ok: 'warn', titulo: 'Se cierran las consultas', detalle: 'Último día para consultar: ' + S.dmy(cons) + '.', tab: 'resumen' });
    if (left < 0) c.push({ ok: 'bad', titulo: 'El plazo de presentación ya pasó', detalle: 'Venció hace ' + (-left) + ' día(s).', tab: 'resumen' });
    else if (left <= 3) c.push({ ok: 'warn', titulo: 'Quedan ' + left + ' día(s) para presentar', detalle: 'El límite es a las ' + l.fechas.horaPres + ' h.', tab: 'resumen' });
    return c;
  }

  S.calif = function (l) {
    var cal = l.calif, par = l.params, cot = S.lotes(l).filter(function (x) { return x.cotiza; }), maxBase = cot.reduce(function (m, x) { return Math.max(m, x.base); }, 0);
    return { necesaria: par.kVentas * maxBase, maxBase: maxBase, ventasOk: Number(cal.ventas) >= par.kVentas * maxBase, expOk: Number(cal.expEsp) >= par.expEsp || Number(cal.expSim) >= par.expSim,
      capacidad: cot.map(function (x) { return { id: x.id, min: par.unidadesMin[x.id] || 0, tiene: Number(cal.unidades[x.id]) || 0, ok: (Number(cal.unidades[x.id]) || 0) >= (par.unidadesMin[x.id] || 0) }; }) };
  };

  function checksExtraLPI(l) {
    var c = [], q = S.calif(l), m = l.oferta.moneda, par = l.params;
    if (!q.maxBase) return c;
    if (!q.ventasOk) c.push({ ok: 'bad', titulo: 'Volumen de ventas insuficiente', detalle: 'Se exige ' + par.kVentas.toString().replace('.', ',') + ' veces el monto de cada lote (' + mon(q.necesaria, m) + ') en al menos 1 de los últimos 5 años. Declarás ' + mon(l.calif.ventas, m) + '.', tab: 'oferta' });
    else c.push({ ok: 'ok', titulo: 'Volumen de ventas dentro de lo exigido', detalle: mon(l.calif.ventas, m) + ' contra ' + mon(q.necesaria, m) + ' exigidos.', tab: 'oferta' });
    if (!q.expOk) c.push({ ok: 'bad', titulo: 'Experiencia insuficiente', detalle: 'Se exigen ' + par.expEsp + ' años con el bien específico o ' + par.expSim + ' con bienes similares.', tab: 'oferta' });
    q.capacidad.filter(function (x) { return !x.ok; }).forEach(function (x) {
      c.push({ ok: 'bad', titulo: 'Capacidad técnica insuficiente en el lote ' + x.id, detalle: 'Se exige haber producido o vendido al menos ' + x.min + ' unidad(es) en un año; declarás ' + x.tiene + '.', tab: 'oferta' });
    });
    if (q.capacidad.every(function (x) { return x.ok; }) && q.expOk) c.push({ ok: 'ok', titulo: 'Experiencia y capacidad técnica acreditadas', detalle: 'Cumplís la experiencia y la cantidad anual mínima de cada lote cotizado.', tab: 'oferta' });
    if (l.oferta.moneda !== 'USD' && !Number(l.oferta.tc)) c.push({ ok: 'warn', titulo: 'Falta el tipo de cambio para comparar', detalle: 'Se convierte a USD con el vendedor divisa del Banco Nación del día hábil anterior a la apertura.', tab: 'oferta' });
    return c;
  }

  function checksExtraCP(l) {
    var c = [], o = l.oferta, par = l.params;
    if (!o.firma) c.push({ ok: 'bad', titulo: 'Falta definir cómo se firma', detalle: 'Firma ológrafa escaneada o firma digital en cada formulario.', tab: 'oferta' });
    if (Number(o.pesoMB) > par.maxMB) c.push({ ok: 'warn', titulo: 'El archivo supera los ' + par.maxMB + ' MB', detalle: 'Dividilo en "libros" (Libro 01 de XX) y enviá todo en el mismo correo.', tab: 'oferta' });
    else c.push({ ok: 'ok', titulo: 'Archivo dentro de ' + par.maxMB + ' MB', detalle: 'PDF único de ' + (o.pesoMB || 0) + ' MB, con índice, sin zip ni enlaces.', tab: 'oferta' });
    return c;
  }

  /* ---------- cronogramas ---------- */
  function segEventos(l, ev, firmaLabel, entregaDias, entregaLabel) {
    var s = S.seg(l), p = l.params;
    if (s.adjudicacion) {
      ev.push({ k: 'adjudicacion', corto: 'Adjudicación', label: 'Adjudicación notificada', date: s.adjudicacion, nota: 'Antes de vencer la validez de la oferta' });
      ev.push({ k: 'garantia', corto: 'Garantía de cumplimiento', label: 'Garantía de cumplimiento (' + p.pctGarantiaCumpl + ' %)', date: add(s.adjudicacion, p.plazoGarantiaCumpl), nota: p.plazoGarantiaCumpl + ' días desde la notificación' });
    }
    if (s.tenencia) {
      ev.push({ k: 'firma', corto: firmaLabel, label: firmaLabel, date: s.tenencia, nota: 'Desde acá corren los plazos de entrega' });
      if (entregaDias) ev.push({ k: 'entrega', corto: entregaLabel, label: entregaLabel, date: add(s.tenencia, entregaDias), nota: 'Plazo máximo de entrega desde la firma' });
    }
    return ev;
  }
  function ordenar(ev) { return ev.filter(function (e) { return e.date; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); }

  function cronoLPI(l) {
    var f = l.fechas, p = l.params, ap = f.apertura; if (!ap) return [];
    var ev = [
      { k: 'consultas', corto: 'Últimas consultas', label: 'Último día para pedir aclaraciones', date: add(ap, -p.consultasDias), nota: p.consultasDias + ' días antes del límite (IAO 7.1)' },
      { k: 'limite', corto: 'Límite de presentación', label: 'Límite para presentar la oferta', date: ap, hora: f.horaPres, key: true, nota: 'Sobre físico: ' + p.copias + '. No hay presentación electrónica' },
      { k: 'apertura', corto: 'Apertura pública', label: 'Apertura pública de ofertas', date: ap, hora: f.horaAper, nota: 'Se leen en voz alta los precios' },
      { k: 'validez', corto: 'Fin de la validez', label: 'Fin de la validez de la oferta', date: add(ap, p.validez), nota: p.validez + ' días desde el límite de presentación' }
    ];
    return ordenar(segEventos(l, ev, 'Firma del contrato', 180, 'Primer plazo de entrega'));
  }

  function cronoCP(l) {
    var f = l.fechas, p = l.params, ap = f.apertura; if (!ap) return [];
    var ev = [
      { k: 'consultas', corto: 'Últimas consultas', label: 'Último día para consultas escritas', date: add(ap, -p.consultasDias), nota: p.consultasDias + ' días antes del límite' },
      { k: 'circulares', corto: 'Últimas circulares', label: 'Última circular posible', date: add(ap, -p.circularesDias), nota: 'Se envían a más tardar ' + p.circularesDias + ' días antes del límite' },
      { k: 'limite', corto: 'Envío y apertura', label: 'Límite de envío por correo y apertura', date: ap, hora: f.horaPres, key: true, nota: 'Cuenta la hora en que el correo entra al servidor del comprador' },
      { k: 'validez', corto: 'Fin de la validez', label: 'Fin de la validez de la cotización', date: add(ap, p.validez), nota: p.validez + ' días desde el límite' }
    ];
    return ordenar(segEventos(l, ev, 'Firma del contrato', 0, ''));
  }

  /* ---------- registro de los tipos ---------- */
  S.TIPOS.lpi_bienes = {
    id: 'lpi_bienes', nombre: 'Licitación pública internacional de bienes (BID)', corto: 'LPI bienes',
    carpetas: { A: 'Formularios y precios', B: 'Elegibilidad y documentación legal', C: 'Conformidad técnica', D: 'Calificaciones del oferente' }, orden: ['A', 'B', 'C', 'D'],
    presentacion: 'sobre', oferta: 'lotes', soportaUT: true, labelFirma: 'Firma del contrato', checks: checksBid, checksExtra: checksExtraLPI, cronograma: cronoLPI,
    tags: function (l) { return ['Validez ' + l.params.validez + ' días', 'Sobre físico']; },
    seed: seedLPI
  };
  S.TIPOS.cp_bienes = {
    id: 'cp_bienes', nombre: 'Comparación de precios de bienes (BID)', corto: 'CP bienes',
    carpetas: { A: 'Cotización', B: 'Documentación del proveedor', T: 'Técnica' }, orden: ['A', 'B', 'T'],
    presentacion: 'correo', oferta: 'lotes', soportaUT: false, labelFirma: 'Firma del contrato', checks: checksBid, checksExtra: checksExtraCP, cronograma: cronoCP,
    tags: function (l) { return ['Envío por correo', 'Validez ' + l.params.validez + ' días']; },
    seed: seedCP643
  };
  S.TIPOS.cp_servicios = {
    id: 'cp_servicios', nombre: 'Comparación de precios de servicios (BID)', corto: 'CP servicios',
    carpetas: { A: 'Cotización', B: 'Documentación del proveedor', T: 'Técnica' }, orden: ['A', 'B', 'T'],
    presentacion: 'correo', oferta: 'lotes', soportaUT: false, labelFirma: 'Firma del contrato', checks: checksBid, checksExtra: checksExtraCP, cronograma: cronoCP,
    tags: function (l) { return ['Envío por correo', 'Validez ' + l.params.validez + ' días']; },
    seed: seedCP642
  };
})();
