import express from "express";
import { body, param } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import {
  createSubject,
  assignFaculty,
  getClassSubjects,
  createClassSubject,
  updateSubject,
  deleteSubject,
  assignFacultyToSubject,
} from "../controllers/subjectController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const createSubjectValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("semesterId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const assignFacultyValidation = [
  body("subjectId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
  body("facultyId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const classIdValidation = [
  param("classId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const subjectIdValidation = [
  param("subjectId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const createClassSubjectValidation = [
  param("classId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
  body("name").notEmpty().withMessage("Subject name is required"),
];

const assignFacultyToSubjectValidation = [
  param("subjectId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
  body("facultyIds").isArray().withMessage("Faculty IDs must be an array"),
  body("facultyIds.*")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid faculty ID length"),
];

// Old routes
router.post(
  "/create",
  auth,
  role("CC", "HOD"),
  createSubjectValidation,
  validate,
  createSubject,
);
router.patch(
  "/assign-faculty",
  auth,
  role("CC", "HOD"),
  assignFacultyValidation,
  validate,
  assignFaculty,
);

// New class-specific subject routes
router.get(
  "/:classId/subjects",
  auth,
  role("HOD", "CC"),
  classIdValidation,
  validate,
  getClassSubjects,
);
router.post(
  "/:classId/subject/create",
  auth,
  role("HOD", "CC"),
  createClassSubjectValidation,
  validate,
  createClassSubject,
);
router.patch(
  "/:subjectId",
  auth,
  role("HOD", "CC"),
  subjectIdValidation,
  body("name").notEmpty().withMessage("Name is required"),
  validate,
  updateSubject,
);
router.delete(
  "/:subjectId",
  auth,
  role("HOD", "CC"),
  subjectIdValidation,
  validate,
  deleteSubject,
);
router.patch(
  "/:subjectId/assign-faculty",
  auth,
  role("HOD", "CC"),
  assignFacultyToSubjectValidation,
  validate,
  assignFacultyToSubject,
);

export default router;
