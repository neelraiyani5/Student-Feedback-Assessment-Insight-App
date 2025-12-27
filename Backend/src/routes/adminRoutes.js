import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createUser, makeCC } from "../controllers/adminController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const createUserValidation = [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Enter valid email"),
    body("role").notEmpty().withMessage("Role is required").isIn(["FACULTY", "STUDENT"]).withMessage("Invalid Role!!!")
]
const ccValidation = [
    body("facultyId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("classId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

router.post('/create', auth, role("HOD", "CC"), createUserValidation, validate, createUser);

router.patch('/make-CC', auth, role("HOD"), ccValidation, validate, makeCC);

export default router;