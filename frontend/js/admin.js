document.addEventListener('DOMContentLoaded', () => {
    // Inicjalizacja inputów MDB
    document.querySelectorAll('.form-outline').forEach((formOutline) => {
        new mdb.Input(formOutline).init();
    });

    initAdminIndex();
    initWorkers();
    initBadania();
    initCennik();
    initFooter();
    initContact();
    initImages();
});

// Funkcja pomocnicza do aktualizacji pól formularza (obsługa MDB)
function updateField(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value || '';
        // Fix dla MDB: Wymuś aktualizację stanu inputa
        if (el.value) {
            el.classList.add('active'); // Klasa active na inpucie
            const wrapper = el.closest('.form-outline');
            if (wrapper) {
                const label = wrapper.querySelector('.form-label');
                if (label) label.classList.add('active');
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}

async function initAdminIndex() {
    const form = document.getElementById('form-edycja-index');
    if (!form) return;

    // Pobierz aktualne dane dla strony głównej
    try {
        const res = await fetch('/api/tresci?strona=index');
        const data = await res.json();
        
        if (data && data.length > 0) {
            const tresc = data[0];
            
            // Wypełnij formularz danymi z bazy (jeśli istnieją)
            if (tresc.oNas) {
                updateField('onas-tytul', tresc.oNas.tytul);
                updateField('onas-podtytul', tresc.oNas.podtytul);
                updateField('onas-tresc', tresc.oNas.tresc);
            }

            if (tresc.karuzele) {
                updateField('karuzela-lekarze', tresc.karuzele.lekarze);
                updateField('karuzela-technicy', tresc.karuzele.technicy);
            }
        }
    } catch (err) {
        console.error("Błąd pobierania danych do edycji:", err);
    }

    // Obsługa zapisu zmian
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            strona: 'index', // Klucz identyfikujący stronę w bazie
            oNas: {
                tytul: document.getElementById('onas-tytul').value,
                podtytul: document.getElementById('onas-podtytul').value,
                tresc: document.getElementById('onas-tresc').value
            },
            karuzele: {
                lekarze: document.getElementById('karuzela-lekarze').value,
                technicy: document.getElementById('karuzela-technicy').value
            }
        };

        try {
            const res = await fetch('/api/tresci', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) alert("Zapisano zmiany pomyślnie!");
            else alert("Wystąpił błąd podczas zapisu.");
        } catch (err) {
            console.error("Błąd wysyłania:", err);
            alert("Błąd połączenia z serwerem.");
        }
    });
}

