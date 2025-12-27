import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";

export const createUser = async (req, res) => {
    try {
        const { userId, name, email, role } = req.body;

        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                userId,
                name,
                email,
                password: hashedPassword,
                role
            }
        });

        res.status(201).json({ message: `${role} created successfully.`, Credentials: { userId, password: password } })
    } catch (error) {
        res.status(500).json({ message: "Failed to create user", error });
    }
}



export const makeCC = async (req, res) => {
    try {
        const { facultyId, classId } = req.body;

        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });

        if (!faculty || faculty.role !== "FACULTY") {
            return res.status(404).json({ message: "Faculty not found or already CC of class!!!" });
        }

        const classData = await prisma.class.findUnique({ where: { id: classId } });

        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        if (classData.ccId) {
            return res.status(409).json({ message: "Class already has CC" });
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: facultyId },
                data: { role: "CC", classId }
            }),
            prisma.class.update({
                where: { id: classId },
                data: { ccId: facultyId }
            })
        ]);

        res.status(201).json({ message: "Faculty promoted to CC" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
