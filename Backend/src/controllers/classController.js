import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";

export const addClass = async (req, res) => {
  try {
    const { semesterId, name } = req.body;

    const exists = await prisma.class.findUnique({
      where: { name_semesterId: { name, semesterId } },
    });

    if (exists)
      return res.status(409).json({ message: "Class already exists" });

    const newClass = await prisma.class.create({
      data: {
        name,
        semesterId,
        pools: {
          create: [{ type: "FAST" }, { type: "MEDIUM" }, { type: "SLOW" }],
        },
      },
      include: { pools: true },
    });

    res.status(201).json({
      message: "Class with pools created successfully",
      Class_Details: newClass,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create class", error: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { userId, name, email, classId } = req.body;

    // Check availability
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { userId }] },
    });
    if (existing) {
      const message = existing.userId === userId ? "Student ID already exists" : "Email already exists";
      return res.status(409).json({ message });
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await prisma.user.create({
      data: {
        userId,
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        classId,
      },
    });

    res.status(201).json({
      message: "Student created successfully",
      Credentials: { userId, password },
    });
  } catch (error) {
    if (error.code === 'P2002') {
        const field = error.meta?.target || '';
        const message = field.includes('userId') ? 'Student ID already exists' : 
                      field.includes('email') ? 'Email already exists' : 
                      'Student with these details already exists';
        return res.status(409).json({ message });
    }
    res
      .status(500)
      .json({ message: "Failed to create student", error: error.message });
  }
};

export const assignCC = async (req, res) => {
  try {
    const { classId, facultyId } = req.body;

    // Verify Faculty
    const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
    if (!faculty || faculty.role !== "FACULTY") {
      return res
        .status(400)
        .json({ message: "Invalid Faculty ID or User is not basic Faculty" });
    }

    // Get Class to check overlap
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });
    if (!existingClass)
      return res.status(404).json({ message: "Class not found" });

    const operations = [];

    // If class has existing CC, demote them
    if (existingClass.ccId) {
      operations.push(
        prisma.user.update({
          where: { id: existingClass.ccId },
          data: { role: "FACULTY", classId: null },
        }),
      );
    }

    // Update New CC
    operations.push(
      prisma.user.update({
        where: { id: facultyId },
        data: { role: "CC", classId },
      }),
    );

    // Update Class
    operations.push(
      prisma.class.update({
        where: { id: classId },
        data: { ccId: facultyId },
      }),
    );

    await prisma.$transaction(operations);

    const updatedClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    res
      .status(200)
      .json({ message: "CC Assigned Successfully", class: updatedClass });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to assign CC", error: error.message });
  }
};

export const resetStudentPassword = async (req, res) => {
  try {
    const { studentId } = req.body;

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: studentId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password reset successfully", password });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to reset password", error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { studentId, name, email, userId } = req.body;

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { userId }],
        NOT: { id: studentId },
      },
    });

    if (existing) {
      const message = existing.userId === userId ? "Student ID already exists" : "Email already exists";
      return res.status(409).json({ message });
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { name, email, userId },
    });

    res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    if (error.code === 'P2002') {
        const field = error.meta?.target || '';
        const message = field.includes('userId') ? 'Student ID already exists' : 
                      field.includes('email') ? 'Email already exists' : 
                      'Student with these details already exists';
        return res.status(409).json({ message });
    }
    res
      .status(500)
      .json({ message: "Failed to update student", error: error.message });
  }
};

export const classStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is missing" });
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        semester: true,
        pools: true,
      },
    });

    if (!classInfo) {
      return res.status(404).json({ message: "Class not found" });
    }

    const students = await prisma.user.findMany({
      where: { classId, role: "STUDENT" },
    });

    res.status(200).json({ Students: students, Class: classInfo });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error!!!", error: error.message });
  }
};

