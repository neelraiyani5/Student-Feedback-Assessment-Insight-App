import prisma from "./src/prisma/client.js";

const result = await prisma.timetableEntry.deleteMany({});
console.log('✅ Deleted ' + result.count + ' timetable entries');
await prisma.$disconnect();
