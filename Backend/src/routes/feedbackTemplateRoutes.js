import express from "express";
import {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} from "../controllers/feedbackTemplateController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

import { body } from "express-validator";
import validate from "../middlewares/validate.js";

const router = express.Router();

// Apply auth to all routes
router.use(auth);

const templateValidation = [
    body("title")
        .notEmpty().withMessage("Title is required")
        .isString().withMessage("Title must be a string"),
    body("questions")
        .isArray({ min: 1 }).withMessage("Questions must be a non-empty array"),
    body("questions.*.question")
        .notEmpty().withMessage("Each question must have text")
        .isString().withMessage("Question text must be a string"),
    body("questions.*.options")
        .isArray({ min: 2 }).withMessage("Each question must have at least 2 options (for radio buttons)")
        .custom((options) => {
            if (!options.every(opt => typeof opt === 'string' && opt.trim() !== '')) {
                throw new Error("Each option must be a non-empty string");
            }
            return true;
        }),
    validate
];

router.post("/create", role("HOD"), templateValidation, createTemplate);
router.patch("/update/:id", role("HOD"), templateValidation, updateTemplate);
router.delete("/delete/:id", role("HOD"), deleteTemplate);

router.get("/list", getTemplates);
router.get("/:id", getTemplateById);

export default router;
