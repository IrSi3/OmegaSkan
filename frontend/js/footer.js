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

      // 5. Poinformuj resztę strony, że stopka jest gotowa
      document.dispatchEvent(new Event("footer-loaded"));
    })
    .catch(error => console.error('Błąd ładowania stopki:', error));
});

function highlightActiveFooterLink() {
  let currentPath = window.location.pathname;

  // Normalizacja ścieżki z adresu URL
  let pathName = currentPath.split('/').pop().split('.')[0];
  if (pathName === '') pathName = 'index';

  // Znajdź wszystkie linki w nawigacji stopki
  const navLinks = document.querySelectorAll('#navigation-2 .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalizacja linku z menu
    let hrefName = href.split('/').pop().split('.')[0];
    if (hrefName === '') hrefName = 'index';

    if (pathName === hrefName) {
      link.classList.add('active');
    }
  });
}

async function pobierzStopka() {
  try {
    const response = await fetch("/api/tresci?strona=stopka");
    const data = await response.json();

    if (data.length > 0 && data[0].footer) {
      const content = data[0].footer;
      // Funkcja stworzKlase jest dostępna globalnie z main.js
      stworzKlase(".footer-tytul", content.tytul);
      stworzKlase(".footer-tresc", content.tresc);
    }
  } catch (err) {
    console.error("Błąd pobierania treści stopki:", err);
  }
}