// Page « Installation, maintenance et conseil » : la demande part par WhatsApp (aucun changement du backend)
(function () {
  const { loadSettings, applyBrand, waLink } = HE;
  const $ = (s) => document.querySelector(s);
  let settings = { storeName: "HEURALIS's Energy", whatsapp: '' };

  const TYPES = {
    installation: "l'installation d'un nouveau système solaire",
    maintenance: 'la maintenance de mon système solaire',
    achat: 'de nouveaux équipements solaires (conseil / devis)',
  };

  // Un clic sur une carte choisit le type de demande et amène au formulaire
  document.querySelectorAll('[data-type]').forEach((b) =>
    b.addEventListener('click', () => {
      $('#type').value = b.dataset.type;
      $('#demande').scrollIntoView();
      $('#nom').focus({ preventScroll: true });
    })
  );

  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#formMsg');
    msg.textContent = '';
    msg.className = 'form-msg';
    const f = Object.fromEntries(new FormData(e.target).entries());
    const v = (k) => String(f[k] || '').trim();

    if (!v('nom') || !v('prenom') || !v('telephone') || !v('adresse')) {
      msg.textContent = 'Merci de remplir le nom, le prénom, le téléphone et la ville ou le quartier.';
      msg.className = 'form-msg err';
      return;
    }
    if (!settings.whatsapp) {
      msg.textContent = "Le numéro WhatsApp de la boutique n'est pas encore disponible. Réessayez dans un instant.";
      msg.className = 'form-msg err';
      return;
    }

    const text = [
      `Bonjour, je souhaite une demande pour ${TYPES[v('type')] || TYPES.achat}.`,
      `Nom : ${v('nom')}`,
      `Prénom : ${v('prenom')}`,
      `Téléphone : ${v('telephone')}`,
      `Ville / quartier : ${v('adresse')}`,
      v('message') ? `Message : ${v('message')}` : '',
    ].filter(Boolean).join('\n');

    window.location.href = waLink(settings.whatsapp, text);
  });

  loadSettings().then((s) => {
    settings = s;
    applyBrand(s);
  });
})();
