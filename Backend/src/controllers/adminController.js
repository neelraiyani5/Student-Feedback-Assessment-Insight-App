import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";
import { sendCredentials } from "../utils/emailService.js";
import xlsx from "xlsx";
import fs from "fs";

export const createUser = async (req, res) => {
    try {
        const { userId, name, email, role } = req.body;

        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                userId,
                name,
                email,
                password: hashedPassword,
                role
            }
        });

        // Send email with credentials
        await sendCredentials(email, name, userId, password);

        res.status(201).json({ message: `${role} created successfully and credentials sent to email.`, Credentials: { userId, password: password } })
    } catch (error) {
        if (error.code === 'P2002') {
            const field = error.meta?.target || '';
            const message = field.includes('userId') ? 'UserID already exists' : 
                          field.includes('email') ? 'Email already exists' : 
                          'User with these details already exists';
            return res.status(409).json({ message });
        }
        res.status(500).json({ message: "Failed to create user", error: error.message });
    }
}



export const makeCC = async (req, res) => {
    try {
        const { facultyId, classId } = req.body;

        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });

        if (!faculty || faculty.role !== "FACULTY") {
            return res.status(404).json({ message: "Faculty not found or already CC of class!!!" });
        }

        const classData = await prisma.class.findUnique({ where: { id: classId } });

        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        if (classData.ccId) {
            return res.status(409).json({ message: "Class already has CC" });
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: facultyId },
                data: { role: "CC", classId }
            }),
            prisma.class.update({
                where: { id: classId },
                data: { ccId: facultyId }
            })
        ]);

        res.status(201).json({ message: "Faculty promoted to CC" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { role } = req.query; // ?role=FACULTY or ?role=STUDENT

        const filter = {};
        if (role) {
            const roles = role.split(',');
            if (roles.length > 1) {
                filter.role = { in: roles };
            } else {
                filter.role = role;
            }
        }

        const users = await prisma.user.findMany({
            where: filter,
            select: {
                id: true,
                userId: true,
                name: true,
                email: true,
                role: true,
                classId: true
            }
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error });
    }
}

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, userId } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email, userId }
        });

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        if (error.code === 'P2002') {
            const field = error.meta?.target || '';
            const message = field.includes('userId') ? 'UserID already exists' : 
                          field.includes('email') ? 'Email already exists' : 
                          'User with these details already exists';
            return res.status(409).json({ message });
        }
        res.status(500).json({ message: "Failed to update user", error: error.message });
    }
}

export const bulkUploadUsers = async (req, res) => {
    try {
        const { role } = req.query; // Validated by express-validator

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const usersData = xlsx.utils.sheet_to_json(sheet);

        if (usersData.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: "The uploaded file is empty or has no data rows" });
        }

        const expectedColumns = ["name", "userid", "email"];
        const actualColumns = Object.keys(usersData[0]);
        const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));

        if (missingColumns.length > 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                message: `Invalid column names in sheet. Required: ${expectedColumns.join(", ")}`,
                missing: missingColumns,
                found: actualColumns
            });
        }

        const results = [];
        const errors = [];

        for (const data of usersData) {
            const { name, userid, email } = data;

            if (!name || !userid || !email) {
                errors.push({ data, error: "Missing required fields (name, userid, email)" });
                continue;
            }

            try {
                // Check if user already exists (userId or email)
                const existingUser = await prisma.user.findFirst({ 
                    where: { 
                        OR: [
                            { userId: userid.toString() },
                            { email: email }
                        ]
                    } 
                });
                
                if (existingUser) {
                    const errorMsg = existingUser.userId === userid.toString() 
                        ? "UserID already exists" 
                        : "Email already exists";
                    errors.push({ name, userid, error: errorMsg });
                    continue;
                }

                const password = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(password, 10);

                const userData = {
                    userId: userid.toString(),
                    name,
                    email: email,
                    password: hashedPassword,
                    role: role
                };

                // If a CC is uploading students, automatically assign them to the CC's class
                if (role === 'STUDENT' && req.user.role === 'CC' && req.user.classId) {
                    userData.classId = req.user.classId;
                }

                await prisma.user.create({
                    data: userData
                });

                // Send email
                await sendCredentials(email, name, userid.toString(), password);
                results.push({ name, userid, status: "Success" });
            } catch (err) {
                errors.push({ name, userid, error: err.message });
            }
        }

        // Delete the file after processing
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
            else console.log("Temp file deleted successfully");
        });

        res.status(201).json({
            message: `Bulk upload for ${role}s completed.`,
            totalProcessed: usersData.length,
            successCount: results.length,
            failureCount: errors.length,
            results,
            errors
        });

    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ message: "Failed to process bulk upload", error: error.message });
    }
}
