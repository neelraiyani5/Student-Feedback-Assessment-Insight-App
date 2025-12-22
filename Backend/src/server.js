import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import semesterRoutes from "./routes/semesterRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
dotenv.config();

const port = process.env.PORT || 3002;
const app =express();

connectDB();

app.use(express.json());

app.use('/user', adminRoutes);
app.use('/auth', authRoutes);
app.use('/department', departmentRoutes);
app.use('/semester', semesterRoutes);
app.use('/subject', subjectRoutes);

app.listen(port, () => {
    console.log(`Server running on "http://localhost:${port}"`);
});