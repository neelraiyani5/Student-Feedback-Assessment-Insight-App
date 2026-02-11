import prisma from "../prisma/client.js";
import { createCourseFileLog } from "../utils/courseFileLogger.js";

export const assignSubjectFaculty = async (req, res) => {
    try {
        const { subjectId, facultyId, classId, taskDeadlines } = req.body;
        // taskDeadlines = [{ templateId: '...', deadline: '...' }, ...]

        const ccId = req.user.id;

        // 1. Verify user is CC for this class OR HOD
        const classData = await prisma.class.findUnique({ where: { id: classId } });
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        const isCC = classData.ccId === ccId;
        const isHOD = req.user.role === 'HOD';

        if (!isCC && !isHOD) {
            return res.status(403).json({ message: "You are not authorized to assign subjects in this class" });
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

        // 4. Log the action
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
        const classInfo = await prisma.class.findUnique({ where: { id: classId } });

        await createCourseFileLog({
            action: "FACULTY_ASSIGNED",
            message: `CC assigned ${faculty?.name} to subject ${subject?.name} for class ${classInfo?.name}`,
            user: { id: req.user.id, name: req.user.name },
            className: classInfo?.name,
            subjectName: subject?.name,
            metadata: { facultyName: faculty?.name }
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
                class: { select: { id: true, name: true } },
                _count: {
                    select: {
                        tasks: true
                    }
                }
            }
        });

        // Optimize: Use groupBy to avoid N+1 queries
        const assignmentIds = assignments.map(a => a.id);
        const completedCounts = await prisma.courseFileTaskSubmission.groupBy({
            by: ['assignmentId'],
            where: {
                assignmentId: { in: assignmentIds },
                status: 'COMPLETED'
            },
            _count: { _all: true }
        });

        const countsMap = Object.fromEntries(
            completedCounts.map(c => [c.assignmentId, c._count._all])
        );

        const assignmentsWithProgress = assignments.map(a => ({
            ...a,
            progress: {
                completed: countsMap[a.id] || 0,
                total: a._count.tasks
            }
        }));

        res.status(200).json(assignmentsWithProgress);
    } catch (error) {
        console.error("Error fetching class assignments:", error);
        res.status(500).json({ message: "Failed to fetch assignments" });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const existingAssignment = await prisma.courseFileAssignment.findUnique({
            where: { id },
            include: { subject: true, faculty: true, class: true }
        });

        await prisma.courseFileAssignment.delete({ where: { id } });

        if (existingAssignment) {
            await createCourseFileLog({
                action: "ASSIGNMENT_DELETED",
                message: `CC deleted assignment of ${existingAssignment.faculty.name} for ${existingAssignment.subject.name} in ${existingAssignment.class.name}`,
                user: { id: req.user.id, name: req.user.name },
                className: existingAssignment.class.name,
                subjectName: existingAssignment.subject.name
            });
        }

        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete assignment" });
    }
};

export const getMyAssignments = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const assignments = await prisma.courseFileAssignment.findMany({
            where: { facultyId },
            select: {
                id: true,
                subjectId: true,
                classId: true,
                subject: { select: { id: true, name: true } },
                class: { select: { id: true, name: true } },
                _count: {
                    select: {
                        tasks: true
                    }
                }
            }
        });
        
        const assignmentIds = assignments.map(a => a.id);
        const completedCounts = await prisma.courseFileTaskSubmission.groupBy({
            by: ['assignmentId'],
            where: {
                assignmentId: { in: assignmentIds },
                status: 'COMPLETED'
            },
            _count: { _all: true }
        });

        const countsMap = Object.fromEntries(
            completedCounts.map(c => [c.assignmentId, c._count._all])
        );

        const assignmentsWithProgress = assignments.map(a => ({
            ...a,
            progress: {
                completed: countsMap[a.id] || 0,
                total: a._count.tasks
            }
        }));

        res.status(200).json(assignmentsWithProgress);
    } catch (error) {
        console.error("Error fetching my assignments:", error);
        res.status(500).json({ message: "Failed to fetch my assignments" });
    }
};

export const getDepartmentAssignments = async (req, res) => {
    try {
        const hodId = req.user.id;
        
        const departments = await prisma.department.findMany({
            where: { hodId },
            select: { id: true }
        });
        
        const deptIds = departments.map(d => d.id);

        const assignments = await prisma.courseFileAssignment.findMany({
            where: {
                class: {
                    semester: {
                        departmentId: { in: deptIds }
                    }
                }
            },
            include: {
                subject: { select: { id: true, name: true } },
                faculty: { select: { id: true, name: true } },
                class: { select: { id: true, name: true } },
                _count: { select: { tasks: true } }
            }
        });

        const assignmentIds = assignments.map(a => a.id);
        const completedCounts = await prisma.courseFileTaskSubmission.groupBy({
            by: ['assignmentId'],
            where: {
                assignmentId: { in: assignmentIds },
                status: 'COMPLETED'
            },
            _count: { _all: true }
        });

        const countsMap = Object.fromEntries(
            completedCounts.map(c => [c.assignmentId, c._count._all])
        );

        const assignmentsWithProgress = assignments.map(a => ({
            ...a,
            progress: {
                completed: countsMap[a.id] || 0,
                total: a._count.tasks
            }
        }));

        res.status(200).json(assignmentsWithProgress);
    } catch (error) {
        console.error("Error fetching department assignments:", error);
        res.status(500).json({ message: "Failed to fetch department assignments" });
    }
};
