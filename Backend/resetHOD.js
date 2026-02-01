import prisma from "./src/prisma/client.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const resetHOD = async () => {
    try {
        const email = "admin@acadone.com";
        const userId = "ADMIN001";
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { userId }
        });

        if (existingUser) {
            // Update existing
            await prisma.user.update({
                where: { userId },
                data: {
                    password: hashedPassword,
                    role: "HOD",
                    mustChangePassword: false 
                }
            });
            console.log("✅ HOD Updated!");
        } else {
            // Create new
            await prisma.user.create({
                data: {
                    userId,
                    name: "System Admin",
                    email,
                    password: hashedPassword,
                    role: "HOD",
                    mustChangePassword: false
                }
            });
            console.log("✅ HOD Created!");
        }

        console.log("\n==================================");
        console.log("   LOGIN CREDENTIALS (HOD)   ");
        console.log("==================================");
        console.log(` User ID:  ${userId}`);
        console.log(` Password: ${password}`);
        console.log("==================================\n");

    } catch (error) {
        console.error("Error seeding HOD:", error);
    } finally {
        await prisma.$disconnect();
    }
};

resetHOD();
