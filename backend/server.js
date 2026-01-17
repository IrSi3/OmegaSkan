const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer');
const cors = require("cors");
require("dotenv").config();
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
  sekcja: {
    tytul: String,
    podtytul: String,
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
