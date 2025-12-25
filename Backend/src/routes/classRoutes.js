import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { addClass, classStudents } from "../controllers/classController.js";

const router = express.Router();

router.post('/add',auth, role("HOD"), addClass);

router.get('/students/:classId', classStudents);

export default router;