export const addStudentToClass = async (req, res) => {
  try {
    const { studentId, classId } = req.body;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "STUDENT") {
      return res.status(400).json({ message: "Invalid student" });
    }

    await prisma.user.update({
      where: { id: studentId },
      data: {
        classId,
        poolId: null,
      },
    });

    res.status(200).json({ message: "Student assigned to class" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to assign student to class", error });
  }
};

export const addStudentToPool = async (req, res) => {
  try {
    const ccId = req.user.id;
    const { studentId, poolId } = req.body;

    const cc = await prisma.user.findUnique({ where: { id: ccId } });

    if (!cc || cc.role !== "CC") {
      return res.status(403).json({ message: "Access Denied!!!" });
    }

    const pool = await prisma.studentPool.findUnique({ where: { id: poolId } });

    if (!pool || pool.classId !== cc.classId) {
      return res
        .status(403)
        .json({ message: "Pool not found or CC doesn't belong to this class" });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (
      !student ||
      student.role !== "STUDENT" ||
      student.classId !== cc.classId
    ) {
      return res
        .status(403)
        .json({ message: "Student not found or doesnt belong to this class" });
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { poolId },
    });

    res.status(200).json({ message: `Student added to ${pool.type} Pool` });
  } catch (error) {
    res.status(500).json({ message: "Failed to add student to pool", error });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, semesterId } = req.body;

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { name, semesterId },
    });

    res
      .status(200)
      .json({ message: "Class updated successfully", class: updatedClass });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update class", error: error.message });
  }
};

/* Subject Management */

export const createSubject = async (req, res) => {
  try {
    const { name, semesterId: providedSemesterId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    let semesterId = providedSemesterId;

    // If CC, auto-detect semester from their class
    if (userRole === "CC") {
      const ccClass = await prisma.class.findFirst({
        where: { ccId: userId },
      });

      if (!ccClass) {
        return res
          .status(404)
          .json({ message: "You are not assigned as Class Coordinator." });
      }
      semesterId = ccClass.semesterId;
    }

    // HOD must provide semesterId
    if (!semesterId) {
      return res.status(400).json({ message: "Semester ID is required." });
    }

    // Check if subject exists in this semester
    const exists = await prisma.subject.findFirst({
      where: {
        name,
        semesterId,
      },
    });

    if (exists) {
      return res
        .status(409)
        .json({ message: "Subject already exists in this semester." });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        semesterId,
      },
    });

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create subject", error: error.message });
  }
};

export const getClassSubjects = async (req, res) => {
  try {
    const ccId = req.user.id;

    const ccClass = await prisma.class.findFirst({
      where: { ccId },
    });

    if (!ccClass) {
      return res.status(404).json({ message: "Class not found for this CC." });
    }

    const subjects = await prisma.subject.findMany({
      where: { semesterId: ccClass.semesterId },
      include: { faculties: true }, // Include assigned faculties details
    });

    res.status(200).json({ subjects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subjects", error: error.message });
  }
};

export const assignFacultyToSubject = async (req, res) => {
  try {
    const { subjectId, facultyIds } = req.body; // Expecting Array
    const ccId = req.user.id;

    // Verify Subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // Get CC's Class (Course File Assignment needs Class Context)
    const ccClass = await prisma.class.findFirst({
      where: { ccId },
    });

    // If CC context is missing (e.g. Admin doing this?), we might skip task creation or fail.
    // Assuming strict CC workflow for now.
    if (!ccClass) {
      // Fallback: If not CC, maybe HOD? But HOD manages Department.
      // If implicit class context is needed, we rely on subject->semester->class?
      // But multiple classes can be in a semester.
      // We'll proceed with subject assignment but warn if class context missing for tasks.
      console.warn(
        "No CC Class context found. Course File Tasks will NOT be generated.",
      );
    }

    const oldFacultyIds = subject.facultyIds || [];
    const newFacultyIds = facultyIds || [];

    // Calculate differences
    const removedIds = oldFacultyIds.filter(
      (id) => !newFacultyIds.includes(id),
    );
    const addedIds = newFacultyIds.filter((id) => !oldFacultyIds.includes(id));

    const operations = [];

    // 1. Update Subject's facultyIds
    operations.push(
      prisma.subject.update({
        where: { id: subjectId },
        data: { facultyIds: newFacultyIds },
      }),
    );

    // 2. Remove subjectId from removed users
    await Promise.all(
      removedIds.map(async (uid) => {
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (user && user.subjectIds) {
          const newSubjectIds = user.subjectIds.filter(
            (sid) => sid !== subjectId,
          );
          await prisma.user.update({
            where: { id: uid },
            data: { subjectIds: newSubjectIds },
          });
        }
      }),
    );

    // 3. Add to Added Faculty & Generate Course Files

    // Fetch Templates Once
    const templates = await prisma.courseFileTaskTemplate.findMany({
      where: { isActive: true },
    });

    await Promise.all(
      addedIds.map(async (uid) => {
        // Update User Subject List
        await prisma.user.update({
          where: { id: uid },
          data: { subjectIds: { push: subjectId } },
        });

        // Auto-Create Course File Assignment + Tasks for ALL Classes in that Semester
        // 1. Get Semester ID from Subject
        // 2. Get All Classes in that Semester
        // 3. Loop and Create Assignment
        
        if (!subject.semesterId) {
             console.warn("Subject has no semester ID, skipping course file creation.");
             return;
        }

        const classesInSemester = await prisma.class.findMany({
            where: { semesterId: subject.semesterId }
        });

        for (const cls of classesInSemester) {
          // Check if assignment already exists (idempotency)
          const existingAssignment =
            await prisma.courseFileAssignment.findUnique({
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
      }),
    );

    // Finally update Subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: { facultyIds: newFacultyIds },
    });

    res.status(200).json({
      message: "Faculty assigned and tasks initialized",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to assign faculty", error: error.message });
  }
};

export const getSubjectClasses = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // 1. Identify which Semester this subject belongs to
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { semesterId: true },
    });

    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // 2. Fetch all Classes for that Semester
    const classes = await prisma.class.findMany({
      where: { semesterId: subject.semesterId },
    });

    // Return classes
    res.status(200).json({ classes });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch classes", error: error.message });
  }
};

export const createAssessment = async (req, res) => {
  try {
    const { title, component, maxMarks, subjectId, classId } = req.body;

    const newAssessment = await prisma.assessment.create({
      data: {
        title,
        component,
        maxMarks: parseInt(maxMarks),
        subjectId,
        classId,
      },
    });

    res.status(201).json({
      message: "Assessment created successfully",
      assessment: newAssessment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create assessment", error: error.message });
  }
};

export const getFacultyAssessments = async (req, res) => {
  try {
    const { subjectId, classId } = req.query;
    const uid = req.user.id;

    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (classId) where.classId = classId;

    // If no specific filters, default to user's assigned subjects
    if (!subjectId) {
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user || !user.subjectIds)
        return res.status(200).json({ assessments: [] });
      where.subjectId = { in: user.subjectIds };
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: { class: true, subject: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ assessments });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch assessments", error: error.message });
  }
};

export const getAssessmentMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            students: {
              where: { role: "STUDENT" },
              orderBy: { name: "asc" },
            },
          },
        },
        marks: true,
      },
    });

    if (!assessment)
      return res.status(404).json({ message: "Assessment not found" });

    res.status(200).json({ assessment });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assessment details",
      error: error.message,
    });
  }
};

