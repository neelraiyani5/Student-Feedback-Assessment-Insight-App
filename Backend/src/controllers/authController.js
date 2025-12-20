import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";

import generateToken from "../utils/jwt.js";

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: {email} });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists!!!" })
        }

        const hasedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hasedPassword,
                role
            }
        });

        const token = generateToken(user.id);

        res.status(201).json({ message: "User created successfully", User: user, Token: token });
    } catch (error) {
        res.status(500).json({ Message: "Registration Failed Due to Internal Server Error!!!", error });
    }
}



export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({where:{email}});

        if(!user) return res.status(401).json({message: "Invalid Credentials!!!"});

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) return res.status(401).json({message: "Invalid Credentials!!!"});

        const token = generateToken(user.id);

        res.status(200).json({message: "Login Successfull", Token: token})
        
    } catch (error) {
        
    }
}