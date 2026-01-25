document.addEventListener("DOMContentLoaded", function() {
  // 1. Pobierz plik footer.html
  fetch('/footer.html')
    .then(response => response.text())
    .then(data => {
      // 2. Wstaw go do placeholder'a
      document.getElementById('footer-placeholder').innerHTML = data;

      // 3. Uruchom logikę "Active" (podświetlanie)
      highlightActiveFooterLink();

      // 4. Pobierz dane do stopki (treść)
      pobierzStopka();

      // 5. Poinformuj resztę strony, że stopka jest gotowa (żeby pobrać kontakty)
      document.dispatchEvent(new Event("footer-loaded"));
    })
    .catch(error => console.error('Błąd ładowania stopki:', error));
});

function highlightActiveFooterLink() {
  let currentPath = window.location.pathname;

  if (currentPath === '/' || currentPath === '') {
    currentPath = 'index.html';
  }

  // Znajdź wszystkie linki w nawigacji stopki (id="navigation-2")
  const navLinks = document.querySelectorAll('#navigation-2 .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Usuń klasę active na wszelki wypadek
    link.classList.remove('active');

    if (href && currentPath.includes(href.replace('/', ''))) {
      link.classList.add('active');
    }
  });
}

// Funkcja pomocniczna (lokalna dla footer.js)
function stworzKlaseStopka(nazwaKlasy, tekst) {
  const elementy = document.querySelectorAll(nazwaKlasy);
  elementy.forEach((el) => {
    if (tekst) {
      el.innerText = tekst;
    }
  });
}

async function pobierzStopka() {
  try {
    const response = await fetch("/api/tresci?strona=stopka");
    const data = await response.json();

    if (data.length > 0 && data[0].footer) {
      const content = data[0].footer;
      stworzKlaseStopka(".footer-tytul", content.tytul);
      stworzKlaseStopka(".footer-tresc", content.tresc);
    }
  } catch (err) {
    console.error("Błąd pobierania treści stopki:", err);
  }
}