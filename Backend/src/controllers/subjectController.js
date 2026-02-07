import prisma from "../prisma/client.js";

export const createSubject = async (req, res) => {
  try {
    const { name, semesterId } = req.body;

    const existingSubject = await prisma.subject.findUnique({
      where: {
        name_semesterId: { name, semesterId },
      },
    });

    if (existingSubject)
      return res
        .status(409)
        .json({ message: "Subject already exists in this semester!!!" });

    const subject = await prisma.subject.create({
      data: {
        name,
        semesterId,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: "Failed to create subject" });
  }
};

export const assignFaculty = async (req, res) => {
  try {
    const { subjectId, facultyId } = req.body;

    const faculty = await prisma.user.findFirst({
      where: {
        id: facultyId,
        role: { in: ["FACULTY", "CC", "HOD"] },
      },
    });

    if (!faculty)
      return res
        .status(404)
        .json({ message: "Faculty not found or invalid role!!!" });

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject)
      return res.status(404).json({ message: "Subject not found!!!" });

    const updateSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: { facultyId },
    });

    res
      .status(201)
      .json({
        messgae: "Faculty assigned to subject successfully",
        updateSubject,
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign faculty" });
  }
};

// Get subjects for a specific class
export const getClassSubjects = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { semester: true },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get all subjects in this class's semester
    const subjects = await prisma.subject.findMany({
      where: { semesterId: classData.semesterId },
      include: {
        faculties: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

// Create subject in a specific class's semester
export const createClassSubject = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name } = req.body;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { semester: true },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const existingSubject = await prisma.subject.findUnique({
      where: {
        name_semesterId: { name, semesterId: classData.semesterId },
      },
    });

    if (existingSubject) {
      return res
        .status(409)
        .json({ message: "Subject already exists in this semester" });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        semesterId: classData.semesterId,
      },
      include: {
        faculties: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create subject" });
  }
};

// Update subject
export const updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { name } = req.body;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: { name },
      include: {
        faculties: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update subject" });
  }
};

// Delete subject
export const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 1. Get all CourseFileAssignment IDs for this subject
    const assignments = await prisma.courseFileAssignment.findMany({
      where: { subjectId },
      select: { id: true }
    });
    const assignmentIds = assignments.map(a => a.id);

    // 2. Delete CourseFileTaskSubmission records first (child of assignments)
    if (assignmentIds.length > 0) {
      await prisma.courseFileTaskSubmission.deleteMany({
        where: { assignmentId: { in: assignmentIds } }
      });
    }

    // 3. Delete course file assignments for this subject
    await prisma.courseFileAssignment.deleteMany({
      where: { subjectId },
    });

    // 4. Delete marks for assessments of this subject
    await prisma.marks.deleteMany({
      where: { assessment: { subjectId } }
    });

    // 5. Delete assessments for this subject
    await prisma.assessment.deleteMany({
      where: { subjectId },
    });

    // 6. Get feedback sessions for this subject
    const sessions = await prisma.feedbackSession.findMany({
      where: { subjectId },
      select: { id: true }
    });
    const sessionIds = sessions.map(s => s.id);

    // 7. Delete feedback responses first
    if (sessionIds.length > 0) {
      await prisma.feedbackResponse.deleteMany({
        where: { sessionId: { in: sessionIds } }
      });
    }

    // 8. Delete feedback sessions for this subject
    await prisma.feedbackSession.deleteMany({
      where: { subjectId },
    });

    // 9. Remove subjectId from all faculty members
    const facultyWithSubject = await prisma.user.findMany({
      where: { subjectIds: { has: subjectId } }
    });
    for (const faculty of facultyWithSubject) {
      await prisma.user.update({
        where: { id: faculty.id },
        data: {
          subjectIds: {
            set: faculty.subjectIds.filter(sid => sid !== subjectId)
          }
        }
      });
    }

    // 10. Delete subject
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete subject", error: error.message });
  }
};

// Assign faculty to subject (replaces all faculty for that subject)
// Also updates User.subjectIds and creates CourseFileAssignments
export const assignFacultyToSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { facultyIds } = req.body;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Verify all faculty exist
    const faculties = await prisma.user.findMany({
      where: {
        id: { in: facultyIds },
        role: { in: ["FACULTY", "CC", "HOD"] },
      },
    });

    if (faculties.length !== facultyIds.length) {
      return res.status(400).json({ message: "One or more faculty not found" });
    }

    const oldFacultyIds = subject.facultyIds || [];
    const newFacultyIds = facultyIds || [];

    // Calculate differences
    const removedIds = oldFacultyIds.filter(id => !newFacultyIds.includes(id));
    const addedIds = newFacultyIds.filter(id => !oldFacultyIds.includes(id));

    // Remove subjectId from removed users
    await Promise.all(
      removedIds.map(async (uid) => {
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (user && user.subjectIds) {
          const newSubjectIds = user.subjectIds.filter(sid => sid !== subjectId);
          await prisma.user.update({
            where: { id: uid },
            data: { subjectIds: newSubjectIds },
          });
        }
      })
    );

    // Fetch Templates Once
    const templates = await prisma.courseFileTaskTemplate.findMany({
      where: { isActive: true },
    });

    // Get all classes in the subject's semester
    const classesInSemester = await prisma.class.findMany({
      where: { semesterId: subject.semesterId }
    });

    // Add to Added Faculty & Generate Course Files
    await Promise.all(
      addedIds.map(async (uid) => {
        // Update User Subject List
        await prisma.user.update({
          where: { id: uid },
          data: { subjectIds: { push: subjectId } },
        });

        // Create CourseFileAssignment for each class in semester
        for (const cls of classesInSemester) {
          const existingAssignment = await prisma.courseFileAssignment.findUnique({
            where: {
              course_assignment_unique: {
                subjectId,
                facultyId: uid,
                classId: cls.id,
              },
            },
          });

          if (!existingAssignment) {
            const assignment = await prisma.courseFileAssignment.create({
              data: {
                subjectId,
                facultyId: uid,
                classId: cls.id,
              },
            });

            // Create Tasks
            const submissions = templates.map((template) => ({
              assignmentId: assignment.id,
              templateId: template.id,
              status: "PENDING",
            }));

            await prisma.courseFileTaskSubmission.createMany({
              data: submissions,
            });
          }
        }
      })
    );

    // Update Subject
    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: { facultyIds: newFacultyIds },
      include: {
        faculties: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ message: "Faculty assigned and tasks initialized", subject: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to assign faculty", error: error.message });
  }
};