// --- OBSŁUGA PRACOWNIKÓW ---
async function initWorkers() {
    const addForm = document.getElementById('addWorkerForm');
    const listContainer = document.getElementById('workers-list');
    const editForm = document.getElementById('editWorkerForm');
    let editModalInstance = null;

    // Pobieranie i wyświetlanie listy
    const loadWorkers = async () => {
        if (!listContainer) return;
        listContainer.innerHTML = '<p>Ładowanie...</p>';
        try {
            const res = await fetch('/api/workers');
            const workers = await res.json();

            listContainer.innerHTML = '';
            workers.forEach(worker => {
                const col = document.createElement('div');
                col.className = 'col-md-4 col-lg-3';
                col.innerHTML = `
                    <div class="card h-100">
                        <img src="${worker.image}" class="card-img-top" alt="${worker.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${worker.name}</h5>
                            <p class="card-text text-muted">${worker.role}</p>
                            <span class="badge bg-info mb-2">${worker.type === 'doctor' ? 'Lekarz' : 'Technik'}</span>
                            <div class="d-flex justify-content-between mt-2">
                                <button class="btn btn-sm btn-primary btn-edit" data-id="${worker._id}">Edytuj</button>
                                <button class="btn btn-sm btn-danger btn-delete" data-id="${worker._id}">Usuń</button>
                            </div>
                        </div>
                    </div>
                `;
                listContainer.appendChild(col);
            });

            // Podpięcie zdarzeń do przycisków
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => handleDelete(btn.dataset.id));
            });
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => handleEditOpen(btn.dataset.id, workers));
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p class="text-danger">Błąd ładowania listy.</p>';
        }
    };

    // Dodawanie pracownika
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addForm);
            try {
                const res = await fetch('/api/workers', { method: 'POST', body: formData });
                if (res.ok) {
                    alert('Pracownik dodany!');
                    addForm.reset();
                    loadWorkers(); // Odśwież listę
                } else {
                    alert('Błąd dodawania');
                }
            } catch (err) { console.error(err); alert('Błąd połączenia'); }
        });
    }

    // Usuwanie pracownika
    const handleDelete = async (id) => {
        if (!confirm("Czy na pewno chcesz usunąć tego pracownika?")) return;
        try {
            const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
            if (res.ok) loadWorkers();
            else alert("Błąd usuwania");
        } catch (err) { console.error(err); }
    };

    // Otwieranie modala edycji
    const handleEditOpen = (id, allWorkers) => {
        const worker = allWorkers.find(w => w._id === id);
        if (!worker) return;

        document.getElementById('editWorkerId').value = worker._id;
        document.getElementById('editWorkerName').value = worker.name;
        document.getElementById('editWorkerRole').value = worker.role;
        document.getElementById('editWorkerType').value = worker.type;
        document.getElementById('editWorkerImage').value = ''; // Reset inputu pliku

        const modalEl = document.getElementById('editWorkerModal');
        editModalInstance = new mdb.Modal(modalEl);
        editModalInstance.show();
    };

    // Zapis edycji
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editWorkerId').value;
            const formData = new FormData();
            formData.append('name', document.getElementById('editWorkerName').value);
            formData.append('role', document.getElementById('editWorkerRole').value);
            formData.append('type', document.getElementById('editWorkerType').value);
            
            const fileInput = document.getElementById('editWorkerImage');
            if (fileInput.files[0]) {
                formData.append('image', fileInput.files[0]);
            }

            try {
                const res = await fetch(`/api/workers/${id}`, { method: 'PUT', body: formData });
                if (res.ok) {
                    alert("Zaktualizowano!");
                    if (editModalInstance) editModalInstance.hide();
                    loadWorkers();
                } else {
                    alert("Błąd aktualizacji");
                }
            } catch (err) { console.error(err); }
        });
    }

    // Załaduj listę na start
    loadWorkers();
}

