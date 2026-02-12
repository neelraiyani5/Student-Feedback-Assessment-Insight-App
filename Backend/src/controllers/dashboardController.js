import prisma from "../prisma/client.js";

/**
 * Get unified dashboard data for any role (HOD, CC, FACULTY, STUDENT)
 * Reduces multiple network calls to one and minimizes payload size.
 */
export const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // 1. Fetch Basic Profile with role-specific requirements
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userId: true,
                name: true,
                email: true,
                role: true,
                classId: true,
                hodDepartments: { select: { id: true, name: true } },
                classesCoordinated: { select: { id: true, name: true, semesterId: true } },
                subjects: { select: { id: true, name: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Initialize response data
        let myAssignments = [];
        let rawUpcomingTasks = [];
        let monitoringData = [];
        let summaryStats = { compliance: 0, totalCount: 0, completedCount: 0, pendingFeedbackCount: 0 };

        if (userRole !== 'STUDENT') {
            const [assignments, tasks] = await Promise.all([
                prisma.courseFileAssignment.findMany({
                    where: { facultyId: userId },
                    select: {
                        id: true,
                        subjectId: true,
                        classId: true,
                        subject: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                        _count: { select: { tasks: true } }
                    }
                }),
                prisma.courseFileTaskSubmission.findMany({
                    where: {
                        assignment: { facultyId: userId },
                        OR: [
                            { status: 'PENDING' },
                            { ccStatus: 'NO' },
                            { hodStatus: 'NO' }
                        ]
                    },
                    take: 5,
                    select: {
                        id: true,
                        deadline: true,
                        status: true,
                        ccStatus: true,
                        hodStatus: true,
                        template: { select: { title: true } },
                        assignment: {
                            select: {
                                subject: { select: { name: true } },
                                class: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: { deadline: 'asc' }
                })
            ]);

            const myAssignIds = assignments.map(a => a.id);
            const myCompletedCounts = await prisma.courseFileTaskSubmission.groupBy({
                by: ['assignmentId'],
                where: { assignmentId: { in: myAssignIds }, status: 'COMPLETED' },
                _count: { _all: true }
            });
            const myCountsMap = Object.fromEntries(myCompletedCounts.map(c => [c.assignmentId, c._count._all]));
            
            myAssignments = assignments.map(a => ({
                id: a.id,
                subjectId: a.subjectId,
                classId: a.classId,
                name: a.subject.name,
                className: a.class.name,
                subject: a.subject,
                class: a.class,
                progress: a._count.tasks > 0 ? Math.round(((myCountsMap[a.id] || 0) / a._count.tasks) * 100) : 0
            }));
            rawUpcomingTasks = tasks;

            // Role-specific Monitoring
            if (userRole === 'HOD') {
                const deptIds = user.hodDepartments.map(d => d.id);
                const deptAssignments = await prisma.courseFileAssignment.findMany({
                    where: { class: { semester: { departmentId: { in: deptIds } } } },
                    select: {
                        id: true,
                        subject: { select: { name: true } },
                        faculty: { select: { name: true } },
                        class: { select: { name: true } },
                        _count: { select: { tasks: true } }
                    }
                });
                const deptAssignIds = deptAssignments.map(a => a.id);
                const deptCompRes = await prisma.courseFileTaskSubmission.groupBy({
                    by: ['assignmentId'],
                    where: { assignmentId: { in: deptAssignIds }, status: 'COMPLETED' },
                    _count: { _all: true }
                });
                const deptCountsMap = Object.fromEntries(deptCompRes.map(c => [c.assignmentId, c._count._all]));
                
                monitoringData = deptAssignments.map(a => {
                    const total = a._count.tasks;
                    const completed = deptCountsMap[a.id] || 0;
                    summaryStats.totalCount += total;
                    summaryStats.completedCount += completed;
                    return {
                        id: a.id,
                        name: a.subject.name,
                        faculty: a.faculty.name,
                        className: a.class.name,
                        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
                        isAssigned: true
                    };
                });
            } else if (userRole === 'CC' && user.classesCoordinated.length > 0) {
                const classIds = user.classesCoordinated.map(c => c.id);
                const semesterIds = user.classesCoordinated.map(c => c.semesterId);
                const [classAssignments, classSubjects] = await Promise.all([
                    prisma.courseFileAssignment.findMany({
                        where: { classId: { in: classIds } },
                        select: { id: true, subjectId: true, subject: { select: { name: true } }, faculty: { select: { name: true } }, class: { select: { name: true } }, _count: { select: { tasks: true } } }
                    }),
                    prisma.subject.findMany({ where: { semesterId: { in: semesterIds } }, include: { faculties: { select: { name: true } } } })
                ]);
                const classAssignIds = classAssignments.map(a => a.id);
                const classCompRes = await prisma.courseFileTaskSubmission.groupBy({
                    by: ['assignmentId'],
                    where: { assignmentId: { in: classAssignIds }, status: 'COMPLETED' },
                    _count: { _all: true }
                });
                const classCountsMap = Object.fromEntries(classCompRes.map(c => [c.assignmentId, c._count._all]));

                monitoringData = classSubjects.map(subject => {
                    const assignment = classAssignments.find(a => a.subjectId === subject.id);
                    if (assignment) {
                        const total = assignment._count.tasks;
                        const completed = classCountsMap[assignment.id] || 0;
                        summaryStats.totalCount += total;
                        summaryStats.completedCount += completed;
                        return { id: assignment.id, subjectId: subject.id, name: subject.name, faculty: assignment.faculty.name, className: assignment.class.name, progress: total > 0 ? Math.round((completed / total) * 100) : 0, isAssigned: true };
                    }
                    return { id: `unassigned-${subject.id}`, subjectId: subject.id, name: subject.name, faculty: subject.faculties?.length > 0 ? subject.faculties[0].name : "Unassigned", className: user.classesCoordinated[0]?.name || "N/A", progress: 0, isAssigned: false };
                });
            }
            summaryStats.compliance = summaryStats.totalCount > 0 ? Math.round((summaryStats.completedCount / summaryStats.totalCount) * 100) : 0;
        } 
        else if (userRole === 'STUDENT') {
            const [studentSubjects, sessions, classStudents] = await Promise.all([
                prisma.subject.findMany({
                    where: { semester: { classes: { some: { id: user.classId } } } },
                    select: { id: true, name: true }
                }),
                prisma.feedbackSession.findMany({
                    where: { 
                        classId: user.classId,
                        assignedStudentIds: { has: userId },
                        responses: { none: { studentId: userId } },
                        expiresAt: { gt: new Date() }
                    },
                    select: { id: true }
                }),
                prisma.user.findMany({
                    where: { classId: user.classId, role: 'STUDENT' },
                    select: {
                        id: true,
                        marks: {
                            select: {
                                marksObtained: true
                            }
                        }
                    }
                })
            ]);

            // Calculate total marks for each student in the class to determine rank
            const studentPerformances = classStudents.map(s => {
                const totalMarks = s.marks.reduce((sum, m) => sum + m.marksObtained, 0);
                return { id: s.id, totalMarks };
            });

            // Sort by total marks descending
            studentPerformances.sort((a, b) => b.totalMarks - a.totalMarks);

            // Find current student's rank (1-indexed)
            const myRank = studentPerformances.findIndex(p => p.id === userId) + 1;

            monitoringData = studentSubjects;
            summaryStats.pendingFeedbackCount = sessions.length;
            summaryStats.overallRank = myRank || 0;
            summaryStats.totalStudents = classStudents.length;
        }

        res.status(200).json({
            user,
            myAssignments,
            monitoringData,
            upcomingTasks: rawUpcomingTasks,
            summaryStats
        });

    } catch (error) {
        console.error("Dashboard Summary Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
