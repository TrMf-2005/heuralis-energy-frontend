// Tracker de visites — niveau 1, totalement anonyme.
// Envoie uniquement : page, provenance, langue, fuseau horaire. Pas de cookie, pas d'IP conservée.
(function () {
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return; // respecte « Ne pas me suivre »
  if (sessionStorage.getItem('he_admin_token')) return; // ne compte pas les visites de l'administrateur
  const API = ((window.APP_CONFIG && window.APP_CONFIG.API_URL) || '').replace(/\/$/, '');
  let referrer = '';
  try {
    if (document.referrer && new URL(document.referrer).origin !== location.origin) referrer = document.referrer;
  } catch { /* ignoré */ }
  const page = location.pathname + (location.search.startsWith('?p=') ? location.search.split('&')[0] : '');
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* ignoré */ }
  fetch(API + '/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, referrer, lang: navigator.language || '', tz }),
    keepalive: true,
  }).catch(() => {});
})();