export const updateAssessmentMarks = async (req, res) => {
  try {
    const { assessmentId, marksData } = req.body;
    // marksData: [{ studentId, marksObtained }]

    const operations = marksData.map((m) =>
      prisma.marks.upsert({
        where: {
          studentId_assessmentId: { studentId: m.studentId, assessmentId },
        },
        create: {
          studentId: m.studentId,
          assessmentId: assessmentId,
          marksObtained: parseInt(m.marksObtained) || 0,
        },
        update: {
          marksObtained: parseInt(m.marksObtained) || 0,
        },
      }),
    );

    await prisma.$transaction(operations);

    res.status(200).json({ message: "Marks updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update marks", error: error.message });
  }
};

export const getStudentSubjects = async (req, res) => {
  try {
    const uid = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        class: {
          include: {
            semester: {
              include: { subjects: true },
            },
          },
        },
      },
    });

    if (!user || !user.class || !user.class.semester) {
      return res.status(200).json({ subjects: [] });
    }

    res.status(200).json({ subjects: user.class.semester.subjects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subjects", error: error.message });
  }
};

export const getStudentSubjectPerformance = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const uid = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user || !user.classId)
      return res.status(400).json({ message: "User not assigned to a class" });

    // 1. Get Assessments for this Subject & Class
    const assessments = await prisma.assessment.findMany({
      where: { subjectId, classId: user.classId },
      include: { marks: true },
    });

    // 2. Process Data for Rank
    const studentTotals = {}; // { studentId: total }

    assessments.forEach((ass) => {
      ass.marks.forEach((m) => {
        studentTotals[m.studentId] =
          (studentTotals[m.studentId] || 0) + m.marksObtained;
      });
    });

    const myTotal = studentTotals[uid] || 0;
    const sortedScores = Object.values(studentTotals).sort((a, b) => b - a);
    const rank = sortedScores.indexOf(myTotal) + 1; // 1-based rank
    const totalStudents = sortedScores.length || 1; // Avoid div by 0

    // 3. Components Analysis
    const components = {
      IA: { scored: 0, total: 0, assessments: [] },
      CSE: { scored: 0, total: 0, assessments: [] },
      ESE: { scored: 0, total: 0, assessments: [] },
      TW: { scored: 0, total: 0, assessments: [] },
    };

    assessments.forEach((ass) => {
      const myMarkRec = ass.marks.find((m) => m.studentId === uid);
      const myMark = myMarkRec ? myMarkRec.marksObtained : 0;

      const marksList = ass.marks.map((m) => m.marksObtained);
      const highest = marksList.length > 0 ? Math.max(...marksList) : 0;
      const lowest = marksList.length > 0 ? Math.min(...marksList) : 0;
      const mean =
        marksList.length > 0
          ? marksList.reduce((a, b) => a + b, 0) / marksList.length
          : 0;

      const assessmentDetail = {
        id: ass.id,
        title: ass.title,
        maxMarks: ass.maxMarks,
        ownMarks: myMark,
        highest,
        lowest,
        mean: Math.round(mean * 100) / 100,
      };

      if (!components[ass.component]) {
        components[ass.component] = { scored: 0, total: 0, assessments: [] };
      }
      if (!components[ass.component].assessments) {
        components[ass.component].assessments = [];
      }

      components[ass.component].scored += myMark;
      components[ass.component].total += ass.maxMarks;
      components[ass.component].assessments.push(assessmentDetail);
    });

    const classTotalScore = sortedScores.reduce((a, b) => a + b, 0);
    const classAvg = totalStudents ? classTotalScore / totalStudents : 0;

    res.status(200).json({
      rank,
      totalStudents,
      totalObtained: myTotal,
      classAverage: classAvg,
      components,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch performance", error: error.message });
  }
};

