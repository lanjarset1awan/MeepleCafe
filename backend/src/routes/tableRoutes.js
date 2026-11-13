import express from "express";
import { TableController } from "../controllers/tableController.js";

const router = express.Router();

router.get("/", TableController.getAll);
router.get("/:id", TableController.getById);
router.post("/", TableController.create);
router.put("/:id", TableController.update);
router.delete("/:id", TableController.remove);

export default router;

