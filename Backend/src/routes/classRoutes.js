import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { addClass, addStudentToClass, addStudentToPool, classStudents, updateClass, assignCC, createStudent, resetStudentPassword, updateStudent } from "../controllers/classController.js";
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
    body("studentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("poolId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!")
]

const createStudentValidation = [
    body("userId").notEmpty(),
    body("name").notEmpty(),
    body("email").isEmail(),
    body("classId").isLength({ min: 24, max: 24 })
]

const updateStudentValidation = [
    body("studentId").isLength({ min: 24, max: 24 }),
    body("userId").notEmpty(),
    body("name").notEmpty(),
    body("email").isEmail()
]

router.post('/add', auth, role("HOD"), addClassValidation, validate, addClass);

router.patch('/update/:id', auth, role("HOD"), updateClass);
router.patch('/assign-cc', auth, role("HOD"), assignCC);

router.get('/students/:classId', classStudents);

router.post('/student/create', auth, role("HOD", "CC"), createStudentValidation, validate, createStudent);
router.patch('/student/reset-password', auth, role("HOD", "CC"), resetStudentPassword);
router.patch('/student/update', auth, role("HOD", "CC"), updateStudentValidation, validate, updateStudent);

router.patch('/student/add', auth, role("HOD", "CC"), addStudentToClassValidation, validate, addStudentToClass);

router.patch('/pool/add', auth, role("HOD", "CC"), addStudentToPoolValidation, validate, addStudentToPool);

export default router;
