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

document.addEventListener("DOMContentLoaded", function () {
  pobierzTresc();
  pobierzStopka();
  pobierzKontakt();
  fetchAndRenderCarousel('doctor', 'doctors-indicators', 'doctors-inner', '#carouselMaterialStyle');
  fetchAndRenderCarousel('technician', 'techs-indicators', 'techs-inner', '#carouselMaterialStyle2');
});

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
  } catch (err) {
    console.error("Błąd pobierania treści:", err);
  }
}

// POBIERANIE STOPKI STRONY
async function pobierzStopka() {
  try {
    const response = await fetch("/api/tresci?strona=stopka");
    const data = await response.json();

    if (data.length > 0 && data[0].footer) {
      const content = data[0].footer;

      stworzKlase(".footer-tytul", content.tytul);
      stworzKlase(".footer-tresc", content.tresc);
    }
  } catch (err) {
    console.error("Błąd pobierania treści:", err);
  }
}

// POBIERANIE DANYCH KONTAKTOWYCH
async function pobierzKontakt() {
  try {
    const response = await fetch("/api/kontakt");
    const data = await response.json();

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
        <div class="carousel-caption d-none d-md-block">
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
