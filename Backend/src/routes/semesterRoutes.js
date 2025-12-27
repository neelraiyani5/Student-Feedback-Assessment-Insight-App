import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createSemester } from "../controllers/semesterController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const createSemesterValidation = [
    body("sem").notEmpty().withMessage("Semester is required").isNumeric().withMessage("Sem value must be integer"),
    body("departmentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

router.post('/create', auth, role("HOD"), createSemesterValidation, validate, createSemester );

export default router;
