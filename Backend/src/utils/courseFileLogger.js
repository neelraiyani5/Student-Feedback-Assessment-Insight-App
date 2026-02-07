import prisma from "../prisma/client.js";

export const createCourseFileLog = async ({
    action,
    message,
    user,
    assignmentId = null,
    className = null,
    subjectName = null,
    taskTitle = null,
    metadata = null
}) => {
    try {
        await prisma.courseFileLog.create({
            data: {
                action,
                message,
                userName: user.name,
                userId: user.id,
                courseFileAssignmentId: assignmentId,
                className,
                subjectName,
                taskTitle,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
            }
        });
    } catch (error) {
        console.error("Failed to create course file log:", error);
    }
};
