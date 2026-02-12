import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import prisma from "../prisma/client.js";

import { parseSyllabusWithAI } from "../services/geminiService.js";

export const uploadSyllabus = async (req, res) => {
    try {
        const { subjectId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }
        
        if (!subjectId) {
             return res.status(400).json({ message: "Subject ID is required" });
        }

        // Authorization Check for Faculty & CC
        if (req.user.role === 'FACULTY') {
            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                select: { facultyIds: true }
            });
            if (!subject || !subject.facultyIds.includes(req.user.id)) {
                return res.status(403).json({ message: "Access Denied: You are not assigned to this subject." });
            }
        } else if (req.user.role === 'CC') {
            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                select: { semesterId: true }
            });
            if (!subject) return res.status(404).json({ message: "Subject not found" });

            const coordinatedClass = await prisma.class.findFirst({
                where: {
                    ccId: req.user.id,
                    semesterId: subject.semesterId
                }
            });
            
            if (!coordinatedClass) {
                return res.status(403).json({ message: "Access Denied: You are not a coordinator for this subject's semester." });
            }
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        // Clean up uploaded file immediately after reading
        fs.unlinkSync(req.file.path);

        let extractedText = "";
        
        // Use pdf-parse (v2) to get raw text
        // v2 exports a PDFParse class, unlike v1 which exported a function
        const pdfExports = pdf.default || pdf;
        
        let result;
        
        // V2 detection: check if PDFParse property exists and is a function/class
        if (pdfExports.PDFParse) {
             const PDFParseClass = pdfExports.PDFParse;
             const parser = new PDFParseClass({ data: dataBuffer });
             result = await parser.getText();
        } 
        // V1 detection: the export itself is a function
        else if (typeof pdfExports === 'function') {
             result = await pdfExports(dataBuffer);
        } 
        else {
             throw new Error("Could not load PDFParse class or function. Exports: " + typeof pdfExports);
        }
        
        extractedText = result.text;
        
        console.log("PDF parsed, sending to AI...");
        let extractedChapters = await parseSyllabusWithAI(extractedText);
        
        if (!extractedChapters || extractedChapters.length === 0) {
             console.log("AI failed or not configured, reverting to manual heuristic parsing...");
             extractedChapters = parseSyllabusText(extractedText);
        }

        if (!extractedChapters || extractedChapters.length === 0) {
            return res.status(400).json({ 
                message: "Could not extract any units or topics from the PDF. Please try a different PDF or enter chapters manually.",
                error: "Parsing failed"
            });
        }
        
        // Save to Database
        // Increased timeout to 30s to handle large files
        await prisma.$transaction(async (tx) => {
            // Delete existing chapters (Topics are deleted automatically due to CASCADE in schema)
            await tx.chapter.deleteMany({ where: { subjectId } });
            
            // Create new
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
        }, {
            maxWait: 5000, 
            timeout: 30000 
        });
        
        // Fetch complete structure to return
        const fullSyllabus = await prisma.chapter.findMany({
            where: { subjectId },
            include: { topics: true },
            orderBy: { number: 'asc' }
        });

        res.status(200).json({ 
            message: "Syllabus processed and saved successfully", 
            chapters: fullSyllabus 
        });

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

        // Authorization Check for Faculty & CC
        if (req.user.role === 'FACULTY') {
            const chap = await prisma.chapter.findUnique({
                where: { id: chapterId },
                include: { subject: { select: { facultyIds: true } } }
            });
            if (!chap || !chap.subject.facultyIds.includes(req.user.id)) {
                return res.status(403).json({ message: "Access Denied: You are not assigned to this subject." });
            }
        } else if (req.user.role === 'CC') {
            const chap = await prisma.chapter.findUnique({
                where: { id: chapterId },
                include: { subject: { select: { semesterId: true } } }
            });
            if (!chap) return res.status(404).json({ message: "Chapter not found" });

            const coordinatedClass = await prisma.class.findFirst({
                where: {
                    ccId: req.user.id,
                    semesterId: chap.subject.semesterId
                }
            });
            
            if (!coordinatedClass) {
                return res.status(403).json({ message: "Access Denied: You are not a coordinator for this subject's semester." });
            }
        }

        const chapter = await prisma.chapter.update({
            where: { id: chapterId },
            data: { title, number }
        });
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ message: "Failed to update chapter" });
    }
};

