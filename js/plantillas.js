/* Borradores de las declaraciones y notas que pide el pliego, redactados con los datos de la empresa y de la licitacion.
   Son modelos de partida: hay que revisarlos con asesoria legal antes de firmar. */
(function () {
  var esc = UI.esc;
  function f(v) { return '<span class="fill">' + esc(v) + '</span>'; }
  function hoy() { return new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function firma(e) { return '<div class="sign"><div>' + f(e.representante) + '<br>' + f(e.cargo) + ' · DNI ' + f(e.dni) + '<br>' + f(e.razon) + '</div></div>'; }
  function money(n) { return UI.money(n); }

  var T = window.Plantillas = {};

  /* [titulo, funcion(e, l) -> parrafos] */
  var defs = {
    nota: ['Nota de presentación', function (e, l) {
      return ['Señores<br>Presidente del ' + f(l.organismo),
        '<b>Ref.:</b> ' + f(l.titulo) + '.',
        f(e.representante) + ', en mi carácter de ' + f(e.cargo) + ' de ' + f(e.razon) + ', CUIT ' + f(e.cuit) + ', con domicilio legal en ' + f(e.domicilio) + ', acreditando la representación con ' + f(e.poder) + ', me dirijo a ustedes para presentar la oferta correspondiente a la licitación de la referencia, conforme el Sobre Único previsto en el Pliego.',
        'La oferta se presenta ' + (l.modalidad === 'ut' ? 'en forma <b>conjunta</b>, con unificación de la representación y designación de representante común, indicando a continuación el porcentaje de participación de cada integrante: ' + f('________') + '.' : 'en forma <b>individual</b>.'),
        'Constituyo domicilio especial en ' + f(e.domicilio) + ' y correo electrónico ' + f(e.email) + ', donde serán válidas las notificaciones.'];
    }],
    aceptacion: ['Constancia de aceptación del Pliego y sus Circulares', function (e, l) {
      return [f(e.razon) + ', CUIT ' + f(e.cuit) + ', representada por ' + f(e.representante) + ', <b>deja constancia</b> de haber leído y de aceptar en su totalidad el Pliego de Bases y Condiciones de la ' + f(l.titulo) + ', sus Anexos y las Circulares emitidas, obligando a todos los integrantes del oferente en caso de presentación conjunta.'];
    }],
    acta: ['Acta del órgano de dirección: decisión de participar', function (e, l) {
      return ['En la ciudad de ' + f('Rosario') + ', siendo la fecha ' + f(hoy()) + ', se reúne el órgano de dirección de ' + f(e.razon) + ' con la presencia de ' + f(e.directores || 'los miembros que correspondan') + ' y resuelve por unanimidad <b>participar</b> en la ' + f(l.titulo) + ', facultando a ' + f(e.representante) + ' para presentar la oferta, firmar la documentación y obligar a la sociedad.',
        '<i>Debe transcribirse en el libro de actas y presentarse copia certificada y legalizada.</i>'];
    }],
    inadmisibilidad: ['Declaración jurada: no alcanzado por causales de inadmisibilidad', function (e, l) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ' (CUIT ' + f(e.cuit) + '), <b>DECLARA BAJO JURAMENTO</b> que ni la sociedad ni sus representantes legales, directores, administradores, socios, controlantes o controladas se encuentran alcanzados por ninguna de las situaciones del Art. II.2 del Pliego: inhabilitación por condena judicial; evasión o mora impositiva o previsional; procesamiento por delitos contra la fe pública o de la Convención Interamericana contra la Corrupción; ni incumplimiento de obligaciones contractuales con el concedente.'];
    }],
    litigio: ['Declaración jurada de inexistencia de litigio con el ENAPRO', function (e) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ', <b>DECLARA BAJO JURAMENTO</b> que ningún integrante del oferente mantiene litigios judiciales o arbitrales en trámite contra el ENAPRO. ' + '<i>Si los hubiera, identificarlos: partes, objeto, fuero y número de expediente.</i>',
        'Toma conocimiento de que, de existir, la adjudicación queda condicionada al desistimiento expreso e irrevocable de la acción y del proceso dentro de 10 días hábiles de notificada.'];
    }],
    laboral: ['Declaración jurada de cumplimiento laboral, previsional y sindical', function (e) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ' (CUIT ' + f(e.cuit) + '), <b>DECLARA BAJO JURAMENTO</b> que se encuentra al día con las obligaciones laborales, de seguridad social y sindicales a su cargo.'];
    }],
    integridad: ['Declaración jurada de integridad y transparencia', function (e) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ' (CUIT ' + f(e.cuit) + '), <b>DECLARA BAJO JURAMENTO</b>:',
        '<b>1. Beneficiarios finales.</b> Nombre completo, tipo y número de documento, nacionalidad, domicilio y porcentaje de participación o control: ' + f(e.benef || '(completar por cada beneficiario)') + '.',
        '<b>2. PEP.</b> Que ' + f('ninguna') + ' de las personas indicadas reviste la condición de Persona Expuesta Políticamente. En caso contrario: vínculo, cargo y función.',
        '<b>3. Origen de los fondos.</b> Que los fondos destinados a las inversiones, aportes y financiamiento de la concesión son de origen lícito, con la siguiente procedencia: ' + f(e.origen || '(describir)') + '. Autoriza al ENAPRO a verificar ante organismos oficiales y entidades financieras.'];
    }],
    inhabilitaciones: ['Declaración jurada de no inhabilitación', function (e) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ', <b>DECLARA BAJO JURAMENTO</b> no estar alcanzado por inhabilitaciones, sanciones o prohibiciones para contratar con el Estado y no haber sido condenado por delitos dolosos vinculados con corrupción, fraude, lavado de activos u otros que afecten la integridad del procedimiento.'];
    }],
    mantenimiento: ['Declaración de mantenimiento de la oferta', function (e, l) {
      return [f(e.razon) + ' <b>declara</b> que mantendrá su oferta por <b>' + l.params.mantenimiento + ' días corridos</b> desde la fecha de apertura, renovable automáticamente por igual plazo salvo notificación expresa con 10 días corridos de antelación, y que acompaña la garantía de mantenimiento por ' + f(money(l.params.garantiaOferta)) + ' conforme el Art. II.6.'];
    }],
    veracidad: ['Declaración jurada de veracidad y autorización de consultas', function (e) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ', <b>GARANTIZA</b> la veracidad y exactitud de todo el contenido de la oferta, se obliga a actualizar y ampliar la información cuando el ENAPRO lo requiera durante la licitación y lo <b>autoriza</b> a requerir información a organismos oficiales, bancos y empresas privadas sobre los integrantes del oferente y sus empresas controladas, controlantes o vinculadas.'];
    }],
    intereses: ['Declaración jurada de intereses', function (e) {
      return [f(e.representante) + ', en representación de ' + f(e.razon) + ', <b>DECLARA BAJO JURAMENTO</b> que ' + f('no existen') + ' vínculos personales, familiares, societarios, comerciales, profesionales o de otra naturaleza relevante con las autoridades o agentes del ENAPRO que intervengan o tengan capacidad de decisión en este procedimiento. <i>Si existen, detallarlos.</i>'];
    }],
    predio: ['Declaración jurada de conocimiento del predio', function (e, l) {
      return [f(e.razon) + ' <b>declara</b> haber realizado la visita técnica obligatoria (Certificado de Visita N° ' + f(e.visitaNro || '____') + ') y conocer el estado físico, operativo, ambiental, urbanístico y jurídico del predio, y que ha efectuado los estudios necesarios para elaborar su oferta. Acepta la concesión en las condiciones en que se encuentra y renuncia a invocar desconocimiento, error u omisión.'];
    }],
    'compromiso-ut': ['Compromiso irrevocable de constitución de UT / consorcio', function (e, l) {
      return ['Los abajo firmantes se <b>comprometen en forma irrevocable</b> a constituir una ' + f('Unión Transitoria') + ' en caso de resultar adjudicatarios de la ' + f(l.titulo) + ', en términos sustancialmente equivalentes a los informados en la oferta, y a acreditar la designación del representante común antes de la firma del Contrato de Concesión.',
        'Integrantes y participación: ' + f(e.razon) + ' ' + f('__ %') + ' · ' + f('(otros integrantes, hasta 5 en total)') + '.'];
    }],
    solidaria: ['Aceptación de responsabilidad solidaria, conjunta e ilimitada', function (e) {
      return [f(e.razon) + ' <b>acepta expresamente</b> asumir frente al ENAPRO responsabilidad principal, solidaria, conjunta e ilimitada por el cumplimiento de las obligaciones de la concesión, con renuncia expresa a los beneficios de excusión y división, hasta la extinción total de las obligaciones, incluido el plazo de garantía.'];
    }]
  };

  /* ---- tablas de lotes y formularios de los pliegos BID ---- */
  var RAW = '<!--raw-->';
  function tablaLotes(l) {
    var o = l.oferta, ls = Store.lotes(l), m = o.moneda, mon = Store.mon, filas = '';
    o.lotes.forEach(function (L, i) {
      var x = ls[i]; if (!x.cotiza) return;
      filas += '<tr><td>' + esc(L.id) + '</td><td>' + esc(L.nombre) + '</td><td class="r">' + L.items.map(function (it) { return it.cant + (it.unidad ? ' ' + it.unidad : ''); }).join(' / ') + '</td><td class="r">' + L.items.map(function (it) { return mon(it.precio, m); }).join(' / ') + '</td><td class="r">' + mon(x.serv, m) + '</td><td class="r">' + mon(x.base, m) + '</td><td class="r">' + mon(x.conIva, m) + '</td></tr>';
    });
    var t = Store.totalLotes(l);
    return RAW + '<table class="ptab"><thead><tr><th>Lote</th><th>Descripción</th><th class="r">Cantidad</th><th class="r">Precio unitario</th><th class="r">Servicios conexos</th><th class="r">Total sin impuestos</th><th class="r">Total con impuestos (' + (Number(o.iva) || 0) + ' %)</th></tr></thead><tbody>' + filas +
      '<tr class="tot"><td colspan="5">Total de los lotes cotizados</td><td class="r">' + mon(t.base, m) + '</td><td class="r">' + mon(t.conIva, m) + '</td></tr></tbody></table>';
  }
  var BID = 'Programa VUCEA (Ministerio de Economía) · Préstamo BID 3869/OC-AR';
  defs.bid_oferta = ['Formulario de Presentación de Oferta', function (e, l) {
    return ['Señores<br>' + f(BID), '<b>Ref.:</b> ' + f(l.nro + ' — ' + l.titulo) + '.',
      'Habiendo examinado los Documentos de Licitación, incluidas las enmiendas, ofrecemos suministrar los bienes y servicios conexos de los lotes cotizados, conforme a la lista de precios, por el siguiente total (' + f(l.oferta.moneda) + '):',
      tablaLotes(l),
      'Validez de la oferta: ' + f(l.oferta.validez + ' días') + ' desde la fecha límite de presentación. Incoterm: ' + f((l.oferta.incoterm || 'CIP') + ' 2020') + '.',
      '<b>Elegibilidad.</b> ' + f(e.razon) + ' tiene la nacionalidad de un país elegible, no tiene conflicto de interés y no está suspendida ni inhabilitada por el BID. Cumplimos las políticas del Banco sobre prácticas prohibidas y no presentamos más de una oferta.'];
  }];
  defs.bid_info = ['Formulario de Información del Oferente', function (e, l) {
    return [RAW + '<table class="ptab"><tbody><tr><th>Nombre jurídico</th><td>' + f(e.razon) + '</td></tr><tr><th>CUIT</th><td>' + f(e.cuit) + '</td></tr><tr><th>Año de registro</th><td>' + f('2014') + '</td></tr><tr><th>País de constitución</th><td>' + f('Argentina') + '</td></tr><tr><th>Domicilio legal</th><td>' + f(e.domicilio) + '</td></tr><tr><th>Representante autorizado</th><td>' + f(e.representante + ' — ' + e.cargo + ' · DNI ' + e.dni) + '</td></tr><tr><th>Contacto</th><td>' + f(e.email + ' · ' + e.telefono) + '</td></tr></tbody></table>',
      'Se adjunta copia de la documentación constitutiva y de la autorización del representante.'];
  }];
  defs.bid_apca = ['Información de los miembros de la APCA o UT', function (e) {
    return ['Líder: ' + f(e.razon) + ' — participación ' + f('60 %') + '. Miembro: ' + f('(razón social del otro integrante)') + ' — participación ' + f('40 %') + '.', 'Cada miembro responde en forma solidaria. El líder cumple como mínimo el 60 % de cada requisito de calificación y cada uno de los demás, el 20 %, hasta sumar el 100 %.'];
  }];
  defs.bid_mantenimiento = ['Declaración de Mantenimiento de la Oferta', function (e, l) {
    return [f(e.razon) + ' <b>declara</b> que mantendrá su oferta por ' + f(l.oferta.validez + ' días') + ' desde la fecha límite de presentación. Acepta que, si retira su oferta durante ese período, o si resultando seleccionada no firma el contrato o no presenta la garantía de cumplimiento, será declarada inelegible para contratos del Comprador por ' + f((l.params.inelegibleAnios || 5) + ' años') + '.'];
  }];
  defs.bid_domicilio = ['Domicilio legal y domicilio real', function (e) {
    return ['<b>Domicilio legal</b> (válido para las comunicaciones del Comprador): ' + f(e.domicilio) + ', Argentina.', '<b>Domicilio real:</b> ' + f(e.domicilio) + ', Argentina.'];
  }];
  defs.bid_posventa = ['Compromiso de servicios posteriores a la venta', function (e, l) {
    return [f(e.razon) + ' <b>se compromete</b> a prestar en el país el mantenimiento, las reparaciones y el suministro de repuestos de los bienes ofrecidos durante dos años desde la recepción definitiva, ' + f('por sí') + ' y mediante personal técnico propio con capacidad y herramientas para hacerlo. Reposición de bienes defectuosos: dentro de los 60 días.'];
  }];
  defs.bid_ventas = ['Declaración jurada de ventas anuales y capacidad', function (e, l) {
    var c = l.calif || { ventas: 0, expEsp: 0, expSim: 0, unidades: {} }, m = l.oferta.moneda;
    return [f(e.razon) + ' <b>DECLARA BAJO JURAMENTO</b> que su volumen anual de ventas máximo en los últimos 5 años fue de ' + f(Store.mon(c.ventas, m)) + ', que tiene ' + f(c.expEsp + ' años') + ' de experiencia en los bienes específicos y ' + f(c.expSim + ' años') + ' en bienes similares.',
      RAW + '<table class="ptab"><thead><tr><th>Lote</th><th class="r">Unidades vendidas en el mejor año</th><th class="r">Mínimo exigido</th></tr></thead><tbody>' + l.oferta.lotes.filter(function (L) { return L.cotiza; }).map(function (L) { return '<tr><td>' + esc(L.id) + '</td><td class="r">' + f((c.unidades || {})[L.id] || 0) + '</td><td class="r">' + (l.params.unidadesMin[L.id] || 0) + '</td></tr>'; }).join('') + '</tbody></table>',
      'Si no es el fabricante, acompaña la declaración jurada del fabricante con su capacidad anual instalada de producción.'];
  }];
  defs.cp_carta = ['Carta de la Cotización', function (e, l) {
    return ['A: ' + f(BID), '<b>Número y título del contrato:</b> ' + f(l.nro + ' — ' + l.titulo) + '.',
      'Con la presentación de nuestra Cotización declaramos: <b>a)</b> que examinamos sin reservas el documento de comparación de precios, incluidas enmiendas y circulares; <b>b)</b> que ofrecemos proveer lo siguiente, conforme al documento; <b>c)</b> el precio de la cotización, en ' + f(l.oferta.moneda) + ':',
      tablaLotes(l),
      '<b>e)</b> la cotización es válida por ' + f(l.oferta.validez + ' días') + '; <b>f)</b> si es aceptada, obtendremos la garantía de cumplimiento; <b>g)</b> somos de un país elegible y no tenemos conflicto de interés; <b>h)</b> presentamos una sola cotización; <b>i)</b> no estamos suspendidos ni inhabilitados por el BID; <b>j)</b> no somos una entidad de propiedad del Estado.'];
  }];
  defs.cp_f1 = ['Formulario 1 — Información del Proveedor', defs.bid_info[1]];
  defs.cp_f6 = ['Formulario 6 — Declaración de Mantenimiento de la Cotización', function (e, l) {
    return [f(e.razon) + ' <b>declara</b> que mantendrá su cotización por ' + f(l.oferta.validez + ' días') + ' desde el límite de presentación. Acepta que la declaración se ejecute si retira la cotización en ese período, si no acepta las correcciones aritméticas de su precio, o si, resultando seleccionada, no firma el contrato o no presenta la garantía de cumplimiento en el plazo.'];
  }];
  defs.cp_origen = ['Declaración jurada del origen de los bienes', function (e) {
    return [f(e.razon) + ' <b>DECLARA BAJO JURAMENTO</b> que los bienes y servicios conexos cotizados tienen origen en un país miembro del Banco Interamericano de Desarrollo, según los criterios del Anexo 1 del documento, y que cuenta con la documentación que lo respalda.'];
  }];

  T.titulo = {}; Object.keys(defs).forEach(function (k) { T.titulo[k] = defs[k][0]; });

  /* qué datos de la empresa lee un borrador: se corre con una empresa vacía que anota cada propiedad que le piden */
  T.campos = function (id, l) {
    var usados = [], e = new Proxy({}, { get: function (t, k) { if (typeof k === 'string' && usados.indexOf(k) < 0) usados.push(k); return k === 'fin' ? {} : ''; } });
    try { if (defs[id]) defs[id][1](e, l); } catch (x) { /* un borrador que no corre con datos vacíos sigue con lo que alcanzó a leer */ }
    return usados;
  };

  T.render = function (id, e, l) {
    var d = defs[id], ps = d[1](e, l), ciudad = l.tid && l.tid !== 'concesion' ? 'Ciudad Autónoma de Buenos Aires' : 'Rosario';
    return '<div class="paper"><h2>' + esc(d[0]) + '</h2><p style="text-align:right">' + ciudad + ', ' + f(hoy()) + '</p>' +
      ps.map(function (p) { return p.indexOf(RAW) === 0 ? p.slice(RAW.length) : '<p>' + p + '</p>'; }).join('') + firma(e) + '</div>';
  };

  /* lista de precios por lote (LPI y comparacion de precios) */
  T.listaPrecios = function (e, l) {
    var cp = l.tid && l.tid.indexOf('cp_') === 0;
    return '<div class="paper"><h2>' + (cp ? 'Formulario 2 — Cotización y lista de precios' : 'Listas de precios por lote') + '</h2><p><b>' + f(l.nro) + '</b> — ' + f(l.titulo) + '</p>' + tablaLotes(l).slice(RAW.length) +
      '<p>Precios en ' + f(l.oferta.moneda) + (cp ? ', con impuestos discriminados' : ', ' + f((l.oferta.incoterm || 'CIP') + ' 2020') + ' en el lugar de destino convenido') + '. Origen de los bienes: ' + f('país miembro del BID') + '.</p>' + firma(e) + '</div>';
  };

  /* Anexo II, con los datos de la pestaña Oferta */
  T.anexo2 = function (e, l) {
    if (l.tid && l.tid !== 'concesion') return T.listaPrecios(e, l);
    var o = l.oferta, p = l.params, c = Number(o.canon) > 0 ? o.canon : p.canonBase;
    function row(k, v) { return '<tr><td style="padding:3px 12px 3px 0;color:#666;white-space:nowrap">' + k + '</td><td>' + v + '</td></tr>'; }
    return '<div class="paper"><h2>Anexo II — Formulario de propuesta económica</h2>' +
      '<table style="font-size:14px;line-height:1.6;margin-bottom:10px">' +
      row('Licitación/Concurso', f(l.nro)) + row('Objeto', f(l.titulo)) + row('Expediente', f(l.expediente || '________')) + row('Fecha de apertura', f(UI.date(l.fechas.apertura))) + '</table>' +
      '<p><b>1. Identificación del oferente.</b> ' + f(e.razon) + ', CUIT ' + f(e.cuit) + ', domicilio ' + f(e.domicilio) + ', ' + f(e.email) + ' · ' + f(e.telefono) + '. Representante: ' + f(e.representante) + ', documento ' + f(e.dni) + ', cargo ' + f(e.cargo) + ', personería: ' + f(e.poder) + '.</p>' +
      '<p><b>2. Canon fijo mensual.</b> Moneda: pesos. Canon ofertado: ' + f(money(c)) + ' (en letras: PESOS ' + f(Store.enLetras(c).toUpperCase()) + '), neto de IVA, a valores del mes de apertura. Canon Base: ' + money(p.canonBase) + '.</p>' +
      '<p><b>3. Actualización.</b> Índice CER publicado por el BCRA, con la periodicidad prevista en el Pliego.</p>' +
      '<p><b>4. Inversión comprometida.</b> ' + f(money(o.inversion)) + ' (PESOS ' + f(Store.enLetras(o.inversion).toUpperCase()) + '), a valores del mes de apertura. Plazo de ejecución: ' + f(o.plazoMeses + ' meses') + ' desde la Fecha de Entrega de Tenencia (máximo ' + p.plazoObraMax + ').</p>' +
      '<p><b>5. Declaraciones.</b> Que la propuesta se formula conforme al Pliego y sus circulares; que los importes incluyen todos los costos, gastos, tributos y cargas a cargo del Concesionario; y que mantiene la oferta por el plazo previsto y acompaña la Garantía de Mantenimiento de Oferta.</p>' +
      firma(e) + '</div>';
  };
})();
