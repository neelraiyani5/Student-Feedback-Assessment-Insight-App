import prisma from "../prisma/client.js";

export const createAssessment = async (req, res) => {
    try {
        const { title, component, maxMarks, subjectId, classId } = req.body;
        const facultyId = req.user.id;

        const subject = await prisma.subject.findFirst({
            where: { 
                id: subjectId,
                OR: [
                    { facultyIds: { has: facultyId } },
                    { semester: { department: { hodId: facultyId } } } // HOD check via relations
                ]
            }
        });

        if (!subject) return res.status(403).json({ message: "Not authorized to create assessments for this subject!!!" });

        const cls = await prisma.class.findFirst({
            where: { id: classId, semesterId: subject.semesterId }
        });

        if (!cls) return res.status(400).json({ message: "Invalid class!!!" });

        const assessment = await prisma.assessment.create({
            data: { title, component, maxMarks, subjectId, classId }
        });

        res.status(201).json({ message: "Assessment created successfully" }, assessment);
    } catch (error) {
        res.status(500).json({ message: "Failed to create assessment" });
    }
}



export const subjectAssessmentList = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;

        const assessment = await prisma.assessment.findMany({
            where: {classId, subjectId}
        });

        res.json(assessment);
    } catch (error) {
        res.status(500).json({ message: "Error fetching assessments" });
    }
}



export const updateAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { title, component, maxMarks } = req.body;
        const facultyId = req.user.id;

        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId },
            include: { subject: true }
        });

        if (!assessment || assessment.subject.facultyId !== facultyId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updated = await prisma.assessment.update({
            where: { id: assessmentId },
            data: { title, component, maxMarks }
        });

        res.json(updated);
    } catch {
        res.status(500).json({ message: "Failed to update assessment" });
    }
}



export const deleteAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const facultyId = req.user.id;

        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId },
            include: { subject: true }
        });

        if (!assessment || assessment.subject.facultyId !== facultyId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await prisma.marks.deleteMany({
            where: { assessmentId }
        });

        await prisma.assessment.delete({
            where: { id: assessmentId }
        });

        res.json({ message: "Assessment deleted successfully" });
    } catch {
        res.status(500).json({ message: "Failed to delete assessment" });
    }
}

