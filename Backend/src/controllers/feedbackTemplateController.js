import prisma from "../prisma/client.js";

export const createTemplate = async (req, res) => {
    try {
        const { title, description, questions } = req.body;

        const template = await prisma.feedbackTemplate.create({
            data: {
                title,
                description,
                questions
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error("Error creating template:", error);
        res.status(500).json({ message: "Failed to create template" });
    }
};

export const getTemplates = async (req, res) => {
    try {
        const templates = await prisma.feedbackTemplate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({ message: "Failed to fetch templates" });
    }
};

export const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await prisma.feedbackTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        res.status(200).json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        res.status(500).json({ message: "Failed to fetch template" });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, questions } = req.body;

        // Check if template exists and is active
        const template = await prisma.feedbackTemplate.findUnique({ where: { id } });
        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        const updatedTemplate = await prisma.feedbackTemplate.update({
            where: { id },
            data: {
                title,
                description,
                questions
            }
        });

        res.status(200).json(updatedTemplate);
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ message: "Failed to update template" });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by setting isActive to false
        await prisma.feedbackTemplate.update({
            where: { id },
            data: { isActive: false }
        });

        res.status(200).json({ message: "Template deleted successfully" });
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({ message: "Failed to delete template" });
    }
};
