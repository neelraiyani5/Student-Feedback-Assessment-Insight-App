import prisma from "../prisma/client.js";

export const createSemester = async (req, res) => {
  try {
    const { sem, departmentId } = req.body;

    const existingSemester = await prisma.semester.findUnique({
      where: {
        sem_departmentId: { sem, departmentId },
      },
    });

    if (existingSemester)
      return res
        .status(409)
        .json({ message: "Semester already exists in this department!!!" });

    const semester = await prisma.semester.create({
      data: {
        sem,
        departmentId,
      },
    });

    res.status(201).json(semester);
  } catch (error) {
    res.status(500).json({ message: "Failed to create semester" });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all classes in this semester first
    await prisma.class.deleteMany({
      where: {
        semesterId: id,
      },
    });

    // Delete the semester
    const semester = await prisma.semester.delete({
      where: {
        id,
      },
    });

    res
      .status(200)
      .json({
        message: "Semester and its classes deleted successfully",
        semester,
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete semester" });
  }
};
