import express from "express";
import { ReservationController } from "../controllers/reservationController.js";

const router = express.Router();

router.get("/availability", ReservationController.checkAvailability);
router.post("/upload-proof", ReservationController.uploadProof);
router.get("/", ReservationController.getAll);
router.get("/:id", ReservationController.getById);
router.post("/", ReservationController.create);
router.patch("/:id/status", ReservationController.updateStatus);
router.put("/:id/status", ReservationController.updateStatus);
router.delete("/:id", ReservationController.remove);

export default router;
