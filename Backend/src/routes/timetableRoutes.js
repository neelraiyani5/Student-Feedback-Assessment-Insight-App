import express from "express";
import { 
    getExcelSheets, 
    uploadTimetable, 
    getTimetable, 
    getAvailability 
} from "../controllers/timetableController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/**
 * @route   POST /api/timetable/get-sheets
 * @desc    Upload Excel and get sheet names
 * @access  HOD, Admin
 */
router.post(
    "/get-sheets", 
    auth, 
    role("HOD"), 
    upload.single("file"), 
    getExcelSheets
);

/**
 * @route   POST /api/timetable/upload
 * @desc    Process selected sheet and save timetable
 * @access  HOD, Admin
 */
router.post(
    "/upload", 
    auth, 
    role("HOD"), 
    uploadTimetable
);

/**
 * @route   GET /api/timetable
 * @desc    Get timetable entries with filters
 * @access  All authenticated users
 */
router.get(
    "/", 
    auth, 
    getTimetable
);

/**
 * @route   GET /api/timetable/availability
 * @desc    Check faculty/room availability
 * @access  All authenticated users
 */
router.get(
    "/availability", 
    auth, 
    getAvailability
);

export default router;
