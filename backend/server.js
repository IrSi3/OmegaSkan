const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const multer = require('multer');
const cors = require("cors");
require("dotenv").config();
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require("path");
const frontendPath = path.join(__dirname, "../frontend");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Połączenie z MongoDB Atlas
const uri = process.env.MONGO_URI;
mongoose
  .connect(uri, { dbName: "omegaskan_db" })
  .then(() => console.log("Połączono z MongoDB Atlas"))
  .catch((err) => console.log("Błąd połączenia:", err));

// Middleware Basic Auth - zabezpieczenie hasłem
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Panel Administratora"');
    return res.status(401).send('Wymagane uwierzytelnienie');
  }

  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];

  // Dane logowania z .env
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (user === adminUser && pass === adminPass) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Panel Administratora"');
    return res.status(401).send('Nieprawidłowe dane logowania');
  }
};
// Zabezpieczamy bezpośredni dostęp do pliku admin.html przed express.static
app.use("/admin.html", basicAuth);

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
  jpg: {
    tlo: String,
    baner1: String,
    baner2: String,
  },
  svg:{
    ikona: String,
  }
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
  kod: String,    
  tytul: String,    
  ikona: String,    
  obraz: String,    
  opis: String,     
  tytulOferty: String,
  listaOferty: [String] 
});
const Badanie = mongoose.model("Badanie", badanieSchema, "badania_info");

// Schemat dla Cennika
const cennikSchema = new mongoose.Schema({
  kategoria: String, 
  kod: String,       
  ikona: String,   
  badania: [{ nazwa: String, cena: String }]
});
const Cennik = mongoose.model("Cennik", cennikSchema, "cennik_info");

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

app.get("/admin", basicAuth, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});


app.listen(PORT, () => {
  console.log(`Serwer OmegaSkan działa na porcie http://localhost:${PORT}`);
});


