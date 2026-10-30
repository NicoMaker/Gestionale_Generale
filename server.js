import { join } from "node:path";
import express from "express";
import apiRoutes from "./src/routes/api.js";
import { initDb } from "./src/db/init.js";
import { stampaAvvio } from "./src/config/rete.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use("/api", apiRoutes);
app.use("/img", express.static(join(import.meta.dirname, "img")));
app.use(express.static(join(import.meta.dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status ?? 400).json({ error: err.message });
});

try {
  await initDb();
  app.listen(PORT, "0.0.0.0", () => stampaAvvio(PORT));
} catch (e) {
  console.error("Errore init DB:", e);
  process.exit(1);
}
