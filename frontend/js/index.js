document.addEventListener("DOMContentLoaded", async function () {
  await loadCarousels();
  pobierzTresc();
});

// POBIERANIE TREŚCI STRONY
async function pobierzTresc() {
  try {
    const response = await fetch("/api/tresci?strona=index");
    const data = await response.json();

    if (data.length > 0 && data[0].oNas) {
      const content = data[0].oNas;

      stworzKlase(".db-tytul", content.tytul);
      stworzKlase(".db-podtytul", content.podtytul);
      stworzKlase(".db-tresc", content.tresc);
    }

    if (data.length > 0 && data[0].karuzele) {
      const karuzele = data[0].karuzele;
      stworzKlase(".carousel-title-doctor", karuzele.lekarze);
      stworzKlase(".carousel-title-technician", karuzele.technicy);
    }
  } catch (err) {
    console.error("Błąd pobierania treści:", err);
  }
}

// ŁADOWANIE I GENEROWANIE KARUZEL
async function loadCarousels() {
  try {
    const response = await fetch('/carousel-section.html');
    const template = await response.text();
    const container = document.getElementById('carousels-placeholder');

    if (!container) return;

    const carouselsConfig = [
      { type: 'doctor', titleClass: 'carousel-title-doctor' },
      { type: 'technician', titleClass: 'carousel-title-technician' }
    ];

    for (const config of carouselsConfig) {
      // Podmiana placeholderów w szablonie
      let html = template
        .replaceAll('{{type}}', config.type)
        .replaceAll('{{titleClass}}', config.titleClass);
      
      // Dodanie do DOM (jako HTML)
      container.insertAdjacentHTML('beforeend', html);

      // Uruchomienie logiki karuzeli dla nowo dodanego elementu
      // ID są generowane w szablonie jako: carousel-{type}, indicators-{type}, inner-{type}
      fetchAndRenderCarousel(config.type, `indicators-${config.type}`, `inner-${config.type}`, `#carousel-${config.type}`);
    }
  } catch (err) {
    console.error("Błąd ładowania szablonu karuzeli:", err);
  }
}

// Tworzenie karuzeli
async function fetchAndRenderCarousel(workerType, indicatorsId, innerId, carouselTargetId) {
  try {
    // 1. Pobierz dane z backendu filtrowane po typie
    const response = await fetch(`/api/workers?type=${workerType}`);
    const workers = await response.json();

    const indicatorsContainer = document.getElementById(indicatorsId);
    const innerContainer = document.getElementById(innerId);

    // Zabezpieczenie: czy kontenery istnieją?
    if (!indicatorsContainer || !innerContainer) return;

    indicatorsContainer.innerHTML = '';
    innerContainer.innerHTML = '';

    workers.forEach((worker, index) => {
      const isActive = index === 0 ? 'active' : '';

      // A. Generowanie kropek (indicators)
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-mdb-target', carouselTargetId);
      btn.setAttribute('data-mdb-slide-to', index.toString());
      btn.setAttribute('aria-label', `Slide ${index + 1}`);
      if (index === 0) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'true');
      }
      indicatorsContainer.appendChild(btn);

      // B. Generowanie slajdu (inner item)
      const itemDiv = document.createElement('div');
      itemDiv.className = `carousel-item ${isActive}`;
      
      itemDiv.innerHTML = `
        <img
          src="${worker.image}"
          class="d-block w-100"
          alt="${worker.name}"
          style="object-fit: cover; aspect-ratio: 16/9;" 
        />
        <div class="carousel-caption d-block">
          <h5>${worker.name}</h5>
          <p>${worker.role}</p>
        </div>
      `;
      innerContainer.appendChild(itemDiv);
    });

  } catch (error) {
    console.error(`Błąd ładowania karuzeli (${workerType}):`, error);
  }
}