// --- Endpoint: Formularz Kontaktowy ---
app.post('/api/contact/send', async (req, res) => {
  // Wyciągamy nowe pola przesłane z frontendu (js/kontakt.js)
  const { firstName, lastName, email, phone, message, captchaToken } = req.body;

  // Walidacja danych
  if (!firstName || !lastName || !email || !phone || !message || !captchaToken) {
    return res.status(400).json({ message: 'Wypełnij wszystkie pola i zaznacz "Nie jestem robotem".' });
  }

  try {
    // Weryfikacja reCAPTCHA 
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const captchaRes = await axios.post(verifyUrl);

    if (!captchaRes.data.success) {
      return res.status(400).json({ message: 'Błąd weryfikacji Captcha. Spróbuj ponownie.' });
    }

    // Konfiguracja Transportera
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Treść wiadomości
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

    // Wyślij
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Wiadomość została wysłana pomyślnie!' });

  } catch (error) {
    console.error('Błąd wysyłania maila:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas wysyłania wiadomości.' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    // Jeśli zapytanie dotyczy pracowników, zapisz w podfolderze
    if (req.originalUrl.includes('/api/workers')) {
        uploadPath = path.join(__dirname, 'uploads/pracownicy');
    } else if (req.originalUrl.includes('/api/badania')) {
        uploadPath = path.join(__dirname, 'uploads/badania');
    } else if (req.originalUrl.includes('/api/cennik')) {
        uploadPath = path.join(__dirname, 'uploads/cennik');
    } else if (req.originalUrl.includes('/api/images')) {
        uploadPath = path.join(__dirname, 'uploads/img');
    }
    
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generujemy unikalną nazwę: timestamp-oryginalnaNazwa
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Aktualizacja treści stron (np. O Nas na stronie głównej)
app.put('/api/tresci', basicAuth, async (req, res) => {
  try {
    const { strona, ...resztaDanych } = req.body;

    if (!strona) {
      return res.status(400).send("Brak parametru 'strona' identyfikującego sekcję.");
    }

    const result = await Tresc.findOneAndUpdate(
      { strona: strona },
      { $set: resztaDanych }, // Aktualizuje tylko przesłane pola (np. oNas)
      { new: true, upsert: true }
    );

    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Aktualizacja zdjęć strony (Tło, Banery, Ikona)
app.put('/api/images', basicAuth, upload.fields([
  { name: 'tlo', maxCount: 1 },
  { name: 'baner1', maxCount: 1 },
  { name: 'baner2', maxCount: 1 },
  { name: 'ikona', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files || {};
    const updates = {};

    const currentData = await Tresc.findOne({ strona: 'zdjecia' });

    if (files['tlo']) {
      if (currentData && currentData.jpg && currentData.jpg.tlo) {
        const oldPath = path.join(__dirname, currentData.jpg.tlo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates['jpg.tlo'] = '/uploads/img/' + files['tlo'][0].filename;
    }
    if (files['baner1']) {
      if (currentData && currentData.jpg && currentData.jpg.baner1) {
        const oldPath = path.join(__dirname, currentData.jpg.baner1);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates['jpg.baner1'] = '/uploads/img/' + files['baner1'][0].filename;
    }
    if (files['baner2']) {
      if (currentData && currentData.jpg && currentData.jpg.baner2) {
        const oldPath = path.join(__dirname, currentData.jpg.baner2);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates['jpg.baner2'] = '/uploads/img/' + files['baner2'][0].filename;
    }
    if (files['ikona']) {
      if (currentData && currentData.svg && currentData.svg.ikona) {
        const oldPath = path.join(__dirname, currentData.svg.ikona);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates['svg.ikona'] = '/uploads/img/' + files['ikona'][0].filename;
    }

    const result = await Tresc.findOneAndUpdate(
      { strona: 'zdjecia' },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Aktualizacja danych kontaktowych
app.put('/api/kontakt', basicAuth, async (req, res) => {
  try {
    const updateData = req.body;
    // Upewnij się, że aktualizujemy dokument główny (typ: "glowny")
    const result = await Kontakt.findOneAndUpdate(
      { typ: "glowny" },
      { $set: updateData },
      { new: true, upsert: true } // Tworzy dokument, jeśli nie istnieje
    );
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Dodawanie pracownika (Zapis pliku na dysku)
app.post('/api/workers', basicAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Brak zdjęcia');

    // Ścieżka do pliku, którą zapiszemy w bazie (dostępna publicznie)
    const imagePath = '/uploads/pracownicy/' + req.file.filename;

    const newWorker = new Worker({
      name: req.body.name,
      role: req.body.role,
      type: req.body.type,
      image: imagePath
    });

    await newWorker.save();
    res.status(201).send('Dodano pracownika do bazy!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Edycja pracownika
app.put('/api/workers/:id', basicAuth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      name: req.body.name,
      role: req.body.role,
      type: req.body.type
    };

    // Jeśli przesłano nowe zdjęcie, zaktualizuj ścieżkę
    if (req.file) {
      const worker = await Worker.findById(id);
      if (worker && worker.image) {
        const oldPath = path.join(__dirname, worker.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.image = '/uploads/pracownicy/' + req.file.filename;
    }

    await Worker.findByIdAndUpdate(id, updates);
    res.status(200).send('Zaktualizowano pracownika');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Usuwanie pracownika
app.delete('/api/workers/:id', basicAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await Worker.findByIdAndDelete(id);
    
    if (worker && worker.image) {
      // Usuń plik z dysku
      const filePath = path.join(__dirname, worker.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.status(200).send('Usunięto pracownika');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Dodaj nowe badanie (z dwoma plikami: ikona i obraz)
app.post('/api/badania', basicAuth, upload.fields([{ name: 'ikona', maxCount: 1 }, { name: 'obraz', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files;
    if (!files || !files['ikona'] || !files['obraz']) {
      return res.status(400).send('Wymagane są oba pliki: ikona i obraz.');
    }

    // Zapisujemy ścieżki do plików
    const ikonaPath = '/uploads/badania/' + files['ikona'][0].filename;
    const obrazPath = '/uploads/badania/' + files['obraz'][0].filename;

    // Przetwarzanie listy oferty (zakładamy, że przychodzi jako string rozdzielony nowymi liniami)
    const listaOfertyArray = req.body.listaOferty ? req.body.listaOferty.split('\n').map(item => item.trim()).filter(i => i) : [];

    const noweBadanie = new Badanie({
      kod: req.body.kod,
      tytul: req.body.tytul,
      ikona: ikonaPath,
      obraz: obrazPath,
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

// Edycja badania
app.put('/api/badania/:id', basicAuth, upload.fields([{ name: 'ikona', maxCount: 1 }, { name: 'obraz', maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || {};
    
    const updates = {
      kod: req.body.kod,
      tytul: req.body.tytul,
      opis: req.body.opis,
      tytulOferty: req.body.tytulOferty,
      listaOferty: req.body.listaOferty ? req.body.listaOferty.split('\n').map(item => item.trim()).filter(i => i) : []
    };

    const badanie = await Badanie.findById(id);

    // Jeśli przesłano nową ikonę
    if (files['ikona']) {
      if (badanie && badanie.ikona) {
        const oldPath = path.join(__dirname, badanie.ikona);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.ikona = '/uploads/badania/' + files['ikona'][0].filename;
    }
    // Jeśli przesłano nowy obraz
    if (files['obraz']) {
      if (badanie && badanie.obraz) {
        const oldPath = path.join(__dirname, badanie.obraz);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.obraz = '/uploads/badania/' + files['obraz'][0].filename;
    }

    await Badanie.findByIdAndUpdate(id, updates);
    res.status(200).send('Zaktualizowano badanie');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Usuwanie badania
app.delete('/api/badania/:id', basicAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const badanie = await Badanie.findByIdAndDelete(id);

    if (badanie) {
      // Usuń pliki z dysku
      if (badanie.ikona && fs.existsSync(path.join(__dirname, badanie.ikona))) 
        fs.unlinkSync(path.join(__dirname, badanie.ikona));
      
      if (badanie.obraz && fs.existsSync(path.join(__dirname, badanie.obraz))) 
        fs.unlinkSync(path.join(__dirname, badanie.obraz));
    }

    res.status(200).send('Usunięto badanie');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Dodaj kategorię cennika
app.post('/api/cennik', basicAuth, upload.single('ikona'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Wymagana jest ikona.');

    const ikonaPath = '/uploads/cennik/' + req.file.filename;
    
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
      ikona: ikonaPath,
      badania: badaniaList
    });

    await nowyCennik.save();
    res.status(201).send('Dodano kategorię cennika!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Edycja kategorii cennika
app.put('/api/cennik/:id', basicAuth, upload.single('ikona'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const updates = {
      kategoria: req.body.kategoria,
      kod: req.body.kod
    };

    // Jeśli przesłano nową ikonę
    if (req.file) {
      const cennik = await Cennik.findById(id);
      if (cennik && cennik.ikona) {
        const oldPath = path.join(__dirname, cennik.ikona);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.ikona = '/uploads/cennik/' + req.file.filename;
    }

    // Parsowanie listy badań (jeśli została przesłana)
    if (req.body.badania) {
        const badaniaRaw = req.body.badania;
        updates.badania = badaniaRaw.split('\n').filter(line => line.trim() !== '').map(line => {
            const trimmedLine = line.trim();
            const match = trimmedLine.match(/(.*)\s+(\d[\d\s.,]*\s*zł?)$/);
            return match ? { nazwa: match[1].trim(), cena: match[2].trim() } : { nazwa: trimmedLine, cena: "" };
        });
    }

    await Cennik.findByIdAndUpdate(id, updates);
    res.status(200).send('Zaktualizowano kategorię cennika');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Usuwanie kategorii cennika
app.delete('/api/cennik/:id', basicAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cennik = await Cennik.findByIdAndDelete(id);
    if (cennik && cennik.ikona && fs.existsSync(path.join(__dirname, cennik.ikona))) {
        fs.unlinkSync(path.join(__dirname, cennik.ikona));
    }
    res.status(200).send('Usunięto kategorię cennika');
  } catch (err) {
    res.status(500).send(err.message);
  }
});
