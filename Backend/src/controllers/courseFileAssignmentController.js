import prisma from "../prisma/client.js";

export const assignSubjectFaculty = async (req, res) => {
    try {
        const { subjectId, facultyId, classId, taskDeadlines } = req.body;
        // taskDeadlines = [{ templateId: '...', deadline: '...' }, ...]

        const ccId = req.user.id;

        // 1. Verify user is CC for this class
        const classData = await prisma.class.findUnique({ where: { id: classId } });
        if (!classData || classData.ccId !== ccId) {
            return res.status(403).json({ message: "You are not the Class Coordinator for this class" });
        }

        // 2. Create Assignment
        const assignment = await prisma.courseFileAssignment.create({
            data: {
                subjectId,
                facultyId,
                classId
            }
        });

        // 3. Initialize 27 Tasks from templates
        const templates = await prisma.courseFileTaskTemplate.findMany({
            where: { isActive: true }
        });

        const submissions = templates.map(template => {
            const customDeadline = taskDeadlines?.find(d => d.templateId === template.id)?.deadline;
            const deadline = customDeadline ? new Date(customDeadline) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days default

            return {
                assignmentId: assignment.id,
                templateId: template.id,
                deadline: deadline,
                status: 'PENDING'
            };
        });

        await prisma.courseFileTaskSubmission.createMany({
            data: submissions
        });

        res.status(201).json({ message: "Subject assigned and tasks initialized", assignment });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Faculty already assigned to this subject in this class" });
        }
        console.error(error);
        res.status(500).json({ message: "Failed to assign subject" });
    }
};

export const getClassAssignments = async (req, res) => {
    try {
        const { classId } = req.params;
        const assignments = await prisma.courseFileAssignment.findMany({
            where: { classId },
            include: {
                subject: { select: { id: true, name: true } },
                faculty: { select: { id: true, name: true, userId: true } },
                _count: {
                    select: {
                        tasks: {
                            where: { status: 'COMPLETED' }
                        }
                    }
                }
            }
        });
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch assignments" });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        // Cascade delete would be ideal, but we'll do it manually if needed or rely on schema
        await prisma.courseFileAssignment.delete({ where: { id } });
        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete assignment" });
    }
};
