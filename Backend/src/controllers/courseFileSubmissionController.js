import prisma from "../prisma/client.js";

export const getFacultyTasks = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const tasks = await prisma.courseFileTaskSubmission.findMany({
            where: {
                assignment: { facultyId }
            },
            include: {
                template: true,
                assignment: {
                    include: {
                        subject: { select: { name: true } },
                        class: { select: { name: true } }
                    }
                }
            },
            orderBy: { deadline: 'asc' }
        });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
};

export const completeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const facultyId = req.user.id;

        const task = await prisma.courseFileTaskSubmission.findUnique({
            where: { id: taskId },
            include: { assignment: true }
        });

        if (!task || task.assignment.facultyId !== facultyId) {
            return res.status(403).json({ message: "Access denied or task not found" });
        }

        const updatedTask = await prisma.courseFileTaskSubmission.update({
            where: { id: taskId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: "Failed to complete task" });
    }
};

export const reviewTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, remarks } = req.body; // status: YES/NO, remarks: string
        const reviewerId = req.user.id;
        const role = req.user.role;

        const task = await prisma.courseFileTaskSubmission.findUnique({
            where: { id: taskId },
            include: { assignment: { include: { class: true } } }
        });

        if (!task) return res.status(404).json({ message: "Task not found" });

        const updateData = {};
        if (role === 'HOD') {
            // HOD can only review after CC has reviewed or if CC is bypassed (user said CC first, then HOD)
            if (task.ccStatus === 'PENDING') {
                return res.status(400).json({ message: "CC must review this task first" });
            }
            updateData.hodStatus = status;
            updateData.hodRemarks = remarks;
            updateData.hodReviewDate = new Date();
        } else if (role === 'CC') {
            // Verify user is CC for this specific class
            if (task.assignment.class.ccId !== reviewerId) {
                return res.status(403).json({ message: "You are not the CC for this class" });
            }
            updateData.ccStatus = status;
            updateData.ccRemarks = remarks;
            updateData.ccReviewDate = new Date();
        } else {
            return res.status(403).json({ message: "Unauthorized role for review" });
        }

        const updatedTask = await prisma.courseFileTaskSubmission.update({
            where: { id: taskId },
            data: updateData
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: "Failed to review task" });
    }
};

export const getComplianceAlerts = async (req, res) => {
    try {
        const now = new Date();
        const alerts = await prisma.courseFileTaskSubmission.findMany({
            where: {
                status: 'PENDING',
                deadline: { lt: now }
            },
            include: {
                template: { select: { title: true } },
                assignment: {
                    include: {
                        faculty: { select: { name: true } },
                        subject: { select: { name: true } },
                        class: { select: { name: true } }
                    }
                }
            }
        });
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch compliance alerts" });
    }
};
