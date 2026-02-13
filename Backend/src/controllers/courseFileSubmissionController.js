import prisma from "../prisma/client.js";
import { createCourseFileLog } from "../utils/courseFileLogger.js";

export const getFacultyTasks = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const tasks = await prisma.courseFileTaskSubmission.findMany({
      where: {
        assignment: { facultyId },
      },
      include: {
        template: true,
        assignment: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { deadline: "asc" },
        { id: "asc" }
      ],
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

export const getAssignmentTasks = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Security check: Faculty can only see their own assignments
    if (req.user.role === 'FACULTY') {
      const assignment = await prisma.courseFileAssignment.findUnique({
        where: { id: assignmentId }
      });
      if (!assignment || assignment.facultyId !== req.user.id) {
        return res.status(403).json({ message: "Access denied to this assignment" });
      }
    }

    const tasks = await prisma.courseFileTaskSubmission.findMany({
      where: { assignmentId },
      include: {
        template: true,
        assignment: {
          include: {
            subject: { select: { name: true } },
            faculty: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { deadline: "asc" },
        { id: "asc" } 
      ],
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignment tasks" });
  }
};

/**
 * Get tasks for CC/HOD review
 * Shows ALL tasks so reviewer can see overall progress
 * Tasks not yet completed by faculty are marked as pending faculty action
 */
export const getReviewableTasks = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const reviewerId = req.user.id;
    const role = req.user.role;

    // Fetch assignment details
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

    // Authorization check based on role
    if (role === "CC") {
      if (assignment.class.ccId !== reviewerId) {
        return res
          .status(403)
          .json({ message: "You are not the CC for this class" });
      }
    } else if (role === "HOD") {
      if (assignment.class.semester.department.hodId !== reviewerId) {
        return res.status(403).json({
          message: "You are not authorized to review this assignment",
        });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    // Get ALL tasks - show full picture to reviewer
    const tasks = await prisma.courseFileTaskSubmission.findMany({
      where: {
        assignmentId,
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
      orderBy: [
        { deadline: "asc" },
        { id: "asc" } 
      ],
    });

    // Enrich with review metadata
    const enrichedTasks = tasks.map((task) => {
      const isCompleted = task.status === "COMPLETED";
      
      return {
        id: task.id,
        taskId: task.id,
        template: task.template,
        deadline: task.deadline,
        status: task.status,
        completedAt: task.completedAt,

        // Faculty completion status
        pendingFacultyAction: !isCompleted,
        
        // Review status
        ccReviewed: task.ccStatus !== "PENDING",
        ccStatus: task.ccStatus,
        ccRemarks: task.ccRemarks,
        ccReviewDate: task.ccReviewDate,

        hodReviewed: task.hodStatus !== "PENDING",
        hodStatus: task.hodStatus,
        hodRemarks: task.hodRemarks,
        hodReviewDate: task.hodReviewDate,

        // For current reviewer
        requiresCCReview: isCompleted && task.ccStatus === "PENDING" && role === "CC",
        requiresHodReview:
          isCompleted &&
          task.ccStatus === "YES" &&
          task.hodStatus === "PENDING" &&
          role === "HOD",
        isReviewable:
          isCompleted && (
            role === "CC"
              ? task.ccStatus === "PENDING"
              : task.ccStatus === "YES" && task.hodStatus === "PENDING"
          ),
      };
    });

    // Calculate stats
    const completedCount = enrichedTasks.filter(t => t.status === "COMPLETED").length;
    const pendingCount = enrichedTasks.filter(t => t.status === "PENDING").length;
    const ccReviewedCount = enrichedTasks.filter(t => t.ccReviewed && t.status === "COMPLETED").length;
    const hodReviewedCount = enrichedTasks.filter(t => t.hodReviewed && t.status === "COMPLETED").length;

    res.status(200).json({
      assignment: {
        id: assignment.id,
        subject: assignment.subject.name,
        faculty: assignment.faculty.name,
        className: assignment.class.name,
        totalTasksInAssignment: enrichedTasks.length,
        completedByFaculty: completedCount,
        pendingFromFaculty: pendingCount,
        ccReviewedCount,
        hodReviewedCount,
      },
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch reviewable tasks" });
  }
};

/**
 * Get tasks for specific subject
 * HOD/CC can view all tasks for a subject they can access
 */
export const getSubjectReviewableTasks = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const reviewerId = req.user.id;
    const role = req.user.role;

    // Find the assignment for this subject (HOD can have multiple subjects)
    const assignment = await prisma.courseFileAssignment.findFirst({
      where: { subjectId },
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
      return res
        .status(404)
        .json({ message: "No assignment found for this subject" });
    }

    // Authorization check based on role
    if (role === "CC") {
      if (assignment.class.ccId !== reviewerId) {
        return res
          .status(403)
          .json({ message: "You are not the CC for this class" });
      }
    } else if (role === "HOD") {
      if (assignment.class.semester.department.hodId !== reviewerId) {
        return res.status(403).json({
          message: "You are not authorized to review this subject",
        });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    // Get ALL tasks - show full picture to reviewer
    const tasks = await prisma.courseFileTaskSubmission.findMany({
      where: {
        assignmentId: assignment.id,
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
      orderBy: [
        { deadline: "asc" },
        { id: "asc" } 
      ],
    });

    // Enrich with review metadata
    const enrichedTasks = tasks.map((task) => {
      const isCompleted = task.status === "COMPLETED";
      
      return {
        id: task.id,
        taskId: task.id,
        template: task.template,
        deadline: task.deadline,
        status: task.status,
        completedAt: task.completedAt,

        // Faculty completion status
        pendingFacultyAction: !isCompleted,
        
        // Review status
        ccReviewed: task.ccStatus !== "PENDING",
        ccStatus: task.ccStatus,
        ccRemarks: task.ccRemarks,
        ccReviewDate: task.ccReviewDate,

        hodReviewed: task.hodStatus !== "PENDING",
        hodStatus: task.hodStatus,
        hodRemarks: task.hodRemarks,
        hodReviewDate: task.hodReviewDate,

        // For current reviewer
        requiresCCReview: isCompleted && task.ccStatus === "PENDING" && role === "CC",
        requiresHodReview:
          isCompleted &&
          task.ccStatus === "YES" &&
          task.hodStatus === "PENDING" &&
          role === "HOD",
        isReviewable:
          isCompleted && (
            role === "CC"
              ? task.ccStatus === "PENDING"
              : task.ccStatus === "YES" && task.hodStatus === "PENDING"
          ),
      };
    });

    res.status(200).json({
      assignment: {
        id: assignment.id,
        subject: assignment.subject.name,
        faculty: assignment.faculty.name,
        className: assignment.class.name,
        totalTasks: enrichedTasks.length,
      },
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch subject tasks" });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const facultyId = req.user.id;

    const task = await prisma.courseFileTaskSubmission.findUnique({
      where: { id: taskId },
      include: { assignment: true },
    });

    if (!task || task.assignment.facultyId !== facultyId) {
      return res
        .status(403)
        .json({ message: "Access denied or task not found" });
    }

    const isHod = req.user.role === 'HOD';
    const isCc = req.user.role === 'CC';
    const updateData = {
      status: "COMPLETED",
      completedAt: new Date(),
    };

    if (isHod) {
      // HOD level auto-approves everything
      updateData.ccStatus = "YES";
      updateData.ccRemarks = "Self Approved (HOD Subject)";
      updateData.ccReviewDate = new Date();
      updateData.hodStatus = "YES";
      updateData.hodRemarks = "Self Approved (HOD Subject)";
      updateData.hodReviewDate = new Date();
    } else if (isCc) {
      // CC level auto-approves their own part, HOD still needs to review
      updateData.ccStatus = "YES";
      updateData.ccRemarks = "Self Approved (CC Subject)";
      updateData.ccReviewDate = new Date();
      updateData.hodStatus = "PENDING";
    } else {
      // Standard faculty resubmission resets both
      updateData.ccStatus = "PENDING";
      updateData.hodStatus = "PENDING";
    }

    const updatedTask = await prisma.courseFileTaskSubmission.update({
      where: { id: taskId },
      data: updateData,
      include: {
        template: { select: { title: true } },
        assignment: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    await createCourseFileLog({
      action: "TASK_COMPLETED",
      message: `Faculty marked task "${updatedTask.template.title}" as COMPLETED`,
      user: { id: req.user.id, name: req.user.name },
      assignmentId: updatedTask.assignmentId,
      className: updatedTask.assignment.class.name,
      subjectName: updatedTask.assignment.subject.name,
      taskTitle: updatedTask.template.title,
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Failed to complete task" });
  }
};

export const revertTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const facultyId = req.user.id;

    const task = await prisma.courseFileTaskSubmission.findUnique({
      where: { id: taskId },
      include: { assignment: true },
    });

    if (!task || task.assignment.facultyId !== facultyId) {
      return res
        .status(403)
        .json({ message: "Access denied or task not found" });
    }

    // Check if any review has already been done
    if (task.ccStatus !== "PENDING" || task.hodStatus !== "PENDING") {
       // Check if it was CC/HOD themselves who auto-completed it
       const isHod = req.user.role === 'HOD';
       const isCc = req.user.role === 'CC';
       
       // Even if they are CC/HOD, if it's already "YES" and they want to revert, they should be allowed 
       // to revert their OWN auto-approvals if they made a mistake marking it as complete.
       // However, if HOD has reviewed a CC's task, CC cannot revert anymore without HOD's consent 
       // (or HOD reverting first). For simplicity, let's allow it if it's not "locked" strictly.
       
       if (task.hodStatus !== "PENDING" && !isHod && !isCc) {
         return res.status(400).json({ message: "Task has already been reviewed by HOD and cannot be reverted." });
       }
    }

    const updatedTask = await prisma.courseFileTaskSubmission.update({
      where: { id: taskId },
      data: {
        status: "PENDING",
        completedAt: null,
        ccStatus: "PENDING",
        ccRemarks: null,
        ccReviewDate: null,
        hodStatus: "PENDING",
        hodRemarks: null,
        hodReviewDate: null
      },
      include: {
        template: { select: { title: true } },
        assignment: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    await createCourseFileLog({
      action: "TASK_REVERTED",
      message: `Faculty reverted task "${updatedTask.template.title}" to PENDING`,
      user: { id: req.user.id, name: req.user.name },
      assignmentId: updatedTask.assignmentId,
      className: updatedTask.assignment.class.name,
      subjectName: updatedTask.assignment.subject.name,
      taskTitle: updatedTask.template.title,
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to revert task" });
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
      include: {
        assignment: {
          include: {
            class: {
              include: {
                semester: {
                  include: { department: true },
                },
              },
            },
          },
        },
      },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    const updateData = {};
    if (role === "HOD") {
      // ===== HOD REVIEW FLOW =====
      // HOD can ONLY review if:
      // 1. Faculty has COMPLETED the task
      // 2. CC has already reviewed the task (ccStatus is not PENDING)
      // 3. HOD belongs to the department of this assignment

      // Check 1: Faculty must have completed the task
      if (task.status !== "COMPLETED") {
        return res.status(400).json({
          message:
            "Task has not been completed by faculty yet. Faculty status: " +
            task.status,
        });
      }

      // Check 2: CC must have reviewed first
      if (task.ccStatus === "PENDING") {
        return res.status(400).json({
          message:
            "Class Coordinator must review this task first before HOD review",
        });
      }

      // Check 3: Verify HOD belongs to the department
      if (task.assignment.class.semester.department.hodId !== reviewerId) {
        return res.status(403).json({
          message:
            "You are not authorized to review assignments from this department",
        });
      }

      updateData.hodStatus = status;
      updateData.hodRemarks = remarks;
      updateData.hodReviewDate = new Date();
    } else if (role === "CC") {
      // ===== CC REVIEW FLOW =====
      // CC can review if:
      // 1. Faculty has COMPLETED the task
      // 2. CC is the coordinator for this class

      // Check 1: Faculty must have completed the task
      if (task.status !== "COMPLETED") {
        return res.status(400).json({
          message:
            "Task has not been completed by faculty yet. Faculty status: " +
            task.status,
        });
      }

      // Check 2: Verify user is CC for this specific class
      if (task.assignment.class.ccId !== reviewerId) {
        return res
          .status(403)
          .json({ message: "You are not the CC for this class" });
      }

      updateData.ccStatus = status;
      updateData.ccRemarks = remarks;
      updateData.ccReviewDate = new Date();
    } else {
      return res.status(403).json({ message: "Unauthorized role for review" });
    }

    const updatedTask = await prisma.courseFileTaskSubmission.update({
      where: { id: taskId },
      data: updateData,
      include: {
        template: { select: { title: true } },
        assignment: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            faculty: { select: { name: true } },
          },
        },
      },
    });

    const actionType = role === "HOD" ? "HOD_REVIEWED" : "CC_REVIEWED";
    const reviewerRole = role === "HOD" ? "HOD" : "CC";

    await createCourseFileLog({
      action: actionType,
      message: `${reviewerRole} reviewed task "${updatedTask.template.title}" as ${status}`,
      user: { id: req.user.id, name: req.user.name },
      assignmentId: updatedTask.assignmentId,
      className: updatedTask.assignment.class.name,
      subjectName: updatedTask.assignment.subject.name,
      taskTitle: updatedTask.template.title,
      metadata: {
        status: status,
        remarks: remarks,
        facultyName: updatedTask.assignment.faculty.name,
      },
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
        status: "PENDING",
        deadline: { lt: now },
      },
      include: {
        template: { select: { title: true } },
        assignment: {
          include: {
            faculty: { select: { name: true } },
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch compliance alerts" });
  }
};

export const updateTaskDeadline = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { deadline } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await prisma.courseFileTaskSubmission.findUnique({
      where: { id: taskId },
      include: { assignment: { include: { class: true } } },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Logic: HOD can update any. CC can update if they are the CC of the class.
    if (userRole === "CC" && task.assignment.class.ccId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the CC for this class" });
    }

    const updatedTask = await prisma.courseFileTaskSubmission.update({
      where: { id: taskId },
      data: { deadline: new Date(deadline) },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update deadline" });
  }
};

export const batchReviewTasks = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, remarks } = req.body; // status: YES/NO
    const userRole = req.user.role;

    if (userRole !== "HOD") {
      return res
        .status(403)
        .json({ message: "Only HOD can perform batch review" });
    }

    // Find all tasks in this assignment that are CC Verified but HOD Pending
    const tasksToUpdate = await prisma.courseFileTaskSubmission.findMany({
      where: {
        assignmentId: assignmentId,
        ccStatus: "YES",
        hodStatus: "PENDING",
      },
    });

    if (tasksToUpdate.length === 0) {
      return res
        .status(200)
        .json({ message: "No tasks eligible for batch review" });
    }

    // Update them
    await prisma.courseFileTaskSubmission.updateMany({
      where: {
        assignmentId: assignmentId,
        ccStatus: "YES",
        hodStatus: "PENDING",
      },
      data: {
        hodStatus: status,
        hodRemarks: remarks || "Batch Approved by HOD",
        hodReviewDate: new Date(),
      },
    });

    // Log?
    await createCourseFileLog({
      action: "HOD_BATCH_REVIEW",
      message: `HOD batch reviewed ${tasksToUpdate.length} tasks as ${status}`,
      user: { id: req.user.id, name: req.user.name },
      className: "N/A", // Could fetch
      subjectName: "N/A",
      metadata: { count: tasksToUpdate.length },
    });

    res
      .status(200)
      .json({ message: "Batch review complete", count: tasksToUpdate.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to batch review" });
  }
};
