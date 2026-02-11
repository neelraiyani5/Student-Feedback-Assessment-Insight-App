import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import validate from "../middlewares/validate.js";
import { addMarks, getMyMarks, updateMarks, bulkUploadMarks } from "../controllers/marksController.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

const addValidation = [
    body("assessmentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("studentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("marksObtained").notEmpty().withMessage("marksObtained can't be empty").isNumeric().withMessage("marksObtained value must be integer")
]

const updateValidation = [
    body("marksObtained").notEmpty().withMessage("marksObtained can't be empty").isNumeric().withMessage("marksObtained value must be integer")
]

const bulkUploadValidation = [
    body("assessmentId").isLength({ min: 24, max: 24 }).withMessage("Invalid ID length!!!"),
    body("studentIdColumn").notEmpty().withMessage("studentIdColumn is required"),
    body("marksColumn").notEmpty().withMessage("marksColumn is required")
]

router.post('/add', auth, role("FACULTY", "CC", "HOD"), addValidation, validate, addMarks);

router.get('/mymarks', auth, role("STUDENT"), getMyMarks);

router.patch('/update/:markId', auth, role("FACULTY", "CC", "HOD"), updateValidation, validate, updateMarks);

router.post('/bulk-upload', auth, role("FACULTY", "CC", "HOD"), upload.single("file"), bulkUploadValidation, validate, bulkUploadMarks);

export default router;