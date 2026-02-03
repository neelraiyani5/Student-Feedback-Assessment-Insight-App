import express from "express";
import {
    createTemplateTask,
    getTemplateTasks,
    updateTemplateTask,
    deleteTemplateTask
} from "../controllers/courseFileTemplateController.js";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.use(auth);

const templateTaskValidation = [
    body("title")
        .notEmpty().withMessage("Task title is required")
        .isString().withMessage("Task title must be a string"),
    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),
    body("order")
        .optional()
        .isInt({ min: 0 }).withMessage("Order must be a positive integer"),
    validate
];

// Only HOD can manage templates
router.post("/template/create", role("HOD"), templateTaskValidation, validate, createTemplateTask);
router.get("/templates", getTemplateTasks);
router.patch("/template/update/:id", role("HOD"), templateTaskValidation, validate, updateTemplateTask);
router.delete("/template/delete/:id", role("HOD"), deleteTemplateTask);

export default router;
