// Zmienna globalna do przechowywania ID widgetu Captcha
let recaptchaWidgetId;

// Funkcja callback uruchamiana przez Google API po załadowaniu skryptu
function captchaLoaded() {
    console.log("Biblioteka reCAPTCHA załadowana.");
    // Jeśli formularz już jest w HTML, renderujemy captchę. 
    // Jeśli nie (bo fetch jeszcze trwa), renderowanie nastąpi w funkcji initForm.
    const container = document.getElementById('recaptcha-container');
    if (container && !container.hasChildNodes()) {
        renderCaptcha();
    }
}

function renderCaptcha() {
    try {
        // TU WPISZ SWÓJ KLUCZ WITRYNY (SITE KEY)
        const siteKey = "6LcPh1ssAAAAAA_c86VoAgY2nimWWcsvjCIGUs6Q"; 
        
        recaptchaWidgetId = grecaptcha.render('recaptcha-container', {
            'sitekey': siteKey
        });
    } catch (e) {
        console.error("Błąd renderowania Captcha:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadContactForm();
    // Tutaj możesz też wywołać pobierzKontakt() jeśli masz taką funkcję do danych adresowych
});

async function loadContactForm() {
    const placeholder = document.getElementById('formularz-placeholder');
    if (!placeholder) return;

    try {
        // 1. Pobierz plik HTML formularza
        const response = await fetch('formularz_kontaktowy.html');
        if (!response.ok) throw new Error('Nie udało się pobrać formularza');
        
        const html = await response.text();
        placeholder.innerHTML = html;

        // 2. Zainicjuj inputy MDB (animacje etykiet)
        // Musimy to zrobić ręcznie, bo HTML został dodany po załadowaniu strony
        document.querySelectorAll('.form-outline').forEach((formOutline) => {
            new mdb.Input(formOutline).init();
        });

        // 3. Renderuj Captchę (jeśli biblioteka Google jest gotowa)
        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
            renderCaptcha();
        }

        // 4. Podepnij obsługę wysyłania
        setupFormSubmit();

    } catch (error) {
        console.error('Błąd:', error);
        placeholder.innerHTML = '<p class="text-danger">Nie udało się załadować formularza.</p>';
    }
}

function setupFormSubmit() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('form-name').value;
        const email = document.getElementById('form-email').value;
        const message = document.getElementById('form-message').value;
        
        // Pobierz token z wyrenderowanego widgetu
        let captchaToken = null;
        try {
            captchaToken = grecaptcha.getResponse(recaptchaWidgetId);
        } catch(err) {
            console.error("Błąd pobierania tokenu Captcha");
        }

        if (!captchaToken) {
            alert("Proszę potwierdzić, że nie jesteś robotem.");
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Wysyłanie...";
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message, captchaToken })
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                contactForm.reset();
                grecaptcha.reset(recaptchaWidgetId); // Reset captchy
            } else {
                alert("Błąd: " + result.message);
            }
        } catch (error) {
            console.error('Błąd połączenia:', error);
            alert("Nie udało się połączyć z serwerem.");
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}