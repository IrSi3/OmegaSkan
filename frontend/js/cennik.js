document.addEventListener('DOMContentLoaded', async () => {
    pobierzObrazy();

    const accordionContainer = document.getElementById('accordion-exam-prices');
    if (!accordionContainer) return;

    try {
        const response = await fetch('/api/cennik');
        const cennikData = await response.json();

        cennikData.forEach((kategoria, index) => {
            const collapseId = `flush-collapse-${kategoria.kod || index}`;
            const headingId = `flush-heading-${kategoria.kod || index}`;

            // Generowanie wierszy tabeli
            const tableRows = kategoria.badania.map(badanie => `
                <tr>
                    <th scope="row">${badanie.nazwa}</th>
                    <td class="text-center">${badanie.cena}</td>
                </tr>
            `).join('');

            const itemHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-mdb-toggle="collapse"
                            data-mdb-target="#${collapseId}"
                            aria-expanded="false"
                            aria-controls="${collapseId}"
                        >
                            <img
                                id="examination-icon"
                                class="m-0 me-3 p-2"
                                src="${kategoria.ikona}"
                                alt="Ikona ${kategoria.kategoria}"
                            />
                            ${kategoria.kategoria}
                        </button>
                    </h2>
                    <div
                        id="${collapseId}"
                        class="accordion-collapse collapse"
                        aria-labelledby="${headingId}"
                        data-mdb-parent="#accordion-exam-prices"
                    >
                        <div class="accordion-body">
                            <table class="table">
                                <thead class="table-head align-middle">
                                    <tr>
                                        <th class="col-4" scope="col">RODZAJ BADANIA</th>
                                        <th class="text-center col-2" scope="col">CENA</th>
                                    </tr>
                                </thead>
                                <tbody class="table-body align-middle">
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            accordionContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

        document.querySelectorAll('.accordion-button').forEach(button => {
             new mdb.Collapse(document.getElementById(button.getAttribute('data-mdb-target').substring(1)), {
                 toggle: false
             });
        });

        // Automatyczne przewijanie do otwartej sekcji
        const collapses = accordionContainer.querySelectorAll('.accordion-collapse');
        collapses.forEach(collapse => {
            collapse.addEventListener('shown.bs.collapse', (e) => {
                const item = e.target.closest('.accordion-item');
                if (item) {
                    const navbar = document.querySelector('.navbar');
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const offset = 20; // Dodatkowy margines od góry
                    const elementPosition = item.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - navbarHeight - offset;

                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            });
        });

        // Obsługa otwierania konkretnej kategorii na podstawie URL (np. cennik#MRI)
        const hash = window.location.hash.substring(1); // Pobierz tekst po # (np. "MRI")
        if (hash) {
            const targetId = `flush-collapse-${hash}`;
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Pobierz instancję lub stwórz nową i pokaż element
                const bsCollapse = mdb.Collapse.getInstance(targetElement) || new mdb.Collapse(targetElement);
                bsCollapse.show();
            }
        }

    } catch (error) {
        console.error('Błąd pobierania cennika:', error);
        accordionContainer.innerHTML = '<p class="text-center text-danger">Nie udało się załadować cennika.</p>';
    }
});

// Pobieranie tla
async function pobierzObrazy() {
  try {
    const response = await fetch("/api/tresci?strona=zdjecia");
    const data = await response.json();

    if (data.length > 0 && data[0].jpg) {
      const content = data[0].jpg;
      
      const tlo = document.getElementById("intro-main");
        if (tlo){
          tlo.style.backgroundImage = `url(${content.tlo})`;
          tlo.style.backgroundSize = 'cover';
        }
    }
  }
  catch (err) {
    console.error("Błąd pobierania obrazów:", err);
  }
}