// Outils partagés par toutes les pages
(function () {
  const API = ((window.APP_CONFIG && window.APP_CONFIG.API_URL) || '').replace(/\/$/, '');
  const TOKEN_KEY = 'he_admin_token';
  const CATEGORIES = ['Lampes solaires', 'Kits solaires', 'Panneaux solaires', 'Powerbanks solaires', 'Accessoires'];
  const DEFAULT_SETTINGS = { storeName: "HEURALIS's Energy", tagline: 'Votre énergie, sans coupure', whatsapp: '', city: '' };

  const SUN_ICON =
    '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="24" r="8" fill="currentColor"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/></svg>';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fcfa = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)).replace(/[\u202f\u00a0]/g, ' ') + ' FCFA';

  const getToken = () => sessionStorage.getItem(TOKEN_KEY);
  const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
  const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

  async function api(path, opts = {}) {
    const { method = 'GET', body, auth = false } = opts;
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && getToken()) headers.Authorization = 'Bearer ' + getToken();
    let res;
    try {
      res = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error('Impossible de joindre le serveur. Vérifie ta connexion puis réessaie.');
    }
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch { /* réponse vide */ }
    if (!res.ok) {
      if (res.status === 401 && auth) clearToken();
      const err = new Error((data && data.message) || 'Une erreur est survenue.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function loadSettings() {
    try {
      return { ...DEFAULT_SETTINGS, ...(await api('/api/settings')) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  // Applique le nom de la boutique (modifiable dans l'admin) partout dans la page
  function applyBrand(s) {
    document.querySelectorAll('[data-store-name]').forEach((el) => (el.textContent = s.storeName));
    document.querySelectorAll('[data-tagline]').forEach((el) => (el.textContent = s.tagline));
    document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
    document.querySelectorAll('[data-wa]').forEach((el) => {
      if (s.whatsapp) { el.href = waLink(s.whatsapp, 'Bonjour, je souhaite un renseignement.'); el.hidden = false; }
      else el.hidden = true;
    });
  }

  const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text || '')}`;

  const productImg = (p, i = 0) =>
    `${API}/api/products/${encodeURIComponent(p.slug)}/image/${i}?v=${new Date(p.updatedAt).getTime()}`;

  // Indicateur d'autonomie (barre proportionnelle sur 24 h)
  function autonomy(h) {
    if (h == null) return '';
    const pct = Math.min(100, Math.round((h / 24) * 100));
    return `<div class="auto"><span class="auto-label">Autonomie : ${esc(h)} h</span><div class="bar" role="img" aria-label="Autonomie ${esc(h)} heures"><i style="width:${pct}%"></i></div></div>`;
  }

  function setMeta(name, content, attr = 'name') {
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  function setCanonical(href) {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
    el.href = href;
  }

  // Menu mobile
  document.addEventListener('DOMContentLoaded', () => {
    const t = document.querySelector('.nav-toggle');
    const n = document.querySelector('.nav');
    if (t && n) t.addEventListener('click', () => {
      const open = n.classList.toggle('open');
      t.setAttribute('aria-expanded', open);
    });
  });

  window.HE = { API, CATEGORIES, SUN_ICON, esc, fcfa, api, getToken, setToken, clearToken, loadSettings, applyBrand, waLink, productImg, autonomy, setMeta, setCanonical };
})();
