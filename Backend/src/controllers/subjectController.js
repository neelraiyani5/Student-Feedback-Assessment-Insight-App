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

    // Delete course file assignments for this subject
    await prisma.courseFileAssignment.deleteMany({
      where: { subjectId },
    });

    // Delete assessments for this subject
    await prisma.assessment.deleteMany({
      where: { subjectId },
    });

    // Delete feedback sessions for this subject
    await prisma.feedbackSession.deleteMany({
      where: { subjectId },
    });

    // Delete subject
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete subject" });
  }
};

// Assign faculty to subject (replaces all faculty for that subject)
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

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: { facultyIds },
      include: {
        faculties: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to assign faculty" });
  }
};
