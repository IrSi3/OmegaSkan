// Animated navbar when scrolled
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  navbar.classList.toggle("navbar-scrolled", window.scrollY > 50);
});

// On mobile: navbar static-top when not scrolled and fixed-top when scrolled down
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  navbar.classList.toggle("navbar-static", window.scrollY <= 0);
  navbar.classList.toggle("navbar-fixed", window.scrollY > 0);
});

document.addEventListener("DOMContentLoaded", async function () {
  pobierzKontakt();
  await loadCarousels();
  pobierzTresc();
});
document.addEventListener("navbar-loaded", pobierzKontakt);
document.addEventListener("footer-loaded", pobierzKontakt);
document.addEventListener("kontakt-kolumna-loaded", pobierzKontakt);

// Funkcja pomocniczna do tworzenia klas
function stworzKlase(nazwaKlasy, tekst) {
  const elementy = document.querySelectorAll(nazwaKlasy);
  elementy.forEach((el) => {
    // Sprawdzamy czy tekst istnieje, żeby nie wpisać "undefined"
    if (tekst) {
      el.innerText = tekst;
    }
  });
}

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

let cachedContactData = null;

// POBIERANIE DANYCH KONTAKTOWYCH
async function pobierzKontakt() {
  try {
    if (!cachedContactData) {
      const response = await fetch("/api/kontakt");
      cachedContactData = await response.json();
    }
    const data = cachedContactData;

    if (data) {
      stworzKlase(".db-telefon", data.telefon);
      stworzKlase(".db-email", data.email);

      if (data.adres) {
        stworzKlase(".db-adres-ulica", data.adres.ulica);
        stworzKlase(
          ".db-adres-miasto",
          `${data.adres.miasto} ${data.adres.kod}`
        );
      }

      if (data.godziny) {
        stworzKlase(".db-godziny-pn", data.godziny.pn_pt);
        stworzKlase(".db-godziny-sob", data.godziny.sob);
        stworzKlase(".db-godziny-nd", data.godziny.nd);
      }

      if (data.mapa) {
        const mapa = document.getElementById("db-mapa");
        if (mapa) mapa.src = data.mapa;
      }
    }
  } catch (err) {
    console.error("Błąd pobierania kontaktu:", err);
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
