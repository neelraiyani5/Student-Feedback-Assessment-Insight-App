import prisma from "../prisma/client.js";

/**
 * Creates a log entry for Course File activities.
 * 
 * @param {Object} params
 * @param {string} params.action - The type of action (e.g., "TASK_COMPLETED")
 * @param {string} params.message - Human readable description
 * @param {Object} params.user - The user performing the action { id, name }
 * @param {string} [params.className] - Name of the class involved
 * @param {string} [params.subjectName] - Name of the subject involved
 * @param {string} [params.taskTitle] - Title of the task involved
 * @param {Object} [params.metadata] - JSON metadata (remarks, status changes, etc.)
 */
export const createCourseFileLog = async ({
    action,
    message,
    user,
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
