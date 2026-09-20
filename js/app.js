// Page d'accueil
(function () {
  const { api, esc, fcfa, CATEGORIES, loadSettings, applyBrand, productImg, autonomy, SUN_ICON, waLink } = HE;
  const $ = (s) => document.querySelector(s);

  const ICONS = {
    'Lampes solaires': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 30c-4-3-6-6-6-10a13 13 0 0 1 26 0c0 4-2 7-6 10z"/><path d="M19 37h10M21 42h6"/></svg>',
    'Kits solaires': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="14" width="32" height="20" rx="3"/><path d="M42 21v6M22 18l-5 8h7l-4 8"/></svg>',
    'Panneaux solaires': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 32l6-18h26l-6 18zM11 26h26M21 14l-3 18M31 14l-3 18M24 32v10M16 42h16"/></svg>',
    'Powerbanks solaires': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="6" width="20" height="36" rx="4"/><path d="M22 16h4M21 32l3-6 3 6"/></svg>',
    Accessoires: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6v10M30 6v10M12 16h24v6a12 12 0 0 1-24 0zM24 34v8"/></svg>',
  };

  let products = [];
  const state = { cat: '', q: '' };

  const url = (p) => 'produit.html?p=' + encodeURIComponent(p.slug);

  function card(p) {
    const out = p.stock <= 0;
    const img = p.imageCount
      ? `<img src="${productImg(p, 0)}" alt="${esc(p.name)}" loading="lazy" width="400" height="300">`
      : `<div class="noimg">${SUN_ICON}</div>`;
    const badge = out
      ? '<span class="badge out">Épuisé</span>'
      : p.badge ? `<span class="badge ${p.badge === 'Promo' ? 'promo' : ''}">${esc(p.badge)}</span>` : '';
    const old = p.oldPrice && p.oldPrice > p.price ? `<s>${fcfa(p.oldPrice)}</s>` : '';
    return `<article class="card">
      <a class="card-img" href="${url(p)}" tabindex="-1" aria-hidden="true">${img}${badge}</a>
      <div class="card-body">
        <span class="card-cat">${esc(p.category)}</span>
        <h3><a href="${url(p)}">${esc(p.name)}</a></h3>
        <div class="price">${fcfa(p.price)}${old}</div>
        ${autonomy(p.autonomyHours)}
        <div class="card-actions">
          <a class="btn btn-line btn-sm" href="${url(p)}">Voir</a>
          ${out ? '' : `<a class="btn btn-sun btn-sm" href="${url(p)}#commander">Acheter</a>`}
        </div>
      </div>
    </article>`;
  }

  function renderHero() {
    const f = products.find((p) => p.featured && p.imageCount);
    if (!f) return;
    $('#heroArt').innerHTML = `<a href="${url(f)}"><img src="${productImg(f, 0)}" alt="${esc(f.name)}" width="400" height="300"></a>
      <a class="hero-tag" href="${url(f)}"><span>${esc(f.name)}</span><span>${fcfa(f.price)}</span></a>`;
  }

  function renderCats() {
    $('#cats').innerHTML = CATEGORIES.map((c) => {
      const n = products.filter((p) => p.category === c).length;
      return `<button type="button" class="cat" data-cat="${esc(c)}" aria-pressed="${state.cat === c}">
        ${ICONS[c] || ''}<span>${esc(c)}</span><small>${n} produit${n > 1 ? 's' : ''}</small></button>`;
    }).join('');
  }

  function renderGrid() {
    const q = state.q.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (!state.cat || p.category === state.cat) &&
        (!q || [p.name, p.category, p.shortDescription].join(' ').toLowerCase().includes(q))
    );
    $('#count').textContent = state.cat ? state.cat : 'Tous les produits';
    $('#grid').innerHTML = list.length
      ? list.map(card).join('')
      : `<div class="state" style="grid-column:1/-1">${products.length ? 'Aucun produit ne correspond à votre recherche.' : 'Les produits arrivent bientôt.'}</div>`;
  }

  function bind() {
    $('#cats').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      state.cat = state.cat === b.dataset.cat ? '' : b.dataset.cat;
      renderCats();
      renderGrid();
      $('#produits').scrollIntoView();
    });
    $('#allBtn').addEventListener('click', () => { state.cat = ''; state.q = ''; $('#search').value = ''; renderCats(); renderGrid(); });
    $('#search').addEventListener('input', (e) => { state.q = e.target.value; renderGrid(); });
  }

  async function init() {
    const settings = await loadSettings();
    applyBrand(settings);
    document.title = `${settings.storeName} — Équipements solaires`;
    const wa = $('#heroWa');
    if (settings.whatsapp) { wa.href = waLink(settings.whatsapp, 'Bonjour, je souhaite un renseignement.'); wa.hidden = false; }
    bind();
    try {
      products = await api('/api/products');
      renderHero();
      renderCats();
      renderGrid();
    } catch (e) {
      $('#grid').innerHTML = `<div class="state" style="grid-column:1/-1">${esc(e.message)}<br>Le serveur peut mettre quelques secondes à se réveiller.<br><br><button class="btn btn-line btn-sm" type="button" id="retry">Réessayer</button></div>`;
      $('#retry').addEventListener('click', () => location.reload());
    }
  }
  init();
})();
