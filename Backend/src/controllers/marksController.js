import prisma from "../prisma/client.js";

export const addMarks = async (req, res) => {
    try {
        const { assessmentId, studentId, marksObtained } = req.body;
        const facultyId = req.user.id;

        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId },
            include: { subject: true }
        });

        if (!assessment || assessment.subject.facultyId !== facultyId) {
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
    } catch {
        res.status(500).json({ message: "Failed to add marks" });
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

        if (!marks || marks.assessment.subject.facultyId !== facultyId) {
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


