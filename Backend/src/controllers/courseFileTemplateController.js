import prisma from "../prisma/client.js";

export const createTemplateTask = async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const task = await prisma.courseFileTaskTemplate.create({
            data: { title, description, order }
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: "Failed to create task template" });
    }
};

export const getTemplateTasks = async (req, res) => {
    try {
        const tasks = await prisma.courseFileTaskTemplate.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch task templates" });
    }
};

export const updateTemplateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, order, isActive } = req.body;
        const task = await prisma.courseFileTaskTemplate.update({
            where: { id },
            data: { title, description, order, isActive }
        });
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Failed to update task template" });
    }
};

export const deleteTemplateTask = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.courseFileTaskTemplate.delete({ where: { id } });
        res.status(200).json({ message: "Task template deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete task template" });
    }
};
