import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";

export const addClass = async (req, res) => {
    try {
        const { semesterId, name } = req.body;

        const exists = await prisma.class.findUnique({
            where: { name_semesterId: { name, semesterId } }
        });

        if (exists)
            return res.status(409).json({ message: "Class already exists" });

        const newClass = await prisma.class.create({
            data: {
                name,
                semesterId,
                pools: {
                    create: [
                        { type: "FAST" },
                        { type: "MEDIUM" },
                        { type: "SLOW" }
                    ]
                }
            },
            include: { pools: true }
        });

        res.status(201).json({ message: "Class with pools created successfully", Class_Details: newClass });
    } catch (error) {
        res.status(500).json({ message: "Failed to create class", error: error.message });
    }
}

export const createStudent = async (req, res) => {
    try {
        const { userId, name, email, classId } = req.body;

        // Check availability
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { userId }] }
        });
        if (existing) {
            return res.status(409).json({ message: "User with email or ID already exists" });
        }

        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = await prisma.user.create({
            data: {
                userId, name, email, 
                password: hashedPassword,
                role: "STUDENT",
                classId
            }
        });

        res.status(201).json({ 
            message: "Student created successfully", 
            Credentials: { userId, password } 
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to create student", error: error.message });
    }
}

export const assignCC = async (req, res) => {
    try {
        const { classId, facultyId } = req.body;

        // Verify Faculty
        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
        if (!faculty || faculty.role !== "FACULTY") {
             return res.status(400).json({ message: "Invalid Faculty ID or User is not basic Faculty" });
        }

        // Get Class to check overlap
        const existingClass = await prisma.class.findUnique({ where: { id: classId } });
        if (!existingClass) return res.status(404).json({ message: "Class not found" });

        const operations = [];

        // If class has existing CC, demote them
        if (existingClass.ccId) {
            operations.push(
                prisma.user.update({
                    where: { id: existingClass.ccId },
                    data: { role: "FACULTY", classId: null }
                })
            );
        }

        // Update New CC
        operations.push(
            prisma.user.update({
                where: { id: facultyId },
                data: { role: "CC", classId }
            })
        );

        // Update Class
        operations.push(
            prisma.class.update({
                where: { id: classId },
                data: { ccId: facultyId }
            })
        );

        await prisma.$transaction(operations);

        const updatedClass = await prisma.class.findUnique({ where: { id: classId } });

        res.status(200).json({ message: "CC Assigned Successfully", class: updatedClass });
    } catch (error) {
        res.status(500).json({ message: "Failed to assign CC", error: error.message });
    }
}

export const resetStudentPassword = async (req, res) => {
    try {
        const { studentId } = req.body;
        
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: studentId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password reset successfully", password });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
}

export const updateStudent = async (req, res) => {
    try {
        const { studentId, name, email, userId } = req.body;

        // Check uniqueness
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { userId }],
                NOT: { id: studentId }
            }
        });

        if (existing) {
            return res.status(409).json({ message: "Email or Student ID already in use" });
        }

        const updatedStudent = await prisma.user.update({
            where: { id: studentId },
            data: { name, email, userId }
        });

        res.status(200).json({ message: "Student updated successfully", student: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: "Failed to update student", error: error.message });
    }
}



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
                    pools: true 
                }
            });

            if (!classInfo) {
                return res.status(404).json({ message: "Class not found" });
            }
    
            const students = await prisma.user.findMany({
                where: { classId, role: "STUDENT" }
            })
    
            res.status(200).json({ Students: students, Class: classInfo })
        } catch (error) {
            res.status(500).json({ message: "Internal server error!!!", error: error.message });
        }
    }



export const addStudentToClass = async (req, res) => {
    try {
        const { studentId, classId } = req.body;

        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student || student.role !== "STUDENT") {
            return res.status(400).json({ message: "Invalid student" });
        }

        await prisma.user.update({
            where: { id: studentId },
            data: {
                classId,
                poolId: null
            }
        });

        res.status(200).json({ message: "Student assigned to class" });
    } catch (error) {
        res.status(500).json({ message: "Failed to assign student to class", error });
    }
}



export const addStudentToPool = async (req, res) => {
    try {
        const ccId = req.user.id;
        const { studentId, poolId } = req.body;

        const cc = await prisma.user.findUnique({ where: { id: ccId } })

        if (!cc || cc.role !== "CC") {
            return res.status(403).json({ message: "Access Denied!!!" });
        }

        const pool = await prisma.studentPool.findUnique({ where: { id: poolId } });

        if (!pool || pool.classId !== cc.classId) {
            return res.status(403).json({ message: "Pool not found or CC doesn't belong to this class" });
        }

        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student || student.role !== "STUDENT" || student.classId !== cc.classId) {
            return res.status(403).json({ message: "Student not found or doesnt belong to this class" });
        }

        await prisma.user.update({
            where: { id: studentId },
            data: { poolId }
        });

        res.status(200).json({ message: `Student added to ${pool.type} Pool` })
    } catch (error) {
        res.status(500).json({ message: "Failed to add student to pool", error });
    }
}

