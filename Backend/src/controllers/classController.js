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
            data: {
                name,
                semesterId,
                pools: {
                    create: [
                        { type: "FAST" },
                        { type: "MEDIUM" },
                        { type: "SLOW" }
                    ]
                }
            },
            include: { pools: true }
        });

        res.status(201).json({ message: "Class with pools created successfully", Class_Details: newClass });
    } catch (error) {
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
        res.status(500).json({ message: "Internal server error!!!", error });
    }
}



export const addStudentToClass = async (req, res) => {
    try {
        const { studentId, classId } = req.body;

        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student || student.role !== "STUDENT") {
            return res.status(400).json({ message: "Invalid student" });
        }

        await prisma.user.update({
            where: { id: studentId },
            data: {
                classId,
                poolId: null
            }
        });

        res.status(200).json({ message: "Student assigned to class" });
    } catch (error) {
        res.status(500).json({ message: "Failed to assign student to class", error });
    }
}



export const addStudentToPool = async (req, res) => {
    try {
        const ccId = req.user.id;
        const { studentId, poolId } = req.body;

        const cc = await prisma.user.findUnique({ where: { id: ccId } })

        if (!cc || cc.role !== "CC") {
            return res.status(403).json({ message: "Access Denied!!!" });
        }

        const pool = await prisma.studentPool.findUnique({ where: { id: poolId } });

        if (!pool || pool.classId !== cc.classId) {
            return res.status(403).json({ message: "Pool not found or CC doesn't belong to this class" });
        }

        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student || student.role !== "STUDENT" || student.classId !== cc.classId) {
            return res.status(403).json({ message: "Student not found or doesnt belong to this class" });
        }

        await prisma.user.update({
            where: { id: studentId },
            data: { poolId }
        });

        res.status(200).json({ message: `Student added to ${pool.type} Pool` })
    } catch (error) {
        res.status(500).json({ message: "Failed to add student to pool", error });
    }
}