import express from "express";
import {
    assignSubjectFaculty,
    getClassAssignments,
    deleteAssignment
} from "../controllers/courseFileAssignmentController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.use(auth);

const assignmentValidation = [
    body("subjectId").isMongoId().withMessage("Invalid Subject ID"),
    body("facultyId").isMongoId().withMessage("Invalid Faculty ID"),
    body("classId").isMongoId().withMessage("Invalid Class ID"),
    body("taskDeadlines").optional().isArray().withMessage("taskDeadlines must be an array"),
    body("taskDeadlines.*.templateId").optional().isMongoId().withMessage("Invalid Template ID in deadlines"),
    body("taskDeadlines.*.deadline").optional().isISO8601().withMessage("Invalid deadline date format"),
    validate
];

// Class Coordinator assigns faculty to subjects
router.post("/assign", role("CC", "HOD"), assignmentValidation, validate, assignSubjectFaculty);
router.get("/class/:classId", getClassAssignments);
router.delete("/delete/:id", role("CC", "HOD"), deleteAssignment);

export default router;
