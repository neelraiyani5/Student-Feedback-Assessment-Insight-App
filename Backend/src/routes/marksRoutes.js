import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import validate from "../middlewares/validate.js";
import { addMarks, getMyMarks, updateMarks } from "../controllers/marksController.js";
const router = express.Router();

const addValidation = [
    body("assessmentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("studentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("marksObtained").notEmpty().withMessage("marksObtained can't be empty").isNumeric().withMessage("marksObtained value must be integer")
]

const updateValidation = [
    body("marksObtained").notEmpty().withMessage("marksObtained can't be empty").isNumeric().withMessage("marksObtained value must be integer")
]

router.post('/add', auth, role("FACULTY", "CC", "HOD"), addValidation, validate, addMarks);

router.get('/mymarks', auth, role("STUDENT"), getMyMarks);

router.patch('/update/:markId', auth, role("FACULTY", "CC", "HOD"), updateValidation, validate, updateMarks);

export default router;