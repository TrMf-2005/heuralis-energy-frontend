// Page Administrateur : connexion, réglages, ajout / modification / suppression des produits
(function () {
  const { api, esc, fcfa, CATEGORIES, getToken, setToken, clearToken, loadSettings, applyBrand, productImg } = HE;
  const $ = (s) => document.querySelector(s);

  let images = []; // images du produit en cours d'édition (data URI)
  let editingId = null;

  // ---------- Connexion ----------
  function showLogin() {
    $('#dash').hidden = true;
    $('#loginView').hidden = false;
  }
  async function showDash() {
    $('#loginView').hidden = true;
    $('#dash').hidden = false;
    const s = await loadSettings();
    applyBrand(s);
    fillSettings(s);
    await loadProducts();
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#loginMsg');
    msg.textContent = '';
    try {
      const { token } = await api('/api/auth/login', { method: 'POST', body: { password: $('#password').value } });
      setToken(token);
      $('#password').value = '';
      showDash();
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  $('#logout').addEventListener('click', () => { clearToken(); showLogin(); });

  function handleAuthError(err) {
    if (err.status === 401) { showLogin(); return true; }
    return false;
  }

  // ---------- Réglages ----------
  function fillSettings(s) {
    $('#storeName').value = s.storeName;
    $('#tagline').value = s.tagline;
    $('#whatsapp').value = s.whatsapp;
    $('#city').value = s.city;
  }
  $('#settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#settingsMsg');
    msg.className = 'form-msg';
    try {
      const s = await api('/api/settings', { method: 'PUT', auth: true, body: { storeName: $('#storeName').value, tagline: $('#tagline').value, whatsapp: $('#whatsapp').value, city: $('#city').value } });
      applyBrand(s);
      msg.textContent = 'Réglages enregistrés.';
    } catch (err) {
      if (handleAuthError(err)) return;
      msg.textContent = err.message;
      msg.className = 'form-msg err';
    }
  });

  // ---------- Produits : liste ----------
  async function loadProducts() {
    const box = $('#plist');
    try {
      const list = await api('/api/products');
      box.innerHTML = list.length
        ? list.map((p) => `<div class="prow">
            ${p.imageCount ? `<img src="${productImg(p, 0)}" alt="">` : '<div class="ph"></div>'}
            <div><b>${esc(p.name)}</b><small>${esc(p.category)} · ${fcfa(p.price)} · stock : ${p.stock}${p.featured ? ' · à la une' : ''}</small></div>
            <div class="row-actions">
              <button class="btn btn-line btn-sm" type="button" data-edit="${p._id}">Modifier</button>
              <button class="btn btn-danger btn-sm" type="button" data-del="${p._id}" data-name="${esc(p.name)}">Supprimer</button>
            </div></div>`).join('')
        : '<div class="state">Aucun produit pour l\'instant. Ajoute le premier avec le formulaire ci-dessus.</div>';
    } catch (err) {
      box.innerHTML = `<div class="state">${esc(err.message)}</div>`;
    }
  }

  $('#plist').addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    try {
      if (ed) {
        const p = await api('/api/products/' + ed.dataset.edit + '/full', { auth: true });
        fillForm(p);
      } else if (del) {
        if (!confirm(`Supprimer « ${del.dataset.name} » ? Cette action est définitive.`)) return;
        await api('/api/products/' + del.dataset.del, { method: 'DELETE', auth: true });
        if (editingId === del.dataset.del) resetForm();
        loadProducts();
      }
    } catch (err) {
      if (!handleAuthError(err)) alert(err.message);
    }
  });

  // ---------- Produits : formulaire ----------
  $('#category').innerHTML = CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join('');

  function specRow(label = '', value = '') {
    const d = document.createElement('div');
    d.className = 'spec-row';
    d.innerHTML = `<input placeholder="Caractéristique (ex : Puissance)" value="${esc(label)}" maxlength="60"><input placeholder="Valeur (ex : 100 W)" value="${esc(value)}" maxlength="120"><button class="btn btn-line btn-sm" type="button">Retirer</button>`;
    d.querySelector('button').addEventListener('click', () => d.remove());
    $('#specs').appendChild(d);
  }
  $('#addSpec').addEventListener('click', () => specRow());

  function renderImages() {
    $('#imgs').innerHTML = images.map((src, i) => `<figure class="${i === 0 ? 'main' : ''}">
      <img src="${src}" alt="Photo ${i + 1}">
      <figcaption>${i === 0 ? '<span>Principale</span>' : `<button type="button" data-act="main" data-i="${i}">Principale</button>`}<button type="button" class="del" data-act="del" data-i="${i}">Retirer</button></figcaption></figure>`).join('');
  }
  $('#imgs').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const i = Number(b.dataset.i);
    if (b.dataset.act === 'del') images.splice(i, 1);
    if (b.dataset.act === 'main') images.unshift(images.splice(i, 1)[0]);
    renderImages();
  });

  // Réduit les photos avant envoi (le site les stocke en base64 dans MongoDB)
  function compress(file, max = 1000, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  $('#imgInput').addEventListener('change', async (e) => {
    for (const f of Array.from(e.target.files)) {
      if (images.length >= 6) break;
      try { images.push(await compress(f)); } catch { /* fichier ignoré */ }
    }
    e.target.value = '';
    renderImages();
  });

  function resetForm() {
    editingId = null;
    $('#productForm').reset();
    $('#specs').innerHTML = '';
    images = [];
    renderImages();
    $('#formTitle').textContent = 'Ajouter un produit';
    $('#saveBtn').textContent = 'Ajouter le produit';
    $('#cancelEdit').hidden = true;
    $('#productMsg').textContent = '';
  }
  $('#cancelEdit').addEventListener('click', resetForm);

  function fillForm(p) {
    resetForm();
    editingId = p._id;
    $('#name').value = p.name;
    $('#category').value = CATEGORIES.includes(p.category) ? p.category : CATEGORIES[CATEGORIES.length - 1];
    $('#price').value = p.price;
    $('#oldPrice').value = p.oldPrice ?? '';
    $('#stock').value = p.stock;
    $('#autonomyHours').value = p.autonomyHours ?? '';
    $('#warranty').value = p.warranty || '';
    $('#badge').value = p.badge || '';
    $('#featured').checked = !!p.featured;
    $('#shortDescription').value = p.shortDescription || '';
    $('#description').value = p.description || '';
    (p.specs || []).forEach((s) => specRow(s.label, s.value));
    images = (p.images || []).slice();
    renderImages();
    $('#formTitle').textContent = 'Modifier le produit';
    $('#saveBtn').textContent = 'Enregistrer les modifications';
    $('#cancelEdit').hidden = false;
    $('#formPanel').scrollIntoView();
  }

  $('#productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#productMsg');
    msg.className = 'form-msg';
    msg.textContent = '';
    const specs = Array.from($('#specs').querySelectorAll('.spec-row')).map((r) => {
      const [a, b] = r.querySelectorAll('input');
      return { label: a.value, value: b.value };
    });
    const body = {
      name: $('#name').value,
      category: $('#category').value,
      price: $('#price').value,
      oldPrice: $('#oldPrice').value,
      stock: $('#stock').value,
      autonomyHours: $('#autonomyHours').value,
      warranty: $('#warranty').value,
      badge: $('#badge').value,
      featured: $('#featured').checked,
      shortDescription: $('#shortDescription').value,
      description: $('#description').value,
      specs,
      images,
    };
    $('#saveBtn').disabled = true;
    try {
      if (editingId) await api('/api/products/' + editingId, { method: 'PUT', auth: true, body });
      else await api('/api/products', { method: 'POST', auth: true, body });
      const wasEdit = !!editingId;
      resetForm();
      msg.textContent = wasEdit ? 'Produit modifié.' : 'Produit ajouté.';
      await loadProducts();
    } catch (err) {
      if (!handleAuthError(err)) {
        msg.textContent = err.message;
        msg.className = 'form-msg err';
      }
    } finally {
      $('#saveBtn').disabled = false;
    }
  });

  // ---------- Démarrage ----------
  (async function init() {
    if (!getToken()) return showLogin();
    try {
      await api('/api/auth/me', { auth: true });
      showDash();
    } catch {
      showLogin();
    }
  })();
})();
