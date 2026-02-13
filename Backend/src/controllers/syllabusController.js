import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import prisma from "../prisma/client.js";

import { parseSyllabusWithAI } from "../services/geminiService.js";

// Helper to check authorization for syllabus management
async function authorizeSyllabusAction(user, subjectId, chapterId = null, topicId = null) {
  const { id: userId, role } = user;

  // 1. Get Subject/Semester context
  let finalSubjectId = subjectId;
  let semesterId = null;

  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        chapter: {
          include: {
            subject: { select: { id: true, semesterId: true } }
          }
        }
      }
    });
    if (!topic) return { error: "Topic not found", status: 404 };
    finalSubjectId = topic.chapter.subject.id;
    semesterId = topic.chapter.subject.semesterId;
  } else if (chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        subject: { select: { id: true, semesterId: true } }
      }
    });
    if (!chapter) return { error: "Chapter not found", status: 404 };
    finalSubjectId = chapter.subject.id;
    semesterId = chapter.subject.semesterId;
  } else if (subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, semesterId: true, facultyIds: true }
    });
    if (!subject) return { error: "Subject not found", status: 404 };
    semesterId = subject.semesterId;
  }

  // 2. Role-based check
  if (role === 'HOD') {
    // Check if HOD belongs to the department of this semester
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { department: true }
    });
    if (!semester || semester.department.hodId !== userId) {
      return { error: "Access Denied: You are not the HOD for this department.", status: 403 };
    }
  } else if (role === 'CC') {
    // Check if CC coordinates a class in this semester
    const coordinatedClass = await prisma.class.findFirst({
      where: { ccId: userId, semesterId: semesterId }
    });
    if (!coordinatedClass) {
      return { error: "Access Denied: You are not the coordinator for this subject's semester.", status: 403 };
    }
  } else if (role === 'FACULTY') {
    // Check if faculty is assigned to this subject
    const subject = await prisma.subject.findUnique({
      where: { id: finalSubjectId },
      select: { facultyIds: true }
    });
    if (!subject || !subject.facultyIds.includes(userId)) {
      return { error: "Access Denied: You are not assigned to this subject.", status: 403 };
    }
  }

  return { authorized: true, subjectId: finalSubjectId };
}

export const uploadSyllabus = async (req, res) => {
    try {
        const { subjectId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }
        
        const auth = await authorizeSyllabusAction(req.user, subjectId);
        if (auth.error) return res.status(auth.status).json({ message: auth.error });

        const dataBuffer = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path);

        const pdfExports = pdf.default || pdf;
        let result;
        
        if (pdfExports.PDFParse) {
             const PDFParseClass = pdfExports.PDFParse;
             const parser = new PDFParseClass({ data: dataBuffer });
             result = await parser.getText();
        } else if (typeof pdfExports === 'function') {
             result = await pdfExports(dataBuffer);
        } else {
             throw new Error("Could not load PDFParse. Exports: " + typeof pdfExports);
        }
        
        const extractedText = result.text;
        console.log("PDF parsed, sending to AI...");
        let extractedChapters = await parseSyllabusWithAI(extractedText);
        
        if (!extractedChapters || extractedChapters.length === 0) {
             extractedChapters = parseSyllabusText(extractedText);
        }

        if (!extractedChapters || extractedChapters.length === 0) {
            return res.status(400).json({ 
                message: "Could not extract syllabus content. Try manual entry.",
                error: "Parsing failed"
            });
        }
        
        await prisma.$transaction(async (tx) => {
            await tx.chapter.deleteMany({ where: { subjectId } });
            
            for (const chap of extractedChapters) {
                const newChapter = await tx.chapter.create({
                    data: {
                        number: chap.number,
                        title: chap.title,
                        subjectId: subjectId
                    }
                });
                
                if (chap.topics.length > 0) {
                    await tx.topic.createMany({
                        data: chap.topics.map(t => ({
                            name: t,
                            chapterId: newChapter.id
                        }))
                    });
                }
            }
        }, { maxWait: 5000, timeout: 30000 });
        
        const fullSyllabus = await prisma.chapter.findMany({
            where: { subjectId },
            include: { topics: true },
            orderBy: { number: 'asc' }
        });

        res.status(200).json(fullSyllabus);

    } catch (error) {
        console.error("Syllabus upload error:", error);
        res.status(500).json({ message: "Failed to process syllabus PDF", error: error.message });
    }
};

export const getSyllabus = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const chapters = await prisma.chapter.findMany({
            where: { subjectId },
            include: { topics: true },
            orderBy: { number: 'asc' }
        });
        res.json(chapters);
    } catch (error) {
         res.status(500).json({ message: "Failed to fetch syllabus" });
    }
};

export const updateChapter = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const { title, number } = req.body;

        const auth = await authorizeSyllabusAction(req.user, null, chapterId);
        if (auth.error) return res.status(auth.status).json({ message: auth.error });

        const chapter = await prisma.chapter.update({
            where: { id: chapterId },
            data: { title, number: number ? parseInt(number) : undefined }
        });
        res.json(chapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update chapter" });
    }
};

export const deleteChapter = async (req, res) => {
    try {
        const { chapterId } = req.params;

        const auth = await authorizeSyllabusAction(req.user, null, chapterId);
        if (auth.error) return res.status(auth.status).json({ message: auth.error });

        await prisma.topic.deleteMany({ where: { chapterId } });
        await prisma.chapter.delete({ where: { id: chapterId } });
        res.json({ message: "Chapter deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete chapter" });
    }
};

export const updateTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { name } = req.body;

        const auth = await authorizeSyllabusAction(req.user, null, null, topicId);
        if (auth.error) return res.status(auth.status).json({ message: auth.error });

        const topic = await prisma.topic.update({
            where: { id: topicId },
            data: { name }
        });
        res.json(topic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update topic" });
    }
};

export const deleteTopic = async (req, res) => {
    try {
        const { topicId } = req.params;

        const auth = await authorizeSyllabusAction(req.user, null, null, topicId);
        if (auth.error) return res.status(auth.status).json({ message: auth.error });

        await prisma.topic.delete({ where: { id: topicId } });
        res.json({ message: "Topic deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete topic" });
    }
};

function parseSyllabusText(text) {
    const chapters = [];
    const lines = text.split('\n');
    let currentChapter = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const unitMatch = line.match(/^(?:Unit|Module|Chapter)\s*-?\s*(\d+)\s*[:.-]?\s*(.*)/i) || 
                         line.match(/^(\d+)\.\s*(.*)/);

        if (unitMatch) {
            const num = parseInt(unitMatch[1]);
            const title = unitMatch[2].trim() || `Unit ${num}`;
            currentChapter = { number: num, title: title, topics: [] };
            chapters.push(currentChapter);
        } else if (currentChapter) {
            if (line.match(/Page|Hours|Credits|Marks|Syllabus|Course/i) || line.length < 3) continue;
            const topic = line.replace(/^[•\-\*]\s*/, '').replace(/\s*\d+\s*$/, '').trim();
            if (topic && topic.length > 5) {
                currentChapter.topics.push(topic);
            }
        }
    }
    return chapters.filter(c => c.topics.length > 0);
}
