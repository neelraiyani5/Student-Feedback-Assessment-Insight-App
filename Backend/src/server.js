import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const port = process.env.PORT || 3002;
const app =express();

connectDB();

app.use(express.json());

app.use('/auth', authRoutes);

app.listen(port, () => {
    console.log(`Server running on "http://localhost:${port}"`);
});