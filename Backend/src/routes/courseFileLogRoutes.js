import express from "express";
import {
  getActivityLogs,
  getAssignmentLogs,
  clearLogs,
  clearAssignmentLogs,
} from "../controllers/courseFileLogController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

router.use(auth);

// Only HOD can view and manage activity logs
router.get("/list", role("HOD"), getActivityLogs);
router.delete("/clear", role("HOD"), clearLogs);

// Get logs for specific assignment
router.get("/assignment/:assignmentId", role("HOD"), getAssignmentLogs);

// Clear logs for specific assignment
router.delete("/assignment/:assignmentId", role("HOD"), clearAssignmentLogs);

export default router;
