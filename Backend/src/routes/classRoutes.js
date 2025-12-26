import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { addClass, addStudentToClass, addStudentToPool, classStudents } from "../controllers/classController.js";

const router = express.Router();

router.post('/add', auth, role("HOD"), addClass);

router.get('/students/:classId', classStudents);

router.patch('/student/add', auth, role("HOD", "CC"), addStudentToClass);

router.patch('/pool/add', auth, role("HOD", "CC"), addStudentToPool);

export default router;
