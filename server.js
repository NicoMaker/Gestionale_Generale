const path = require("path");
const express = require("express");
const apiRoutes = require("./src/routes/api");
const { initDb } = require("./src/db/init");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", apiRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message });
});

initDb()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Gestionale su http://localhost:${PORT}`),
    ),
  )
  .catch((e) => {
    console.error("Errore init DB:", e);
    process.exit(1);
  });