/* Delete & Edit Functions */

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Cleanup relations that would block deletion
    // a. Unset CC status from classes
    await prisma.class.updateMany({
      where: { ccId: id },
      data: { ccId: null },
    });

    // b. Remove from subjects (many-to-many list)
    const subjectsWithFaculty = await prisma.subject.findMany({
      where: { facultyIds: { has: id } }
    });
    
    for (const subject of subjectsWithFaculty) {
      await prisma.subject.update({
        where: { id: subject.id },
        data: {
          facultyIds: {
            set: subject.facultyIds.filter(fid => fid !== id)
          }
        }
      });
    }

    // 2. Perform the deletion
    await prisma.user.delete({ where: { id } });
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      message: "Failed to delete user. Ensure they are not currently assigned as an HOD or have active Course File Assignments.",
      error: error.message,
    });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const subject = await prisma.subject.update({
      where: { id },
      data: { name },
    });
    res.status(200).json({ message: "Subject updated", subject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update subject", error: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Cleanup relation manually for Mongo Scalar Lists
    // Pull subjectId from all Users who have it
    // Note: This might be heavy if many users, but usually limited faculty.
    // We find users with this subjectId first.
    const users = await prisma.user.findMany({
      where: { subjectIds: { has: id } },
    });

    for (const u of users) {
      const newIds = u.subjectIds.filter((sid) => sid !== id);
      await prisma.user.update({
        where: { id: u.id },
        data: { subjectIds: newIds },
      });
    }

    await prisma.subject.delete({ where: { id } });
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete subject", error: error.message });
  }
};

export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, maxMarks, component } = req.body;
    const assessment = await prisma.assessment.update({
      where: { id },
      data: { title, maxMarks: parseInt(maxMarks), component },
    });
    res.status(200).json({ message: "Assessment updated", assessment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update assessment", error: error.message });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.assessment.delete({ where: { id } });
    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete assessment", error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the class to check if it has a CC
    const classData = await prisma.class.findUnique({
      where: { id },
      include: { cc: true, pools: true },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // If class has a CC, demote them back to FACULTY
    if (classData.ccId) {
      await prisma.user.update({
        where: { id: classData.ccId },
        data: { role: "FACULTY", classId: null },
      });
    }

    // Delete all students in this class first
    await prisma.user.deleteMany({
      where: {
        classId: id,
        role: "STUDENT",
      },
    });

    // Delete all student pools in this class
    await prisma.studentPool.deleteMany({
      where: {
        classId: id,
      },
    });

    // Delete the class
    await prisma.class.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ message: "Class and its students deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete class", error: error.message });
  }
};
