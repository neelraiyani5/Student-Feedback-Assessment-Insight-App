import prisma from "./src/prisma/client.js";
import bcrypt from "bcryptjs";

const main = async () => {
    console.log("Adding 30 Students to Class 2B...");

    const password = await bcrypt.hash("Abc@12345", 10);
    const classId = "697d308ebeb8c9029b6d3194"; // Class 2B ID

    let createdCount = 0;

    for (let i = 1; i <= 30; i++) {
        const userId = `S2B${i.toString().padStart(3, '0')}`; // S2B001, S2B002...
        const email = `s2b${i}@acadone.com`;
        const name = `Student 2B-${i}`;

        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { userId }] }
        });

        if (!existing) {
            console.log(`Creating ${name} (${userId})...`);
            await prisma.user.create({
                data: {
                    userId,
                    name,
                    email,
                    password,
                    role: "STUDENT",
                    classId,
                    mustChangePassword: false
                }
            });
            createdCount++;
        } else {
            console.log(`${userId} already exists, skipping...`);
        }
    }

    console.log(`\nDone! Created ${createdCount} new students in Class 2B.`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
