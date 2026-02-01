import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { getDepartmentOverview, createDepartment } from "../controllers/departmentController.js";

const router = express.Router();

router.post('/create', auth, role("HOD"), createDepartment);
router.get('/overview/:id', auth, role("HOD"), getDepartmentOverview);

export default router;
