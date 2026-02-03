import express from "express";
import { getActivityLogs, clearLogs } from "../controllers/courseFileLogController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

router.use(auth);

// Only HOD can view and manage activity logs
router.get("/list", role("HOD"), getActivityLogs);
router.delete("/clear", role("HOD"), clearLogs);

export default router;