// --- OBSŁUGA BADAŃ ---
async function initBadania() {
    const addForm = document.getElementById('badanieForm');
    const listContainer = document.getElementById('badania-list');
    const editForm = document.getElementById('editBadanieForm');
    let editModalInstance = null;

    // Pobieranie i wyświetlanie listy
    const loadBadania = async () => {
        if (!listContainer) return;
        listContainer.innerHTML = '<p>Ładowanie...</p>';
        try {
            const res = await fetch('/api/badania');
            const badania = await res.json();

            listContainer.innerHTML = '';
            badania.forEach(badanie => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                col.innerHTML = `
                    <div class="card h-100">
                        <div class="card-header d-flex align-items-center">
                            <img src="${badanie.ikona}" alt="ikona" style="width: 40px; height: 40px; object-fit: contain;" class="me-2">
                            <h5 class="mb-0 text-truncate">${badanie.tytul}</h5>
                        </div>
                        <div class="card-body">
                            <p class="text-muted small mb-2">Kod: <strong>${badanie.kod}</strong></p>
                            <img src="${badanie.obraz}" class="img-fluid rounded mb-2" style="height: 150px; width: 100%; object-fit: cover;">
                            <div class="d-flex justify-content-between mt-3">
                                <button class="btn btn-sm btn-primary btn-edit-badanie" data-id="${badanie._id}">Edytuj</button>
                                <button class="btn btn-sm btn-danger btn-delete-badanie" data-id="${badanie._id}">Usuń</button>
                            </div>
                        </div>
                    </div>
                `;
                listContainer.appendChild(col);
            });

            // Podpięcie zdarzeń
            document.querySelectorAll('.btn-delete-badanie').forEach(btn => {
                btn.addEventListener('click', () => handleDelete(btn.dataset.id));
            });
            document.querySelectorAll('.btn-edit-badanie').forEach(btn => {
                btn.addEventListener('click', () => handleEditOpen(btn.dataset.id, badania));
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p class="text-danger">Błąd ładowania listy badań.</p>';
        }
    };

    // Dodawanie badania
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addForm);
            try {
                const res = await fetch('/api/badania', { method: 'POST', body: formData });
                if (res.ok) {
                    alert('Badanie dodane!');
                    addForm.reset();
                    loadBadania();
                } else {
                    const txt = await res.text();
                    alert('Błąd: ' + txt);
                }
            } catch (err) { console.error(err); alert('Błąd połączenia'); }
        });
    }

    // Usuwanie badania
    const handleDelete = async (id) => {
        if (!confirm("Czy na pewno chcesz usunąć to badanie?")) return;
        try {
            const res = await fetch(`/api/badania/${id}`, { method: 'DELETE' });
            if (res.ok) loadBadania();
            else alert("Błąd usuwania");
        } catch (err) { console.error(err); }
    };

    // Otwieranie modala edycji
    const handleEditOpen = (id, allBadania) => {
        const badanie = allBadania.find(b => b._id === id);
        if (!badanie) return;

        document.getElementById('editBadanieId').value = badanie._id;
        document.getElementById('editBadanieKod').value = badanie.kod;
        document.getElementById('editBadanieTytul').value = badanie.tytul;
        document.getElementById('editBadanieOpis').value = badanie.opis;
        document.getElementById('editBadanieTytulOferty').value = badanie.tytulOferty;
        // Konwersja tablicy na string z nowymi liniami
        document.getElementById('editBadanieListaOferty').value = badanie.listaOferty ? badanie.listaOferty.join('\n') : '';
        
        document.getElementById('editBadanieIkona').value = '';
        document.getElementById('editBadanieObraz').value = '';

        const modalEl = document.getElementById('editBadanieModal');
        editModalInstance = new mdb.Modal(modalEl);
        editModalInstance.show();
    };

    // Zapis edycji
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editBadanieId').value;
            const formData = new FormData();
            
            formData.append('kod', document.getElementById('editBadanieKod').value);
            formData.append('tytul', document.getElementById('editBadanieTytul').value);
            formData.append('opis', document.getElementById('editBadanieOpis').value);
            formData.append('tytulOferty', document.getElementById('editBadanieTytulOferty').value);
            formData.append('listaOferty', document.getElementById('editBadanieListaOferty').value);

            const ikonaFile = document.getElementById('editBadanieIkona').files[0];
            const obrazFile = document.getElementById('editBadanieObraz').files[0];
            if (ikonaFile) formData.append('ikona', ikonaFile);
            if (obrazFile) formData.append('obraz', obrazFile);

            try {
                const res = await fetch(`/api/badania/${id}`, { method: 'PUT', body: formData });
                if (res.ok) {
                    alert("Zaktualizowano!");
                    if (editModalInstance) editModalInstance.hide();
                    loadBadania();
                } else { alert("Błąd aktualizacji"); }
            } catch (err) { console.error(err); }
        });
    }

    loadBadania();
}

