import prisma from "../prisma/client.js";

export const startFeedbackSession = async (req, res) => {
    try {
        const { title, templateId, classId, subjectId } = req.body;
        const facultyId = req.user.id;

        // 1. Validate Template
        const template = await prisma.feedbackTemplate.findUnique({ where: { id: templateId } });
        if (!template) return res.status(404).json({ message: "Template not found" });

        // 2. Get Pools for this Class
        const pools = await prisma.studentPool.findMany({
            where: { classId },
            include: { students: { select: { id: true } } }
        });

        const fastPool = pools.find(p => p.type === 'FAST')?.students || [];
        const mediumPool = pools.find(p => p.type === 'MEDIUM')?.students || [];
        const slowPool = pools.find(p => p.type === 'SLOW')?.students || [];

        // 3. Random Selection Logic
        const getRandom = (arr, n) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, n).map(s => s.id);
        };

        const selectedStudents = [
            ...getRandom(fastPool, 3),
            ...getRandom(mediumPool, 2),
            ...getRandom(slowPool, 1)
        ];

        if (selectedStudents.length === 0) {
            return res.status(400).json({ message: "No students found in the selected pools for this class" });
        }

        // 4. Set Expiration (End of Today)
        const expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999);

        // 5. Create Session
        const session = await prisma.feedbackSession.create({
            data: {
                title,
                templateId,
                facultyId,
                classId,
                subjectId,
                assignedStudentIds: selectedStudents,
                expiresAt
            }
        });

        res.status(201).json(session);
    } catch (error) {
        console.error("Error starting feedback session:", error);
        res.status(500).json({ message: "Failed to start feedback session" });
    }
};

export const getStudentSessions = async (req, res) => {
    try {
        const studentId = req.user.id;
        const now = new Date();

        const sessions = await prisma.feedbackSession.findMany({
            where: {
                assignedStudentIds: { has: studentId },
                expiresAt: { gt: now }
            },
            include: {
                template: true,
                faculty: { select: { name: true } },
                subject: { select: { name: true } }
            }
        });

        res.status(200).json(sessions);
    } catch (error) {
        console.error("Error fetching student sessions:", error);
        res.status(500).json({ message: "Failed to fetch sessions" });
    }
};

export const submitFeedback = async (req, res) => {
    try {
        const { sessionId, answers } = req.body;
        const studentId = req.user.id;

        // Verify session assignment and expiration
        const session = await prisma.feedbackSession.findUnique({ where: { id: sessionId } });
        if (!session) return res.status(404).json({ message: "Session not found" });
        if (!session.assignedStudentIds.includes(studentId)) {
            return res.status(403).json({ message: "You are not assigned to this feedback session" });
        }
        if (new Date() > session.expiresAt) {
            return res.status(403).json({ message: "This feedback session has expired" });
        }

        const response = await prisma.feedbackResponse.create({
            data: {
                sessionId,
                studentId,
                answers
            }
        });

        res.status(201).json(response);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Feedback already submitted for this session" });
        }
        console.error("Error submitting feedback:", error);
        res.status(500).json({ message: "Failed to submit feedback" });
    }
};

export const getSessionResponses = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Verification logic for CC could be added here (check if CC of the class)

        const responses = await prisma.feedbackResponse.findMany({
            where: { sessionId },
            include: {
                student: { select: { name: true, userId: true } }
            }
        });

        res.status(200).json(responses);
    } catch (error) {
        console.error("Error fetching session responses:", error);
        res.status(500).json({ message: "Failed to fetch responses" });
    }
};
