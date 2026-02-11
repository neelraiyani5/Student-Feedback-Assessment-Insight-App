import prisma from "../prisma/client.js";
import xlsx from "xlsx";
import fs from "fs";

export const addMarks = async (req, res) => {
    try {
        const { assessmentId, studentId, marksObtained } = req.body;
        const facultyId = req.user.id;

        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId },
            include: { subject: true }
        });

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        const isAuthorized = assessment.subject.facultyIds.includes(facultyId) || req.user.role === 'HOD';

        if (!isAuthorized) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (marksObtained > assessment.maxMarks) {
            return res.status(400).json({ message: "Marks exceed max marks" });
        }

        const student = await prisma.user.findFirst({
            where: { id: studentId, classId: assessment.classId }
        });

        if (!student) {
            return res.status(400).json({ message: "Student not in class" });
        }

        const marks = await prisma.marks.create({
            data: {
                studentId,
                assessmentId,
                marksObtained
            }
        });

        res.status(201).json(marks);
    } catch (error) {
        console.error("Add Marks Error:", error);
        res.status(500).json({ message: "Failed to add marks" });
    }
}

export const bulkUploadMarks = async (req, res) => {
    try {
        const { assessmentId, studentIdColumn, marksColumn } = req.body;
        const facultyId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: { subject: true }
        });

        if (!assessment) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Assessment not found" });
        }

        const isAuthorized = assessment.subject.facultyIds.includes(facultyId) || req.user.role === 'HOD';

        if (!isAuthorized) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ message: "Unauthorized!!!" });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const sheetData = xlsx.utils.sheet_to_json(sheet);

        if (sheetData.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: "The uploaded file is empty" });
        }

        // Validate columns
        const actualColumns = Object.keys(sheetData[0]);
        if (!actualColumns.includes(studentIdColumn) || !actualColumns.includes(marksColumn)) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                message: `Column not found. Please check your spelling for "${studentIdColumn}" and "${marksColumn}" in the Excel file.`
            });
        }

        const results = [];
        const errors = [];

        for (const row of sheetData) {
            const studentUserid = row[studentIdColumn]?.toString();
            const marksObtained = parseInt(row[marksColumn]);

            if (!studentUserid || isNaN(marksObtained)) {
                errors.push({ row, error: "Missing or invalid data in row" });
                continue;
            }

            if (marksObtained > assessment.maxMarks) {
                errors.push({ studentUserid, marksObtained, error: `Marks exceed max marks (${assessment.maxMarks})` });
                continue;
            }

            try {
                // Find student by userid and ensure they are in the correct class
                const student = await prisma.user.findFirst({
                    where: {
                        userId: studentUserid,
                        classId: assessment.classId,
                        role: "STUDENT"
                    }
                });

                if (!student) {
                    errors.push({ studentUserid, error: "Student not found in this class" });
                    continue;
                }

                // Upsert marks
                await prisma.marks.upsert({
                    where: {
                        studentId_assessmentId: {
                            studentId: student.id,
                            assessmentId: assessment.id
                        }
                    },
                    update: { marksObtained },
                    create: {
                        studentId: student.id,
                        assessmentId: assessment.id,
                        marksObtained
                    }
                });

                results.push({ studentUserid, status: "Success" });
            } catch (err) {
                errors.push({ studentUserid, error: err.message });
            }
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            message: "Bulk upload completed",
            totalProcessed: sheetData.length,
            successCount: results.length,
            failureCount: errors.length,
            errors
        });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error("Bulk Upload Error:", error);
        res.status(500).json({ message: "Failed to process bulk upload", error: error.message });
    }
}



export const getMyMarks = async (req, res) => {
    try {
        const studentId = req.user.id;

        const marks = await prisma.marks.findMany({
            where: { studentId },
            include: {
                assessment: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        const result = marks.map(m => ({
            subject: m.assessment.subject.name,
            component: m.assessment.component,
            assessment: m.assessment.title,
            marksObtained: m.marksObtained,
            maxMarks: m.assessment.maxMarks
        }));

        res.json(result);
    } catch {
        res.status(500).json({ message: "Failed to fetch marks" });
    }
}



export const updateMarks = async (req, res) => {
    try {
        const { marksId } = req.params;
        const { marksObtained } = req.body;
        const facultyId = req.user.id;

        const marks = await prisma.marks.findFirst({
            where: { id: marksId },
            include: {
                assessment: {
                    include: { subject: true }
                }
            }
        });

        if (!marks) {
            return res.status(404).json({ message: "Marks record not found" });
        }

        const isAuthorized = marks.assessment.subject.facultyIds.includes(facultyId) || req.user.role === 'HOD';

        if (!isAuthorized) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (marksObtained > marks.assessment.maxMarks) {
            return res.status(400).json({ message: "Marks exceed max marks" });
        }

        const updated = await prisma.marks.update({
            where: { id: marksId },
            data: { marksObtained }
        });

        res.json(updated);
    } catch {
        res.status(500).json({ message: "Failed to update marks" });
    }
};


