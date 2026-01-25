document.addEventListener('DOMContentLoaded', async () => {
    const kontener = document.getElementById('kontener-badan');
    if (!kontener) return;

    try {
        // Pobierz numer telefonu z bazy (endpoint /api/kontakt)
        const kontaktRes = await fetch('/api/kontakt');
        const kontaktDane = await kontaktRes.json();
        const telefon = kontaktDane.telefon || '000 000 000';

        // Pobierz listę badań
        const badaniaRes = await fetch('/api/badania');
        const badania = await badaniaRes.json();

        badania.forEach(badanie => {
            const sekcja = document.createElement('section');
            sekcja.className = 'section';
            sekcja.id = `${badanie.kod}-section`;
            sekcja.style.width = '100%';

            // Generowanie listy punktów oferty
            const elementyListy = badanie.listaOferty.map(item => `<li>${item}</li>`).join('');

            sekcja.innerHTML = `
                <div class="row g-0 w-100 align-items-center">
                  <div id="exam-icon-heading" class="col-12 text-center align-items-center d-flex justify-content-center flex-wrap py-5 px-3 px-md-5">
                    <img id="examination-icon" class="img-fluid m-0 p-2" src="${badanie.ikona}" alt="${badanie.tytul} ikona" />
                    <h2 id="examination-heading" class="display-4 resp-font-3 m-0 p-2">
                      ${badanie.tytul}
                    </h2>
                  </div>

                  <!-- Kolumna ze zdjęciem -->
                  <div class="col-lg-6">
                    <div class="mx-auto" id="examination-photo-column">
                      <div class="image-container">
                        <img class="img-fluid rounded-9" src="${badanie.obraz}" alt="${badanie.tytul} zdjęcie" />
                        <div class="image-overlay">
                          <p class="overlay-text">
                            ${badanie.opis}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Kolumna z opisem i ofertą -->
                  <div class="col-lg-6 py-5 px-3 px-md-5">
                    <div class="p-1">
                      <div class="my-3">
                        <h2 class="resp-font-4">
                          ${badanie.tytulOferty}
                        </h2>
                        <ul class="p-4 resp-font-5">
                          ${elementyListy}
                        </ul>
                        <div class="text-center p-5" style="background-color: #071924">
                          <h4 class="resp-font-6">Rezerwacja terminu badania:</h4>
                          <div class="d-flex align-items-center resp-font-6 my-3 justify-content-center">
                            <i class="fas fa-phone fa-fw"></i>
                            <p style="display: inline-block; margin-left: 15px; margin-bottom: 0px;">
                              <span style="display: block">${telefon}</span>
                            </p>
                          </div>
                          <a class="btn btn-outline-light btn-lg my-2 mx-2" href="kontakt" role="button">Kontakt</a>
                          <a class="btn btn-outline-light btn-lg my-2 mx-2" href="cennik#${badanie.kod}" role="button">Cennik</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            `;
            kontener.appendChild(sekcja);
        });

    } catch (error) {
        console.error('Błąd pobierania danych:', error);
    }
});
