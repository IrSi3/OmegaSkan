const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer');
const cors = require("cors");
require("dotenv").config();
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require("path");
const tempPath = path.join(__dirname, "../");
const frontendPath = path.join(tempPath, "/frontend");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Połączenie z MongoDB Atlas
const uri = process.env.MONGO_URI; // To zdefiniujesz w pliku .env
mongoose
  .connect(uri, { dbName: "omegaskan_db" })
  .then(() => console.log("Połączono z MongoDB Atlas"))
  .catch((err) => console.log("Błąd połączenia:", err));

app.use(express.static(frontendPath));

// Schemat dla Treści Stron
const trescSchema = new mongoose.Schema({
  strona: String,
  oNas: {
    tytul: String,
    podtytul: String,
    tresc: String,
  },
  karuzele: {
    lekarze: String,
    technicy: String
  },
   footer: {
    tytul: String,
    tresc: String,
  },
});
const Tresc = mongoose.model("Tresc", trescSchema, "pages_content");

// Schemat dla Danych Kontaktowych
const kontaktSchema = new mongoose.Schema({
  typ: String,
  telefon: String,
  email: String,
  adres: {
    ulica: String,
    miasto: String,
    kod: String,
  },
  godziny: {
    pn_pt: String,
    sob: String,
    nd: String,
  },
  mapa: String,
});
const Kontakt = mongoose.model("Kontakt", kontaktSchema, "contact_info");

// Schemat dla Pracownikow
const workerSchema = new mongoose.Schema({
  type: String,
  name: String,
  role: String,
  image: String,
});
const Worker = mongoose.model("Worker", workerSchema, "worker_info");

// Schemat dla Badań (Examinations)
const badanieSchema = new mongoose.Schema({
  kod: String,        // np. 'MRI' - identyfikator sekcji
  tytul: String,      // np. 'REZONANS MAGNETYCZNY'
  ikona: String,      // Base64
  obraz: String,      // Base64
  opis: String,       // tekst na overlayu zdjęcia
  tytulOferty: String,// nagłówek listy np. 'W naszej ofercie...'
  listaOferty: [String] // tablica punktów oferty
});
const Badanie = mongoose.model("Badanie", badanieSchema, "badania_info");

// Schemat dla Cennika
const cennikSchema = new mongoose.Schema({
  kategoria: String,  // np. 'Cennik badań MR'
  kod: String,        // np. 'MRI' - unikalny identyfikator do HTML
  ikona: String,      // Base64
  badania: [{ nazwa: String, cena: String }]
});
const Cennik = mongoose.model("Cennik", cennikSchema, "cennik_info");

// Konfiguracja Multer (do przechowywania pliku w pamięci RAM przed zapisem do bazy)
const upload = multer({ storage: multer.memoryStorage() });

// Pobierz treści dla konkretnej strony

