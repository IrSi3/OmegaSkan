document.addEventListener("DOMContentLoaded", function() {
  pobierzIkone();
  // 1. Pobierz plik navbar.html
  fetch('/navbar.html')
    .then(response => response.text())
    .then(data => {
      // 2. Wstaw go do placeholder'a
      document.getElementById('navbar-placeholder').innerHTML = data;

      // 3. Uruchom logikę "Active" (podświetlanie)
      highlightActiveLink();
    })
    .catch(error => console.error('Błąd ładowania nawigacji:', error));
});

function highlightActiveLink() {
  let currentPath = window.location.pathname;

  // Normalizacja ścieżki z adresu URL (tak jak w stopce)
  let pathName = currentPath.split('/').pop().split('.')[0];
  if (pathName === '') pathName = 'index';

  const navLinks = document.querySelectorAll('#navigation-1 .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalizacja linku z menu
    let hrefName = href.split('/').pop().split('.')[0];
    if (hrefName === '') hrefName = 'index';

    if (pathName === hrefName) {
      link.classList.add('active');
      
      // Specjalna obsługa dla przycisku "Badania" (który jest wewnątrz buttona)
      if (link.classList.contains('btn-exam')) {
         link.classList.add('active');
      }
    }
  });
}

// Pobieranie tla i baneru
async function pobierzIkone() {
  try {
    const response = await fetch("/api/tresci?strona=zdjecia");
    const data = await response.json();

    if (data.length > 0 && data[0].svg) {
      const content = data[0].svg;

      const ikona = document.getElementById("omegaskan-ikona");
        if (ikona) ikona.src = content.ikona;
    }
  }
  catch (err) {
    console.error("Błąd pobierania obrazów:", err);
  }
}