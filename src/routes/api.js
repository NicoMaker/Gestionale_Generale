import { Router } from "express";
import * as c from "../controllers/crud.controller.js";
import * as x from "../controllers/export.controller.js";

const router = Router();

router.get("/modules", c.modules);
router.get("/tables", c.listTables);
router.get("/stats", c.stats);
router.get("/dashboard", c.dashboard);
router.get("/modules/:id/summary", c.moduleSummary);

// Esportazioni (CSV, Excel, PDF) e copia del database
router.get("/export/tables/:table/:formato", x.tabella);
router.get("/export/modules/:id/:formato", x.modulo);
router.get("/export/all/xlsx", x.tutto);
router.get("/backup", x.backup);

router.get("/tables/:table/meta", c.loadTable, c.meta);
router.get("/tables/:table/options", c.loadTable, c.options);
router.get("/tables/:table", c.loadTable, c.list);
router.post("/tables/:table", c.loadTable, c.create);
router.post("/tables/:table/elimina", c.loadTable, c.removeMany);
router.get("/tables/:table/:id", c.loadTable, c.getOne);
router.put("/tables/:table/:id", c.loadTable, c.update);
router.delete("/tables/:table/:id", c.loadTable, c.remove);

export default router;
