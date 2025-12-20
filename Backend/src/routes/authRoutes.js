import express from "express";
import {register, login, getme} from "../controllers/authController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', auth, getme);

export default router;