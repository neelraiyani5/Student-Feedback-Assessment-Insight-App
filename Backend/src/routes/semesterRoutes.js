import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createSemester } from "../controllers/semesterController.js";

const router = express.Router();

router.post('/create', auth, role("HOD"), createSemester );

export default router;
