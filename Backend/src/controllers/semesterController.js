import prisma from "../prisma/client.js";

export const createSemester = async (req, res) => {
    try {
        const { name, departmentId } = req.body;

        const existingSemester = await prisma.semester.findUnique({
            where: {
                name_departmentId: { name, departmentId }
            }
        });

        if (existingSemester) return res.status(409).json({ message: "Semester already exists in this department!!!" });

        const semester = await prisma.semester.create({
            data: {
                name,
                departmentId
            }
        });

        res.status(201).json(semester);
    } catch (error) {
        res.status(500).json({ message: "Failed to create semester" });
    }
}