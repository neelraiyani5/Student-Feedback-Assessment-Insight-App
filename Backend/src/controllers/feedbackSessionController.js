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
                expiresAt,
                topicIds: req.body.topicIds || []
            }
        });

        // Logan: Print assigned students for verification
        const assignedStudents = await prisma.user.findMany({
            where: { id: { in: selectedStudents } },
            select: { name: true, userId: true }
        });

        console.log("--------------------------------------------------");
        console.log(`NEW FEEDBACK SESSION: ${title}`);
        console.log(`Subject: ${session.subjectId} | Class: ${session.classId}`);
        console.log("ASSIGNED STUDENTS:");
        assignedStudents.forEach((s, i) => {
            console.log(`${i + 1}. ${s.name} (${s.userId})`);
        });
        console.log("--------------------------------------------------");

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

        // 1. Fetch sessions without the massive syllabus include
        const sessions = await prisma.feedbackSession.findMany({
            where: {
                assignedStudentIds: { has: studentId },
                expiresAt: { gt: now },
                responses: {
                    none: {
                        studentId: studentId
                    }
                }
            },
            include: {
                template: true,
                faculty: { select: { name: true } },
                subject: { select: { name: true } }
            }
        });

        if (sessions.length === 0) return res.status(200).json([]);

        // 2. Fetch only the TOPICS that are actually assigned to these sessions
        const allTargetTopicIds = sessions.flatMap(s => s.topicIds);
        const specificTopics = await prisma.topic.findMany({
            where: { id: { in: allTargetTopicIds } },
            select: { id: true, name: true }
        });

        const topicsMap = Object.fromEntries(specificTopics.map(t => [t.id, t]));

        // 3. Map topics back to sessions
        const formattedSessions = sessions.map(session => {
            const sessionTopics = session.topicIds
                .map(id => topicsMap[id])
                .filter(Boolean);
            
            return {
                ...session,
                topics: sessionTopics
            };
        });

        res.status(200).json(formattedSessions);
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
        const userRole = req.user.role;

        const responses = await prisma.feedbackResponse.findMany({
            where: { sessionId },
            include: {
                student: userRole === 'HOD' ? { select: { name: true, userId: true } } : false
            }
        });

        // 1. Calculate Stats on Backend to save frontend processing
        const questionMap = {};
        responses.forEach(resp => {
            if (resp.answers && Array.isArray(resp.answers)) {
                resp.answers.forEach(ans => {
                    if (!questionMap[ans.question]) {
                        questionMap[ans.question] = {};
                    }
                    questionMap[ans.question][ans.answer] = (questionMap[ans.question][ans.answer] || 0) + 1;
                });
            }
        });

        const stats = Object.keys(questionMap).map(qText => ({
            question: qText,
            options: questionMap[qText]
        }));

        res.status(200).json({
            responses: userRole === 'HOD' ? responses : [], // Only HOD gets individual rows
            stats,
            total: responses.length,
            requesterRole: userRole
        });
    } catch (error) {
        console.error("Error fetching session responses:", error);
        res.status(500).json({ message: "Failed to fetch responses" });
    }
};

export const getAllSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = {};

        if (userRole === "CC") {
             const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { classesCoordinated: true }
            });
            const classIds = user.classesCoordinated.map(c => c.id);
            whereClause = { classId: { in: classIds } };
        }
        // Faculty sees their own?
        if (userRole === "FACULTY") {
             whereClause = { facultyId: userId };
        }

        const sessions = await prisma.feedbackSession.findMany({
            where: whereClause,
            include: {
                template: { select: { title: true } },
                class: { select: { name: true } },
                subject: { select: { name: true } },
                faculty: { select: { name: true } },
                _count: { select: { responses: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(sessions);
    } catch (error) {
        console.error("Error fetching all sessions:", error);
        res.status(500).json({ message: "Failed to fetch sessions" });
    }
};

export const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const session = await prisma.feedbackSession.findUnique({
            where: { id },
            include: {
                template: true,
                faculty: { select: { name: true } },
                subject: { select: { name: true } }
            }
        });

        if (!session) return res.status(404).json({ message: "Session not found" });

        // Security check for students
        if (role === 'STUDENT' && !session.assignedStudentIds.includes(userId)) {
            return res.status(403).json({ message: "Not assigned to this session" });
        }

        const specificTopics = await prisma.topic.findMany({
            where: { id: { in: session.topicIds } },
            select: { id: true, name: true }
        });

        res.status(200).json({
            ...session,
            topics: specificTopics
        });
    } catch (error) {
        console.error("Error fetching session by ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default {
    startFeedbackSession,
    getStudentSessions,
    submitFeedback,
    getSessionResponses,
    getAllSessions,
    getSessionById
};
