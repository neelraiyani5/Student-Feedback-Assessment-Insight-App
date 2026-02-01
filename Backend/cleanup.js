import prisma from "./src/prisma/client.js";

const main = async () => {
    console.log("Starting Cleanup of Dummy Data...");

    try {
        // 1. Delete Dummy Students (email @acadone.com)
        const deletedStudents = await prisma.user.deleteMany({
            where: { 
                email: { endsWith: '@acadone.com' },
                role: 'STUDENT'
            }
        });
        console.log(`Deleted ${deletedStudents.count} dummy students.`);

        // 2. Identify Dummy Classes
        const dummyClasses = await prisma.class.findMany({
            where: { name: { startsWith: 'Class ' } },
            select: { id: true }
        });
        const classIds = dummyClasses.map(c => c.id);

        if (classIds.length > 0) {
            console.log(`Found ${classIds.length} dummy classes. Cleaning up dependencies...`);

            // 3. Delete Student Pools linked to these classes
            const deletedPools = await prisma.studentPool.deleteMany({
                where: { classId: { in: classIds } }
            });
            console.log(`Deleted ${deletedPools.count} student pools.`);

            // 4. Delete Classes
            const deletedClasses = await prisma.class.deleteMany({
                where: { id: { in: classIds } }
            });
            console.log(`Deleted ${deletedClasses.count} dummy classes.`);
        } else {
            console.log("No dummy classes found.");
        }

        // 3. Delete Dummy Semesters?
        // Risky to delete semesters as they simply store 'sem' number.
        // We will leave them to avoid deleting user's semesters if they match.
        console.log("Skipping Semester deletion to prevent data loss.");

    } catch (error) {
        console.error("Cleanup Failed:", error);
    }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
