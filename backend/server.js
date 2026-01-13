const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Połączenie z MongoDB Atlas
const uri = process.env.MONGO_URI; // To zdefiniujesz w pliku .env
mongoose
  .connect(uri)
  .then(() => console.log("Połączono z MongoDB Atlas"))
  .catch((err) => console.log("Błąd połączenia:", err));

// Schemat danych (Model) - przykład dla 'Badania'
const badanieSchema = new mongoose.Schema({
  nazwa: String,
  opis: String,
  cena: Number,
  zdjecieUrl: String, // Ścieżka do zdjęcia
});

const Badanie = mongoose.model("Badanie", badanieSchema);

// Endpoint API (Pobieranie danych)
app.get("/api/badania", async (req, res) => {
  try {
    const badania = await Badanie.find();
    res.json(badania);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
