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
});
document.addEventListener("navbar-loaded", pobierzKontakt);
document.addEventListener("footer-loaded", pobierzKontakt);

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
