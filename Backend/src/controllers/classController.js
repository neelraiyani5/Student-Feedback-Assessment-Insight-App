import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";

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
        res.status(500).json({ message: "Failed to create class", error: error.message });
    }
}

export const createStudent = async (req, res) => {
    try {
        const { userId, name, email, classId } = req.body;

        // Check availability
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { userId }] }
        });
        if (existing) {
            return res.status(409).json({ message: "User with email or ID already exists" });
        }

        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = await prisma.user.create({
            data: {
                userId, name, email, 
                password: hashedPassword,
                role: "STUDENT",
                classId
            }
        });

        res.status(201).json({ 
            message: "Student created successfully", 
            Credentials: { userId, password } 
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to create student", error: error.message });
    }
}

export const assignCC = async (req, res) => {
    try {
        const { classId, facultyId } = req.body;

        // Verify Faculty
        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
        if (!faculty || faculty.role !== "FACULTY") {
             return res.status(400).json({ message: "Invalid Faculty ID or User is not basic Faculty" });
        }

        // Get Class to check overlap
        const existingClass = await prisma.class.findUnique({ where: { id: classId } });
        if (!existingClass) return res.status(404).json({ message: "Class not found" });

        const operations = [];

        // If class has existing CC, demote them
        if (existingClass.ccId) {
            operations.push(
                prisma.user.update({
                    where: { id: existingClass.ccId },
                    data: { role: "FACULTY", classId: null }
                })
            );
        }

        // Update New CC
        operations.push(
            prisma.user.update({
                where: { id: facultyId },
                data: { role: "CC", classId }
            })
        );

        // Update Class
        operations.push(
            prisma.class.update({
                where: { id: classId },
                data: { ccId: facultyId }
            })
        );

        await prisma.$transaction(operations);

        const updatedClass = await prisma.class.findUnique({ where: { id: classId } });

        res.status(200).json({ message: "CC Assigned Successfully", class: updatedClass });
    } catch (error) {
        res.status(500).json({ message: "Failed to assign CC", error: error.message });
    }
}

export const resetStudentPassword = async (req, res) => {
    try {
        const { studentId } = req.body;
        
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: studentId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password reset successfully", password });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
}

export const updateStudent = async (req, res) => {
    try {
        const { studentId, name, email, userId } = req.body;

        // Check uniqueness
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { userId }],
                NOT: { id: studentId }
            }
        });

        if (existing) {
            return res.status(409).json({ message: "Email or Student ID already in use" });
        }

        const updatedStudent = await prisma.user.update({
            where: { id: studentId },
            data: { name, email, userId }
        });

        res.status(200).json({ message: "Student updated successfully", student: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: "Failed to update student", error: error.message });
    }
}



    export const classStudents = async (req, res) => {
        try {
            const { classId } = req.params;
    
            if (!classId) {
                return res.status(400).json({ message: "Class ID is missing" });
            }

            const classInfo = await prisma.class.findUnique({
                where: { id: classId },
                include: { 
                    semester: true,
                    pools: true 
                }
            });

            if (!classInfo) {
                return res.status(404).json({ message: "Class not found" });
            }
    
            const students = await prisma.user.findMany({
                where: { classId, role: "STUDENT" }
            })
    
            res.status(200).json({ Students: students, Class: classInfo })
        } catch (error) {
            res.status(500).json({ message: "Internal server error!!!", error: error.message });
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

export const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, semesterId } = req.body;

        const updatedClass = await prisma.class.update({
            where: { id },
            data: { name, semesterId }
        });

        res.status(200).json({ message: "Class updated successfully", class: updatedClass });
    } catch (error) {
        res.status(500).json({ message: "Failed to update class", error: error.message });
    }
}