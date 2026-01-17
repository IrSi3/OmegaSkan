document.addEventListener("DOMContentLoaded", function() {
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
  // Pobierz aktualną ścieżkę, np. "/cennik.html" lub "/"
  let currentPath = window.location.pathname;

  // Jeśli adres to samo "/", traktuj to jak "index.html"
  if (currentPath === '/' || currentPath === '') {
    currentPath = 'index.html';
  }

  // Znajdź wszystkie linki w nawigacji
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    // Pobierz href linku (np. "cennik.html")
    const href = link.getAttribute('href');

    // Sprawdź czy href zawiera się w aktualnej ścieżce
    // Używamy includes, żeby złapać dopasowanie nawet jak będzie "/cennik" bez .html
    if (href && currentPath.includes(href.replace('/', ''))) {
      link.classList.add('active');
      
      // Specjalna obsługa dla przycisku "Badania" (który jest wewnątrz buttona)
      if (link.classList.contains('btn-exam')) {
         link.classList.add('active');
      }
    }
  });
}