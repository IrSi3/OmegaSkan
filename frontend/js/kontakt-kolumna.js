document.addEventListener("DOMContentLoaded", function() {
  fetch('/kontakt-kolumna.html')
    .then(response => response.text())
    .then(data => {
      const placeholder = document.getElementById('kontakt-kolumna-placeholder');
      if (placeholder) {
        placeholder.innerHTML = data;
        document.dispatchEvent(new Event("kontakt-kolumna-loaded"));
      }
    })
    .catch(error => console.error('Błąd ładowania kolumny kontaktowej:', error));
});