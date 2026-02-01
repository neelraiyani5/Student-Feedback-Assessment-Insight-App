import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";

import generateToken from "../utils/jwt.js";

export const login = async (req, res) => {
    try {
        const { userId, password } = req.body;

        const user = await prisma.user.findUnique({ where: { userId } });

        if (!user) return res.status(401).json({ message: "Invalid Credentials!!!" });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(401).json({ message: "Invalid Credentials!!!" });

        const token = generateToken(user.id);

        res.status(200).json({ message: "Login Successfull", token: token, mustChangePassword: user.mustChangePassword })

    } catch (error) {
        res.status(500).json({ message: "Login Failed!!!", error })
    }
}



export const getme = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { hodDepartments: true }
    });
    res.status(200).json({ user });
}



export const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: "New password required" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });

        res.status(200).json({ message: "Password changed successfully. Please login again." });

    } catch (error) {
        res.status(500).json({ message: "Failed to change password", error });
    }
};
