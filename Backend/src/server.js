import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import semesterRoutes from "./routes/semesterRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import marksRoutes from "./routes/marksRoutes.js";
dotenv.config();

const port = process.env.PORT || 3002;
const app =express();

connectDB();

app.use(express.json());

app.use('/user', adminRoutes);
app.use('/auth', authRoutes);
app.use('/department', departmentRoutes);
app.use('/semester', semesterRoutes);
app.use('/class', classRoutes);
app.use('/subject', subjectRoutes);
app.use('/assessment', assessmentRoutes);
app.use('/marks', marksRoutes);

app.listen(port, () => {
    console.log(`Server running on "http://localhost:${port}"`);
});

