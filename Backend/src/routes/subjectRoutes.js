import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createSubject, assignFaculty } from "../controllers/subjectController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const createSubjectValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("semesterId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

const assignFacultyValidation = [
    body("subjectId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("facultyId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

router.post('/create', auth, role("CC", "HOD"), createSubjectValidation, validate, createSubject);

router.patch('/assign-faculty', auth, role("CC", "HOD"), assignFacultyValidation, validate, assignFaculty);

export default router;
