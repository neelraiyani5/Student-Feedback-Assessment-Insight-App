import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createDepartment, getDepartmentOverview } from "../controllers/departmentController.js";

const router = express.Router();

router.post('/create', auth, role("HOD"), createDepartment);

router.get('/overview/:id', auth, getDepartmentOverview);

export default router;
