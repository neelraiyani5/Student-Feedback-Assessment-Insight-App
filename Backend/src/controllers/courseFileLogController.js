import prisma from "../prisma/client.js";

export const getActivityLogs = async (req, res) => {
    try {
        const logs = await prisma.courseFileLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to last 100 logs for performance
        });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activity logs" });
    }
};

export const clearLogs = async (req, res) => {
    try {
        await prisma.courseFileLog.deleteMany({});
        res.status(200).json({ message: "Activity logs cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to clear logs" });
    }
};
