import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { addClass, addStudentToClass, addStudentToPool, classStudents } from "../controllers/classController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const addClassValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("semesterId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

const addStudentToClassValidation = [
    body("studentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("classId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

const addStudentToPoolValidation = [
    body("facultyId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("poolId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

router.post('/add', auth, role("HOD"), addClassValidation, validate, addClass);

router.get('/students/:classId', classStudents);

router.patch('/student/add', auth, role("HOD", "CC"), addStudentToClassValidation, validate, addStudentToClass);

router.patch('/pool/add', auth, role("HOD", "CC"), addStudentToPoolValidation, validate, addStudentToPool);

export default router;
