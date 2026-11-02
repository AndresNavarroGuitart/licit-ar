/* Helpers de interfaz: formato, escape, toast, modal y panel lateral de fuente. */
(function () {
  var UI = window.UI = {};

  UI.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  UI.money = function (n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); };
  UI.date = function (iso) { return iso ? iso.split('-').reverse().join('/') : '—'; };
  UI.dateLong = function (iso) {
    if (!iso) return '—';
    return new Date(iso + 'T12:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
  };

  UI.countdown = function (iso) {
    var n = Store.daysLeft(iso);
    if (n < 0) return 'Venció hace ' + (-n) + ' d';
    if (n === 0) return 'Hoy';
    if (n === 1) return 'Mañana';
    return 'Faltan ' + n + ' días';
  };
  UI.urgency = function (iso) {
    var n = Store.daysLeft(iso);
    return n < 0 ? 'past' : n <= 3 ? 'bad' : n <= 10 ? 'warn' : 'ok';
  };

  UI.estadoLic = { preparacion: ['En preparación', 'info'], presentada: ['Presentada', 'ok'], analisis: ['Por analizar', 'muted'], adjudicacion: ['Adjudicada', 'ok'], ejecucion: ['En ejecución', 'ok'] };
  UI.estadoReq = { pendiente: ['Pendiente', 'muted'], 'en-curso': ['En curso', 'warn'], listo: ['Listo', 'ok'] };
  UI.origen = { biblioteca: 'Biblioteca', plantilla: 'Borrador del sistema', externo: 'Archivo a subir', oferta: 'Se completa en Oferta', indicadores: 'Se completa en Oferta', anexo2: 'Formulario con tus precios' };
  UI.carpeta = { A: 'Antecedentes', T: 'Oferta técnica', E: 'Oferta económica' };
  UI.mon = function (n, m) { return Store.mon(n, m); };
  UI.tipoDoc = {
    poder: 'Legal', fabricante: 'Técnico', folleteria: 'Técnico',
    estatuto: 'Societario', arca: 'Fiscal', iibb: 'Fiscal', previsional: 'Previsional', concursos: 'Judicial', penales: 'Judicial',
    balance: 'Contable', antecedentes: 'Antecedente'
  };

  UI.pill = function (text, tone) { return '<span class="pill ' + tone + '">' + UI.esc(text) + '</span>'; };

  UI.ring = function (pct, size) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg class="ring" width="' + (size || 64) + '" height="' + (size || 64) + '" viewBox="0 0 64 64" role="img" aria-label="' + pct + ' % listo">' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="6"/>' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--primary)" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 32 32)"/>' +
      '<text x="32" y="37" text-anchor="middle" class="ring-t">' + pct + '%</text></svg>';
  };

  var toastTimer;
  UI.toast = function (msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  UI.modal = function (html, wide) {
    var o = document.getElementById('overlay');
    o.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true"><button class="x" data-act="close" aria-label="Cerrar">×</button>' + html + '</div>';
    o.className = 'open';
  };
  UI.drawer = function (html) {
    var o = document.getElementById('overlay');
    o.innerHTML = '<aside class="drawer" role="dialog" aria-modal="true"><button class="x" data-act="close" aria-label="Cerrar">×</button>' + html + '</aside>';
    o.className = 'open right';
  };
  UI.close = function () { var o = document.getElementById('overlay'); o.className = ''; o.innerHTML = ''; };
})();
