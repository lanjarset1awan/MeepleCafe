import express from "express";
import { AuthController } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/users", AuthController.getAllUsers);
router.get("/profile/:id", AuthController.getProfile);

export default router;