export const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, semesterId } = req.body;

        const updatedClass = await prisma.class.update({
            where: { id },
            data: { name, semesterId }
        });

        res.status(200).json({ message: "Class updated successfully", class: updatedClass });
    } catch (error) {
        res.status(500).json({ message: "Failed to update class", error: error.message });
    }
}

/* Subject Management */

export const createSubject = async (req, res) => {
    try {
        const { name } = req.body;
        const ccId = req.user.id;

        // Verify CC and get their Class
        const ccClass = await prisma.class.findFirst({
            where: { ccId }
        });

        if (!ccClass) {
            return res.status(404).json({ message: "You are not assigned as Class Coordinator." });
        }

        // Check if subject exists in this semester
        const exists = await prisma.subject.findFirst({
            where: { 
                name, 
                semesterId: ccClass.semesterId 
            }
        });

        if (exists) {
            return res.status(409).json({ message: "Subject already exists in this semester." });
        }

        const subject = await prisma.subject.create({
            data: {
                name,
                semesterId: ccClass.semesterId
            }
        });

        res.status(201).json({ message: "Subject created successfully", subject });
    } catch (error) {
        res.status(500).json({ message: "Failed to create subject", error: error.message });
    }
};

export const getClassSubjects = async (req, res) => {
    try {
        const ccId = req.user.id;
        
        const ccClass = await prisma.class.findFirst({
            where: { ccId }
        });

        if (!ccClass) {
            return res.status(404).json({ message: "Class not found for this CC." });
        }

        const subjects = await prisma.subject.findMany({
            where: { semesterId: ccClass.semesterId },
            include: { faculties: true } // Include assigned faculties details
        });

        res.status(200).json({ subjects });
    } catch (error) {
         res.status(500).json({ message: "Failed to fetch subjects", error: error.message });
    }
};

export const assignFacultyToSubject = async (req, res) => {
    try {
        const { subjectId, facultyIds } = req.body; // Expecting Array
        
        // Verify Subject exists
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        const oldFacultyIds = subject.facultyIds || [];
        const newFacultyIds = facultyIds || [];

        // Calculate differences
        const removedIds = oldFacultyIds.filter(id => !newFacultyIds.includes(id));
        const addedIds = newFacultyIds.filter(id => !oldFacultyIds.includes(id));

        const operations = [];

        // 1. Update Subject's facultyIds
        operations.push(
            prisma.subject.update({
                where: { id: subjectId },
                data: { facultyIds: newFacultyIds }
            })
        );

        // 2. Remove subjectId from removed users
        // Note: We need to fetch user, filter ids, and update. 
        // For atomic operations, we perform this inside the transaction flow logic implicitly by awaiting loops before or constructing ops.
        // Since we can't easily do 'pull' in one op, we will do read-modify-write for consistency.
        // However, inside $transaction, we can't do async logic unless we use the interactive transaction (preview) or just simple await.
        // We'll iterate and push promises to operations array? No, $transaction takes array of Promises (Prisma Promises), 
        // but read-modify-write requires reading first.
        // So we will run the side-effects via normal await loops, then update subject. 
        // It's not strictly atomic but sufficient for this app.

        // Remove from Removed Faculty
        await Promise.all(removedIds.map(async (uid) => {
            const user = await prisma.user.findUnique({ where: { id: uid } });
            if (user && user.subjectIds) {
                const newSubjectIds = user.subjectIds.filter(sid => sid !== subjectId);
                await prisma.user.update({
                    where: { id: uid },
                    data: { subjectIds: newSubjectIds }
                });
            }
        }));

        // Add to Added Faculty
        await Promise.all(addedIds.map(async (uid) => {
             // We use 'push' which is atomic if available, or set.
             // Prisma Mongo supports atomic push? Yes: { push: subjectId }
             await prisma.user.update({
                 where: { id: uid },
                 data: { 
                    subjectIds: { push: subjectId }
                 }
             });
        }));

        // Finally update Subject
        const updatedSubject = await prisma.subject.update({
             where: { id: subjectId },
             data: { facultyIds: newFacultyIds }
        });

        res.status(200).json({ message: "Faculty assigned successfully", subject: updatedSubject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to assign faculty", error: error.message });
    }
};

export const getSubjectClasses = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: { semester: { include: { classes: true } } }
        });
        if (!subject) return res.status(404).json({ message: "Subject not found" });
        
        // Return classes in the subject's semester
        res.json({ classes: subject.semester.classes });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch classes", error: error.message });
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
                classId
            }
        });

        res.status(201).json({ message: "Assessment created successfully", assessment: newAssessment });
    } catch (error) {
        res.status(500).json({ message: "Failed to create assessment", error: error.message });
    }
};

