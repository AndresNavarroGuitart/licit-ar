/* Estado del preview: datos de EJEMPLO guardados en localStorage + reglas de calculo.
   El caso de referencia es el Pliego de concesion del predio Mangrullo (ENAPRO, Puerto de Rosario). */
(function () {
  var KEY = 'pliego-preview-v7';
  var DAY = 864e5;

  function noon(d) { var x = new Date(d); x.setHours(12, 0, 0, 0); return x; }
  function iso(d) {
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }
  function addDaysTo(date, n) { return iso(new Date(noon(date + 'T12:00').getTime() + n * DAY)); }
  function inDays(n) { return iso(new Date(noon(new Date()).getTime() + n * DAY)); }
  function daysLeft(date) { return Math.round((noon(date + 'T12:00') - noon(new Date())) / DAY); }
  function isWeekend(date) { var w = new Date(date + 'T12:00').getDay(); return w === 0 || w === 6; }
  /* dias habiles administrativos (sin feriados): el pliego computa plazos en dias habiles (Art. I.2) */
  function addBusinessDays(date, n) {
    var step = n < 0 ? -1 : 1, left = Math.abs(n), d = date;
    while (left > 0) { d = addDaysTo(d, step); if (!isWeekend(d)) left--; }
    return d;
  }
  function nextWeekday(date) { while (isWeekend(date)) date = addDaysTo(date, 1); return date; }

  var PBC = 'Pliego de Bases y Condiciones';
  var AII = 'Anexo II — Formulario de propuesta económica';
  var AIII = 'Anexo III — Infraestructura mínima';

  /* ---------- numero en letras (el pliego dice que, si difieren, prevalece lo escrito en letras) ---------- */
  var U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  var D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  var C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  function menos1000(x) {
    if (x === 100) return 'cien';
    var c = Math.floor(x / 100), r = x % 100, s = c ? C[c] + (r ? ' ' : '') : '';
    if (r < 30) return s + U[r];
    var d = Math.floor(r / 10), u = r % 10;
    return s + D[d] + (u ? ' y ' + U[u] : '');
  }
  function apocope(s) { return s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un'); }
  function hasta999999(x) {
    var mil = Math.floor(x / 1000), r = x % 1000, s = '';
    if (mil) s = mil === 1 ? 'mil' : apocope(menos1000(mil)) + ' mil';
    if (r) s += (s ? ' ' : '') + menos1000(r);
    return s;
  }
  function enLetras(n) {
    n = Math.floor(Number(n) || 0);
    if (n <= 0) return 'cero';
    var mill = Math.floor(n / 1e6), rest = n % 1e6, s = '';
    if (mill) s = mill === 1 ? 'un millón' : apocope(hasta999999(mill)) + ' millones';
    if (rest) s += (s ? ' ' : '') + hasta999999(rest);
    return s;
  }

  function req(id, carpeta, grupo, titulo, detalle, origen, folios, estado, src, extra) {
    var r = { id: id, carpeta: carpeta, grupo: grupo, titulo: titulo, detalle: detalle, origen: origen, folios: folios, estado: estado, src: src };
    for (var k in (extra || {})) r[k] = extra[k];
    return r;
  }
  function S(ref, pag, texto, mark, doc) { return { doc: doc || PBC, ref: ref, pag: pag, texto: texto, mark: mark }; }

  function seedRequisitos() {
    var A = 'Antecedentes', G = 'Garantía', ID = 'Habilidad e integridad', EF = 'Capacidad económico-financiera', TO = 'Capacidad técnico-operativa', UT = 'Presentación conjunta';
    return [
      req('a', 'A', 'Presentación', 'Nota de presentación', 'Firmada por el representante. Si es presentación conjunta: % de participación de cada integrante y representante común.', 'plantilla', 2, 'en-curso',
        S('Art. II.5.1 a)', 23, 'nota de presentación firmada por el representante de la empresa. Para el caso puntual de presentación conjunta, la nota deberá firmar el representante designado.', 'nota de presentación firmada'), { tpl: 'nota' }),
      req('b', 'A', 'Presentación', 'Constancia de aceptación del Pliego y sus Circulares', 'Firmada por representante con facultades suficientes; obliga a todos los integrantes.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 b)', 24, 'Constancia de Aceptación del Pliego y sus Circulares por parte del Oferente, firmada por el representante del Oferente con facultades suficientes.', 'Constancia de Aceptación del Pliego'), { tpl: 'aceptacion' }),
      req('d', 'A', 'Presentación', 'Datos del oferente y documentos constitutivos certificados y legalizados', 'Razón social, lugar y fecha de constitución, domicilio, inscripción; copia certificada de estatuto o contrato.', 'biblioteca', 18, 'listo',
        S('Art. II.5.1 d)', 24, 'se agregará copia debidamente certificada y legalizada de los documentos constitutivos y estatutos.', 'certificada y legalizada'), { docTipo: 'estatuto', docId: 'd1' }),
      req('e', 'A', 'Presentación', 'Acta del órgano de dirección: decisión de participar', 'Copia certificada y legalizada (personas jurídicas) o DDJJ (personas humanas).', 'plantilla', 3, 'pendiente',
        S('Art. II.5.1 e)', 24, 'Copia debidamente certificada y legalizada del acta del órgano de dirección (para personas jurídicas) o declaración jurada (para personas humanas) donde se manifieste la decisión de participar.', 'decisión de participar'), { tpl: 'acta' }),
      req('f1', 'A', ID, 'DDJJ de no estar alcanzado por inadmisibilidad (Art. II.2)', 'Alcanza a directores, administradores, socios y sociedades controlantes o controladas.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 f)', 24, 'Declaración jurada firmada por el representante del oferente en la que conste que las personas humanas y/o los directores, administradores o socios no se encuentran alcanzados por ninguna de las condiciones de inadmisibilidad señaladas en el Artículo II.2.', 'inadmisibilidad'), { tpl: 'inadmisibilidad' }),
      req('f2', 'A', ID, 'DDJJ de inexistencia de litigio con el ENAPRO', 'Si existen litigios: identificarlos (partes, objeto, fuero, expediente).', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 f)', 24, 'declaración jurada de inexistencia de litigio con el ENAPRO, en la que deberá manifestar si alguno de los integrantes del oferente mantiene litigios judiciales o arbitrales en trámite contra el ENAPRO.', 'inexistencia de litigio'), { tpl: 'litigio' }),
      req('f3', 'A', ID, 'Constancia de CUIT e inscripción tributaria nacional', 'De cada integrante.', 'biblioteca', 2, 'listo',
        S('Art. II.5.1 f)', 25, 'constancia de CUIT y constancias de inscripción tributaria (nacional y, de corresponder, provincial y/o municipal).', 'constancia de CUIT'), { docTipo: 'arca', docId: 'd2' }),
      req('f4', 'A', ID, 'Constancia de inscripción tributaria provincial (Ingresos Brutos)', 'Y municipal, de corresponder.', 'biblioteca', 2, 'listo',
        S('Art. II.5.1 f)', 25, 'constancias de inscripción tributaria (nacional y, de corresponder, provincial y/o municipal).', 'provincial y/o municipal'), { docTipo: 'iibb', docId: 'd3' }),
      req('f5', 'A', ID, 'DDJJ de cumplimiento laboral, de seguridad social y sindical', 'Personas humanas sin personal a cargo: alcanza una DDJJ en ese sentido.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 f)', 25, 'declaración jurada de cumplimiento de las obligaciones laborales, de seguridad social y sindicales a su cargo.', 'obligaciones laborales'), { tpl: 'laboral' }),
      req('f6', 'A', ID, 'Constancia de inexistencia de deuda previsional', 'O certificación contable de cumplimiento, de contador independiente con legalización del consejo profesional.', 'biblioteca', 2, 'listo',
        S('Art. II.5.1 f)', 25, 'constancia emitida por la autoridad nacional competente que acredite, de corresponder, la inexistencia de deuda previsional (o, en su defecto, certificación contable).', 'inexistencia de deuda previsional'), { docTipo: 'previsional', docId: 'd4' }),
      req('f7', 'A', ID, 'Constancia de inexistencia de concursos o quiebras', 'De cada integrante.', 'biblioteca', 2, 'listo',
        S('Art. II.5.1 f)', 25, 'constancia/certificación acerca de la inexistencia de procesos concursales o quiebras.', 'procesos concursales o quiebras'), { docTipo: 'concursos', docId: 'd5' }),
      req('g', 'A', ID, 'DDJJ de integridad y transparencia', 'Beneficiarios finales, declaración PEP y origen lícito de los fondos de la inversión.', 'plantilla', 4, 'en-curso',
        S('Art. II.5.1 g)', 25, 'Declaración jurada de integridad y transparencia, que deberá incluir (i) identificación del/los beneficiario/s final/es; (ii) declaración PEP; y (iii) declaración jurada de origen lícito de los fondos.', 'integridad y transparencia'), { tpl: 'integridad' }),
      req('h', 'A', ID, 'Certificados de antecedentes penales (nacionales)', 'Personas humanas oferentes; o administradores y beneficiarios finales si es persona jurídica.', 'biblioteca', 4, 'listo',
        S('Art. II.5.1 h)', 26, 'Certificados de antecedentes penales (nacionales) respecto de: (i) personas humanas oferentes; y (ii) para personas jurídicas, respecto de sus administradores/directores/gerentes y de las personas humanas que revistan la condición de beneficiario final.', 'antecedentes penales'), { docTipo: 'penales', docId: 'd6' }),
      req('i', 'A', ID, 'DDJJ de no inhabilitaciones ni sanciones para contratar con el Estado', 'Y de no haber sido condenado por delitos dolosos de corrupción, fraude o lavado de activos.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 i)', 26, 'Declaración jurada de no estar alcanzados por inhabilitaciones, sanciones o prohibiciones para contratar con el Estado.', 'inhabilitaciones, sanciones o prohibiciones'), { tpl: 'inhabilitaciones' }),
      req('j', 'A', G, 'Declaración de mantenimiento de la oferta', 'Acompaña la garantía del Art. II.6; mantenimiento por 60 días corridos.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 j)', 26, 'Declaración de mantenimiento de la oferta, incluyendo la garantía correspondiente, en un todo de acuerdo con lo especificado en el Artículo II.6.', 'mantenimiento de la oferta'), { tpl: 'mantenimiento' }),
      req('o', 'A', G, 'Garantía de mantenimiento de oferta ($ 40.000.000)', 'Depósito bancario, aval bancario o seguro de caución. El original va al Departamento de Asuntos Legales dentro de las 24 h de la apertura.', 'oferta', 6, 'pendiente',
        S('Art. II.6', 38, 'una garantía de mantenimiento de la misma o la constancia de haberla constituido, por el monto de $40.000.000 (pesos cuarenta millones).', 'monto de $40.000.000')),
      req('k', 'A', G, 'Detalle de los seguros a contratar si resulta adjudicatario', 'Con las posibles aseguradoras, sujetas al control de la Superintendencia de Seguros de la Nación (Art. IV.13).', 'externo', 3, 'pendiente',
        S('Art. II.5.1 k)', 26, 'Detalle de los seguros a contratar en caso de resultar adjudicatario, incluyendo la identificación de las posibles compañías aseguradoras.', 'Detalle de los seguros')),
      req('l', 'A', ID, 'DDJJ de veracidad y autorización para requerir información', 'Autoriza al ENAPRO a consultar organismos oficiales, bancos y empresas vinculadas.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 l)', 26, 'garantizando la veracidad y exactitud de todas las expresiones y del contenido de la oferta que se realiza y obligándose a actualizar y ampliar la información.', 'veracidad y exactitud'), { tpl: 'veracidad' }),
      req('p', 'A', ID, 'DDJJ de intereses', 'Vínculos con autoridades o agentes que intervengan o decidan en el procedimiento.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 p)', 30, 'será obligatoria la presentación de una Declaración Jurada de Intereses, mediante la cual el Oferente deberá informar la existencia o inexistencia de vínculos.', 'Declaración Jurada de Intereses'), { tpl: 'intereses' }),
      req('m1a', 'A', EF, 'Balances y estados de resultados de los últimos 2 ejercicios', 'Certificados por contador y legalizados por el CPCE. Sociedades nuevas: ingresos de 6 meses y DDJJ de IVA.', 'biblioteca', 40, 'listo',
        S('Art. II.5.1 m.1)', 27, 'Balances Generales y Estados de Resultados de los últimos dos (2) ejercicios, certificado por Contador Público y legalizados por el Consejo Profesional de Ciencias Económicas.', 'últimos dos (2) ejercicios'), { docTipo: 'balance', docId: 'd7' }),
      req('m1b', 'A', EF, 'Flujo de fondos proyectado a 2 años (certificado)', 'Apertura mensual de ingresos y egresos, con las pautas de elaboración. Firma legalizada ante el CPCE.', 'externo', 8, 'en-curso',
        S('Art. II.5.1 m.1)', 27, 'Informe especial que acredite el flujo proyectado de fondos (cash flow) del oferente relativo a los próximos 2 años.', 'flujo proyectado de fondos')),
      req('m1c', 'A', EF, 'Patrimonio neto, facturación de 3 ejercicios y fuentes de financiación', 'Con el compromiso de financiación de cada fuente si resulta adjudicatario.', 'externo', 6, 'pendiente',
        S('Art. II.5.1 m.1)', 27, 'Patrimonio Neto al cierre del último ejercicio. Indicación de las fuentes de financiación previstas, adjuntando para cada rubro el compromiso de financiación. Facturación anual para los 3 últimos ejercicios.', 'Facturación anual para los 3 últimos ejercicios')),
      req('m1d', 'A', EF, 'Indicadores: liquidez > 1, endeudamiento < 1,5, margen operativo > 0', 'Certificados por contador y legalizados. Si no se cumplen, se desestima la oferta.', 'indicadores', 2, 'pendiente',
        S('Art. II.5.1 m.1)', 28, 'Si estos tres indicadores no alcanzaran los valores establecidos supra, se desestimará la Oferta.', 'se desestimará la Oferta')),
      req('m2', 'A', TO, 'Antecedentes técnico-operativos (experiencia funcional)', 'Por cada antecedente: proyecto y ubicación, período, rol, alcance, indicadores, comitente y respaldo documental.', 'biblioteca', 12, 'en-curso',
        S('Art. II.5.1 m.2)', 28, 'indicar para cada antecedente: (i) identificación del proyecto/obra/operación y su ubicación; (ii) período de ejecución y/o explotación; (iii) rol desempeñado; (iv) alcance de la operatoria.', 'para cada antecedente'), { docTipo: 'antecedentes' }),
      req('n1', 'A', TO, 'Certificado de visita al predio emitido por el ENAPRO', 'La visita técnica es obligatoria y previa a la presentación. Se coordina con Gerencia de Infraestructura y Desarrollo Portuario.', 'externo', 1, 'pendiente',
        S('Art. II.5.1 n)', 29, 'La visita técnica al Predio será obligatoria y deberá efectuarse con anterioridad a la presentación de la Oferta. Su realización se acreditará mediante el correspondiente Certificado de Visita emitido por el ENAPRO.', 'visita técnica al Predio será obligatoria')),
      req('n2', 'A', TO, 'DDJJ de conocimiento del predio', 'No se admite invocar desconocimiento de las condiciones físicas, operativas o jurídicas.', 'plantilla', 1, 'pendiente',
        S('Art. II.5.1 n)', 30, 'La presentación de la oferta lleva implícito el total conocimiento de las condiciones en las que se desarrollará la concesión de uso.', 'total conocimiento'), { tpl: 'predio' }),

      req('ut1', 'A', UT, 'Compromiso irrevocable de constitución de la UT o consorcio', 'Si todavía no está constituida: se asume el compromiso para el caso de resultar adjudicataria.', 'plantilla', 2, 'pendiente',
        S('Art. II.4.4 c)', 21, 'Si la UT/Consorcio se presentara a constituirse, deberá acompañarse: (1) compromiso irrevocable de constitución en caso de adjudicación.', 'compromiso irrevocable de constitución'), { tpl: 'compromiso-ut', soloUT: true }),
      req('ut2', 'A', UT, 'Proyecto de contrato constitutivo con sus condiciones esenciales', 'Duración superior a la de la concesión y sus prórrogas.', 'externo', 10, 'pendiente',
        S('Art. II.4.4 c)', 21, '(2) proyecto de contrato con sus condiciones esenciales, en los términos del Pliego.', 'proyecto de contrato'), { soloUT: true }),
      req('ut3', 'A', UT, 'Poder del representante común y designación de la firma líder', 'Facultades suficientes para obligar a todos los integrantes hasta la firma del contrato.', 'externo', 4, 'pendiente',
        S('Art. II.4.4 b)', 21, 'Deberá designarse un Representante Común con facultades suficientes para actuar, obligar y responsabilizar a todos los integrantes frente al ENAPRO.', 'Representante Común'), { soloUT: true }),
      req('ut4', 'A', UT, 'Aceptación de responsabilidad solidaria, conjunta e ilimitada', 'De cada integrante, con renuncia a los beneficios de excusión y división.', 'plantilla', 1, 'pendiente',
        S('Art. II.4.4 a)', 20, 'Todos los integrantes/socios asumirán frente al ENAPRO responsabilidad principal, solidaria, conjunta e ilimitada, con renuncia expresa a los beneficios de excusión y división.', 'solidaria, conjunta e ilimitada'), { tpl: 'solidaria', soloUT: true }),

      req('t1', 'T', 'Plan empresario', 'Visión estratégica del negocio', 'Función futura del predio, aporte al Puerto y articulación con las unidades que ya opera el oferente.', 'externo', 6, 'en-curso',
        S('Art. II.5.2 a)', 31, 'Visión estratégica del negocio: se la deberá explicitar de forma tal que resulte claro para el ENAPRO cuál es la perspectiva del oferente acerca de la futura función del predio.', 'Visión estratégica del negocio')),
      req('t2', 'T', 'Plan empresario', 'Plan operativo con layout preliminar', 'Organización funcional, sectores, circulaciones, etapas de inversión, mantenimiento, seguridad y ambiente.', 'externo', 14, 'en-curso',
        S('Art. II.5.2 b)', 31, 'incluir, como mínimo en su oferta, un lay-out preliminar del predio. Además, deberá indicar qué tipo de tecnología aplicará y qué servicios se ofrecerán.', 'lay-out preliminar')),
      req('t3', 'T', 'Plan empresario', 'Memoria descriptiva del proyecto y plan de desarrollo y mejoras', 'Criterios de implantación, soluciones urbanísticas, arquitectónicas, operativas y ambientales. Sin llegar a proyecto ejecutivo.', 'externo', 30, 'pendiente',
        S('Art. II.5.2 c)', 32, 'La Memoria Descriptiva deberá desarrollar los criterios generales de implantación del proyecto, justificar la organización funcional propuesta y fundamentar las soluciones adoptadas.', 'Memoria Descriptiva')),
      req('t4', 'T', 'Plan empresario', 'Planos y maqueta (conjunto 1:500, plantas 1:200 o 1:100, cortes y vistas 1:100)', 'Maqueta del conjunto a escala 1:500, física o electrónica.', 'externo', 24, 'pendiente',
        S('Art. II.5.2 c)', 33, 'Propuesta de Conjunto: Escala 1:500. Edificios (Plantas): Escala 1:200 o 1:100. Cortes y Vistas: Escala 1:100. Maqueta del Conjunto: Escala 1:500.', 'Escala 1:500')),
      req('t5', 'T', 'Plan empresario', 'Cronograma general de obras e inversiones con hitos verificables', 'Plazos y metas durante la vigencia de la concesión.', 'externo', 4, 'pendiente',
        S('Art. II.5.2 c)', 34, 'el cronograma general de ejecución de las obras e inversiones, los plazos previstos para su desarrollo y los principales hitos de avance.', 'cronograma general de ejecución')),
      req('t6', 'T', 'Plan empresario', 'Plan de recursos humanos (organigrama)', 'Funciones previstas y cantidad estimada de personal.', 'externo', 3, 'pendiente',
        S('Art. II.5.2 d)', 35, 'Plan de Recursos Humanos: Cada oferente detallará la estructura organizativa propuesta para la operación del Predio.', 'Plan de Recursos Humanos')),
      req('t7', 'T', 'Plan empresario', 'Adecuación al Anexo III: infraestructura mínima y criterios ambientales', 'Energía, agua, desagües, cerramiento, infraestructura náutica, protección de márgenes, gestión ambiental.', 'externo', 12, 'pendiente',
        S('Art. II.5.2', 31, 'La Oferta Técnica deberá elaborarse de conformidad con los lineamientos, criterios técnicos, infraestructura mínima y documentación establecidos en el Anexo III.', 'Anexo III', PBC)),

      req('e1', 'E', 'Oferta económica', 'Plan de inversiones (montos, cronograma mensual, hitos y financiamiento)', 'Mínimo $ 10.000 millones netos de IVA, a valores del mes de apertura, ejecutados en hasta 30 meses.', 'oferta', 6, 'pendiente',
        S('Art. II.5.3 a)', 35, 'El Plan de Inversiones no podrá ser inferior a PESOS DIEZ MIL MILLONES ($10.000.000.000) (neto de IVA) y deberá ejecutarse dentro del plazo máximo de TREINTA (30) meses.', 'PESOS DIEZ MIL MILLONES')),
      req('e2', 'E', 'Oferta económica', 'Proyecciones financieras', 'Ingresos, gastos directos y fijos, depreciaciones, tasas y canon con bonificación y actualización CER.', 'externo', 10, 'pendiente',
        S('Art. II.5.3 b)', 36, 'Las proyecciones financieras de cada oferente deberán contemplar, entre otros elementos: ingresos a percibir, gastos directos de operación, cronogramas de depreciación.', 'proyecciones financieras')),
      req('e3', 'E', 'Oferta económica', 'Flujo de fondos de todo el período de concesión', 'Debe reflejar la bonificación del canon (100 % y 50 % en 24 meses) y el cronograma de la inversión mínima.', 'externo', 8, 'pendiente',
        S('Art. II.5.3 c)', 37, 'El flujo de fondos deberá reflejar en forma expresa la bonificación del canon al 100% y al 50% durante los primeros veinticuatro (24) meses.', 'bonificación del canon')),
      req('e4', 'E', 'Oferta económica', 'Anexo II — Formulario de propuesta económica (canon, inversión y plazo)', 'Completo, firmado y sin enmiendas. Canon en números y letras; si difieren, prevalece lo escrito en letras.', 'anexo2', 3, 'pendiente',
        S('Art. II.5.3 d)', 37, 'el Oferente deberá presentar completo, firmado y sin enmiendas el Anexo II – Formulario de la Propuesta Económica.', 'completo, firmado y sin enmiendas'))
    ];
  }

  function seedLicitacion() {
    return {
      id: 'mangrullo',
      nro: 'Licitación Pública Nacional',
      titulo: 'Concesión de uso del predio Mangrullo del Puerto de Rosario',
      organismo: 'Ente Administrador Puerto Rosario (ENAPRO)',
      expediente: '',
      tipo: 'Concesión de uso',
      estado: 'preparacion',
      ref: { label: 'Canon base mensual', monto: 40000000 },
      params: { canonBase: 40000000, inversionMin: 10000000000, plazoObraMax: 30, garantiaOferta: 40000000, garantiaEjec: 1000000000, mantenimiento: 60, plazoConcesion: 20, prorrogaMax: 10 },
      fechas: { visita: '', presentacion: '', horaPres: '11:00', apertura: '', horaAper: '11:00' },
      modalidad: 'individual',
      archivos: [
        { id: 'a1', nombre: 'Pliego-de-concesion-Mangrullo.pdf', tipo: 'Pliego de bases y condiciones', paginas: 93, peso: '522 KB', hallazgos: '35 requisitos · 3 carpetas · 4 garantías · plazos' },
        { id: 'a2', nombre: 'ANEXO-I.pdf', tipo: 'Anexo I · Memoria descriptiva', paginas: 14, peso: '1,5 MB', hallazgos: 'Superficie 5,3 ha · 3 sectores existentes' },
        { id: 'a3', nombre: 'Anexo-II.pdf', tipo: 'Anexo II · Formulario de propuesta económica', paginas: 3, peso: '111 KB', hallazgos: 'Formulario a completar: se arma en Oferta' },
        { id: 'a4', nombre: 'Anexo-III.pdf', tipo: 'Anexo III · Infraestructura mínima', paginas: 19, peso: '173 KB', hallazgos: '6 capítulos técnicos y ambientales' }
      ],
      requisitos: seedRequisitos(),
      oferta: { canon: 52000000, inversion: 10800000000, plazoMeses: 28, forma: 'Seguro de caución', garantiaConstituida: false, garantiaVence: '' },
      fin: { ac: 4200000000, pc: 3100000000, pt: 6000000000, pn: 5200000000, mb: 1800000000, io: 9000000000 },
      presentada: false,
      seg: { tareas: { t2a: true }, apertura: {}, mejora: '', canonOriginal: '', adjudicacion: '', tenencia: '', invertido: '', circulares: [],
        consultas: [{ id: 'q1', fecha: inDays(-4), texto: '¿La maqueta del conjunto puede presentarse solo en formato electrónico?', estado: 'respondida', resp: 'Sí. El Art. II.5.2 c) admite maqueta física o electrónica a escala 1:500.' }] }
    };
  }

  function fechasEjemplo() {
    var ap = nextWeekday(inDays(24));
    return { visita: addBusinessDays(ap, -9), presentacion: ap, horaPres: '11:00', apertura: ap, horaAper: '11:00' };
  }

  function seed() {
    var m = seedLicitacion(); m.fechas = fechasEjemplo();
    var st = {
      empresas: Store.seedEmpresas(),
      biblioteca: [
        { id: 'd1', tipo: 'estatuto', nombre: 'Contrato social + actas de designación (certificados)', vence: null, archivo: 'contrato_social_actas.pdf' },
        { id: 'd2', tipo: 'arca', nombre: 'Constancia de inscripción ARCA', vence: inDays(90), archivo: 'constancia_arca.pdf' },
        { id: 'd3', tipo: 'iibb', nombre: 'Constancia de Ingresos Brutos (API Santa Fe)', vence: inDays(40), archivo: 'constancia_iibb.pdf' },
        { id: 'd4', tipo: 'previsional', nombre: 'Constancia de inexistencia de deuda previsional', vence: inDays(60), archivo: 'libre_deuda_previsional.pdf' },
        { id: 'd5', tipo: 'concursos', nombre: 'Certificado de inexistencia de concursos y quiebras', vence: inDays(15), archivo: 'certificado_concursos.pdf' },
        { id: 'd6', tipo: 'penales', nombre: 'Certificados de antecedentes penales (autoridades)', vence: inDays(12), archivo: 'antecedentes_penales.pdf' },
        { id: 'd7', tipo: 'balance', nombre: 'Balances 2024 y 2025 certificados por CPCE', vence: null, archivo: 'balances_2024_2025.pdf' },
        { id: 'd8', tipo: 'antecedentes', nombre: 'Dossier de antecedentes técnico-operativos (3 proyectos)', vence: null, archivo: 'dossier_antecedentes.pdf' },
        { id: 'd9', tipo: 'antecedentes', nombre: 'Certificado de buena ejecución — Marina Delta Norte', vence: null, archivo: 'certificado_marina_delta.pdf' },
        { id: 'd10', tipo: 'balance', nombre: 'Estados contables auditados, últimos 5 ejercicios', vence: null, archivo: 'estados_contables_5_ejercicios.pdf' },
        { id: 'd11', tipo: 'poder', nombre: 'Poder y autorización del firmante (certificados)', vence: inDays(300), archivo: 'poder_firmante.pdf' },
        { id: 'd12', tipo: 'fabricante', nombre: 'Autorización del fabricante (ejemplo)', vence: inDays(120), archivo: 'autorizacion_fabricante.pdf' },
        { id: 'd13', tipo: 'folleteria', nombre: 'Folletería y manuales técnicos de los equipos', vence: null, archivo: 'folleteria_manuales.pdf' }
      ].concat(Store.seedDocsExtra()),
      licitaciones: [
        m].concat(Store.seedExtra()).concat([
        { id: 'lp-02-2026', nro: 'Licitación Pública N° 02/2026', titulo: 'Concesión de uso de predio costero (ejemplo)', organismo: 'Municipalidad de Ejemplo', expediente: 'EXP-2026-0052210', tipo: 'Concesión de uso', estado: 'analisis', ref: { label: 'Canon base mensual', monto: 18000000 }, fechas: { visita: '', presentacion: nextWeekday(inDays(40)), horaPres: '12:00', apertura: nextWeekday(inDays(40)), horaAper: '12:30' }, archivos: [], requisitos: [], presentada: false, resumenFijo: { listos: 0, total: 0 } }
      ])
    };
    return Store.postSeed(st);
  }

  var state = null;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state || !state.licitaciones) state = seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin storage: sigue en memoria */ } }

  var Store = window.Store = {
    inDays: inDays, daysLeft: daysLeft, addDaysTo: addDaysTo, addBusinessDays: addBusinessDays, nextWeekday: nextWeekday,
    enLetras: enLetras, PBC: PBC, AII: AII, AIII: AIII,
    get: function () { if (!state) load(); return state; },
    save: save,
    reset: function () { state = seed(); save(); },
    lic: function (id) { return Store.get().licitaciones.filter(function (l) { return l.id === id; })[0]; },
    doc: function (id) { return Store.get().biblioteca.filter(function (d) { return d.id === id; })[0]; },
    seedLicitacion: seedLicitacion, fechasEjemplo: fechasEjemplo,
    seedExtra: function () { return []; }, seedEmpresas: function () { return []; }, seedDocsExtra: function () { return []; }, postSeed: function (st) { return st; }, TIPOS: {}
  };
  /* cada tipo de licitacion trae su estructura de carpetas, controles y cronograma */
  Store.T = function (l) { return Store.TIPOS[l.tid || 'concesion']; };

  /* ---------- etapas del proceso (desde el lado del oferente) ---------- */
  Store.addMonths = function (date, n) { var d = new Date(date + 'T12:00'); d.setMonth(d.getMonth() + n); return iso(d); };
  Store.ETAPAS = [
    { n: 1, t: 'Planificación y preparación', ext: true, d: 'La entidad detecta la necesidad, estima el presupuesto y redacta los pliegos.' },
    { n: 2, t: 'Convocatoria y consultas', d: 'Llamado, consultas y circulares aclaratorias.' },
    { n: 3, t: 'Presentación de ofertas', d: 'Armado de la propuesta técnica, económica y legal; entrega y garantía.' },
    { n: 4, t: 'Apertura y evaluación', d: 'Acto de apertura, evaluación de la comisión y dictamen.' },
    { n: 5, t: 'Adjudicación y contratación', d: 'Adjudicación, notificación y firma del contrato.' },
    { n: 6, t: 'Ejecución y cierre', d: 'Ejecución del contrato, recepción y liberación de garantías.' }
  ];
  Store.estadoDeEtapa = { 2: 'analisis', 3: 'preparacion', 4: 'presentada', 5: 'adjudicacion', 6: 'ejecucion' };
  Store.etapa = function (l) { return l.etapa || (l.presentada ? 4 : l.estado === 'analisis' ? 2 : 3); };
  Store.setEtapa = function (l, n) { l.etapa = n; l.estado = Store.estadoDeEtapa[n] || l.estado; l.presentada = n >= 4; };
  Store.seg = function (l) {
    if (!l.seg) l.seg = { tareas: {}, consultas: [], circulares: [], apertura: {}, mejora: '', canonOriginal: '', adjudicacion: '', tenencia: '', invertido: '' };
    return l.seg;
  };

  /* ---------- reglas ---------- */
  /* requisitos que aplican: los de presentacion conjunta solo si el oferente es UT o consorcio */
  Store.reqs = function (l) { return l.requisitos.filter(function (r) { return !r.soloUT || l.modalidad === 'ut'; }); };

  Store.progress = function (l) {
    if (l.resumenFijo) return { total: l.resumenFijo.total, done: l.resumenFijo.listos, pct: l.resumenFijo.total ? Math.round(100 * l.resumenFijo.listos / l.resumenFijo.total) : 0 };
    var rs = Store.reqs(l).filter(function (r) { return !r.opcional; }), done = rs.filter(function (r) { return r.estado === 'listo'; }).length;
    return { total: rs.length, done: done, pct: rs.length ? Math.round(100 * done / rs.length) : 0 };
  };

  /* un unico sobre con tres carpetas, hojas numeradas en forma correlativa (Art. II.1) */
  Store.folios = function (l) {
    var n = 0, out = {}, porCarpeta = {};
    Store.T(l).orden.forEach(function (c) {
      porCarpeta[c] = 0;
      Store.reqs(l).filter(function (r) { return r.carpeta === c; }).forEach(function (r) {
        out[r.id] = { from: n + 1, to: n + r.folios }; n += r.folios; porCarpeta[c] += r.folios;
      });
    });
    return { byReq: out, total: n, porCarpeta: porCarpeta };
  };

  /* cronograma: el pliego computa plazos en dias habiles; las fechas del llamado se cargan a mano */
  Store.cronograma = function (l) {
    var f = l.fechas, p = l.params;
    if (!f.apertura) return [];
    var ev = [
      { k: 'visita', corto: 'Visita técnica', label: 'Visita técnica obligatoria (antes de presentar)', date: f.visita, nota: 'Coordinar con la Gerencia de Infraestructura y Desarrollo Portuario' },
      { k: 'consultas', corto: 'Últimas consultas', label: 'Último día para consultas', date: addBusinessDays(f.apertura, -7), nota: '7 días hábiles antes de la apertura' },
      { k: 'circulares', corto: 'Últimas circulares', label: 'Última circular posible', date: addBusinessDays(f.apertura, -2), nota: 'El ENAPRO las emite con 2 días hábiles de anticipación como mínimo' },
      { k: 'apertura', corto: 'Presentación y apertura', label: 'Presentación y apertura de ofertas', date: f.apertura, hora: f.horaAper, key: true, nota: 'Oficinas del ENAPRO, lunes a viernes de 9 a 15 h' },
      { k: 'garantia', corto: 'Garantía original', label: 'Entregar el original de la garantía (Asuntos Legales)', date: addDaysTo(f.apertura, 1), nota: 'Dentro de las 24 h de la apertura; si no, se desestima la oferta' },
      { k: 'fin', corto: 'Fin del mantenimiento', label: 'Fin del mantenimiento de oferta', date: addDaysTo(f.apertura, p.mantenimiento), nota: '60 días corridos; se renueva solo salvo aviso 10 días antes' }
    ];
    /* hitos posteriores, cuando ya se cargaron las fechas en Seguimiento */
    var s = Store.seg(l);
    if (s.adjudicacion) {
      ev.push({ k: 'adjudicacion', corto: 'Adjudicación', label: 'Adjudicación notificada', date: s.adjudicacion, nota: 'Desde acá corren los plazos de garantías, constitución y firma' });
      ev.push({ k: 'garantias', corto: 'Garantías', label: 'Garantías de cumplimiento y de ejecución', date: addBusinessDays(s.adjudicacion, 5), nota: '5 días hábiles de notificada la adjudicación' });
      ev.push({ k: 'firma', corto: 'Firma del contrato', label: 'Firma del contrato (límite)', date: addBusinessDays(s.adjudicacion, 30), nota: '30 días hábiles de notificada la adjudicación' });
    }
    if (s.tenencia) {
      ev.push({ k: 'tenencia', corto: 'Entrega de tenencia', label: 'Entrega de tenencia', date: s.tenencia, nota: 'Empiezan a correr los 20 años, la bonificación y los 30 meses de obra' });
      ev.push({ k: 'obra', corto: 'Fin de la inversión mínima', label: 'Fin del plazo de la inversión mínima', date: Store.addMonths(s.tenencia, p.plazoObraMax), nota: '30 meses desde la entrega de tenencia' });
    }
    return ev.filter(function (e) { return e.date; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  };

  /* bonificacion del canon (Art. IV.4 c): 100 % meses 1-12, 50 % meses 13-24, sin bonificacion desde el 25 */
  Store.canon = function (l) {
    var c = Number(l.oferta.canon) || l.params.canonBase, y1 = 0, y2 = c * 12 * 0.5, resto = c * (l.params.plazoConcesion * 12 - 24);
    return { canon: c, mensualAno2: c * 0.5, total24: y1 + y2, totalPlazo: y1 + y2 + resto, garantiaCumplimiento: c * 12 };
  };

  Store.ratios = function (l) {
    var f = l.fin, num = function (k) { return Number(f[k]) || 0; };
    return {
      liquidez: num('pc') ? num('ac') / num('pc') : null,
      endeudamiento: num('pn') ? num('pt') / num('pn') : null,
      margen: num('io') ? num('mb') / num('io') : null
    };
  };

  Store.garantiaVenceMin = function (l) { return addDaysTo(l.fechas.apertura, l.params.mantenimiento); };

  Store.docEstado = function (d, apertura) {
    if (!d.vence) return 'sin-vto';
    if (d.vence < iso(new Date())) return 'vencido';
    if (apertura && d.vence < apertura) return 'vence-antes';
    return 'vigente';
  };

  function dmy(s) { return s.split('-').reverse().join('/'); }
  var pesos = function (n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); };

  Store.checks = function (l) {
    var c = [], p = Store.progress(l), o = l.oferta, par = l.params, r = Store.ratios(l), left = daysLeft(l.fechas.apertura);
    c.push({ ok: p.done === p.total ? 'ok' : 'bad', titulo: 'Requisitos completos', detalle: p.done + ' de ' + p.total + ' requisitos listos.', tab: 'requisitos' });

    Store.reqs(l).filter(function (q) { return q.docId; }).forEach(function (q) {
      var d = Store.doc(q.docId); if (!d) return;
      var e = Store.docEstado(d, l.fechas.apertura);
      if (e === 'vencido') c.push({ ok: 'bad', titulo: d.nombre + ' está vencido', detalle: 'Venció el ' + dmy(d.vence) + '. Renovalo y reemplazalo.', tab: 'armado' });
      else if (e === 'vence-antes') c.push({ ok: 'warn', titulo: d.nombre + ' vence antes de la apertura', detalle: 'Vence el ' + dmy(d.vence) + ', apertura ' + dmy(l.fechas.apertura) + '. Conviene renovarlo para llegar vigente.', tab: 'armado' });
    });

    var cb = par.canonBase;
    if (!(Number(o.canon) > 0)) c.push({ ok: 'warn', titulo: 'Canon no consignado', detalle: 'Si no se completa, la oferta se entiende formulada por el Canon Base (' + pesos(cb) + ').', tab: 'oferta' });
    else if (o.canon < cb) c.push({ ok: 'bad', titulo: 'Canon inferior al Canon Base', detalle: 'Ofrecés ' + pesos(o.canon) + ' y el piso es ' + pesos(cb) + '. Se desestima sin posibilidad de subsanar (Art. II.5.3 d).', tab: 'oferta' });
    else c.push({ ok: 'ok', titulo: 'Canon igual o superior al Canon Base', detalle: pesos(o.canon) + ' por mes, a valores de apertura, actualizado por CER.', tab: 'oferta' });

    if (!(Number(o.inversion) > 0) || !(Number(o.plazoMeses) > 0)) c.push({ ok: 'bad', titulo: 'Falta completar la inversión comprometida', detalle: 'Monto y plazo de ejecución.', tab: 'oferta' });
    else if (o.inversion < par.inversionMin || o.plazoMeses > par.plazoObraMax) c.push({ ok: 'bad', titulo: 'La inversión no cumple el mínimo del pliego', detalle: 'Mínimo ' + pesos(par.inversionMin) + ' netos en hasta ' + par.plazoObraMax + ' meses. Ofrecés ' + pesos(o.inversion) + ' en ' + o.plazoMeses + ' meses.', tab: 'oferta' });
    else c.push({ ok: 'ok', titulo: 'Inversión dentro de lo exigido', detalle: pesos(o.inversion) + ' en ' + o.plazoMeses + ' meses (mínimo ' + pesos(par.inversionMin) + ' en ' + par.plazoObraMax + ').', tab: 'oferta' });

    if (r.liquidez == null || r.endeudamiento == null || r.margen == null) c.push({ ok: 'bad', titulo: 'Faltan datos de los indicadores financieros', detalle: 'Se calculan con los datos del último balance.', tab: 'oferta' });
    else {
      var fallan = [];
      if (!(r.liquidez > 1)) fallan.push('liquidez ' + r.liquidez.toFixed(2).replace('.', ',') + ' (debe ser mayor a 1)');
      if (!(r.endeudamiento < 1.5)) fallan.push('endeudamiento ' + r.endeudamiento.toFixed(2).replace('.', ',') + ' (debe ser menor a 1,50)');
      if (!(r.margen > 0)) fallan.push('margen operativo ' + (r.margen * 100).toFixed(1).replace('.', ',') + ' % (debe ser mayor a 0)');
      if (fallan.length) c.push({ ok: 'bad', titulo: 'Los indicadores financieros no alcanzan', detalle: 'Se desestima la oferta: ' + fallan.join('; ') + '.', tab: 'oferta' });
      else c.push({ ok: 'ok', titulo: 'Indicadores financieros dentro de lo exigido', detalle: 'Liquidez, endeudamiento y margen operativo cumplen.', tab: 'oferta' });
    }

    var min = Store.garantiaVenceMin(l), necesitaVig = o.forma !== 'Depósito bancario';
    if (!o.garantiaConstituida) c.push({ ok: 'bad', titulo: 'Garantía de oferta sin constituir', detalle: pesos(par.garantiaOferta) + ' por ' + o.forma.toLowerCase() + '. El pliego pide el comprobante junto con la oferta.', tab: 'oferta' });
    else if (necesitaVig && !o.garantiaVence) c.push({ ok: 'bad', titulo: 'Falta la vigencia de la garantía', detalle: 'Debe cubrir hasta el ' + dmy(min) + ' (apertura + ' + par.mantenimiento + ' días corridos).', tab: 'oferta' });
    else if (necesitaVig && o.garantiaVence < min) c.push({ ok: 'bad', titulo: 'La garantía vence antes del mantenimiento de oferta', detalle: 'Vence el ' + dmy(o.garantiaVence) + ' y debería cubrir hasta el ' + dmy(min) + '.', tab: 'oferta' });
    else c.push({ ok: 'ok', titulo: 'Garantía de oferta constituida', detalle: pesos(par.garantiaOferta) + ' · ' + o.forma + (necesitaVig ? ' · vigente hasta ' + dmy(o.garantiaVence) : '') + '.', tab: 'oferta' });

    var visita = Store.reqs(l).filter(function (q) { return q.id === 'n1'; })[0];
    if (visita && visita.estado !== 'listo' && l.fechas.visita && daysLeft(l.fechas.visita) <= 3) c.push({ ok: 'warn', titulo: 'Visita técnica sin certificado', detalle: 'Es obligatoria y previa a la presentación; coordinala ya con el ENAPRO.', tab: 'requisitos' });

    var cons = addBusinessDays(l.fechas.apertura, -7);
    if (daysLeft(cons) >= 0 && daysLeft(cons) <= 3) c.push({ ok: 'warn', titulo: 'Se cierran las consultas', detalle: 'Último día para consultar: ' + dmy(cons) + '.', tab: 'resumen' });

    if (left < 0) c.push({ ok: 'bad', titulo: 'El plazo de presentación ya pasó', detalle: 'Venció hace ' + (-left) + ' día(s).', tab: 'resumen' });
    else if (left <= 3) c.push({ ok: 'warn', titulo: 'Quedan ' + left + ' día(s) para presentar', detalle: 'Se recibe de lunes a viernes de 9 a 15 h, hasta la hora de apertura.', tab: 'resumen' });
    return c;
  };

  /* la concesion es el primer tipo; los demas se registran en tipos.js */
  var checksConcesion = Store.checks, cronogramaConcesion = Store.cronograma;
  Store.TIPOS.concesion = {
    id: 'concesion', nombre: 'Concesión de uso', carpetas: { A: 'Antecedentes', T: 'Oferta técnica', E: 'Oferta económica' }, orden: ['A', 'T', 'E'],
    presentacion: 'sobre', oferta: 'canon', soportaUT: true,
    checks: checksConcesion, cronograma: cronogramaConcesion,
    tags: function (l) { return ['Plazo ' + l.params.plazoConcesion + ' años']; }
  };
  Store.checks = function (l) { return Store.T(l).checks(l); };
  Store.cronograma = function (l) { return Store.T(l).cronograma(l); };

  /* avisos de documentos de la biblioteca que vencen antes de la apertura: comun a todos los tipos */
  Store.checkDocs = function (l) {
    var c = [];
    Store.reqs(l).filter(function (q) { return q.docId; }).forEach(function (q) {
      var d = Store.doc(q.docId); if (!d) return;
      var e = Store.docEstado(d, l.fechas.apertura);
      if (e === 'vencido') c.push({ ok: 'bad', titulo: d.nombre + ' está vencido', detalle: 'Venció el ' + dmy(d.vence) + '. Renovalo y reemplazalo.', tab: 'armado' });
      else if (e === 'vence-antes') c.push({ ok: 'warn', titulo: d.nombre + ' vence antes de la apertura', detalle: 'Vence el ' + dmy(d.vence) + ', apertura ' + dmy(l.fechas.apertura) + '. Conviene renovarlo para llegar vigente.', tab: 'armado' });
    });
    return c;
  };
  Store.dmy = dmy;
  Store.pesos = pesos;

  /* una licitación presentada se ve completa, pero la oferta queda en solo lectura hasta que se habilite la edición */
  Store.bloqueada = function (l) { return !!l.presentada && !l.editable; };

  Store.bloqueantes = function (l) { return Store.checks(l).filter(function (x) { return x.ok === 'bad'; }); };
})();
