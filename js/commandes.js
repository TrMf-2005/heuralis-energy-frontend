// Liste des commandes (page d'administration)
(function () {
  const { api, esc, fcfa, getToken } = HE;
  if (!getToken()) { location.replace('admin.html'); return; }
  const $ = (s) => document.querySelector(s);
  const LABELS = { en_cours: 'En cours', effectuee: 'Effectuée', annulee: 'Annulée' };
  let orders = [];
  let filter = '';

  function fail(err) {
    if (err.status === 401) { location.replace('admin.html'); return; }
    $('#rows').innerHTML = `<tr><td colspan="6">${esc(err.message)}</td></tr>`;
  }

  function render() {
    const count = (s) => orders.filter((o) => o.statut === s).length;
    $('#filters').innerHTML = [['', `Toutes (${orders.length})`], ['en_cours', `En cours (${count('en_cours')})`], ['effectuee', `Effectuées (${count('effectuee')})`], ['annulee', `Annulées (${count('annulee')})`]]
      .map(([v, l]) => `<button class="btn btn-line btn-sm" type="button" data-f="${v}" aria-pressed="${filter === v}">${l}</button>`).join('');
    const list = orders.filter((o) => !filter || o.statut === filter);
    $('#rows').innerHTML = list.length
      ? list.map((o) => `<tr>
          <td><b>${esc(o.reference)}</b><br><small>${new Date(o.createdAt).toLocaleString('fr-FR')}</small></td>
          <td>${esc(o.nom)} ${esc(o.prenom)}<br><small>${esc(o.telephone)}</small></td>
          <td>${esc(o.adresse)}${o.note ? `<br><small>Précision : ${esc(o.note)}</small>` : ''}</td>
          <td>${esc(o.productName)} × ${o.quantity}<br><small>${fcfa(o.total)}</small></td>
          <td><span class="pill ${o.statut}">${LABELS[o.statut]}</span><br>
            <select data-id="${o._id}" aria-label="Changer le statut de ${esc(o.reference)}" style="margin-top:6px">
              ${Object.entries(LABELS).map(([k, l]) => `<option value="${k}" ${k === o.statut ? 'selected' : ''}>${l}</option>`).join('')}
            </select></td>
          <td><button class="btn btn-danger btn-sm" type="button" data-del="${o._id}" data-ref="${esc(o.reference)}">Supprimer</button></td></tr>`).join('')
      : '<tr><td colspan="6">Aucune commande dans cette catégorie.</td></tr>';
  }

  async function load() {
    try { orders = await api('/api/orders', { auth: true }); render(); } catch (e) { fail(e); }
  }

  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (b) { filter = b.dataset.f; render(); }
  });
  $('#rows').addEventListener('change', async (e) => {
    const sel = e.target.closest('select[data-id]');
    if (!sel) return;
    try {
      await api(`/api/orders/${sel.dataset.id}/statut`, { method: 'PATCH', auth: true, body: { statut: sel.value } });
      orders.find((o) => o._id === sel.dataset.id).statut = sel.value;
      render();
    } catch (err) { fail(err); }
  });
  $('#rows').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-del]');
    if (!b || !confirm(`Supprimer la commande ${b.dataset.ref} ?`)) return;
    try {
      await api('/api/orders/' + b.dataset.del, { method: 'DELETE', auth: true });
      orders = orders.filter((o) => o._id !== b.dataset.del);
      render();
    } catch (err) { fail(err); }
  });
  $('#refresh').addEventListener('click', load);
  load();
})();
