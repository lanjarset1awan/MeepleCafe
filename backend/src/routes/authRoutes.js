import express from "express";
import { AuthController } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/users", AuthController.getAllUsers);
router.get("/profile/:id", AuthController.getProfile);
router.put("/profile/:id", AuthController.updateProfile);
router.post("/upload-avatar", AuthController.uploadAvatar);
router.delete("/profile/:id/avatar", AuthController.deleteAvatar);

export default router;
