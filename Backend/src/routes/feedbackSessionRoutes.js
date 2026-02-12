import express from "express";
import {
    startFeedbackSession,
    getStudentSessions,
    submitFeedback,
    getSessionResponses,
    getAllSessions,
    getSessionById
} from "../controllers/feedbackSessionController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

router.use(auth);

// Faculty starts a session
router.post("/start", role("FACULTY", "CC", "HOD"), startFeedbackSession);

// Students get their assigned sessions
router.get("/student/active", role("STUDENT"), getStudentSessions);

// Students submit feedback
router.post("/submit", role("STUDENT"), submitFeedback);

// List all sessions (Monitoring)
router.get("/list", role("HOD", "CC", "FACULTY"), getAllSessions);

// Get specific session
router.get("/session/:id", getSessionById);

// CC or higher views responses
router.get("/responses/:sessionId", role("CC", "HOD", "FACULTY"), getSessionResponses);

export default router;
