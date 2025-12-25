import express from "express";
import { login, getme, changePassword } from "../controllers/authController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post('/login', login);
router.post('/change-password', auth, changePassword);

router.get('/me', auth, getme);

export default router;