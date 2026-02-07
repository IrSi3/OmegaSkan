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
    pobierzObrazy();
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
        //Formatowanie numeru telefony
        setupPhoneFormatting();

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

// Funkcja do formatowania numeru
function setupPhoneFormatting() {
    const phoneInput = document.getElementById('form-phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
        // 1. Usuń wszystko co nie jest cyfrą
        let value = e.target.value.replace(/\D/g, '');
        
        // 2. Ogranicz do 9 cyfr
        value = value.substring(0, 9);
        
        // 3. Dodaj myślniki (format XXX-XXX-XXX)
        let formattedValue = "";
        if (value.length > 0) {
            formattedValue = value.substring(0, 3);
        }
        if (value.length >= 4) {
            formattedValue += '-' + value.substring(3, 6);
        }
        if (value.length >= 7) {
            formattedValue += '-' + value.substring(6, 9);
        }
        
        e.target.value = formattedValue;
    });
}

function setupFormSubmit() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Pobieranie nowych pól
        const firstName = document.getElementById('form-first-name').value;
        const lastName = document.getElementById('form-last-name').value;
        const email = document.getElementById('form-email').value;
        const phone = document.getElementById('form-phone').value;
        const message = document.getElementById('form-message').value;
        
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

        const submitBtn = document.getElementById('button');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Wysyłanie...";
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: `${firstName} ${lastName}`, // Łączymy w jedno 'name' dla backendu lub zmieniamy backend
                    firstName, 
                    lastName, 
                    email, 
                    phone, 
                    message, 
                    captchaToken 
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                contactForm.reset();
                grecaptcha.reset(recaptchaWidgetId);
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