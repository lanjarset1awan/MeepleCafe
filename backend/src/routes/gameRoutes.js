import express from "express";
import { GameController } from "../controllers/gameController.js";

const router = express.Router();

router.get("/", GameController.getAll);
router.get("/:id", GameController.getById);
router.post("/upload-image", GameController.uploadImage);
router.post("/", GameController.create);
router.put("/:id", GameController.update);
router.delete("/:id", GameController.remove);

export default router;

