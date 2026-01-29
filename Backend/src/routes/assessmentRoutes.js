import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import validate from "../middlewares/validate.js";
import { createAssessment, deleteAssessment, subjectAssessmentList, updateAssessment } from "../controllers/assessmentController.js";
const router = express.Router();

const createValidation = [
    body("title").notEmpty().withMessage("Title is required is required"),
    body("component").notEmpty().withMessage("Component is required").isIn(["IA", "CSE", "ESE"]).withMessage("Invalid Component!!!"),
    body("maxMarks").notEmpty().withMessage("maxMarks is required").isNumeric().withMessage("maxMarks value must be integer"),
    body("subjectId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("classId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

const updateValidation = [
    body("title").notEmpty().withMessage("Title is required is required"),
    body("component").notEmpty().withMessage("Component is required").isIn(["IA", "CSE", "ESE"]).withMessage("Invalid Component!!!"),
    body("maxMarks").notEmpty().withMessage("Maxmarks is required").isNumeric().withMessage("Maxmarks value must be integer")
]

router.post('/create', auth, role("FACULTY", "CC", "HOD"), createValidation, validate, createAssessment);

router.get('/list/:classId/:subjectId', auth, role("STUDENT", "FACULTY", "CC", "HOD"), subjectAssessmentList);

router.patch('/update/:assessmentId', auth, role("FACULTY", "CC", "HOD"), updateValidation, validate, updateAssessment);

router.delete('/delete/:assessmentId', auth, role("FACULTY", "CC", "HOD"), deleteAssessment);

export default router;
