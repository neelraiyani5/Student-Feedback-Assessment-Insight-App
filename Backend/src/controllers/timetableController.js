import prisma from "../prisma/client.js";
import xlsx from "xlsx";
import fs from "fs";
import { parseTimetableWithAI } from "../services/geminiService.js";

/**
 * Get sheet names from an uploaded Excel file
 */
export const getExcelSheets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log(`[Timetable] Reading file: ${req.file.originalname}`);
    const workbook = xlsx.readFile(req.file.path);
    const sheets = workbook.SheetNames;
    
    console.log(`[Timetable] Sheets found: ${sheets.join(", ")}`);

    res.status(200).json({
      message: "Sheets retrieved successfully",
      sheets,
      tempPath: req.file.path
    });
  } catch (error) {
    console.error("[Timetable Error]", error);
    res.status(500).json({ message: "Failed to read Excel sheets" });
  }
};

const romanToDecimal = (roman) => {
  if (!roman) return 0;
  const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
  const upper = roman.toString().toUpperCase().trim();
  if (map[upper]) return map[upper];
  const num = parseInt(upper);
  return isNaN(num) ? 0 : num;
};

/**
 * Upload and process Timetable from selected sheet
 */
export const uploadTimetable = async (req, res) => {
  try {
    const { sheetName, tempPath } = req.body;
    
    if (!sheetName || !tempPath) {
      return res.status(400).json({ message: "Sheet name and file path are required" });
    }

    console.log(`[Timetable] Processing sheet: "${sheetName}"`);

    if (!fs.existsSync(tempPath)) {
      return res.status(400).json({ message: "Temporary file not found. Please upload again." });
    }

    const workbook = xlsx.readFile(tempPath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      fs.unlinkSync(tempPath);
      return res.status(404).json({ message: `Sheet "${sheetName}" not found` });
    }

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    console.log(`[Timetable] Loaded ${data.length} rows from sheet`);

    const sheetText = xlsx.utils.sheet_to_csv(sheet);
    console.log(`[Timetable] Sending sheet text to AI (${sheetText.length} chars)`);

    const aiResult = await parseTimetableWithAI(sheetText);

    if (!aiResult || !aiResult.metadata || !aiResult.entries) {
      fs.unlinkSync(tempPath);
      return res.status(500).json({ message: "AI extraction failed. Please try again or check the file format." });
    }

    const { metadata, subjects: aiSubjects, faculty: aiFaculty, entries: aiEntries } = aiResult;
    const semesterNo = metadata.semester;
    const divisionName = metadata.division;
    const defaultRoom = metadata.defaultRoom;

    console.log(`[Timetable AI] Metadata: Sem=${semesterNo}, Div=${divisionName}, Room=${defaultRoom}`);

    if (!semesterNo || !divisionName) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ 
        message: `AI could not find Semester or Division info. Please check the sheet.` 
      });
    }

    // 5. SYNC DB
    const hod = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { hodDepartments: true }
    });
    
    if (!hod || !hod.hodDepartments[0]) {
        fs.unlinkSync(tempPath);
        return res.status(403).json({ message: "HOD department not found" });
    }

    const deptId = hod.hodDepartments[0].id;
    let semester = await prisma.semester.findFirst({ where: { sem: semesterNo, departmentId: deptId } });
    if (!semester) semester = await prisma.semester.create({ data: { sem: semesterNo, departmentId: deptId } });
    
    let cls = await prisma.class.findFirst({ where: { name: divisionName, semesterId: semester.id } });
    if (!cls) cls = await prisma.class.create({ data: { name: divisionName, semesterId: semester.id } });

    // 5a. DELETE OLD ENTRIES for this class+semester (clean re-upload)
    const deletedOld = await prisma.timetableEntry.deleteMany({
        where: { classId: cls.id, semesterId: semester.id }
    });
    if (deletedOld.count > 0) {
        console.log(`[Timetable] Cleared ${deletedOld.count} old entries for ${divisionName} (Sem ${semesterNo})`);
    }

    let savedCount = 0;
    for (const entry of aiEntries) {
        try {
            // Find Subject
            const subData = aiSubjects[entry.subjectInitial] || { fullName: entry.subjectInitial };
            if (!subData.fullName) continue;

            let subject = await prisma.subject.findFirst({ 
                where: { name: { contains: subData.fullName, mode: 'insensitive' }, semesterId: semester.id } 
            });
            if (!subject) {
                subject = await prisma.subject.create({ 
                    data: { name: subData.fullName, semesterId: semester.id } 
                });
            }

            // Find Faculty — Match by INITIALS (userId) first, then by name
            const facInitial = entry.facultyInitial;
            
            if (!facInitial) {
                console.log(`[Timetable AI] Skipping entry with no faculty info: ${entry.subjectInitial}`);
                continue;
            }

            // Strategy 1: Match initials to userId (most reliable)
            let faculty = await prisma.user.findFirst({
                where: { 
                    userId: facInitial.toLowerCase(),
                    role: { in: ['FACULTY', 'CC', 'HOD'] }
                }
            });

            // Strategy 2: Fall back to name contains (for faculty whose userId doesn't match initials)
            if (!faculty) {
                const facFullName = aiFaculty[facInitial];
                if (facFullName) {
                    // Try matching last name (more reliable than full name match)
                    const nameParts = facFullName.split(/\s+/);
                    const lastName = nameParts[nameParts.length - 1];
                    if (lastName && lastName.length > 2) {
                        faculty = await prisma.user.findFirst({
                            where: { 
                                name: { contains: lastName, mode: 'insensitive' },
                                role: { in: ['FACULTY', 'CC', 'HOD'] }
                            }
                        });
                    }
                }
            }

            if (!faculty) {
                const displayName = aiFaculty[facInitial] || facInitial;
                console.log(`[Timetable AI] Faculty not found: ${displayName} (${facInitial}) — add with userId: "${facInitial.toLowerCase()}"`);
                continue;
            }

            // Room logic
            const room = entry.room || defaultRoom || "Unknown";

            await prisma.timetableEntry.create({
                data: { 
                    day: entry.day, 
                    startTime: entry.startTime, 
                    endTime: entry.endTime, 
                    room: room, 
                    subjectId: subject.id, 
                    facultyId: faculty.id, 
                    classId: cls.id, 
                    semesterId: semester.id 
                }
            });
            savedCount++;
        } catch (err) {
            console.error(`[Timetable AI] Error saving entry:`, err.message);
        }
    }

    fs.unlinkSync(tempPath);
    res.status(201).json({ message: "Timetable processed successfully", count: savedCount, semester: semesterNo, class: divisionName });
  } catch (error) {
    if (req.body.tempPath && fs.existsSync(req.body.tempPath)) fs.unlinkSync(req.body.tempPath);
    res.status(500).json({ message: "Failed to process timetable upload", error: error.message });
  }
};

