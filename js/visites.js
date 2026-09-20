// Visites du site (page d'administration) — données anonymes
(function () {
  const { api, esc, getToken } = HE;
  if (!getToken()) { location.replace('admin.html'); return; }
  const $ = (s) => document.querySelector(s);

  const place = (v) => {
    const city = v.timezone ? v.timezone.split('/').pop().replace(/_/g, ' ') : '';
    return [city, v.country].filter(Boolean).join(', ') || '—';
  };

  async function load() {
    try {
      const { stats, visits } = await api('/api/visits', { auth: true });
      $('#stats').innerHTML = `
        <div class="stat"><b>${stats.visitorsToday}</b><span>visiteurs aujourd'hui</span></div>
        <div class="stat"><b>${stats.viewsToday}</b><span>pages vues aujourd'hui</span></div>
        <div class="stat"><b>${stats.total}</b><span>pages vues conservées</span></div>`;
      $('#days').innerHTML = stats.perDay.length
        ? stats.perDay.map((d) => `<tr><td>${esc(d._id)}</td><td>${d.visiteurs}</td><td>${d.pages}</td></tr>`).join('')
        : '<tr><td colspan="3">Pas encore de données.</td></tr>';
      $('#top').innerHTML = stats.topPages.map((p) => `<tr><td>${esc(p._id)}</td><td>${p.n}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';
      $('#devices').innerHTML = stats.byDevice.map((d) => `<tr><td>${esc(d._id || 'inconnu')}</td><td>${d.n}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';
      $('#rows').innerHTML = visits.length
        ? visits.map((v) => `<tr><td>${new Date(v.createdAt).toLocaleString('fr-FR')}</td><td>${esc(v.page)}</td><td>${esc(v.referrer || 'accès direct')}</td><td>${esc(v.device)} · ${esc(v.browser)}</td><td>${esc(v.lang)}</td><td>${esc(place(v))}</td></tr>`).join('')
        : '<tr><td colspan="6">Aucune visite enregistrée pour l\'instant.</td></tr>';
    } catch (err) {
      if (err.status === 401) return location.replace('admin.html');
      $('#rows').innerHTML = `<tr><td colspan="6">${esc(err.message)}</td></tr>`;
    }
  }
  $('#refresh').addEventListener('click', load);
  load();
})();
