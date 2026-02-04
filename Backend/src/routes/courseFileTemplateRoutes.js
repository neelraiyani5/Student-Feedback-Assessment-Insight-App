import express from "express";
import { getTemplates, updateTemplate } from "../controllers/courseFileTemplateController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

router.use(auth);

// Only HOD or Admin can manage templates
router.get("/list", role("HOD", "ADMIN"), getTemplates);
router.patch("/:id", role("HOD", "ADMIN"), updateTemplate);

export default router;
