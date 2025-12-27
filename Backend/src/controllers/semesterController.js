import prisma from "../prisma/client.js";

export const createSemester = async (req, res) => {
    try {
        const { sem, departmentId } = req.body;

        const existingSemester = await prisma.semester.findUnique({
            where: {
                sem,_departmentId: { sem, departmentId }
            }
        });

        if (existingSemester) return res.status(409).json({ message: "Semester already exists in this department!!!" });

        const semester = await prisma.semester.create({
            data: {
                sem,
                departmentId
            }
        });

        res.status(201).json(semester);
    } catch (error) {
        res.status(500).json({ message: "Failed to create semester" });
    }
}