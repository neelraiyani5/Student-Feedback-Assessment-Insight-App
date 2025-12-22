import bcrypt from "bcryptjs"
import dotenv from "dotenv";
dotenv.config();
import prisma from "./client.js"

const seedHodDepartment = async (req, res) => {
    try {
        console.log("Seeding HOD and Department...");

        const existingHOD = await prisma.user.findFirst({ where: { role: "HOD" } });
        if (existingHOD) return console.log("HOD already exists. Skiping seed.");

        const hodUserId = "hod001";
        const hodPassword = process.env.HOD_PASSWORD;

        if(!hodPassword) return console.log("Password is missing!!!")

        const hashedPassword = await bcrypt.hash(hodPassword, 10);

        const hod = await prisma.user.create({
            data: {
                userId: hodUserId,
                name: "CD Parmar",
                email: "cdp@gmail.com",
                password: hashedPassword,
                role: "HOD"
            }
        });

        await prisma.department.create({
            data: {
                name: "Information & Communication Technology",
                hodId: hod.id
            }
        });

        console.log("HOD & Department");
        console.log("Login Credentials:");
        console.log("ID:", hodUserId);
        console.log("Password:", hodPassword);
    } catch (error) {
        console.error("Seeding failed:", error);
    } finally{
        await prisma.$disconnect();
    }
}

seedHodDepartment();
