const router = require("express").Router();
const c = require("../controllers/crud.controller");

router.get("/modules", c.modules);
router.get("/tables", c.listTables);
router.get("/stats", c.stats);
router.get("/dashboard", c.dashboard);
router.get("/schema/mmd", c.schemaMmd);

router.get("/tables/:table/meta", c.loadTable, c.meta);
router.get("/tables/:table/options", c.loadTable, c.options);
router.get("/tables/:table", c.loadTable, c.list);
router.post("/tables/:table", c.loadTable, c.create);
router.get("/tables/:table/:id", c.loadTable, c.getOne);
router.put("/tables/:table/:id", c.loadTable, c.update);
router.delete("/tables/:table/:id", c.loadTable, c.remove);

module.exports = router;
