import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js"

import dotenv from "dotenv";
dotenv.config();

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.id;

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            omit: {createdAt: true}
        });
        
        req.user = user;
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: "Expired or Invalid token", error });
    }
}

export default auth;