/**
 * Get timetable with filters
 */
export const getTimetable = async (req, res) => {
  try {
    const { facultyName, room, className, day } = req.query;
    const where = {};
    if (facultyName) where.faculty = { name: { contains: facultyName, mode: 'insensitive' } };
    if (room) where.room = { contains: room, mode: 'insensitive' };
    if (className) where.class = { name: { contains: className, mode: 'insensitive' } };
    if (day) where.day = day.toUpperCase();

    const timetable = await prisma.timetableEntry.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        faculty: { select: { name: true, userId: true } },
        class: { select: { name: true } },
        semester: { select: { sem: true } }
      }
    });

    // Custom sorting: MON -> TUE -> WED -> THU -> FRI
    const dayOrderMap = { "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5 };
    
    const sortedTimetable = timetable.sort((a, b) => {
        const dayDiff = (dayOrderMap[a.day] || 99) - (dayOrderMap[b.day] || 99);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
    });

    res.status(200).json(sortedTimetable);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
};

/**
 * Get current availability status
 */
export const getAvailability = async (req, res) => {
    try {
        const { currentDay } = req.query;
        const dayEntries = await prisma.timetableEntry.findMany({
            where: { day: currentDay },
            include: { faculty: { select: { name: true } }, class: { select: { name: true } }, subject: { select: { name: true } } }
        });
        res.status(200).json(dayEntries);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch availability" });
    }
}
