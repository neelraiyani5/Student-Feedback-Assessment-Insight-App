import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import prisma from "../prisma/client.js";

const templates = [
    { title: "Vision & Mission", description: "Institute and Department Vision & Mission statements" },
    { title: "PEOs, POs & PSOs", description: "Program Educational Objectives, Program Outcomes, Program Specific Outcomes" },
    { title: "Academic Calendar", description: "University and Department Academic Calendar" },
    { title: "Class Time Table", description: "Master time table for the semester" },
    { title: "Individual Time Table", description: "Faculty individual time table" },
    { title: "Syllabus", description: "Copy of the university syllabus" },
    { title: "Course Outcomes (COs)", description: "List of Course Outcomes" },
    { title: "CO-PO Mapping", description: "Mapping matrix of COs with POs and PSOs" },
    { title: "Lesson Plan", description: "Day-wise teaching plan/schedule" },
    { title: "Question Bank", description: "Unit-wise important questions" },
    { title: "Previous Question Papers", description: "Last 3 years university question papers" },
    { title: "IA Question Papers", description: "Internal Assessment question papers with scheme of evaluation" },
    { title: "IA Sample Scripts", description: "Sample answer booklets (Best, Average, Poor)" },
    { title: "Assignments", description: "Assignment questions given to students" },
    { title: "Assignment Samples", description: "Sample assignment submissions" },
    { title: "Student List", description: "List of enrolled students" },
    { title: "Attendance Register", description: "Copy of attendance record" },
    { title: "Result Analysis (Previous)", description: "Analysis of previous batch/semester results" },
    { title: "IA Result Analysis", description: "Analysis of current semester IA marks" },
    { title: "Slow & Advanced Learners", description: "List of identified learners and remedial measures taken" },
    { title: "Counseling Register", description: "Mentor-Mentee counseling details" },
    { title: "Content Beyond Syllabus", description: "Details of topics covered beyond syllabus" },
    { title: "Course Material", description: "Lecture notes / PPTs / Handouts" },
    { title: "Feedback Analysis", description: "Student feedback report and action taken" },
    { title: "Course End Survey", description: "Indirect assessment via course end survey" },
    { title: "CO Attainment", description: "Final CO attainment calculations" },
    { title: "Course Closure Report", description: "Faculty feedback and course closure summary" }
];

const seed = async () => {
    try {
        const count = await prisma.courseFileTaskTemplate.count();
        if (count > 0) {
            console.log(`Course File Templates already exist (${count}). Skipping.`);
            return;
        }

        console.log("Seeding Course File Templates...");
        await prisma.courseFileTaskTemplate.createMany({
            data: templates.map(t => ({
                ...t,
                isActive: true
            }))
        });
        console.log("Seeding complete. 27 tasks created.");
    } catch (e) {
        console.error("Seeding failed", e);
    } finally {
        await prisma.$disconnect();
    }
};

seed();