export const deleteChapter = async (req, res) => {
    try {
        const { chapterId } = req.params;

        // Authorization Check for Faculty & CC
        if (req.user.role === 'FACULTY') {
            const chap = await prisma.chapter.findUnique({
                where: { id: chapterId },
                include: { subject: { select: { facultyIds: true } } }
            });
            if (!chap || !chap.subject.facultyIds.includes(req.user.id)) {
                return res.status(403).json({ message: "Access Denied: You are not assigned to this subject." });
            }
        } else if (req.user.role === 'CC') {
            const chap = await prisma.chapter.findUnique({
                where: { id: chapterId },
                include: { subject: { select: { semesterId: true } } }
            });
            if (!chap) return res.status(404).json({ message: "Chapter not found" });

            const coordinatedClass = await prisma.class.findFirst({
                where: {
                    ccId: req.user.id,
                    semesterId: chap.subject.semesterId
                }
            });
            
            if (!coordinatedClass) {
                return res.status(403).json({ message: "Access Denied: You are not a coordinator for this subject's semester." });
            }
        }

        await prisma.topic.deleteMany({ where: { chapterId } });
        await prisma.chapter.delete({ where: { id: chapterId } });
        res.json({ message: "Chapter deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete chapter" });
    }
};

export const updateTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { name } = req.body;

        // Authorization Check for Faculty & CC
        if (req.user.role === 'FACULTY') {
            const top = await prisma.topic.findUnique({
                where: { id: topicId },
                include: { chapter: { include: { subject: { select: { facultyIds: true } } } } }
            });
            if (!top || !top.chapter.subject.facultyIds.includes(req.user.id)) {
                return res.status(403).json({ message: "Access Denied: You are not assigned to this subject." });
            }
        } else if (req.user.role === 'CC') {
            const top = await prisma.topic.findUnique({
                where: { id: topicId },
                include: { chapter: { include: { subject: { select: { semesterId: true } } } } }
            });
            if (!top) return res.status(404).json({ message: "Topic not found" });

            const coordinatedClass = await prisma.class.findFirst({
                where: {
                    ccId: req.user.id,
                    semesterId: top.chapter.subject.semesterId
                }
            });
            
            if (!coordinatedClass) {
                return res.status(403).json({ message: "Access Denied: You are not a coordinator for this subject's semester." });
            }
        }

        const topic = await prisma.topic.update({
            where: { id: topicId },
            data: { name }
        });
        res.json(topic);
    } catch (error) {
        res.status(500).json({ message: "Failed to update topic" });
    }
};

export const deleteTopic = async (req, res) => {
    try {
        const { topicId } = req.params;

        // Authorization Check for Faculty & CC
        if (req.user.role === 'FACULTY') {
            const top = await prisma.topic.findUnique({
                where: { id: topicId },
                include: { chapter: { include: { subject: { select: { facultyIds: true } } } } }
            });
            if (!top || !top.chapter.subject.facultyIds.includes(req.user.id)) {
                return res.status(403).json({ message: "Access Denied: You are not assigned to this subject." });
            }
        } else if (req.user.role === 'CC') {
            const top = await prisma.topic.findUnique({
                where: { id: topicId },
                include: { chapter: { include: { subject: { select: { semesterId: true } } } } }
            });
            if (!top) return res.status(404).json({ message: "Topic not found" });

            const coordinatedClass = await prisma.class.findFirst({
                where: {
                    ccId: req.user.id,
                    semesterId: top.chapter.subject.semesterId
                }
            });
            
            if (!coordinatedClass) {
                return res.status(403).json({ message: "Access Denied: You are not a coordinator for this subject's semester." });
            }
        }

        await prisma.topic.delete({ where: { id: topicId } });
        res.json({ message: "Topic deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete topic" });
    }
};

// Fallback manual parsing logic
function parseSyllabusText(text) {
    const chapters = [];
    // Looking for patterns like "Unit 1", "Module 1", "Chapter 1" or just "1. Introduction"
    const lines = text.split('\n');
    let currentChapter = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Pattern matching for Units/Chapters
        const unitMatch = line.match(/^(?:Unit|Module|Chapter)\s*-?\s*(\d+)\s*[:.-]?\s*(.*)/i) || 
                         line.match(/^(\d+)\.\s*(.*)/);

        if (unitMatch) {
            const num = parseInt(unitMatch[1]);
            const title = unitMatch[2].trim() || `Unit ${num}`;
            currentChapter = {
                number: num,
                title: title,
                topics: []
            };
            chapters.push(currentChapter);
        } else if (currentChapter) {
            // Noise filtering: skip lines that look like page numbers, headers, or metadata
            if (line.match(/Page|Hours|Credits|Marks|Syllabus|Course/i) || line.length < 3) continue;
            
            // Treat other lines as topics
            // Clean common bullet symbols
            const topic = line.replace(/^[•\-\*]\s*/, '').replace(/\s*\d+\s*$/, '').trim();
            if (topic && topic.length > 5) {
                currentChapter.topics.push(topic);
            }
        }
    }
    
    // De-duplication and cleanup
    return chapters.filter(c => c.topics.length > 0);
}