// --- OBSŁUGA CENNIKA ---
async function initCennik() {
    const addForm = document.getElementById('cennikForm');
    const listContainer = document.getElementById('cennik-list');
    const editForm = document.getElementById('editCennikForm');
    let editModalInstance = null;

    // Pobieranie i wyświetlanie listy
    const loadCennik = async () => {
        if (!listContainer) return;
        listContainer.innerHTML = '<p>Ładowanie...</p>';
        try {
            const res = await fetch('/api/cennik');
            const cennik = await res.json();

            listContainer.innerHTML = '';
            cennik.forEach(kat => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                col.innerHTML = `
                    <div class="card h-100">
                        <div class="card-header d-flex align-items-center">
                            <img src="${kat.ikona}" alt="ikona" style="width: 30px; height: 30px; object-fit: contain;" class="me-2">
                            <h5 class="mb-0 text-truncate">${kat.kategoria}</h5>
                        </div>
                        <div class="card-body">
                            <p class="text-muted small mb-2">Kod: <strong>${kat.kod}</strong></p>
                            <p class="small">Liczba badań: ${kat.badania ? kat.badania.length : 0}</p>
                            <div class="d-flex justify-content-between mt-3">
                                <button class="btn btn-sm btn-primary btn-edit-cennik" data-id="${kat._id}">Edytuj</button>
                                <button class="btn btn-sm btn-danger btn-delete-cennik" data-id="${kat._id}">Usuń</button>
                            </div>
                        </div>
                    </div>
                `;
                listContainer.appendChild(col);
            });

            document.querySelectorAll('.btn-delete-cennik').forEach(btn => {
                btn.addEventListener('click', () => handleDelete(btn.dataset.id));
            });
            document.querySelectorAll('.btn-edit-cennik').forEach(btn => {
                btn.addEventListener('click', () => handleEditOpen(btn.dataset.id, cennik));
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p class="text-danger">Błąd ładowania cennika.</p>';
        }
    };

    // Dodawanie kategorii
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addForm);
            try {
                const res = await fetch('/api/cennik', { method: 'POST', body: formData });
                if (res.ok) {
                    alert('Kategoria dodana!');
                    addForm.reset();
                    loadCennik();
                } else {
                    const txt = await res.text();
                    alert('Błąd: ' + txt);
                }
            } catch (err) { console.error(err); alert('Błąd połączenia'); }
        });
    }

    // Usuwanie kategorii
    const handleDelete = async (id) => {
        if (!confirm("Czy na pewno chcesz usunąć tę kategorię i wszystkie jej badania?")) return;
        try {
            const res = await fetch(`/api/cennik/${id}`, { method: 'DELETE' });
            if (res.ok) loadCennik();
            else alert("Błąd usuwania");
        } catch (err) { console.error(err); }
    };

    // Otwieranie modala edycji
    const handleEditOpen = (id, allCennik) => {
        const kat = allCennik.find(c => c._id === id);
        if (!kat) return;

        document.getElementById('editCennikId').value = kat._id;
        document.getElementById('editCennikKategoria').value = kat.kategoria;
        document.getElementById('editCennikKod').value = kat.kod;
        
        // Konwersja tablicy obiektów {nazwa, cena} na string "Nazwa Cena" w nowych liniach
        const badaniaText = kat.badania ? kat.badania.map(b => `${b.nazwa} ${b.cena}`).join('\n') : '';
        document.getElementById('editCennikBadania').value = badaniaText;
        
        document.getElementById('editCennikIkona').value = '';

        const modalEl = document.getElementById('editCennikModal');
        editModalInstance = new mdb.Modal(modalEl);
        editModalInstance.show();
    };

    // Zapis edycji
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editCennikId').value;
            const formData = new FormData();
            
            formData.append('kategoria', document.getElementById('editCennikKategoria').value);
            formData.append('kod', document.getElementById('editCennikKod').value);
            formData.append('badania', document.getElementById('editCennikBadania').value);

            const ikonaFile = document.getElementById('editCennikIkona').files[0];
            if (ikonaFile) formData.append('ikona', ikonaFile);

            try {
                const res = await fetch(`/api/cennik/${id}`, { method: 'PUT', body: formData });
                if (res.ok) {
                    alert("Zaktualizowano!");
                    if (editModalInstance) editModalInstance.hide();
                    loadCennik();
                } else { alert("Błąd aktualizacji"); }
            } catch (err) { console.error(err); }
        });
    }

    loadCennik();
}

