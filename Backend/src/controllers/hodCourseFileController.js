import prisma from "../prisma/client.js";

/**
 * Get all semesters for the HOD's department
 * Used for HOD to select which semester to review
 */
export const getHodDepartmentSemesters = async (req, res) => {
  try {
    const hodId = req.user.id;

    // Find departments where user is HOD
    const departments = await prisma.department.findMany({
      where: { hodId },
      include: {
        semesters: {
          select: {
            id: true,
            sem: true,
          },
        },
      },
    });

    if (departments.length === 0) {
      return res
        .status(404)
        .json({ message: "No departments found for this HOD" });
    }

    res.status(200).json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch semesters" });
  }
};

/**
 * Get all subjects with course files for a specific semester
 * HOD can see all subjects in their department's semester
 */
export const getHodSemesterSubjects = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const hodId = req.user.id;

    // Verify this semester belongs to HOD's department
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { department: true },
    });

    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    if (semester.department.hodId !== hodId) {
      return res
        .status(403)
        .json({ message: "You are not the HOD for this department" });
    }

    // Get all subjects in this semester with their assignments
    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      include: {
        courseFileAssignments: {
          include: {
            faculty: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    // Format response
    const subjectsWithAssignments = subjects.map((subject) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      assignments: subject.courseFileAssignments.map((assign) => ({
        assignmentId: assign.id,
        facultyName: assign.faculty.name,
        className: assign.class.name,
        totalTasks: assign._count.tasks,
      })),
    }));

    res.status(200).json(subjectsWithAssignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

/**
 * Get tasks that are ready for HOD review
 * Only shows tasks where faculty has completed status
 * HOD can only review after CC has reviewed (if CC review is required)
 */
export const getHodReviewableTasks = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const hodId = req.user.id;

    // Verify HOD can review this assignment
    const assignment = await prisma.courseFileAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            semester: {
              include: { department: true },
            },
          },
        },
        subject: { select: { name: true } },
        faculty: { select: { name: true } },
      },
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.class.semester.department.hodId !== hodId) {
      return res
        .status(403)
        .json({ message: "Not authorized to review this assignment" });
    }

    // Get only tasks that are COMPLETED by faculty
    // These are the only tasks HOD can review
    const tasks = await prisma.courseFileTaskSubmission.findMany({
      where: {
        assignmentId,
        status: "COMPLETED", // Only completed tasks can be reviewed
      },
      include: {
        template: { select: { id: true, title: true, description: true } },
        assignment: {
          include: {
            subject: { select: { name: true } },
            faculty: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    // Add metadata about review status
    const enrichedTasks = tasks.map((task) => ({
      ...task,
      isReviewable: task.status === "COMPLETED" && task.ccStatus !== "PENDING",
      reviewHistory: {
        ccReviewed: task.ccStatus !== "PENDING",
        ccStatus: task.ccStatus,
        ccReviewDate: task.ccReviewDate,
        hodReviewed: task.hodStatus !== "PENDING",
        hodStatus: task.hodStatus,
        hodReviewDate: task.hodReviewDate,
      },
    }));

    res.status(200).json({
      assignment: {
        id: assignment.id,
        subject: assignment.subject.name,
        faculty: assignment.faculty.name,
        class: assignment.class.name,
      },
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks for review" });
  }
};

/**
 * Get compliance summary for HOD's department
 * Shows which tasks have been reviewed and by whom
 */
export const getHodComplianceSummary = async (req, res) => {
  try {
    const hodId = req.user.id;

    // Find departments where user is HOD
    const departments = await prisma.department.findMany({
      where: { hodId },
      include: {
        semesters: {
          include: {
            classes: {
              include: {
                courseFileAssignments: {
                  include: {
                    subject: { select: { name: true } },
                    faculty: { select: { name: true } },
                    tasks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (departments.length === 0) {
      return res.status(404).json({ message: "No departments found" });
    }

    // Aggregate statistics
    let totalAssignments = 0;
    let totalTasks = 0;
    let hodReviewedTasks = 0;
    let ccReviewedTasks = 0;
    let completedTasks = 0;

    const semesterStats = [];

    for (const dept of departments) {
      for (const semester of dept.semesters) {
        let semTasks = 0;
        let semCompleted = 0;
        let semCCReviewed = 0;
        let semHodReviewed = 0;

        for (const cls of semester.classes) {
          for (const assignment of cls.courseFileAssignments) {
            totalAssignments += 1;

            for (const task of assignment.tasks) {
              totalTasks += 1;
              semTasks += 1;

              if (task.status === "COMPLETED") {
                completedTasks += 1;
                semCompleted += 1;
              }

              if (task.ccStatus !== "PENDING") {
                ccReviewedTasks += 1;
                semCCReviewed += 1;
              }

              if (task.hodStatus !== "PENDING") {
                hodReviewedTasks += 1;
                semHodReviewed += 1;
              }
            }
          }
        }

        if (semTasks > 0) {
          semesterStats.push({
            semesterId: semester.id,
            semesterNo: semester.sem,
            totalTasks: semTasks,
            completed: semCompleted,
            ccReviewed: semCCReviewed,
            hodReviewed: semHodReviewed,
            completionPercent: Math.round((semCompleted / semTasks) * 100),
            ccReviewPercent: Math.round((semCCReviewed / semTasks) * 100),
            hodReviewPercent: Math.round((semHodReviewed / semTasks) * 100),
          });
        }
      }
    }

    const summary = {
      departmentName: departments[0].name,
      totalAssignments,
      totalTasks,
      completedTasks: {
        count: completedTasks,
        percent: Math.round((completedTasks / totalTasks) * 100),
      },
      ccReviewedTasks: {
        count: ccReviewedTasks,
        percent: Math.round((ccReviewedTasks / totalTasks) * 100),
      },
      hodReviewedTasks: {
        count: hodReviewedTasks,
        percent: Math.round((hodReviewedTasks / totalTasks) * 100),
      },
      semesterStats,
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch compliance summary" });
  }
};
