import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import {
  addClass,
  addStudentToClass,
  addStudentToPool,
  classStudents,
  updateClass,
  assignCC,
  createStudent,
  resetStudentPassword,
  updateStudent,
  createSubject,
  getClassSubjects,
  assignFacultyToSubject,
  createAssessment,
  getSubjectClasses,
  getFacultyAssessments,
  getAssessmentMarks,
  updateAssessmentMarks,
  getStudentSubjects,
  getStudentSubjectPerformance,
  deleteUser,
  updateSubject,
  deleteSubject,
  updateAssessment,
  deleteAssessment,
  deleteClass,
} from "../controllers/classController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const addClassValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("semesterId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const addStudentToClassValidation = [
  body("studentId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
  body("classId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const addStudentToPoolValidation = [
  body("studentId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
  body("poolId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid ID length!!!"),
];

const createStudentValidation = [
  body("userId").notEmpty(),
  body("name").notEmpty(),
  body("email").isEmail(),
  body("classId").isLength({ min: 24, max: 24 }),
];

const updateStudentValidation = [
  body("studentId").isLength({ min: 24, max: 24 }),
  body("userId").notEmpty(),
  body("name").notEmpty(),
  body("email").isEmail(),
];

router.post("/add", auth, role("HOD"), addClassValidation, validate, addClass);

router.patch("/update/:id", auth, role("HOD"), updateClass);
router.delete("/:id", auth, role("HOD"), deleteClass);
router.patch("/assign-cc", auth, role("HOD"), assignCC);

router.get("/students/:classId", classStudents);

router.post(
  "/student/create",
  auth,
  role("HOD", "CC"),
  createStudentValidation,
  validate,
  createStudent,
);
router.patch(
  "/student/reset-password",
  auth,
  role("HOD", "CC"),
  resetStudentPassword,
);
router.patch(
  "/student/update",
  auth,
  role("HOD", "CC"),
  updateStudentValidation,
  validate,
  updateStudent,
);

router.patch(
  "/student/add",
  auth,
  role("HOD", "CC"),
  addStudentToClassValidation,
  validate,
  addStudentToClass,
);

router.patch(
  "/pool/add",
  auth,
  role("HOD", "CC"),
  addStudentToPoolValidation,
  validate,
  addStudentToPool,
);

router.post("/subject/create", auth, role("CC", "HOD"), createSubject);
router.get("/subjects", auth, role("CC", "HOD"), getClassSubjects);
router.patch(
  "/subject/assign-faculty",
  auth,
  role("CC", "HOD"),
  assignFacultyToSubject,
);

// Assessment Routes
router.post(
  "/assessment/create",
  auth,
  role("FACULTY", "CC", "HOD"),
  createAssessment,
);
router.get(
  "/subject/:subjectId/classes",
  auth,
  role("FACULTY", "CC", "HOD"),
  getSubjectClasses,
);
router.get(
  "/assessments/list",
  auth,
  role("FACULTY", "CC", "HOD"),
  getFacultyAssessments,
);
router.get(
  "/assessment/:id/details",
  auth,
  role("FACULTY", "CC", "HOD"),
  getAssessmentMarks,
);
router.patch(
  "/assessment/marks/update",
  auth,
  role("FACULTY", "CC", "HOD"),
  updateAssessmentMarks,
);

// Student Routes
router.get("/student/subjects", auth, role("STUDENT"), getStudentSubjects);
router.get(
  "/student/subject/:subjectId/performance",
  auth,
  role("STUDENT"),
  getStudentSubjectPerformance,
);

// Edit & Delete Routes
router.delete("/user/delete/:id", auth, role("HOD"), deleteUser);
router.patch("/subject/update/:id", auth, role("HOD", "CC"), updateSubject);
router.delete("/subject/delete/:id", auth, role("HOD", "CC"), deleteSubject);
router.patch(
  "/assessment/update/:id",
  auth,
  role("HOD", "CC", "FACULTY"),
  updateAssessment,
);
router.delete(
  "/assessment/delete/:id",
  auth,
  role("HOD", "CC", "FACULTY"),
  deleteAssessment,
);

export default router;
