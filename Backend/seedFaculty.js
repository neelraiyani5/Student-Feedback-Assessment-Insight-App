import prisma from "./src/prisma/client.js";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Abc@12345";

// ─── All Faculty from 8TK1, 6EK1, 6EK2, 4EK2 timetable sheets ───
const FACULTY_LIST = [
    // From previous errors + common across sheets
    { initials: "SPL",  name: "Dr. Sunil Lavadiya" },
    { initials: "IJ",   name: "Prof. Indu Jaiswal" },
    { initials: "NAK",  name: "Prof. Nishith Kotak" },
    { initials: "DDZ",  name: "Dr. D D Zala" },
    { initials: "SB",   name: "Prof. Suhag Baldaniya" },
    { initials: "VD",   name: "Prof. Vijay Dubey" },
    { initials: "CDP",  name: "Prof. Chandrasinh Parmar" },
    { initials: "MS",   name: "Dr. Mitesh Solanki" },
    { initials: "RDO",  name: "Prof. Rakesh Oza" },
    { initials: "AAB",  name: "Dr. Arjav Bavarva" },
    { initials: "HS",   name: "Prof. Harsha Satramani" },
    { initials: "SA",   name: "Mr. Shamsaagaz Mohammed" },
    { initials: "RM",   name: "Prof. Rakesh Meena" },
    { initials: "KL",   name: "Dr. Krishn Limbachiya" },
    { initials: "JV",   name: "Prof. Jignesh Vyas" },
    { initials: "MK",   name: "Prof. Meha Kothari" },
    { initials: "PJ",   name: "Prof. Priyank Javia" },
    { initials: "DB",   name: "Prof. Darshan Bhatt" },
    { initials: "RJ",   name: "Prof. Rohit Joshi" },
    { initials: "PP",   name: "Prof. Pranav Patel" },
    { initials: "AP",   name: "Prof. Alok Patel" },
    { initials: "NP",   name: "Prof. Nikunj Patel" },
    { initials: "HP",   name: "Prof. Hardik Patel" },
    { initials: "KD",   name: "Prof. Krunal Dave" },
    { initials: "MD",   name: "Prof. Mital Dave" },
    { initials: "YP",   name: "Prof. Yogesh Patel" },
    { initials: "DP",   name: "Prof. Darshana Patel" },
    { initials: "VM",   name: "Prof. Vaibhav Mehta" },
    { initials: "SS",   name: "Prof. Sapna Shah" },
    { initials: "KS",   name: "Prof. Kaushik Shah" },
    { initials: "RK",   name: "Prof. Rahul Kotak" },
    { initials: "NK",   name: "Prof. Neha Kotak" },
    { initials: "BD",   name: "Prof. Brijesh Desai" },
    { initials: "AK",   name: "Prof. Ashish Kotak" },
];

async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("  TIMETABLE DATA CLEANUP & FACULTY SEEDING ");
    console.log("═══════════════════════════════════════════\n");

    // Step 1: Clear all timetable entries
    const deleted = await prisma.timetableEntry.deleteMany({});
    console.log(`✅ Cleared ${deleted.count} timetable entries.\n`);

    // Step 2: Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Step 3: Add missing faculty
    let added = 0;
    let skipped = 0;

    for (const fac of FACULTY_LIST) {
        // Check if already exists by name (case-insensitive partial match)
        const existing = await prisma.user.findFirst({
            where: {
                name: { contains: fac.name, mode: 'insensitive' },
                role: { in: ['FACULTY', 'CC', 'HOD'] }
            }
        });

        if (existing) {
            console.log(`  ⏭️  ${fac.name} (${fac.initials}) — already exists as ${existing.role}`);
            skipped++;
            continue;
        }

        // Also check by initials in userId
        const existingById = await prisma.user.findFirst({
            where: { userId: fac.initials.toLowerCase() }
        });

        if (existingById) {
            console.log(`  ⏭️  ${fac.name} (${fac.initials}) — userId '${fac.initials.toLowerCase()}' already taken`);
            skipped++;
            continue;
        }

        try {
            await prisma.user.create({
                data: {
                    userId: fac.initials.toLowerCase(),
                    name: fac.name,
                    email: `${fac.initials.toLowerCase()}@ict.faculty.com`,
                    password: hashedPassword,
                    role: "FACULTY",
                    mustChangePassword: false
                }
            });
            console.log(`  ✅ Added: ${fac.name} (${fac.initials})`);
            added++;
        } catch (err) {
            console.log(`  ❌ Failed: ${fac.name} — ${err.message}`);
        }
    }

    console.log("\n═══════════════════════════════════════════");
    console.log(`  DONE: ${added} faculty added, ${skipped} already existed`);
    console.log(`  Password for all new accounts: ${DEFAULT_PASSWORD}`);
    console.log("═══════════════════════════════════════════\n");

    await prisma.$disconnect();
}

main().catch(e => {
    console.error("Fatal:", e.message);
    prisma.$disconnect();
    process.exit(1);
});