// --- OBSŁUGA STOPKI ---
async function initFooter() {
    const form = document.getElementById('form-edycja-stopka');
    if (!form) return;

    try {
        const res = await fetch('/api/tresci?strona=stopka');
        const data = await res.json();
        if (data && data.length > 0 && data[0].footer) {
            updateField('footer-tytul', data[0].footer.tytul);
            updateField('footer-tresc', data[0].footer.tresc);
        }
    } catch (err) { console.error(err); }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            strona: 'stopka',
            footer: {
                tytul: document.getElementById('footer-tytul').value,
                tresc: document.getElementById('footer-tresc').value
            }
        };
        try {
            const res = await fetch('/api/tresci', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) alert("Zapisano stopkę!");
            else alert("Błąd zapisu.");
        } catch (err) { console.error(err); }
    });
}

// --- OBSŁUGA GRAFIK (TŁO, BANERY, IKONA) ---
async function initImages() {
    const form = document.getElementById('form-edycja-zdjecia');
    if (!form) return;

    // Funkcja pomocnicza do wyświetlania podglądu
    const showPreview = (id, src) => {
        const el = document.getElementById(id);
        if (el && src) {
            el.innerHTML = `Aktualny plik: <a href="${src}" target="_blank">Podgląd</a>`;
        }
    };

    // Pobierz aktualne dane
    try {
        const res = await fetch('/api/tresci?strona=zdjecia');
        const data = await res.json();
        
        if (data && data.length > 0) {
            const imgData = data[0];
            if (imgData.jpg) {
                showPreview('preview-tlo', imgData.jpg.tlo);
                showPreview('preview-baner1', imgData.jpg.baner1);
                showPreview('preview-baner2', imgData.jpg.baner2);
            }
            if (imgData.svg) {
                showPreview('preview-ikona', imgData.svg.ikona);
            }
        }
    } catch (err) { console.error("Błąd pobierania zdjęć:", err); }

    // Obsługa zapisu
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();

        const appendFile = (name, id) => {
            const fileInput = document.getElementById(id);
            if (fileInput && fileInput.files[0]) {
                formData.append(name, fileInput.files[0]);
            }
        };

        appendFile('tlo', 'img-tlo');
        appendFile('ikona', 'img-ikona');
        appendFile('baner1', 'img-baner1');
        appendFile('baner2', 'img-baner2');

        try {
            const res = await fetch('/api/images', { method: 'PUT', body: formData });
            if (res.ok) {
                alert("Zapisano grafiki!");
                location.reload();
            } else {
                alert("Błąd zapisu grafik.");
            }
        } catch (err) { console.error(err); alert("Błąd połączenia."); }
    });
}

// --- OBSŁUGA KONTAKTU ---
async function initContact() {
    const form = document.getElementById('form-edycja-kontakt');
    if (!form) return;

    try {
        const res = await fetch('/api/kontakt');
        const data = await res.json();
        if (data) {
            updateField('kontakt-telefon', data.telefon);
            updateField('kontakt-email', data.email);
            updateField('kontakt-mapa', data.mapa);
            if (data.adres) {
                updateField('kontakt-ulica', data.adres.ulica);
                updateField('kontakt-miasto', data.adres.miasto);
                updateField('kontakt-kod', data.adres.kod);
            }
            if (data.godziny) {
                updateField('kontakt-pn-pt', data.godziny.pn_pt);
                updateField('kontakt-sob', data.godziny.sob);
                updateField('kontakt-nd', data.godziny.nd);
            }
        }
    } catch (err) { console.error(err); }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            typ: 'glowny',
            telefon: document.getElementById('kontakt-telefon').value,
            email: document.getElementById('kontakt-email').value,
            mapa: document.getElementById('kontakt-mapa').value,
            adres: {
                ulica: document.getElementById('kontakt-ulica').value,
                miasto: document.getElementById('kontakt-miasto').value,
                kod: document.getElementById('kontakt-kod').value
            },
            godziny: {
                pn_pt: document.getElementById('kontakt-pn-pt').value,
                sob: document.getElementById('kontakt-sob').value,
                nd: document.getElementById('kontakt-nd').value
            }
        };
        try {
            const res = await fetch('/api/kontakt', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) alert("Zapisano dane kontaktowe!");
            else alert("Błąd zapisu.");
        } catch (err) { console.error(err); }
    });
}