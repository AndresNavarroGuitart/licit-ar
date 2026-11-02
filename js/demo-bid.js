/* Documentos y recorrido FICTICIOS de los tipos con oferta por lotes (licitacion internacional y comparacion de precios). */
(function () {
  var H = Demo.h(), p = H.p, h3 = H.h3, paper = H.paper, tbl = H.tbl, scan = H.scan, ul = H.ul;
  var mon = Store.mon, esc = UI.esc;
  var DB = window.DemoBid = {};

  function e0() { return Store.get().empresa; }
  function lotesCot(l) { return l.oferta.lotes.map(function (L, i) { return { L: L, x: Store.lotes(l)[i] }; }).filter(function (z) { return z.x.cotiza; }); }

  var ESC = {
    lp8: function (e) { return scan('Poder y autorización del firmante', 'Copia certificada', [['Sociedad', e.razon], ['Apoderado', e.representante + ' · DNI ' + e.dni], ['Facultades', 'Presentar ofertas, firmar formularios y declaraciones y comprometer a la sociedad en procesos de compra financiados por organismos multilaterales'], ['Instrumento', e.poder]]); },
    lp9: function (e) { return scan('Estatuto social y actas', 'Copia simple', [['Razón social', e.razon], ['Constitución', 'Escritura N° 214 del 12/03/2014 (ficticia)'], ['Objeto social', 'Comercialización, instalación y servicio técnico de equipos de inspección, seguridad y tecnología'], ['Autoridades', 'Presidente: ' + e.representante]]); },
    lp11: function (e, l) { return scan('Autorización del Fabricante', 'Formulario de la Sección IV', [['Fabricante', 'Escáneres del Mundo S.A. (ficticio)'], ['Autoriza a', e.razon], ['Para suministrar', lotesCot(l).map(function (z) { return z.L.nombre; }).join('; ')], ['Alcance', 'Garantía plena y servicio posterior a la venta en la República Argentina']]); },
    lp13: function (e, l) { return scan('Folletería, manuales y hojas técnicas', '60 folios', [['Contenido', lotesCot(l).map(function (z) { return 'Hoja técnica y manual del lote ' + z.L.id; }).join(' · ')], ['Idioma', 'Español, con traducción de los textos en otro idioma']]); },
    lp16: function (e) { return scan('Estados contables auditados — últimos 5 ejercicios', 'Copia simple', [['Sociedad', e.razon], ['Ejercicios', '2021, 2022, 2023, 2024 y 2025'], ['Ventas del mejor ejercicio', 'USD 9.500.000 (equivalente, ficticio)'], ['Auditor', 'Estudio contable de ejemplo · informe sin salvedades']]); },
    cp4: function (e, l) { return scan('Pliego completo, firmado en original', 'Escaneo para el envío', [['Documento', l.nro + ' — ' + l.titulo], ['Hojas', '52, todas inicialadas; la última y la de la oferta económica con firma completa'], ['Firmante', e.representante + ' (' + e.cargo + ')']]); },
    cp6: function (e) { return scan('Estatuto, contrato social y poder', 'Copia simple', [['Razón social', e.razon], ['Constitución', 'Escritura N° 214 del 12/03/2014 (ficticia)'], ['Autoridades', 'Presidente: ' + e.representante]]); },
    cp7: function (e) { return scan('Autorización al signatario', 'Poder certificado', [['Sociedad', e.razon], ['Signatario', e.representante + ' · DNI ' + e.dni], ['Facultad', 'Firmar la cotización y obligar a la sociedad']]); },
    cp8: function (e) { return scan('Constancia de CUIT', 'Emitida por ARCA, vigente', [['Contribuyente', e.razon], ['CUIT', e.cuit], ['Estado', 'Activo']]); },
    cp9: function (e) { return scan('Autorización del fabricante', 'Formulario del pliego', [['Fabricante', 'Repuestos Originales S.A. (ficticio)'], ['Autoriza a', e.razon], ['Alcance', 'Suministro de repuestos originales para equipos Dell Latitude']]); },
    cp12: function (e, l) { return scan('Folletería con datos técnicos', '12 folios', [['Contenido', lotesCot(l).map(function (z) { return z.L.nombre; }).join(' · ')]]); }
  };

  DB.doc = function (l, r) {
    var e = Store.empresaDe(l), m = l.oferta.moneda, cot = lotesCot(l), lpi = l.tid === 'lpi_bienes';
    if (r.estado !== 'listo' && r.estado !== 'en-curso') return '<div class="banner" style="margin:10px 0"><span>!</span><span>Este documento todavía no está armado.</span></div>';
    if (r.tpl) return Plantillas.render(r.tpl, e, l);
    if (r.origen === 'anexo2') return Plantillas.anexo2(e, l);
    if (ESC[r.id]) return ESC[r.id](e, l);
    switch (r.id) {
      case 'lp5':
        return paper('Gastos asociados a la importación', p('Estimación por lote de lo que se suma al precio CIP hasta dejar los bienes en destino. <i>Cifras ficticias.</i>') +
          tbl(['Lote', 'Derechos y tasas de importación', 'Gastos portuarios y despacho', 'Transporte interno y seguro', 'Total estimado'], cot.map(function (z) {
            var a = z.x.base * 0.05, b = z.x.base * 0.012, c = z.x.base * 0.018; return [z.L.id, mon(a, m), mon(b, m), mon(c, m), mon(a + b + c, m)];
          }), [1, 2, 3, 4]));
      case 'lp6':
        return paper('Impuestos internos por lote', p('A la fecha de presentación de la oferta.') + tbl(['Lote', 'Impuesto', 'Base imponible', 'Alícuota', 'Valor'], cot.map(function (z) {
          var al = Number(l.oferta.iva) || 0; return [z.L.id, al ? 'IVA' : 'Sin impuestos internos', mon(z.x.base, m), al + ' %', mon(z.x.base * al / 100, m)];
        }), [2, 3, 4]));
      case 'lp14':
        return paper('Conformidad con las especificaciones técnicas', p('Para cada lote se detalla cómo se cumple lo pedido. <i>Contenido ilustrativo.</i>') + tbl(['Lote', 'Requisito', 'Oferta', 'Evidencia'], cot.reduce(function (a, z) {
          return a.concat([[z.L.id, 'Inspección no intrusiva según el tipo de carga', 'Cumple', 'Hoja técnica, sección 2'], [z.L.id, 'Seguridad radiológica y normas aplicables', 'Cumple', 'Certificados, sección 5'], [z.L.id, 'Software, interconexión a la red y formación', 'Cumple', 'Manual, sección 7']]);
        }, [])) + p('<b>Variaciones y excepciones:</b> ninguna.'));
      case 'lp15':
        return paper('Lista de repuestos y herramientas especiales', p('Disponibilidad y precios actuales para 2 años desde la recepción definitiva. <i>Precios ficticios.</i>') + tbl(['Repuesto o herramienta', 'Disponibilidad', 'Precio (' + m + ')'], [['Tubo generador de rayos X', 'Stock local', mon(38000, m)], ['Detector lineal (módulo)', '30 días', mon(12500, m)], ['Fuente de alimentación', 'Stock local', mon(4200, m)], ['Kit de calibración', 'Stock local', mon(2600, m)], ['Juego de herramientas especiales', 'Se entrega con el equipo', mon(0, m)]], [2]));
      case 'lp17':
        return paper('Lista de contratos de bienes iguales y similares', p('Últimos 5 años. <i>Clientes y cifras ficticios.</i>') + tbl(['Cliente', 'Bienes suministrados', 'Cantidad', 'Fecha'], [['Autoridad aduanera de ejemplo', 'Escáner de portal fijo', '2', '2022'], ['Operador portuario de ejemplo', 'Equipo móvil tipo tráiler', '4', '2023'], ['Terminal aeroportuaria de ejemplo', 'Escáner de bultos doble vista', '11', '2024'], ['Zona franca de ejemplo', 'Escáner de bultos doble vista', '6', '2021'], ['Ministerio de ejemplo', 'Equipo móvil tipo tráiler', '3', '2025']], [2]));
      case 'lp19': {
        var q = Store.calif(l);
        return paper('Acreditación de ventas, experiencia y capacidad', tbl(['Criterio', 'Exigido', 'Declarado', 'Resultado'], [
          ['Volumen de ventas anual (mejor año de 5)', mon(q.necesaria, m), mon(l.calif.ventas, m), q.ventasOk ? 'Cumple' : 'No cumple'],
          ['Experiencia en el bien específico o en similares', l.params.expEsp + ' años o ' + l.params.expSim + ' años', l.calif.expEsp + ' años / ' + l.calif.expSim + ' años', q.expOk ? 'Cumple' : 'No cumple']
        ].concat(q.capacidad.map(function (x) { return ['Capacidad anual, lote ' + x.id, x.min + ' unidad(es)', x.tiene + ' unidad(es)', x.ok ? 'Cumple' : 'No cumple']; }))));
      }
      case 'cp11':
        return paper('Descripción del servicio', p('Servicio mensual durante 12 meses para las cuatro impresoras multifunción de las oficinas de la Unidad Ejecutora (dos monocromáticas y dos color).') +
          ul(['Provisión y colocación de insumos, sin incluir el papel.', 'Servicio técnico en incidentes con y sin garantía, con asistencia en menos de 96 horas.', 'Diagnóstico de fallas.', 'Gestión de repuestos en garantía y fuera de garantía (a cargo del comprador).', 'Cobertura de 10.000 copias en blanco y negro y 5.000 en color por mes entre los cuatro equipos.', 'Reemplazo por equipos equivalentes, sin costo, si no se consiguen insumos o repuestos.']) + p('<i>Contenido ilustrativo con datos ficticios.</i>'));
      case 'cp13':
        return paper('Documentación de las especificaciones técnicas', p('Se adjunta lo que pide la Sección IV para los lotes cotizados:') + ul(cot.map(function (z) { return 'Lote ' + esc(z.L.id) + ': ficha técnica y plazo de entrega comprometido.'; })) + p('<i>Contenido ilustrativo.</i>'));
      default:
        return paper(r.titulo, p(esc(r.detalle)) + p('<i>Documento de ejemplo con datos ficticios.</i>'));
    }
  };

  DB.pasosExtra = function (l) {
    var lpi = l.tid === 'lpi_bienes', pasos = [], tot = Store.totalLotes(l);
    pasos.push({ txt: 'Precios cargados: ' + tot.n + ' lote(s), ' + mon(tot.base, l.oferta.moneda) + ' sin impuestos', run: function () {} });
    if (lpi) pasos.push({ txt: 'Calificación: ventas, experiencia y capacidad por lote verificadas', run: function () {} });
    else pasos.push({ txt: 'Firmando cada formulario (' + l.oferta.firma.toLowerCase() + ') y armando el PDF único de ' + l.oferta.pesoMB + ' MB, con índice y clave', run: function () {} });
    pasos.push({ txt: lpi ? 'Foliando ' + Store.folios(l).total + ' hojas y preparando original, copia física y copia digital' : 'Numerando ' + Store.folios(l).total + ' folios y preparando el correo de envío', run: function () {} });
    pasos.push({ txt: 'Verificando controles del pliego', run: function () {} });
    return pasos;
  };

  DB.recorrido = function (l) {
    var s = Store.seg(l), f = l.fechas, p2 = l.params, lpi = l.tid === 'lpi_bienes', pasos = [], d = Store.addDaysTo, m = l.oferta.moneda, tot = Store.totalLotes(l);
    function T() { for (var i = 0; i < arguments.length; i++) s.tareas[arguments[i]] = true; }
    function add(c, txt, run) { pasos.push({ c: c, txt: txt, run: run }); }
    var E3 = 'Etapa 3 · Presentación de ofertas', E4 = 'Etapa 4 · Apertura y evaluación', E5 = 'Etapa 5 · Adjudicación y contratación', E6 = 'Etapa 6 · Ejecución y cierre';
    var P = lpi ? ['b2a', 'b2b', 'b2c'] : ['c2a', 'c2b', 'c2c', 'c2d'];
    add(E3, lpi ? 'Sobre físico entregado antes de las ' + f.horaPres + ' h: original, copia física y copia digital' : 'Correo enviado antes de las ' + f.horaPres + ' h con el PDF de ' + l.oferta.pesoMB + ' MB, firmado y con clave', function () { Store.setEtapa(l, 4); P.forEach(function (id) { s.tareas[id] = true; }); if (!lpi) T('c3b', 'c3d', 'c3g'); else T('b3b', 'b3c'); });
    if (lpi) {
      add(E4, 'Acto público de apertura: se leen los precios de 5 ofertas', function () { s.apertura = { oferentes: 5, orden: 0 }; T('b4a'); });
      add(E4, 'El Comprador pide una aclaración; se responde por escrito sin cambiar precios', function () { T('b4b'); });
      add(E4, 'Tu oferta resulta la más baja y pasa a poscalificación', function () { s.apertura.orden = 1; });
      add(E4, 'Poscalificación aprobada: ventas, experiencia y capacidad técnica verificadas', function () { T('b4c', 'b4e'); });
      add(E5, 'Adjudicación notificada el ' + UI.date(d(f.apertura, 70)) + ', antes de vencer la validez (fecha simulada)', function () { s.adjudicacion = d(f.apertura, 70); Store.setEtapa(l, 5); T('b5a'); });
      add(E5, 'Garantía de cumplimiento del ' + p2.pctGarantiaCumpl + ' % (' + mon(tot.base * p2.pctGarantiaCumpl / 100, m) + ') presentada en 28 días', function () { T('b5b'); });
      add(E5, 'Convenio de contrato firmado el ' + UI.date(d(f.apertura, 70 + 25)), function () { s.tenencia = d(f.apertura, 95); T('b5c'); });
      add(E5, 'Anticipo del ' + p2.anticipoPct + ' % solicitado con garantía por el 100 % del anticipo', function () { T('b5d'); });
      add(E6, 'Plazos de entrega en marcha: 180 días para el lote 3 y 300 para los lotes 1 y 2', function () { Store.setEtapa(l, 6); });
      add(E6, 'Inspecciones y pruebas en fábrica aprobadas', function () { T('b6b'); });
    } else {
      add(E4, 'Apertura al cierre de la recepción: llegaron 4 cotizaciones válidas', function () { s.apertura = { oferentes: 4, orden: 0 }; });
      add(E4, 'Clave del archivo enviada luego de la apertura', function () { T('c4a'); });
      add(E4, 'Corrección aritmética aceptada; tu cotización es la más baja sin impuestos', function () { s.apertura.orden = 1; T('c4c', 'c4e'); });
      add(E5, 'Adjudicación notificada el ' + UI.date(d(f.apertura, 30)) + ', antes de vencer la validez (fecha simulada)', function () { s.adjudicacion = d(f.apertura, 30); Store.setEtapa(l, 5); T('c5a'); });
      add(E5, 'DNI del firmante y poder presentados', function () { T('c5b'); });
      add(E5, 'Garantía de cumplimiento del ' + p2.pctGarantiaCumpl + ' % (' + mon(tot.base * p2.pctGarantiaCumpl / 100, m) + ') en 28 días', function () { T('c5c'); });
      add(E5, 'Contrato firmado el ' + UI.date(d(f.apertura, 45)), function () { s.tenencia = d(f.apertura, 45); T('c5d'); });
      add(E6, 'Entrega con factura, remito y declaración jurada de origen; recepción en 7 días hábiles', function () { Store.setEtapa(l, 6); T('c6a', 'c6b'); });
      add(E6, 'Cobro del 100 % dentro de los 10 días de la recepción', function () { T('c6d'); });
    }
    return pasos;
  };

  Demo.TD.lotes = DB;
})();