app.get("/api/tresci", async (req, res) => {
  try {
    const { strona } = req.query;
    const query = strona ? { strona: strona } : {};
    const tresci = await Tresc.find(query);
    res.json(tresci);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pobierz dane kontaktowe
app.get("/api/kontakt", async (req, res) => {
  try {
    const kontakt = await Kontakt.findOne({ typ: "glowny" });
    res.json(kontakt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pobierz dane pracownikow
app.get('/api/workers', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type: type } : {};
    const workers = await Worker.find(query);
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pobierz listę badań
app.get('/api/badania', async (req, res) => {
  try {
    const badania = await Badanie.find({});
    res.json(badania);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pobierz cennik
app.get('/api/cennik', async (req, res) => {
  try {
    const cennik = await Cennik.find({});
    res.json(cennik);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/cennik", (req, res) => {
  res.sendFile(path.join(frontendPath, "cennik.html"));
});

app.get("/kontakt", (req, res) => {
  res.sendFile(path.join(frontendPath, "kontakt.html"));
});

app.get("/badania", (req, res) => {
  res.sendFile(path.join(frontendPath, "badania.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Serwer OmegaSkan działa na porcie http://localhost:${PORT}`);
});


// Dodawanie TYMCZASOWE
app.post('/api/workers', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Brak zdjęcia');

    // Konwersja zdjęcia na Base64
    const imgBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const newWorker = new Worker({
      name: req.body.name,
      role: req.body.role,
      type: req.body.type,
      image: imgBase64
    });

    await newWorker.save();
    res.status(201).send('Dodano pracownika do bazy!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Dodaj nowe badanie (z dwoma plikami: ikona i obraz)
app.post('/api/badania', upload.fields([{ name: 'ikona', maxCount: 1 }, { name: 'obraz', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files;
    if (!files || !files['ikona'] || !files['obraz']) {
      return res.status(400).send('Wymagane są oba pliki: ikona i obraz.');
    }

    // Konwersja plików na Base64
    const ikonaBase64 = `data:${files['ikona'][0].mimetype};base64,${files['ikona'][0].buffer.toString('base64')}`;
    const obrazBase64 = `data:${files['obraz'][0].mimetype};base64,${files['obraz'][0].buffer.toString('base64')}`;

    // Przetwarzanie listy oferty (zakładamy, że przychodzi jako string rozdzielony nowymi liniami)
    const listaOfertyArray = req.body.listaOferty ? req.body.listaOferty.split('\n').map(item => item.trim()).filter(i => i) : [];

    const noweBadanie = new Badanie({
      kod: req.body.kod,
      tytul: req.body.tytul,
      ikona: ikonaBase64,
      obraz: obrazBase64,
      opis: req.body.opis,
      tytulOferty: req.body.tytulOferty,
      listaOferty: listaOfertyArray
    });

    await noweBadanie.save();
    res.status(201).send('Dodano badanie do bazy!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Dodaj kategorię cennika
app.post('/api/cennik', upload.single('ikona'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Wymagana jest ikona.');

    const ikonaBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Parsowanie listy badań (format: "Nazwa badania Cena")
    const badaniaRaw = req.body.badania || "";
    const badaniaList = badaniaRaw.split('\n').filter(line => line.trim() !== '').map(line => {
        const trimmedLine = line.trim();
        // Regex łapie wszystko do ostatniej spacji jako nazwę, a resztę (cyfry i ew. zł) jako cenę
        const match = trimmedLine.match(/(.*)\s+(\d[\d\s.,]*\s*zł?)$/);
        return match ? { nazwa: match[1].trim(), cena: match[2].trim() } : { nazwa: trimmedLine, cena: "" };
    });

    const nowyCennik = new Cennik({
      kategoria: req.body.kategoria,
      kod: req.body.kod || Math.random().toString(36).substr(2, 5), // Generuj kod jeśli brak
      ikona: ikonaBase64,
      badania: badaniaList
    });

    await nowyCennik.save();
    res.status(201).send('Dodano kategorię cennika!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Endpoint: Formularz Kontaktowy ---
app.post('/api/contact/send', async (req, res) => {
  // Wyciągamy nowe pola przesłane z frontendu (js/kontakt.js)
  const { firstName, lastName, email, phone, message, captchaToken } = req.body;

  // 1. Walidacja danych - sprawdzamy nowe pola
  if (!firstName || !lastName || !email || !phone || !message || !captchaToken) {
    return res.status(400).json({ message: 'Wypełnij wszystkie pola i zaznacz "Nie jestem robotem".' });
  }

  try {
    // 2. Weryfikacja reCAPTCHA (bez zmian)
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const captchaRes = await axios.post(verifyUrl);

    if (!captchaRes.data.success) {
      return res.status(400).json({ message: 'Błąd weryfikacji Captcha. Spróbuj ponownie.' });
    }

    // 3. Konfiguracja Transportera (wykorzystuje Twoje zmienne z .env)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 4. Treść wiadomości - tutaj konfigurujesz wygląd maila
    const mailOptions = {
      from: `"Formularz OmegaSkan" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TARGET,
      replyTo: email,
      subject: `Nowa wiadomość od: ${firstName} ${lastName}`,
      text: `Otrzymałeś nową wiadomość.\n\nImię: ${firstName}\nNazwisko: ${lastName}\nEmail: ${email}\nTelefon: ${phone}\n\nTreść:\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #007bff;">Nowa wiadomość ze strony OmegaSkan</h2>
          <p><strong>Dane pacjenta:</strong></p>
          <ul>
            <li><strong>Imię i nazwisko:</strong> ${firstName} ${lastName}</li>
            <li><strong>Adres e-mail:</strong> ${email}</li>
            <li><strong>Numer telefonu:</strong> ${phone}</li>
          </ul>
          <p><strong>Treść wiadomości:</strong></p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007bff;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `
    };

    // 5. Wyślij
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Wiadomość została wysłana pomyślnie!' });

  } catch (error) {
    console.error('Błąd wysyłania maila:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas wysyłania wiadomości.' });
  }
});