import prisma from "../prisma/client.js";

export const getTemplates = async (req, res) => {
    try {
        const templates = await prisma.courseFileTaskTemplate.findMany({
            where: { isActive: true },
            orderBy: { id: 'asc' }
        });
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch templates" });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        
        const template = await prisma.courseFileTaskTemplate.update({
            where: { id },
            data: { title, description }
        });
        
        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ message: "Failed to update template" });
    }
};
