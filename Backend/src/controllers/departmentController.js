import prisma from "../prisma/client.js";

export const getDepartmentOverview = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await prisma.department.findUnique({
            where: { id },
            select: {
                semesters: {
                    include: { subjects: true }
                },
                hod: {
                    select: { id: true, name: true, email: true }
                }
            },
        });

        res.status(201).json(department);
    } catch (error) {
        res.status(500).json({ message: "Failed to get department overview" });
    }
}