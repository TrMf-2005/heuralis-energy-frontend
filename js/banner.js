// Bandeau d'information sur le suivi anonyme des visites
(function () {
  try { if (localStorage.getItem('he_info_ok')) return; } catch { /* stockage indisponible */ }
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div');
    b.className = 'info-banner';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Information sur les visites');
    b.innerHTML =
      '<p>Ce site compte les visites de façon anonyme : aucun cookie, aucune adresse IP conservée. ' +
      '<a href="confidentialite.html">Politique de confidentialité</a></p>' +
      '<button class="btn btn-sun btn-sm" type="button">J\'ai compris</button>';
    b.querySelector('button').addEventListener('click', () => {
      try { localStorage.setItem('he_info_ok', '1'); } catch { /* ignoré */ }
      b.remove();
    });
    document.body.appendChild(b);
  });
})();
