import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

/**
 * @route GET /dashboard/summary
 * @desc Get unified dashboard data for the current user
 */
router.get("/summary", getDashboardSummary);

export default router;
