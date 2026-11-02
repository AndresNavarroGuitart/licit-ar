/* Contenido FICTICIO de cada requisito, para simular la confeccion de la oferta de Mangrullo.
   Los numeros de inversion y flujo de fondos se calculan a partir de lo cargado en la pestaña Oferta. */
(function () {
  var esc = UI.esc, money = UI.money;
  var D = window.Demo = {};
  D.TD = {};   /* documentos y recorrido por tipo de oferta (lotes, servicio), registrados en demo-bid.js */
  D.h = function () { return { p: p, h3: h3, paper: paper, tbl: tbl, scan: scan, ul: ul }; };

  function em() { return Store.get().empresa; }
  function p(t) { return '<p>' + t + '</p>'; }
  function h3(t) { return '<h3 style="font-family:Inter,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#555;margin:18px 0 6px">' + t + '</h3>'; }
  function paper(titulo, cuerpo) { return '<div class="paper"><h2>' + esc(titulo) + '</h2>' + cuerpo + '</div>'; }
  function mm(n) { return (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 0 }); }
  function pct(n, d) { return (n * 100).toLocaleString('es-AR', { maximumFractionDigits: d == null ? 1 : d }) + ' %'; }
  function ul(items) { return '<ul style="margin:0 0 12px;padding-left:20px">' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; }
  function tbl(head, rows, right) {
    right = right || [];
    return '<table class="ptab"><thead><tr>' + head.map(function (h, i) { return '<th' + (right.indexOf(i) > -1 ? ' class="r"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr' + (r.total ? ' class="tot"' : '') + '>' + (r.total ? r.total : r).map(function (c, i) { return '<td' + (right.indexOf(i) > -1 ? ' class="r"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function scan(titulo, sub, filas) {
    return '<div class="scan"><div class="scan-h"><b>' + esc(titulo) + '</b><span>' + esc(sub) + '</span></div><dl>' +
      filas.map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl><div class="scan-f">Documento de la biblioteca · escaneo de ejemplo con datos ficticios</div></div>';
  }

  /* ---------- plan de inversiones ---------- */
  var RUBROS = [
    ['Estudios, proyectos ejecutivos y gestión ambiental', 0.3, 1, 6],
    ['Infraestructura de servicios (energía, agua, desagües, iluminación)', 1.9, 3, 12],
    ['Protección de márgenes y frente ribereño', 2.3, 4, 14],
    ['Guardería náutica: racks, rampas y ascensor náutico', 2.2, 6, 18],
    ['Astillero y varadero', 1.6, 8, 20],
    ['Edificios: administración, gastronomía y servicios', 1.4, 10, 24],
    ['Parque público y espacios exteriores', 0.8, 16, 26],
    ['Señalización, seguridad y control de acceso', 0.3, 22, 28]
  ];
  D.plan = function (l) {
    var inv = Number(l.oferta.inversion) || 0, T = Number(l.oferta.plazoMeses) || 28, k = inv / 10.8e9, mf = T / 28;
    var rubros = RUBROS.map(function (r) {
      var a = Math.max(1, Math.round(r[2] * mf)), b = Math.max(a, Math.round(r[3] * mf));
      return { n: r[0], monto: r[1] * 1e9 * k, a: a, b: b };
    });
    var mes = [], acum = [], t = 0;
    for (var m = 1; m <= T; m++) {
      var s = 0; rubros.forEach(function (r) { if (m >= r.a && m <= r.b) s += r.monto / (r.b - r.a + 1); });
      mes.push(s); t += s; acum.push(t);
    }
    return { rubros: rubros, mes: mes, acum: acum, T: T, inv: inv };
  };

  /* ---------- flujo de fondos de la concesion (pesos constantes a valores de apertura) ---------- */
  var UNIDADES = [['Guardería náutica (racks y amarres)', 4.2], ['Astillero y varadero', 3.1], ['Gastronomía y locales comerciales', 1.9], ['Eventos y deportes náuticos', 1.1], ['Estacionamiento y servicios', 0.7]];
  var RAMPA = [0.14, 0.55, 0.86];
  D.flujo = function (l) {
    var pl = D.plan(l), c = Number(l.oferta.canon) || l.params.canonBase, N = l.params.plazoConcesion, rows = [], cum = 0, flows = [];
    for (var y = 1; y <= N; y++) {
      var f = y <= 3 ? RAMPA[y - 1] : 1, ing = 11.0e9 * f, gd = ing * 0.55, gf = 1.2e9, tasas = ing * 0.08;
      var canon = y === 1 ? 0 : y === 2 ? c * 6 : c * 12, ebitda = ing - gd - gf - tasas, inv = 0;
      pl.mes.forEach(function (x, i) { if (Math.ceil((i + 1) / 12) === y) inv += x; });
      var neto = ebitda - canon - inv; cum += neto; flows.push(neto);
      rows.push({ y: y, ing: ing, gd: gd, gf: gf, tasas: tasas, canon: canon, ebitda: ebitda, inv: inv, neto: neto, cum: cum });
    }
    function van(r) { return flows.reduce(function (s, x, i) { return s + x / Math.pow(1 + r, i + 1); }, 0); }
    var lo = -0.5, hi = 2, tir = null;
    if (van(lo) > 0 && van(hi) < 0) { for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (van(mid) > 0) lo = mid; else hi = mid; } tir = (lo + hi) / 2; }
    var pb = rows.filter(function (r) { return r.cum >= 0; })[0];
    return { rows: rows, tir: tir, van12: van(0.12), payback: pb ? pb.y : null, ingresosPorUnidad: UNIDADES };
  };

  /* ---------- graficos SVG (colores fijos: viven sobre papel blanco) ---------- */
  function sCurve(pl) {
    var W = 520, H = 200, L = 40, B = 28, T = 10, n = pl.T, bw = (W - L - 10) / n, mx = Math.max.apply(null, pl.mes), tot = pl.inv, s = '';
    s += '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - 6) + '" y2="' + (H - B) + '" stroke="#999"/>';
    [0, 25, 50, 75, 100].forEach(function (v) { var y = H - B - (H - B - T) * v / 100; s += '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#666">' + v + '%</text><line x1="' + L + '" x2="' + (W - 6) + '" y1="' + y + '" y2="' + y + '" stroke="#eee"/>'; });
    pl.mes.forEach(function (x, i) { var h = (H - B - T) * 0.5 * x / mx; s += '<rect x="' + (L + i * bw + 1) + '" y="' + (H - B - h) + '" width="' + (bw - 2) + '" height="' + h + '" fill="#b9cbe6"/>'; });
    var pts = pl.acum.map(function (a, i) { return (L + i * bw + bw / 2).toFixed(1) + ',' + (H - B - (H - B - T) * a / tot).toFixed(1); }).join(' ');
    s += '<polyline points="' + pts + '" fill="none" stroke="#1d3a63" stroke-width="2.5"/>';
    for (var m = 1; m <= n; m += (n > 24 ? 3 : 2)) s += '<text x="' + (L + (m - 1) * bw + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="#666">' + m + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Curva de inversión acumulada">' + s + '<text x="' + (W - 6) + '" y="' + (H - 1) + '" text-anchor="end" font-size="10" fill="#666">mes</text></svg>';
  }
  function cumChart(fl) {
    var W = 520, H = 190, L = 56, B = 26, T = 10, vals = fl.rows.map(function (r) { return r.cum; }), mn = Math.min(0, Math.min.apply(null, vals)), mx = Math.max.apply(null, vals), bw = (W - L - 8) / vals.length;
    function Y(v) { return T + (H - B - T) * (1 - (v - mn) / (mx - mn)); }
    var s = '<line x1="' + L + '" x2="' + (W - 6) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="#999"/>';
    [mn, 0, mx].forEach(function (v) { s += '<text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="10" fill="#666">' + (v / 1e9).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' mil M</text>'; });
    vals.forEach(function (v, i) { var y0 = Y(0), y1 = Y(v); s += '<rect x="' + (L + i * bw + 2) + '" y="' + Math.min(y0, y1) + '" width="' + (bw - 4) + '" height="' + Math.abs(y1 - y0) + '" fill="' + (v < 0 ? '#d9a39b' : '#8fc3a1') + '"/>'; if ((i + 1) % 2 === 0 || i === 0) s += '<text x="' + (L + i * bw + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="#666">' + (i + 1) + '</text>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Flujo acumulado por año">' + s + '<text x="' + (W - 6) + '" y="' + (H - 1) + '" text-anchor="end" font-size="10" fill="#666">año</text></svg>';
  }
  function gantt(pl) {
    var rows = [{ n: 'Habilitación ambiental (Ley 11.717)', a: 1, b: Math.max(2, Math.round(6 * pl.T / 28)) }].concat(pl.rubros.map(function (r) { return { n: r.n.split(':')[0].split('(')[0].trim(), a: r.a, b: r.b }; }), [{ n: 'Puesta en marcha y habilitaciones', a: Math.max(1, pl.T - 2), b: pl.T }]);
    var W = 540, L = 190, rh = 22, H = rows.length * rh + 30, bw = (W - L - 8) / pl.T, s = '';
    rows.forEach(function (r, i) {
      var y = 24 + i * rh;
      s += '<text x="' + (L - 8) + '" y="' + (y + 13) + '" text-anchor="end" font-size="10.5" fill="#333">' + esc(r.n.length > 34 ? r.n.slice(0, 33) + '…' : r.n) + '</text><rect x="' + (L + (r.a - 1) * bw) + '" y="' + (y + 3) + '" width="' + ((r.b - r.a + 1) * bw) + '" height="13" rx="2" fill="#1d3a63" opacity="' + (i === 0 || i === rows.length - 1 ? '.55' : '.9') + '"/>';
    });
    for (var m = 1; m <= pl.T; m += 3) s += '<text x="' + (L + (m - 1) * bw + bw / 2) + '" y="14" text-anchor="middle" font-size="10" fill="#666">' + m + '</text><line x1="' + (L + (m - 1) * bw) + '" x2="' + (L + (m - 1) * bw) + '" y1="18" y2="' + (H - 4) + '" stroke="#eee"/>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Cronograma de obras">' + s + '</svg>';
  }
  function layout(escala) {
    var s = '<rect width="560" height="360" fill="#f7f4ec"/>' +
      '<rect x="452" y="0" width="108" height="330" fill="#bcd6ee"/><text x="506" y="170" text-anchor="middle" font-size="12" fill="#2c5a9a" transform="rotate(90 506 170)">Río Paraná</text>' +
      '<rect x="0" y="322" width="452" height="38" fill="#bcd6ee"/><text x="340" y="345" text-anchor="middle" font-size="12" fill="#2c5a9a">Arroyo Saladillo</text>' +
      '<rect x="0" y="0" width="22" height="322" fill="#d9d4c6"/><text x="11" y="170" text-anchor="middle" font-size="10" fill="#666" transform="rotate(-90 11 170)">Calle Mangrullo</text>' +
      '<rect x="30" y="14" width="414" height="298" fill="#fff" stroke="#1d3a63" stroke-width="2" stroke-dasharray="6 3"/>' +
      '<rect x="270" y="22" width="166" height="92" fill="#cfe6d6"/><text x="353" y="62" text-anchor="middle" font-size="12" font-weight="600" fill="#2b6b45">Parque público</text><text x="353" y="78" text-anchor="middle" font-size="10" fill="#2b6b45">ribereño y paseo</text>' +
      '<rect x="120" y="22" width="140" height="92" fill="#f1dfc4"/><text x="190" y="62" text-anchor="middle" font-size="12" font-weight="600" fill="#8a5a1a">Gastronomía</text><text x="190" y="78" text-anchor="middle" font-size="10" fill="#8a5a1a">y servicios</text>' +
      '<rect x="38" y="22" width="72" height="92" fill="#e4e4e4"/><text x="74" y="62" text-anchor="middle" font-size="11" font-weight="600" fill="#555">Playa de</text><text x="74" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="#555">estaciona-</text><text x="74" y="90" text-anchor="middle" font-size="11" font-weight="600" fill="#555">miento</text>' +
      '<rect x="38" y="124" width="280" height="96" fill="#dbe6f5"/><text x="178" y="142" text-anchor="middle" font-size="12" font-weight="600" fill="#1d3a63">Guardería náutica</text>';
    for (var i = 0; i < 2; i++) for (var j = 0; j < 3; j++) s += '<rect x="' + (58 + i * 130 + j * 36) + '" y="154" width="30" height="54" fill="#8aa9d6" stroke="#1d3a63"/>';
    s += '<rect x="326" y="124" width="110" height="96" fill="#c9def2"/><text x="381" y="168" text-anchor="middle" font-size="11" font-weight="600" fill="#1d3a63">Rampas y</text><text x="381" y="182" text-anchor="middle" font-size="11" font-weight="600" fill="#1d3a63">caleta</text>' +
      '<rect x="38" y="230" width="398" height="74" fill="#e9dccb"/><text x="237" y="250" text-anchor="middle" font-size="12" font-weight="600" fill="#6b4a1e">Astillero y varadero</text>';
    for (var k = 0; k < 5; k++) s += '<rect x="' + (66 + k * 70) + '" y="262" width="52" height="30" fill="#c9b08a" stroke="#6b4a1e"/>';
    s += '<rect x="22" y="150" width="14" height="40" fill="#1d3a63"/><text x="29" y="206" text-anchor="middle" font-size="9" fill="#1d3a63">Acceso</text>' +
      '<rect x="30" y="336" width="100" height="4" fill="#333"/><text x="30" y="332" font-size="10" fill="#333">0</text><text x="130" y="332" text-anchor="end" font-size="10" fill="#333">50 m</text><text x="140" y="342" font-size="10" fill="#333">Escala ' + escala + '</text>' +
      '<g transform="translate(528 40)"><path d="M0 -22 L7 0 L0 -6 L-7 0Z" fill="#1d3a63"/><text y="14" text-anchor="middle" font-size="11" fill="#1d3a63">N</text></g>';
    return '<svg viewBox="0 0 560 360" width="100%" role="img" aria-label="Implantación del predio">' + s + '</svg>';
  }
  function corte() {
    return '<svg viewBox="0 0 560 150" width="100%" role="img" aria-label="Corte esquemático"><rect width="560" height="150" fill="#f7f4ec"/><rect x="0" y="110" width="560" height="40" fill="#bcd6ee"/>' +
      '<path d="M0 100 L380 100 L430 118 L560 118" stroke="#6b4a1e" stroke-width="3" fill="none"/><rect x="30" y="52" width="110" height="48" fill="#dbe6f5" stroke="#1d3a63"/><rect x="38" y="60" width="94" height="14" fill="#8aa9d6"/><rect x="38" y="78" width="94" height="14" fill="#8aa9d6"/>' +
      '<rect x="190" y="68" width="90" height="32" fill="#f1dfc4" stroke="#8a5a1a"/><rect x="310" y="84" width="48" height="16" fill="#cfe6d6" stroke="#2b6b45"/><path d="M380 100 L430 118" stroke="#1d3a63" stroke-width="5"/>' +
      '<text x="85" y="44" text-anchor="middle" font-size="10" fill="#333">Racks (3 niveles)</text><text x="235" y="60" text-anchor="middle" font-size="10" fill="#333">Gastronomía</text><text x="334" y="78" text-anchor="middle" font-size="10" fill="#333">Paseo</text><text x="440" y="108" font-size="10" fill="#333">Rampa</text><text x="480" y="140" font-size="10" fill="#2c5a9a">Río Paraná</text></svg>';
  }
  function organigrama() {
    function box(x, y, w, t, sub, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="44" rx="6" fill="' + (fill || '#fff') + '" stroke="#1d3a63"/><text x="' + (x + w / 2) + '" y="' + (y + 19) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#1d3a63">' + t + '</text><text x="' + (x + w / 2) + '" y="' + (y + 34) + '" text-anchor="middle" font-size="10" fill="#555">' + sub + '</text>'; }
    function ln(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#1d3a63"/>'; }
    var s = box(200, 6, 160, 'Directorio', '3 miembros', '#dbe6f5') + ln(280, 50, 280, 66) + box(200, 66, 160, 'Gerencia general', '1 gerente + 2 staff', '#dbe6f5') + ln(280, 110, 280, 128) + ln(70, 128, 490, 128);
    [[10, 'Operaciones', '38 personas'], [150, 'Comercial', '9 personas'], [290, 'Administración', '8 personas'], [430, 'Ambiente y seguridad', '6 personas']].forEach(function (g) { s += ln(g[0] + 60, 128, g[0] + 60, 146) + box(g[0], 146, 120, g[1], g[2]); });
    [[10, 'Guardería náutica', '14'], [10, 'Astillero y varadero', '12'], [10, 'Mantenimiento', '7'], [10, 'Seguridad y accesos', '5']].forEach(function (g, i) { s += '<rect x="' + (g[0] + 8) + '" y="' + (204 + i * 22) + '" width="164" height="18" fill="#f3f6fb" stroke="#b9cbe6"/><text x="' + (g[0] + 14) + '" y="' + (217 + i * 22) + '" font-size="10" fill="#333">' + g[1] + ' · ' + g[2] + '</text>'; });
    return '<svg viewBox="0 0 560 300" width="100%" role="img" aria-label="Organigrama">' + s + '</svg>';
  }

  /* ---------- documentos ---------- */
  var ESCANEOS = {
    d: function (e) { return scan('Estatuto social y actas de designación', 'Copia certificada y legalizada', [['Razón social', e.razon], ['Constitución', 'Escritura N° 214 del 12/03/2014, Rosario (ficticia)'], ['Objeto social', 'Construcción, administración, operación y explotación comercial de marinas, guarderías náuticas, astilleros y predios portuarios'], ['Duración', '99 años'], ['Autoridades vigentes', e.directores + ' · Presidente: ' + e.representante], ['Certificación', 'Escribano público, legalizada por el Colegio de Escribanos']]); },
    f3: function (e) { return scan('Constancia de inscripción — ARCA', 'Constancia de CUIT', [['Contribuyente', e.razon], ['CUIT', e.cuit], ['Actividad principal', 'Servicios de explotación de marinas, guarderías náuticas y puertos'], ['Estado', 'Activo'], ['Condición frente al IVA', 'Responsable inscripto']]); },
    f4: function (e) { return scan('Constancia de inscripción — Ingresos Brutos', 'Administración Provincial de Impuestos', [['Contribuyente', e.razon], ['N° de inscripción', '000-000000-0'], ['Régimen', 'Local'], ['Situación', 'Regular, sin deuda exigible']]); },
    f6: function (e) { return scan('Inexistencia de deuda previsional', 'Constancia de autoridad nacional', [['Empleador', e.razon], ['CUIT', e.cuit], ['Resultado', 'No registra deuda previsional exigible'], ['Personal en nómina', '27 trabajadores']]); },
    f7: function (e) { return scan('Certificado de inexistencia de concursos y quiebras', 'Registro de procesos universales', [['Consultado', e.razon + ' (CUIT ' + e.cuit + ')'], ['Resultado', 'No registra procesos concursales ni quiebras']]); },
    h: function (e) { return scan('Certificados nacionales de antecedentes penales', 'Registro Nacional de Reincidencia', [['Personas consultadas', '3 directores titulares y 2 beneficiarios finales'], ['Resultado', 'Sin antecedentes penales, en los 5 casos']]); },
    m1a: function (e) {
      return scan('Balances y estados de resultados 2024 y 2025', 'Certificados por contador y legalizados por el CPCE', [['Sociedad', e.razon], ['Ejercicio 2025', 'Activo $ 11.200 M · Pasivo $ 6.000 M · Patrimonio neto $ 5.200 M'], ['Ejercicio 2024', 'Activo $ 9.100 M · Pasivo $ 5.200 M · Patrimonio neto $ 3.900 M'], ['Ventas', '2025: $ 9.000 M · 2024: $ 7.400 M'], ['Resultado del ejercicio 2025', 'Ganancia de $ 640 M'], ['Certificación', 'Contador público · legalizado por el Consejo Profesional de Ciencias Económicas']]);
    },
    m2: function () { return null; }
  };

  D.doc = function (l, r) {
    if (D.TD[Store.T(l).oferta]) return D.TD[Store.T(l).oferta].doc(l, r);
    var e = Store.empresaDe(l), pl = D.plan(l), fl = D.flujo(l), o = l.oferta, par = l.params, c = Store.canon(l);
    if (r.estado !== 'listo' && r.estado !== 'en-curso') return '<div class="banner" style="margin:10px 0"><span>!</span><span>Este documento todavía no está armado.</span></div>';
    if (r.tpl) return Plantillas.render(r.tpl, e, l);
    if (r.origen === 'anexo2') return Plantillas.anexo2(e, l);
    if (r.origen === 'biblioteca' && ESCANEOS[r.id] && ESCANEOS[r.id](e)) return ESCANEOS[r.id](e);

    switch (r.id) {
      case 'm2':
        return paper('Antecedentes técnico-operativos', p('Se presentan tres antecedentes de operación de instalaciones de naturaleza comparable. Cada uno indica los siete datos que pide el Art. II.5.1 m.2).') +
          tbl(['Dato', 'Marina Delta Norte', 'Astillero Paraná Medio', 'Costanera Norte'], [
            ['Proyecto y ubicación', 'Guardería náutica y marina, Delta del Paraná', 'Astillero y varadero, ribera del Paraná medio', 'Paseo costero con gastronomía'],
            ['Período', '2016 – vigente', '2012 – 2022', '2019 – vigente'],
            ['Rol', 'Concesionario y operador', 'Operador y contratista principal', 'Concesionario'],
            ['Alcance', 'Guarda, mantenimiento y movimiento de embarcaciones; gastronomía', 'Reparación y mantenimiento de embarcaciones comerciales', 'Operación y mantenimiento de 4 ha de espacio público'],
            ['Indicadores', '3.200 m² cubiertos · 120 posiciones en racks', 'Varadero de 80 t · 9.000 m² · 45 buques/año', '4 ha · 380.000 visitantes/año'],
            ['Comitente', 'Ente portuario de ejemplo · contacto: 000-0000', 'Empresa naviera de ejemplo · contacto: 000-0001', 'Municipalidad de Ciudad Ejemplo · contacto: 000-0002'],
            ['Respaldo', 'Contrato y certificado de buena ejecución', 'Órdenes de trabajo y certificados de recepción', 'Contrato de concesión y actas de inspección']]) +
          p('<i>Todos los antecedentes, nombres y cifras son ficticios.</i>'));
      case 'k':
        return paper('Detalle de seguros a contratar', p('Si resulta adjudicatario, ' + esc(e.razon) + ' contratará las siguientes coberturas con compañías habilitadas por la Superintendencia de Seguros de la Nación (Art. IV.13).') +
          tbl(['Cobertura', 'Aseguradora posible', 'Riesgo cubierto'], [['Responsabilidad civil', 'Aseguradora Ejemplo S.A. / Seguros del Litoral de Ejemplo S.A.', 'Daños a terceros y a bienes del ENAPRO'], ['Incendio', 'Aseguradora Ejemplo S.A.', 'Edificios, instalaciones y equipamiento'], ['Accidentes de trabajo y fallecimiento', 'ART de Ejemplo S.A.', 'Personal propio y contratistas'], ['Todo riesgo construcción', 'Seguros del Litoral de Ejemplo S.A.', 'Obras del plan de inversiones']]) + p('<i>Las sumas aseguradas se fijan según el Art. IV.13 al firmar el contrato.</i>'));
      case 'n1':
        return scan('Certificado de visita al predio Mangrullo', 'Emitido por el ENAPRO', [['N° de certificado', e.visitaNro], ['Visitante', e.razon + ' · ' + e.representante], ['Fecha de la visita', UI.date(l.fechas.visita)], ['Coordinada con', 'Gerencia de Infraestructura y Desarrollo Portuario'], ['Constancia', 'Se realizó la visita técnica obligatoria al predio']]);
      case 'o':
        return scan('Póliza de seguro de caución — garantía de mantenimiento de oferta', 'Certificada por escribano público', [['Tomador', e.razon], ['Asegurado', 'Ente Administrador Puerto Rosario'], ['Suma asegurada', money(par.garantiaOferta)], ['Forma', o.forma], ['Vigencia hasta', UI.date(o.garantiaVence || Store.garantiaVenceMin(l))], ['Aseguradora', 'Aseguradora Ejemplo S.A. (habilitada por la SSN)']]);
      case 'm1b': {
        var q = [['Trimestre', 'Cobranzas', 'Pagos', 'Saldo del trimestre', 'Saldo acumulado']], acc = 0, rows = [];
        var cob = [2.1, 2.4, 2.6, 2.9, 2.8, 3.1, 3.3, 3.5], pag = [1.9, 2.0, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8];
        cob.forEach(function (x, i) { var s = x - pag[i]; acc += s; rows.push(['T' + (i + 1), '$ ' + x.toLocaleString('es-AR', { minimumFractionDigits: 1 }) + ' mil M', '$ ' + pag[i].toLocaleString('es-AR', { minimumFractionDigits: 1 }) + ' mil M', '$ ' + s.toLocaleString('es-AR', { minimumFractionDigits: 1 }) + ' mil M', '$ ' + acc.toLocaleString('es-AR', { minimumFractionDigits: 1 }) + ' mil M']); });
        return paper('Flujo de fondos proyectado del oferente — 2 años', p('Informe especial con apertura mensual (resumido por trimestre), certificado por contador público y legalizado por el CPCE. Pautas: ventas con crecimiento del 8 % anual, cobranzas a 30 días, sin nuevos endeudamientos.') + tbl(q[0], rows, [1, 2, 3, 4]));
      }
      case 'm1c':
        return paper('Patrimonio neto, facturación y fuentes de financiación', h3('Patrimonio y facturación') +
          tbl(['Concepto', 'Importe'], [['Patrimonio neto al cierre del último ejercicio', money(l.fin.pn)], ['Facturación 2023', '$ 6.100.000.000'], ['Facturación 2024', '$ 7.400.000.000'], ['Facturación 2025', '$ 9.000.000.000']], [1]) +
          h3('Fuentes de financiación de la inversión') + tbl(['Fuente', '%', 'Importe', 'Compromiso'], [['Aportes de capital de los socios', '30 %', money(o.inversion * 0.3), 'Acta de compromiso de los socios'], ['Crédito bancario', '45 %', money(o.inversion * 0.45), 'Carta de intención de entidad financiera (ficticia)'], ['Fondos propios generados', '25 %', money(o.inversion * 0.25), 'Certificación contable'], { total: ['Total', '100 %', money(o.inversion), ''] }], [1, 2]));
      case 'm1d': {
        var ra = Store.ratios(l), f = l.fin, n2 = function (x) { return x.toFixed(2).replace('.', ','); };
        return paper('Indicadores económico-financieros del último ejercicio', p('Certificados por contador público y legalizados por el Consejo Profesional de Ciencias Económicas.') +
          tbl(['Indicador', 'Cálculo', 'Valor', 'Exigido', 'Resultado'], [['Liquidez corriente', 'AC ' + mm(f.ac) + ' M / PC ' + mm(f.pc) + ' M', n2(ra.liquidez), '> 1', ra.liquidez > 1 ? 'Cumple' : 'No cumple'], ['Endeudamiento', 'PT ' + mm(f.pt) + ' M / PN ' + mm(f.pn) + ' M', n2(ra.endeudamiento), '< 1,50', ra.endeudamiento < 1.5 ? 'Cumple' : 'No cumple'], ['Margen operativo', 'MB ' + mm(f.mb) + ' M / IO ' + mm(f.io) + ' M', pct(ra.margen), '> 0', ra.margen > 0 ? 'Cumple' : 'No cumple']], [2]));
      }
      case 't1':
        return paper('Visión estratégica del negocio', p('<b>Mangrullo como puerto de servicios náuticos y paseo público.</b> ' + esc(e.razon) + ' propone convertir el predio de 5,3 hectáreas en un polo náutico, de reparaciones navales y de uso público que acompañe el desarrollo del Puerto de Rosario y reconecte la ciudad con su ribera.') +
          p('Tres ideas ordenan la propuesta:') + ul(['<b>Servicios a embarcaciones comerciales y deportivas,</b> con astillero, varadero y guardería náutica en altura sobre la base existente.', '<b>Espacio público abierto,</b> con paseo ribereño, gastronomía y deportes náuticos, accesible fuera del área operativa.', '<b>Operación sustentable,</b> con energía solar en cubiertas, submedición de consumos y tratamiento de efluentes de zonas náuticas.']) +
          p('Articula con las unidades que hoy opera el grupo: la marina del Delta aporta la gestión de guardería y la operación de racks; el astillero del Paraná medio aporta la gestión de varadero y mantenimiento naval.'));
      case 't2':
        return paper('Plan operativo', p('Modelo de funcionamiento integral durante los ' + par.plazoConcesion + ' años de concesión, con tres áreas operativas y un área de acceso público.') + layout('1:500 (esquema)') +
          tbl(['Sector', 'Superficie aprox.', 'Operación'], [['Astillero y varadero', '1,0 ha', 'Reparación y mantenimiento de embarcaciones comerciales; varadero de 120 t; talleres'], ['Guardería náutica', '1,9 ha', '2 racks existentes repotenciados y 1 nuevo; rampas; ascensor náutico'], ['Parque público y gastronomía', '1,6 ha', 'Paseo ribereño, locales gastronómicos, deportes náuticos'], ['Estacionamiento y accesos', '0,8 ha', 'Separación de circulación peatonal y vehicular; control de accesos']], [1]) +
          p('<b>Tecnología y servicios.</b> Gestión de reservas y facturación en línea, control de accesos con lectura de patentes, submedición eléctrica por sector, cámaras perimetrales. <b>Mantenimiento y ambiente.</b> Plan de mantenimiento preventivo anual, separadores de hidrocarburos, tratamiento del primer lavado y gestión de residuos.'));
      case 't3':
        return paper('Memoria descriptiva del proyecto y plan de desarrollo y mejoras', h3('Criterios de implantación') + p('El proyecto organiza el predio en franjas paralelas al río: uso público al norte y este, guardería en el centro y astillero sobre el arroyo Saladillo. Los usos públicos y los operativos tienen accesos separados.') +
          h3('Solución urbanística y arquitectónica') + p('Edificios de baja altura (máx. dos plantas), estructura metálica y hormigón, cubiertas aptas para paneles solares y materiales de baja exigencia de mantenimiento, adecuados al ambiente portuario.') +
          h3('Solución operativa') + p('Circulaciones vehiculares perimetrales, zona de maniobras para tráileres de embarcaciones y circuito peatonal continuo hasta la caleta.') +
          h3('Solución ambiental') + p('Habilitación ambiental según Ley provincial 11.717, línea de base y plan de gestión ambiental de obra, separación de efluentes y generación fotovoltaica.') +
          h3('Plan de desarrollo y mejoras') + ul(D.plan(l).rubros.map(function (x) { return esc(x.n) + ': ' + money(x.monto) + ' (meses ' + x.a + '–' + x.b + ').'; })) + p('<i>Nivel de detalle propio de la oferta, sin llegar a proyecto ejecutivo.</i>'));
      case 't4':
        return paper('Planos y maqueta', h3('Propuesta de conjunto · Escala 1:500') + layout('1:500') + h3('Edificios (plantas) · Escala 1:200 y 1:100') + p('Plantas de administración, gastronomía y talleres, y planta del rack tipo con 3 columnas de 6 cunas (ver láminas 2 a 6).') +
          h3('Cortes y vistas · Escala 1:100') + corte() + h3('Maqueta del conjunto · 1:500') + p('Maqueta electrónica navegable (archivo adjunto en el medio digital) y registro fotográfico de la maqueta física.'));
      case 't5': {
        var g = D.plan(l);
        return paper('Cronograma general de obras e inversiones', p('Plazo total: ' + g.T + ' meses desde la Fecha de Entrega de Tenencia (máximo ' + par.plazoObraMax + ').') + gantt(g) +
          h3('Hitos verificables') + tbl(['Mes', 'Hito', 'Inversión acumulada'], [[6, 'Proyectos ejecutivos aprobados y habilitación ambiental', pct(g.acum[Math.min(5, g.T - 1)] / g.inv, 0)], [12, 'Servicios básicos operativos', pct(g.acum[Math.min(11, g.T - 1)] / g.inv, 0)], [18, 'Protección de márgenes y guardería habilitadas', pct(g.acum[Math.min(17, g.T - 1)] / g.inv, 0)], [24, 'Astillero y edificios terminados', pct(g.acum[Math.min(23, g.T - 1)] / g.inv, 0)], [g.T, 'Puesta en marcha total', '100 %']], [2]));
      }
      case 't6':
        return paper('Plan de recursos humanos', p('Estructura propuesta para la operación del predio: <b>61 personas</b> en régimen pleno.') + organigrama() + p('<i>Dotación estimada: Operaciones 38 (guardería 14, astillero 12, mantenimiento 7, seguridad 5), Comercial 9, Administración y finanzas 8, Ambiente y seguridad 6.</i>'));
      case 't7':
        return paper('Adecuación al Anexo III: infraestructura mínima y criterios ambientales', tbl(['Capítulo', 'Cómo se cumple'], [
          ['III.4.1 Energía eléctrica', 'Proyecto según AEA y normas de la EPE; tableros, puesta a tierra, emergencia; submedición por sector; generación solar en cubiertas'],
          ['III.4.2 Agua', 'Conexión a red existente con tanque de reserva y permiso de uso de agua'],
          ['III.4.3 Desagües', 'Pluviales y cloacales; separadores de hidrocarburos y tratamiento del primer lavado en zonas náuticas'],
          ['III.4.4–III.4.6 Iluminación, circulaciones y cerramiento', 'Iluminación LED con control; pavimentos de hormigón; cerramiento perimetral y control de accesos'],
          ['III.4.7–III.4.9 Edificaciones, materialidad e instalaciones', 'Edificios permanentes de bajo mantenimiento; sin soluciones precarias'],
          ['III.4.10–III.4.11 Infraestructura náutica y márgenes', 'Rampas, ascensor náutico, racks; defensa y estabilización del frente ribereño'],
          ['III.4.12–III.4.14 Parque público, señalización y conservación', 'Parque ribereño de acceso libre; señalética bilingüe; plan de conservación'],
          ['III.5 Documentación técnica', 'Documentación de oferta incluida; proyectos ejecutivos a presentar si resulta adjudicatario'],
          ['III.6 Gestión ambiental', 'Categorización y licencia ambiental (Ley 11.717), EIA, plan de gestión de obra, residuos y monitoreo']]));
      case 'e1': {
        var pi = D.plan(l), tot = pi.inv;
        return paper('Plan de inversiones', p('Expresado en pesos a valores del mes de apertura, neto de IVA. Monto total: <b>' + money(tot) + '</b> en <b>' + pi.T + ' meses</b> (mínimo ' + money(par.inversionMin) + ' en ' + par.plazoObraMax + ').') +
          tbl(['Rubro', 'Monto', '% del total', 'Meses'], pi.rubros.map(function (r) { return [esc(r.n), money(r.monto), pct(r.monto / tot), r.a + '–' + r.b]; }).concat([{ total: ['Total', money(tot), '100 %', '1–' + pi.T] }]), [1, 2]) +
          h3('Avance mensual y acumulado') + sCurve(pi) + h3('Hitos porcentuales') +
          tbl(['Mes', 'Inversión del mes', 'Acumulado', '% acumulado'], [6, 12, 18, 24, pi.T].filter(function (m, i, a) { return a.indexOf(m) === i && m <= pi.T; }).map(function (m) { return [m, money(pi.mes[m - 1]), money(pi.acum[m - 1]), pct(pi.acum[m - 1] / tot, 0)]; }), [1, 2, 3]) +
          p('<b>Financiamiento:</b> 30 % aportes de capital, 45 % crédito bancario y 25 % fondos propios (ver compromisos en la carpeta Antecedentes).'));
      }
      case 'e2': {
        var yrs = [1, 2, 3, 5, 10, 20].filter(function (y) { return y <= par.plazoConcesion; });
        return paper('Proyecciones financieras', p('Pesos constantes a valores del mes de apertura, sin efecto inflacionario.') + h3('Ingresos por unidad de negocio (régimen pleno)') +
          tbl(['Unidad', 'Ingreso anual', '%'], fl.ingresosPorUnidad.map(function (u) { return [u[0], money(u[1] * 1e9), pct(u[1] / 11)]; }).concat([{ total: ['Total', money(11e9), '100 %'] }]), [1, 2]) +
          h3('Proyección resumida') + tbl(['Año', 'Ingresos', 'Gastos directos', 'Gastos fijos', 'Tasas', 'Canon'], yrs.map(function (y) { var r = fl.rows[y - 1]; return [y, mm(r.ing), mm(r.gd), mm(r.gf), mm(r.tasas), mm(r.canon)]; }), [1, 2, 3, 4, 5]) +
          p('<span style="font-size:12.5px;color:#666">Cifras en millones de pesos. Gastos directos: 55 % de los ingresos. Tasas e impuestos: 8 %. Depreciación lineal a 20 años de la inversión (' + mm(o.inversion / 20) + ' M por año). Canon con bonificación del Art. IV.4 c) y actualización por CER.</span>'));
      }
      case 'e3':
        return paper('Flujo de fondos de la concesión', p('Refleja la bonificación del canon (100 % meses 1–12, 50 % meses 13–24) y el cronograma de inversión (' + D.plan(l).T + ' meses). Cifras en millones de pesos constantes.') +
          tbl(['Año', 'Ingresos', 'Gastos op.', 'Canon', 'Inversión', 'Flujo neto', 'Acumulado'], fl.rows.map(function (r) { return [r.y, mm(r.ing), mm(r.gd + r.gf + r.tasas), mm(r.canon), mm(r.inv), mm(r.neto), mm(r.cum)]; }), [1, 2, 3, 4, 5, 6]) + cumChart(fl) +
          p('<b>Rentabilidad estimada:</b> TIR ' + (fl.tir == null ? 'no definida' : pct(fl.tir)) + ' · recupero de la inversión en el año ' + (fl.payback || '—') + ' · VAN al 12 %: ' + money(fl.van12) + '.'));
      default:
        return paper(r.titulo, p(esc(r.detalle)) + p('<i>Documento de ejemplo con datos ficticios.</i>'));
    }
  };

  /* ---------- simulacion paso a paso ---------- */
  var VERBOS = { plantilla: 'Redactado', biblioteca: 'Adjuntado de la biblioteca', externo: 'Elaborado', oferta: 'Completado en Oferta', indicadores: 'Calculados con el último balance', anexo2: 'Formulario completado' };
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) + '.pdf'; }

  D.pasos = function (l) {
    var rs = [], pasos = [];
    Store.T(l).orden.forEach(function (c) { rs = rs.concat(Store.reqs(l).filter(function (r) { return r.carpeta === c; })); });
    rs.forEach(function (r) {
      pasos.push({ c: r.carpeta, txt: VERBOS[r.origen] + ': ' + r.titulo + ' · ' + r.folios + ' fol.', run: function () {
        r.estado = 'listo';
        if (r.origen === 'biblioteca' && !r.docId) { var propios = Store.docsDeEmpresa(Store.empresaDe(l).id), d = propios.filter(function (x) { return x.id === r.docPref; })[0] || propios.filter(function (x) { return x.tipo === r.docTipo; })[0]; if (d) r.docId = d.id; }
        if (r.origen === 'externo' && !r.archivo) r.archivo = slug(r.titulo);
      } });
    });
    pasos.push({ txt: 'Renovando certificados que vencen antes de la apertura', run: function () {
      Store.get().biblioteca.forEach(function (d) { if (d.vence && d.vence < l.fechas.apertura) d.vence = Store.addDaysTo(l.fechas.apertura, 45); });
    } });
    if (D.TD[Store.T(l).oferta]) return pasos.concat(D.TD[Store.T(l).oferta].pasosExtra(l));
    pasos.push({ txt: 'Constituyendo la garantía de oferta con vigencia hasta ' + UI.date(Store.addDaysTo(Store.garantiaVenceMin(l), 15)), run: function () {
      l.oferta.garantiaConstituida = true; l.oferta.garantiaVence = Store.addDaysTo(Store.garantiaVenceMin(l), 15);
    } });
    pasos.push({ txt: 'Foliando el sobre único: ' + Store.folios(l).total + ' hojas en 3 carpetas', run: function () {} });
    pasos.push({ txt: 'Verificando controles del pliego', run: function () {} });
    return pasos;
  };

  /* recorrido de las etapas 3 a 6 con hechos ficticios; las fechas futuras son simuladas */
  D.pasosRecorrido = function (l) {
    if (D.TD[Store.T(l).oferta]) return D.TD[Store.T(l).oferta].recorrido(l);
    var s = Store.seg(l), f = l.fechas, p = l.params, hab = Store.addBusinessDays, fo = Store.folios(l).total, pasos = [];
    function T() { for (var i = 0; i < arguments.length; i++) s.tareas[arguments[i]] = true; }
    function add(c, txt, run) { pasos.push({ c: c, txt: txt, run: run }); }
    var E3 = 'Etapa 3 · Presentación de ofertas', E4 = 'Etapa 4 · Apertura y evaluación', E5 = 'Etapa 5 · Adjudicación y contratación', E6 = 'Etapa 6 · Ejecución y cierre';
    add(E3, 'Sobre único entregado en las oficinas del ENAPRO: ' + fo + ' folios, original y copia', function () { Store.setEtapa(l, 4); T('t2a', 't2b', 't2c', 't2d'); s.circulares = [{ n: 1, fecha: Store.addBusinessDays(f.apertura, -6), resumen: 'Aclara el horario de recepción de sobres (ficticia).' }]; });
    add(E4, 'Acto de apertura: se recibieron 4 ofertas y la tuya es la N° 3, con ' + fo + ' hojas (acta notarial)', function () { s.apertura = { nro: 3, oferentes: 4, orden: 0 }; T('t4a'); });
    add(E4, 'Garantía original entregada en Asuntos Legales dentro de las 24 h', function () { T('t4b'); });
    add(E4, 'La Comisión pide una aclaración y se responde dentro de las 48 h', function () { T('t4c'); });
    add(E4, 'La Comisión invita a mejorar el canon: de ' + money(l.oferta.canon) + ' a ' + money(58000000) + ' (no baja del piso ni del canon original)', function () { s.canonOriginal = l.oferta.canon; l.oferta.canon = 58000000; s.mejora = 58000000; T('t4d'); });
    add(E4, 'Dictamen de la Comisión: tu oferta queda primera en el orden de mérito', function () { s.apertura.orden = 1; T('t4g'); });
    add(E5, 'El Consejo Directivo adjudica y notifica el ' + UI.date(hab(f.apertura, 25)) + ' (fecha simulada)', function () { s.adjudicacion = hab(f.apertura, 25); Store.setEtapa(l, 5); T('t5a'); });
    add(E5, 'Garantías constituidas en 5 días hábiles: cumplimiento ' + money(58000000 * 12) + ' (12 cánones, con el canon mejorado) y ejecución ' + money(p.garantiaEjec), function () { T('t5c', 't5d'); });
    add(E5, 'Concesionario formalizado y modelos de pólizas presentados', function () { T('t5e', 't5f'); });
    add(E5, 'Contrato de concesión firmado el ' + UI.date(hab(f.apertura, 45)), function () { T('t5g', 't5h'); });
    add(E6, 'Acta de entrega de tenencia el ' + UI.date(hab(f.apertura, 55)) + ': empiezan a correr los 20 años, la bonificación y los 30 meses de obra', function () { s.tenencia = hab(f.apertura, 55); Store.setEtapa(l, 6); });
    add(E6, 'Seguros vigentes y primer canon: bonificado al 100 % los primeros 12 meses', function () { T('t6c', 't6b'); });
    add(E6, 'Primer certificado de obra: ' + money(410000000) + ' (4 % de la inversión mínima)', function () { s.invertido = 410000000; });
    return pasos;
  };

  /* ---------- paquete final: todos los documentos en orden, con folios ---------- */
  D.paqueteCompleto = function (l) {
    var fo = Store.folios(l), e = Store.empresaDe(l), listos = Store.progress(l);
    var cuerpo = Store.T(l).orden.map(function (c) {
      return '<div class="pkg-sep"><span>Carpeta · ' + esc(UI.carpeta[c]) + '</span></div>' + Store.reqs(l).filter(function (r) { return r.carpeta === c; }).map(function (r) {
        var f = fo.byReq[r.id];
        return '<section class="pkg-doc" id="doc-' + r.id + '"><div class="pkg-h"><span class="mono">fol. ' + f.from + '–' + f.to + '</span><span>' + esc(r.titulo) + '</span>' + UI.pill(UI.estadoReq[r.estado][0], UI.estadoReq[r.estado][1]) + '</div>' + D.doc(l, r) + '</section>';
      }).join('');
    }).join('');
    return '<div class="pkg">' + cuerpo + '</div>';
  };
})();
