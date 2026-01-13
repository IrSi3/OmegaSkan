const express = require("express");
const mongoose = require("mongoose");
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
  .connect(uri)
  .then(() => console.log("Połączono z MongoDB Atlas"))
  .catch((err) => console.log("Błąd połączenia:", err));

app.use(express.static(frontendPath));

// Schemat dla Treści Stron
const trescSchema = new mongoose.Schema({
  strona: String, // np. "index", "badania"
  sekcja: String, // np. "about_us", "intro"
  naglowek: String,
  tresc: String,
});
const Tresc = mongoose.model("Tresc", trescSchema);

// Schemat dla Danych Kontaktowych
const kontaktSchema = new mongoose.Schema({
  typ: String, // "glowny"
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
});
const Kontakt = mongoose.model("Kontakt", kontaktSchema);

// Pobierz treści dla konkretnej strony
app.get("/api/tresci", async (req, res) => {
  try {
    const { strona } = req.query; // Pobiera parametr z adresu URL
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
