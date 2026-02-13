import express from "express";
import {
  getFacultyTasks,
  completeTask,
  revertTask,
  reviewTask,
  getComplianceAlerts,
  getAssignmentTasks,
  getReviewableTasks,
  getSubjectReviewableTasks,
  updateTaskDeadline,
  batchReviewTasks,
} from "../controllers/courseFileSubmissionController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.use(auth);

const reviewValidation = [
  body("status")
    .isIn(["YES", "NO"])
    .withMessage("Status must be either YES or NO"),
  body("remarks").optional().isString().withMessage("Remarks must be a string"),
  validate,
];

// Faculty routes
router.get("/my-tasks", role("FACULTY", "CC", "HOD"), getFacultyTasks);
router.patch("/complete/:taskId", role("FACULTY", "CC", "HOD"), completeTask);
router.patch("/revert/:taskId", role("FACULTY", "CC", "HOD"), revertTask);

// Review routes (CC and HOD)
router.get(
  "/assignment/:assignmentId/tasks",
  role("FACULTY", "CC", "HOD"),
  getAssignmentTasks,
);
/**
 * NEW: Get only COMPLETED tasks for review
 * CC sees only pending CC reviews
 * HOD sees only tasks where CC has already reviewed
 */
router.get(
  "/assignment/:assignmentId/reviewable-tasks",
  role("CC", "HOD"),
  getReviewableTasks,
);
/**
 * NEW: Get tasks for a specific subject
 * Bypasses semester/subject selection
 */
router.get(
  "/subject/:subjectId/reviewable-tasks",
  role("CC", "HOD"),
  getSubjectReviewableTasks,
);
router.patch(
  "/review/:taskId",
  role("CC", "HOD"),
  reviewValidation,
  validate,
  reviewTask,
);
router.patch("/deadline/:taskId", role("CC", "HOD"), updateTaskDeadline);
router.patch(
  "/assignment/:assignmentId/batch-review",
  role("HOD"),
  batchReviewTasks,
);

// Compliance alerts
router.get("/compliance-alerts", role("CC", "HOD"), getComplianceAlerts);

export default router;