export const getFacultyAssessments = async (req, res) => {
    try {
        const uid = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: uid } });
        
        if (!user || !user.subjectIds) return res.status(200).json({ assessments: [] });

        const assessments = await prisma.assessment.findMany({
            where: { subjectId: { in: user.subjectIds } },
            include: { class: true, subject: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ assessments });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch assessments", error: error.message });
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
                             where: { role: 'STUDENT' },
                             orderBy: { name: 'asc' }
                         } 
                     }
                },
                marks: true
            }
        });

        if (!assessment) return res.status(404).json({ message: "Assessment not found" });

        res.status(200).json({ assessment });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch assessment details", error: error.message });
    }
};

export const updateAssessmentMarks = async (req, res) => {
    try {
        const { assessmentId, marksData } = req.body; 
        // marksData: [{ studentId, marksObtained }]

        const operations = marksData.map(m => 
            prisma.marks.upsert({
                where: { studentId_assessmentId: { studentId: m.studentId, assessmentId } },
                create: { 
                    studentId: m.studentId, 
                    assessmentId: assessmentId, 
                    marksObtained: parseInt(m.marksObtained) || 0 
                },
                update: { 
                    marksObtained: parseInt(m.marksObtained) || 0 
                }
            })
        );

        await prisma.$transaction(operations);

        res.status(200).json({ message: "Marks updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update marks", error: error.message });
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
                            include: { subjects: true } 
                        } 
                    } 
                } 
            } 
        });

        if (!user || !user.class || !user.class.semester) {
            return res.status(200).json({ subjects: [] });
        }

        res.status(200).json({ subjects: user.class.semester.subjects });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch subjects", error: error.message });
    }
};

export const getStudentSubjectPerformance = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const uid = req.user.id;
        
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user || !user.classId) return res.status(400).json({ message: "User not assigned to a class" });

        // 1. Get Assessments for this Subject & Class
        const assessments = await prisma.assessment.findMany({
            where: { subjectId, classId: user.classId },
            include: { marks: true }
        });

        // 2. Process Data for Rank
        const studentTotals = {}; // { studentId: total }
        
        assessments.forEach(ass => {
            ass.marks.forEach(m => {
                studentTotals[m.studentId] = (studentTotals[m.studentId] || 0) + m.marksObtained;
            });
        });

        const myTotal = studentTotals[uid] || 0;
        const sortedScores = Object.values(studentTotals).sort((a,b) => b-a);
        const rank = sortedScores.indexOf(myTotal) + 1; // 1-based rank
        const totalStudents = sortedScores.length || 1; // Avoid div by 0

        // 3. Components Analysis
        const components = {
            IA: { scored: 0, total: 0 },
            CSE: { scored: 0, total: 0 },
            ESE: { scored: 0, total: 0 }
        };

        assessments.forEach(ass => {
            const myMark = ass.marks.find(m => m.studentId === uid);
            const score = myMark ? myMark.marksObtained : 0;
            
            if (components[ass.component]) {
                components[ass.component].scored += score;
                components[ass.component].total += ass.maxMarks;
            } else {
                 // Fallback if component name differs or new type
                 if(!components[ass.component]) components[ass.component] = { scored: 0, total: 0 };
                 components[ass.component].scored += score;
                 components[ass.component].total += ass.maxMarks;
            }
        });

        const classTotalScore = sortedScores.reduce((a, b) => a + b, 0);
        const classAvg = totalStudents ? (classTotalScore / totalStudents) : 0;

        res.status(200).json({
            rank,
            totalStudents,
            totalObtained: myTotal,
            classAverage: classAvg,
            components
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch performance", error: error.message });
    }
};

/* Delete & Edit Functions */

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
         res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
}

export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const subject = await prisma.subject.update({
            where: { id },
            data: { name }
        });
        res.status(200).json({ message: "Subject updated", subject });
    } catch (error) {
        res.status(500).json({ message: "Failed to update subject", error: error.message });
    }
}

export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Cleanup relation manually for Mongo Scalar Lists
        // Pull subjectId from all Users who have it
        // Note: This might be heavy if many users, but usually limited faculty.
        // We find users with this subjectId first.
        const users = await prisma.user.findMany({
            where: { subjectIds: { has: id } }
        });

        for(const u of users) {
            const newIds = u.subjectIds.filter(sid => sid !== id);
            await prisma.user.update({
                where: { id: u.id },
                data: { subjectIds: newIds }
            });
        }

        await prisma.subject.delete({ where: { id } });
        res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
         res.status(500).json({ message: "Failed to delete subject", error: error.message });
    }
}

export const updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, maxMarks, component } = req.body;
        const assessment = await prisma.assessment.update({
             where: { id },
             data: { title, maxMarks: parseInt(maxMarks), component }
        });
        res.status(200).json({ message: "Assessment updated", assessment });
    } catch (error) {
        res.status(500).json({ message: "Failed to update assessment", error: error.message });
    }
}

export const deleteAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.assessment.delete({ where: { id } });
        res.status(200).json({ message: "Assessment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete assessment", error: error.message });
    }
}