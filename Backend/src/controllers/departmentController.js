import prisma from "../prisma/client.js";

export const getDepartmentOverview = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await prisma.department.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                semesters: {
                    include: { 
                        subjects: true,
                        classes: {
                            include: {
                                cc: {
                                    select: { id: true, name: true, email: true }
                                }
                            }
                        }
                    }
                },
                hod: {
                    select: { id: true, name: true, email: true }
                }
            },
        });

        res.status(200).json(department);

    } catch (error) {
        res.status(500).json({ message: "Failed to get department overview" });
    }
}

export const createDepartment = async (req, res) => {
    try {
        const { name, hodId } = req.body;

        const department = await prisma.department.create({
            data: {
                name,
                hodId
            }
        });

        res.status(201).json(department);
    } catch (error) {
        res.status(500).json({ message: "Failed to create department", error: error.message });
    }
}