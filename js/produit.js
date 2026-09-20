// Page dédiée à un produit
(function () {
  const { api, API, esc, fcfa, loadSettings, applyBrand, productImg, autonomy, setMeta, setCanonical, waLink } = HE;
  const root = document.querySelector('#productRoot');
  const slug = new URLSearchParams(location.search).get('p');

  function notFound(msg) {
    root.innerHTML = `<div class="wrap"><div class="state" style="margin:48px 0">${esc(msg)}<br><br><a class="btn btn-sun" href="index.html#produits">Voir tous les produits</a></div></div>`;
  }

  function paragraphs(t) {
    return String(t || '').split(/\n+/).filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('');
  }

  // SEO propre à chaque produit : titre, meta description, réseaux sociaux, données structurées
  function seo(p, s) {
    const title = `${p.name} — ${s.storeName}`;
    const desc = (p.shortDescription || String(p.description || '').replace(/\s+/g, ' ').slice(0, 155) || `${p.name} chez ${s.storeName}`).slice(0, 160);
    const canonical = `${location.origin}${location.pathname}?p=${encodeURIComponent(p.slug)}`;
    document.title = title;
    setMeta('description', desc);
    setCanonical(canonical);
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'product', 'property');
    setMeta('og:url', canonical, 'property');
    if (p.imageCount) setMeta('og:image', productImg(p, 0), 'property');
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: desc,
      sku: p.slug,
      category: p.category,
      image: p.imageCount ? Array.from({ length: p.imageCount }, (_, i) => productImg(p, i)) : undefined,
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'XOF',
        price: p.price,
        availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };
    let el = document.querySelector('#ld-product');
    if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ld-product'; document.head.appendChild(el); }
    el.textContent = JSON.stringify(ld);
  }

  function orderForm(p, s) {
    if (p.stock <= 0) {
      const wa = s.whatsapp ? `<a class="btn btn-wa" href="${waLink(s.whatsapp, 'Bonjour, quand « ' + p.name + ' » sera-t-il disponible ?')}">Nous écrire sur WhatsApp</a>` : '';
      return `<div class="order-box" id="commander"><h2>Produit épuisé</h2><p>Ce produit n'est plus en stock pour le moment.</p>${wa}</div>`;
    }
    return `<div class="order-box" id="commander">
      <h2>Lancer votre commande</h2>
      <form id="orderForm" novalidate>
        <div class="form-grid">
          <div class="field"><label for="nom">Nom</label><input id="nom" name="nom" autocomplete="family-name" required maxlength="60"></div>
          <div class="field"><label for="prenom">Prénom</label><input id="prenom" name="prenom" autocomplete="given-name" required maxlength="60"></div>
          <div class="field"><label for="telephone">Téléphone</label><input id="telephone" name="telephone" type="tel" autocomplete="tel" placeholder="Ex : 01 96 00 00 00" required maxlength="25"></div>
          <div class="field"><label for="quantity">Quantité</label><select id="quantity" name="quantity">${[1,2,3,4,5,6,7,8,9,10].map((n) => `<option>${n}</option>`).join('')}</select></div>
          <div class="field full"><label for="adresse">Adresse de livraison</label><textarea id="adresse" name="adresse" autocomplete="street-address" required maxlength="250" placeholder="Quartier, ville, repère utile pour le livreur"></textarea></div>
          <div class="field full"><label for="note">Précision (facultatif)</label><input id="note" name="note" maxlength="300"></div>
        </div>
        <p class="stock" style="margin:14px 0 4px">Total : <span id="total">${fcfa(p.price)}</span></p>
        <button class="btn btn-sun" type="submit" id="submitBtn" style="width:100%">Confirmer ma commande</button>
        <p class="form-msg" id="formMsg" role="alert"></p>
      </form></div>`;
  }

  function render(p, s) {
    const imgs = Array.from({ length: p.imageCount }, (_, i) => productImg(p, i));
    const out = p.stock <= 0;
    const old = p.oldPrice && p.oldPrice > p.price ? `<s>${fcfa(p.oldPrice)}</s>` : '';
    const specs = (p.specs || []).length
      ? `<h2 style="margin-top:1.4em">Caractéristiques</h2><table class="specs"><tbody>${p.specs.map((x) => `<tr><th scope="row">${esc(x.label)}</th><td>${esc(x.value)}</td></tr>`).join('')}</tbody></table>`
      : '';
    root.innerHTML = `<div class="wrap">
      <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <a href="index.html#produits">${esc(p.category)}</a> / ${esc(p.name)}</nav>
      <section class="product">
        <div class="gallery">
          <div class="gallery-main">${imgs.length ? `<img id="mainImg" src="${imgs[0]}" alt="${esc(p.name)}" width="800" height="600">` : `<div class="noimg">${HE.SUN_ICON}</div>`}</div>
          ${imgs.length > 1 ? `<div class="thumbs" id="thumbs">${imgs.map((u, i) => `<button type="button" data-i="${i}" aria-label="Photo ${i + 1}" aria-current="${i === 0}"><img src="${u}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        </div>
        <div class="info">
          <span class="muted">${esc(p.category)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="price">${fcfa(p.price)}${old}</div>
          ${autonomy(p.autonomyHours)}
          ${p.shortDescription ? `<p style="margin-top:14px">${esc(p.shortDescription)}</p>` : ''}
          <ul class="facts">
            <li class="stock ${out ? 'out' : ''}">${out ? 'Épuisé' : p.stock <= 5 ? `Plus que ${p.stock} en stock` : 'En stock'}</li>
            ${p.warranty ? `<li>Garantie : <b>${esc(p.warranty)}</b></li>` : ''}
          </ul>
          ${out ? '' : '<a class="btn btn-sun" href="#commander">Lancer votre commande</a>'}
        </div>
      </section>
      <section class="detail">
        <div>${p.description ? `<h2>Description</h2>${paragraphs(p.description)}` : ''}${specs}</div>
        <aside>${orderForm(p, s)}</aside>
      </section></div>`;

    const thumbs = document.querySelector('#thumbs');
    if (thumbs) thumbs.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      document.querySelector('#mainImg').src = imgs[b.dataset.i];
      thumbs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-current', x === b));
    });

    const form = document.querySelector('#orderForm');
    if (!form) return;
    const qty = form.querySelector('#quantity');
    qty.addEventListener('change', () => (document.querySelector('#total').textContent = fcfa(p.price * Number(qty.value))));
    form.addEventListener('submit', (e) => submit(e, p, s, form));
  }

  async function submit(e, p, s, form) {
    e.preventDefault();
    const msg = document.querySelector('#formMsg');
    const btn = document.querySelector('#submitBtn');
    msg.textContent = '';
    msg.className = 'form-msg';
    const f = Object.fromEntries(new FormData(form).entries());
    if (!f.nom.trim() || !f.prenom.trim() || !f.telephone.trim() || !f.adresse.trim()) {
      msg.textContent = 'Merci de remplir le nom, le prénom, le téléphone et l\'adresse de livraison.';
      msg.className = 'form-msg err';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';
    try {
      const r = await api('/api/orders', { method: 'POST', body: { productId: p._id, quantity: Number(f.quantity), nom: f.nom, prenom: f.prenom, telephone: f.telephone, adresse: f.adresse, note: f.note } });
      const text = `Bonjour, je viens de passer la commande ${r.reference} : ${r.quantity} × ${r.productName}. Nom : ${f.prenom} ${f.nom}.`;
      const wa = s.whatsapp ? `<a class="btn btn-wa" href="${waLink(s.whatsapp, text)}">Confirmer sur WhatsApp</a>` : '';
      document.querySelector('#commander').innerHTML = `<div class="confirm"><h2>Commande enregistrée</h2><p>Votre référence :</p><div class="ref">${esc(r.reference)}</div><p>Total : <b>${fcfa(r.total)}</b>. Nous vous contactons au ${esc(f.telephone)} pour confirmer la livraison.</p>${wa}</div>`;
      document.querySelector('#commander').scrollIntoView();
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-msg err';
      btn.disabled = false;
      btn.textContent = 'Confirmer ma commande';
    }
  }

  async function init() {
    const s = await loadSettings();
    applyBrand(s);
    if (!slug) return notFound('Produit introuvable.');
    try {
      const p = await api('/api/products/' + encodeURIComponent(slug));
      seo(p, s);
      render(p, s);
    } catch (e) {
      notFound(e.status === 404 ? 'Ce produit n\'existe pas ou n\'est plus disponible.' : e.message);
    }
  }
  init();
})();
