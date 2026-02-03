import express from "express";
import {
    startFeedbackSession,
    getStudentSessions,
    submitFeedback,
    getSessionResponses
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

// CC or higher views responses
router.get("/responses/:sessionId", role("CC", "HOD"), getSessionResponses);

export default router;
