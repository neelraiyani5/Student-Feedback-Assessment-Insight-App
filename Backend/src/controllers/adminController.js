import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";

export const createUser = async (req, res) => {
    try {
        const { userId, name, email, role, semesterId } = req.body;

        if (!["STUDENT", "FACULTY"].includes(role)) {
            return res.status(400).json({ message: "Invalid Role!!!" });
        }

        if (role === "STUDENT" && !semesterId) {
            return res.status(400).json({ message: "Semester is required for students" });
        }

        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                userId,
                name,
                email,
                password: hashedPassword,
                role,
                semesterId: role === "STUDENT" ? semesterId : null
            }
        });

        res.status(201).json({ message: `${role} created successfully.`, Credentials: {userId, password: password}  })
    } catch (error) {
        res.status(500).json({ message: "Failed to create user", error });
    }
}



export const makeCC = async (req, res) => {
    try {
        const { facultyId } = req.body;

        const facutly = await prisma.user.findUnique({ where: { id: facultyId } });

        if (!facutly || facutly.role !== "FACULTY") {
            return res.status(400).json({ message: "Invalid Faculty!!!" });
        }

        await prisma.user.update({
            where: { id: facultyId },
            data: { role: "CC" }
        });

        res.status(201).json({ message: "Faculty promotoded to CC" });
    } catch (error) {
        res.status(500).json({ message: "Failed to promote CC", error });
    }
}