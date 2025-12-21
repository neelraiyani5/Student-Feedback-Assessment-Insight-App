import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createSubject, assignFaculty } from "../controllers/subjectController.js";

const router = express.Router();

router.post('/create', auth, role("CC", "HOD"), createSubject);

router.put('/assign-faculty', auth, role("CC", "HOD"), assignFaculty);

export default router;
