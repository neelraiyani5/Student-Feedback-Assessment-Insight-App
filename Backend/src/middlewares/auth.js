import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET) ;

        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: "Expired or Invalid token", error });
    }
}

export default auth;