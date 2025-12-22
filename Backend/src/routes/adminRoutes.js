import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { createUser, makeCC } from "../controllers/adminController.js";

const router = express.Router();

router.post('/create',auth, role("HOD", "CC"), createUser);

router.patch('/make-CC',auth, role("HOD"), makeCC); 

export default router;