document.addEventListener("DOMContentLoaded", function() {
  // 1. Pobierz plik navbar.html
  fetch('/navbar.html')
    .then(response => response.text())
    .then(data => {
      // 2. Wstaw go do placeholder'a
      document.getElementById('navbar-placeholder').innerHTML = data;

      // 3. Uruchom logikę "Active" (podświetlanie)
      highlightActiveLink();

      // 4. Poinformuj resztę strony, że navbar jest gotowy
      document.dispatchEvent(new Event("navbar-loaded"));
    })
    .catch(error => console.error('Błąd ładowania nawigacji:', error));
});

function highlightActiveLink() {
  let currentPath = window.location.pathname;

  // Normalizacja ścieżki z adresu URL:
  // 1. Pobierz ostatni człon po '/' (np. "badania" lub "badania.html")
  // 2. Usuń rozszerzenie (np. ".html")
  let pathName = currentPath.split('/').pop().split('.')[0];
  
  // Obsługa strony głównej ("/" -> "" -> "index")
  if (pathName === '') pathName = 'index';

  const navLinks = document.querySelectorAll('#navigation-1 .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalizacja linku z menu (np. "badania.html" -> "badania")
    const hrefName = href.split('/').pop().split('.')[0];

    if (pathName === hrefName) {
      link.classList.add('active');
      
      // Specjalna obsługa dla przycisku "Badania" (który jest wewnątrz buttona)
      if (link.classList.contains('btn-exam')) {
         link.classList.add('active');
      }
    }
  });
}