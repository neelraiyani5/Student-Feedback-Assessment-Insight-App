import express from "express";
import {
    getFacultyTasks,
    completeTask,
    reviewTask,
    getComplianceAlerts
} from "../controllers/courseFileSubmissionController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.use(auth);

const reviewValidation = [
    body("status")
        .isIn(["YES", "NO"]).withMessage("Status must be either YES or NO"),
    body("remarks")
        .optional()
        .isString().withMessage("Remarks must be a string"),
    validate
];

// Faculty routes
router.get("/my-tasks", role("FACULTY", "CC", "HOD"), getFacultyTasks);
router.patch("/complete/:taskId", role("FACULTY", "CC", "HOD"), completeTask);

// Review routes (CC and HOD)
router.patch("/review/:taskId", role("CC", "HOD"), reviewValidation, validate, reviewTask);

// Compliance alerts
router.get("/compliance-alerts", role("CC", "HOD"), getComplianceAlerts);

export default router;
