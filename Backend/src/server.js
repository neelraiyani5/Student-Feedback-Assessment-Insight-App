import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import semesterRoutes from "./routes/semesterRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import marksRoutes from "./routes/marksRoutes.js";
import feedbackTemplateRoutes from "./routes/feedbackTemplateRoutes.js";
import feedbackSessionRoutes from "./routes/feedbackSessionRoutes.js";
import courseFileTemplateRoutes from "./routes/courseFileTemplateRoutes.js";
import courseFileAssignmentRoutes from "./routes/courseFileAssignmentRoutes.js";
import courseFileSubmissionRoutes from "./routes/courseFileSubmissionRoutes.js";
import courseFileLogRoutes from "./routes/courseFileLogRoutes.js";
import hodCourseFileRoutes from "./routes/hodCourseFileRoutes.js";
dotenv.config();

const port = process.env.PORT || 3002;
const app = express();

connectDB();

// Enable CORS for all origins (needed for React Native/Expo)
app.use(cors());
app.use(express.json());

app.use("/user", adminRoutes);
app.use("/auth", authRoutes);
app.use("/department", departmentRoutes);
app.use("/semester", semesterRoutes);
app.use("/class", classRoutes);
app.use("/subject", subjectRoutes);
app.use("/assessment", assessmentRoutes);
app.use("/marks", marksRoutes);
app.use("/feedback-template", feedbackTemplateRoutes);
app.use("/feedback-session", feedbackSessionRoutes);
app.use("/course-file", courseFileTemplateRoutes);
app.use("/course-file-assignment", courseFileAssignmentRoutes);
app.use("/course-file-submission", courseFileSubmissionRoutes);
app.use("/course-file-log", courseFileLogRoutes);
app.use("/hod-course-file", hodCourseFileRoutes);

app.listen(port, () => {
  console.log(`Server running on "http://localhost:${port}"`);
});
