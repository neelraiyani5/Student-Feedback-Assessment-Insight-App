import prisma from "../prisma/client.js";

export const createSubject = async (req, res) => {
    try {
        const { name, semesterId } = req.body;

        const existingSubject = await prisma.subject.findUnique({
            where: {
                name_semesterId: { name, semesterId }
            }
        });

        if (existingSubject) return res.status(409).json({ message: "Subject already exists in this semester!!!" });

        const subject = await prisma.subject.create({
            data: {
                name,
                semesterId
            }
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: "Failed to create subject" });
    }
}



export const assignFaculty = async (req, res) => {
    try {
        const { subjectId, facultyId } = req.body;

        const subject = await prisma.subject.update({
            where: { id: subjectId },
            data: { facultyId }
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: "Failed to assign faculty" });
    }
};
