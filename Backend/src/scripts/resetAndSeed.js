import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import prisma from "../prisma/client.js";

const DEFAULT_PASSWORD = "Abc@12345";
const DEPT_NAME = "Information & communication Technology";

const COURSE_TEMPLATES = [
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

const FEEDBACK_TEMPLATE = {
    title: "Lecture Feedback Form",
    description: "Standard feedback for daily lectures",
    questions: [
        { question: "How clear was the explanation?", options: ["Excellent", "Good", "Average", "Poor"] },
        { question: "Was the pace appropriate?", options: ["Yes", "Too Fast", "Too Slow"] },
        { question: "Did the faculty encourage participation?", options: ["Always", "Sometimes", "Never"] },
        { question: "Overall rating of the session", options: ["5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"] }
    ]
};

async function main() {
    console.log("Emptying database...");
    
    // Ordered deletion to avoid foreign key issues (though MongoDB/Prisma is lenient)
    await prisma.feedbackResponse.deleteMany({});
    await prisma.feedbackSession.deleteMany({});
    await prisma.feedbackTemplate.deleteMany({});
    await prisma.courseFileLog.deleteMany({});
    await prisma.courseFileTaskSubmission.deleteMany({});
    await prisma.courseFileAssignment.deleteMany({});
    await prisma.courseFileTaskTemplate.deleteMany({});
    await prisma.marks.deleteMany({});
    await prisma.assessment.deleteMany({});
    await prisma.studentPool.deleteMany({});
    await prisma.subject.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.semester.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("Database cleared.");

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    console.log("Creating Admins...");
    const hod1 = await prisma.user.create({
        data: {
            userId: "cdparmar",
            name: "Prof. CD parmar",
            email: "cdparmar@it.com",
            password: hashedPassword,
            role: "HOD",
            mustChangePassword: false
        }
    });

    const hod2 = await prisma.user.create({
        data: {
            userId: "meha_ict",
            name: "Prof. Meha Kothari",
            email: "meha@it.com",
            password: hashedPassword,
            role: "HOD",
            mustChangePassword: false
        }
    });

    console.log("Creating Department...");
    const dept = await prisma.department.create({
        data: {
            name: DEPT_NAME,
            hodId: hod1.id
        }
    });

    console.log("Creating Semester...");
    const sem8 = await prisma.semester.create({
        data: {
            sem: 8,
            departmentId: dept.id
        }
    });

    console.log("Creating Class ICT-8-A...");
    const classA = await prisma.class.create({
        data: {
            name: "ICT-8-A",
            semesterId: sem8.id
        }
    });

    console.log("Creating CC...");
    const cc = await prisma.user.create({
        data: {
            userId: "cc_jignesh",
            name: "Prof. Jignesh Vyas",
            email: "jignesh@it.com",
            password: hashedPassword,
            role: "CC",
            classId: classA.id,
            mustChangePassword: false
        }
    });

    // Update class with CC
    await prisma.class.update({
        where: { id: classA.id },
        data: { ccId: cc.id }
    });

    console.log("Creating Faculty...");
    const fac1 = await prisma.user.create({
        data: {
            userId: "fac_sneha",
            name: "Prof. Sneha Patel",
            email: "sneha@it.com",
            password: hashedPassword,
            role: "FACULTY",
            mustChangePassword: false
        }
    });

    const fac2 = await prisma.user.create({
        data: {
            userId: "fac_rahul",
            name: "Prof. Rahul Sharma",
            email: "rahul@it.com",
            password: hashedPassword,
            role: "FACULTY",
            mustChangePassword: false
        }
    });

    console.log("Creating Subjects...");
    const sub1 = await prisma.subject.create({
        data: {
            name: "Internet of Things (IoT)",
            semesterId: sem8.id,
            facultyIds: [fac1.id]
        }
    });

    const sub2 = await prisma.subject.create({
        data: {
            name: "Mobile Computing (MC)",
            semesterId: sem8.id,
            facultyIds: [fac2.id]
        }
    });

    console.log("Creating 20 Students in ICT-8-A...");
    const students = [];
    const studentNames = [
        "Arjun Mehta", "Priya Sharma", "Rahul Gupta", "Anjali Nair", "Vikram Singh",
        "Deepa Iyer", "Rohan Verma", "Sneha Rao", "Karan Joshi", "Ishita Saxena",
        "Aditya Kulkarni", "Tanvi Bhat", "Siddharth Das", "Riya Kapoor", "Manish Pandey",
        "Neha Reddy", "Akash Malhotra", "Pooja Hegde", "Varun Dhawan", "Shruti Haasan"
    ];

    for (let i = 0; i < 20; i++) {
        const student = await prisma.user.create({
            data: {
                userId: `2024ICT${(i + 1).toString().padStart(2, '0')}`,
                name: studentNames[i],
                email: `student${i + 1}@it.com`,
                password: hashedPassword,
                role: "STUDENT",
                classId: classA.id,
                subjectIds: [sub1.id, sub2.id],
                mustChangePassword: false
            }
        });
        students.push(student);
    }

    console.log("Creating Student Pools...");
    await prisma.studentPool.create({
        data: {
            classId: classA.id,
            type: "FAST",
            students: { connect: students.slice(0, 7).map(s => ({ id: s.id })) }
        }
    });
    await prisma.studentPool.create({
        data: {
            classId: classA.id,
            type: "MEDIUM",
            students: { connect: students.slice(7, 14).map(s => ({ id: s.id })) }
        }
    });
    await prisma.studentPool.create({
        data: {
            classId: classA.id,
            type: "SLOW",
            students: { connect: students.slice(14, 20).map(s => ({ id: s.id })) }
        }
    });

    console.log("Seeding Course File Task Templates...");
    await prisma.courseFileTaskTemplate.createMany({
        data: COURSE_TEMPLATES.map(t => ({ ...t, isActive: true }))
    });

    // Fetch created templates for task creation
    const templates = await prisma.courseFileTaskTemplate.findMany({
        where: { isActive: true }
    });

    console.log("Creating Course File Assignments for Faculties...");
    // For Faculty 1 (IoT) - fac1
    const assignment1 = await prisma.courseFileAssignment.create({
        data: {
            classId: classA.id,
            subjectId: sub1.id,
            facultyId: fac1.id
        }
    });
    // Create tasks for assignment1
    await prisma.courseFileTaskSubmission.createMany({
        data: templates.map(t => ({
            assignmentId: assignment1.id,
            templateId: t.id,
            status: "PENDING"
        }))
    });

    // For Faculty 2 (MC) - fac2
    const assignment2 = await prisma.courseFileAssignment.create({
        data: {
            classId: classA.id,
            subjectId: sub2.id,
            facultyId: fac2.id
        }
    });
    // Create tasks for assignment2
    await prisma.courseFileTaskSubmission.createMany({
        data: templates.map(t => ({
            assignmentId: assignment2.id,
            templateId: t.id,
            status: "PENDING"
        }))
    });

    console.log("Seeding Feedback Template...");
    await prisma.feedbackTemplate.create({
        data: FEEDBACK_TEMPLATE
    });

    console.log("--------------------------------------------------");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("--------------------------------------------------");
    console.log(`Department: ${DEPT_NAME}`);
    console.log(`Admin 1 (Primary): cdparmar / ${DEFAULT_PASSWORD}`);
    console.log(`Admin 2: meha_ict / ${DEFAULT_PASSWORD}`);
    console.log(`CC: cc_jignesh / ${DEFAULT_PASSWORD}`);
    console.log(`Faculty 1 (IoT): fac_sneha / ${DEFAULT_PASSWORD}`);
    console.log(`Faculty 2 (MC): fac_rahul / ${DEFAULT_PASSWORD}`);
    console.log(`20 Students created in class: ICT-8-A`);
    console.log(`Student ID Sample: 2024ICT01 to 2024ICT20`);
    console.log("--------------------------------------------------");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
