import express from "express";
import {
  getHodDepartmentSemesters,
  getHodSemesterSubjects,
  getHodReviewableTasks,
  getHodComplianceSummary,
} from "../controllers/hodCourseFileController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

router.use(auth);
router.use(role("HOD"));

/**
 * GET /hod-course-file/semesters
 * Get all semesters in HOD's department
 * Used to display semester selection on HOD dashboard
 */
router.get("/semesters", getHodDepartmentSemesters);

/**
 * GET /hod-course-file/semester/:semesterId/subjects
 * Get all subjects in a specific semester with their course file assignments
 * Shows list of subjects that have course file assignments
 */
router.get("/semester/:semesterId/subjects", getHodSemesterSubjects);

/**
 * GET /hod-course-file/assignment/:assignmentId/tasks
 * Get all tasks that are ready for HOD review
 * Only returns COMPLETED tasks (faculty has completed)
 * Marks which tasks have been reviewed by CC and which by HOD
 */
router.get("/assignment/:assignmentId/tasks", getHodReviewableTasks);

/**
 * GET /hod-course-file/compliance-summary
 * Get overall compliance statistics for HOD's department
 * Shows completion, CC review, and HOD review percentages
 */
router.get("/compliance-summary", getHodComplianceSummary);

export default router;
