import express from "express";
import { body } from "express-validator";
import { login, getme, changePassword } from "../controllers/authController.js";
import auth from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const loginValidation = [
    body("userId").notEmpty().withMessage("User Id is required"),
    body("password").notEmpty().withMessage("Password is required").isLength({ min: 6, max: 8 }).withMessage("Passsword length should be min 6 and max 8")
]

const changePasswordValidation = [
    body("newPasword").notEmpty().withMessage("Password is required").isLength({ min: 6, max: 8 })
        .withMessage("Passsword length should be min 6 and max 8")
]

router.post('/login', loginValidation, validate, login);

router.patch('/change-password', auth, changePasswordValidation, validate, changePassword);

router.get('/me', auth, getme);

export default router;