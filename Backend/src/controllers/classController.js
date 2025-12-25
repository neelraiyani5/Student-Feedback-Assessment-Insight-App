import prisma from "../prisma/client.js";

export const addClass = async (req, res) => {
    try {
        const { semesterId, name } = req.body;

        const exists = await prisma.class.findUnique({
            where: { name_semesterId: { name, semesterId } }
        });

        if (exists)
            return res.status(409).json({ message: "Class already exists" });

        const newClass = await prisma.class.create({
            data: { name, semesterId }
        });

        res.status(201).json({ message: "Class created successfully", Class_Details: newClass });
    } catch {
        res.status(500).json({ message: "Failed to create class", error });
    }
}



export const classStudents = async (req, res) => {
    try {
        const { classId } = req.params;

        if (!classId) {
            return res.status(400).json({ message: "Class ID is missing" });
        }

        const students = await prisma.user.findMany({
            where: { classId, role: "STUDENT" }
        })

        res.status(200).json({ Students: students })
    } catch (error) {
        res.status(500).json({ message: "Internal server error!!!" });
    }
}