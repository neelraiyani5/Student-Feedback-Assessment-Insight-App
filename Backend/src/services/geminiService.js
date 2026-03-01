import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

const getGenAI = () => {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

export const parseSyllabusWithAI = async (text) => {
    const ai = getGenAI();
    if (!ai) {
        console.error("Gemini API Key missing");
        return null;
    }
    try {
        // Switching to gemini-flash-latest because gemini-2.0-flash had 0 quota 
        // and gemini-1.5-flash was not found in your model list.
        const model = ai.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an expert academic syllabus parser.
        Your goal is to extract Units (Chapters) and their distinct Topics (Subtopics) from the provided text.
        
        STRICT EXTRACTION RULES:
        1. Identify sections like "Unit 1", "Module I", "Chapter 1", etc.
        2. "number" must be an integer.
        3. "title" must be the name of the unit (e.g., "Introduction to Neural Networks").
        4. "topics" must be a clean array of strings. Split long paragraphs into logical subtopics.
        5. IGNORE: Marks, Hours, Credits, Outcomes, Objectives, Reference Books, and Lists of Experiments.
        6. IGNORE: Standalone numbers like "05", "10" which usually represent hours.
        7. If the text is a table, align the unit title with its corresponding topics correctly.
        
        CRITICAL: Return ONLY a valid JSON array. Do not include any explanation or markdown tags.
        [
            { "number": 1, "title": "Unit Title Here", "topics": ["Topic A", "Topic B"] }
        ]

        SYLLABUS TEXT:
        ${text.substring(0, 25000)} 
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();
        
        console.log("Raw AI Response received");
        
        // Advanced cleanup: Find the first '[' and last ']' to extract JSON if AI adds chatter
        const start = textResponse.indexOf('[');
        const end = textResponse.lastIndexOf(']');
        
        if (start === -1 || end === -1) {
            console.error("AI did not return a valid JSON array format");
            return null;
        }
        
        const jsonString = textResponse.substring(start, end + 1);
        const parsed = JSON.parse(jsonString);
        
        if (Array.isArray(parsed)) {
            console.log(`Successfully extracted ${parsed.length} units via AI`);
            return parsed;
        }
        
        return null;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return null;
    }
};

/**
 * AI Timetable Parser
 * Extracts metadata, legends, and grid data from messy Excel text
 */
export const parseTimetableWithAI = async (sheetDataText) => {
    const ai = getGenAI();
    if (!ai) {
        console.error("Gemini API Key missing");
        return null;
    }

    try {
        const model = ai.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an expert academic timetable parser. 
        Your goal is to extract schedule information from the provided raw text (converted from Excel).

        CONTEXT:
        - The text contains a header (Semester, Division, Class Room).
        - It includes legends for "SUBJECT NAMES AND CODES" and "FACULTY INITIALS AND NAMES".
        - It has a grid starting with "Sr No", "TIME", and days like "MON", "TUE", etc.
        - Labs often span multiple columns or have multiple initials (e.g., "AI NAK MA105").

        RULES:
        1. "semester": Extract as an integer (convert Roman numerals like VI to 6).
        2. "division": Extract the division/class name (e.g., "6EK2", "4EK1").
        3. "defaultRoom": Extract the class room from the header.
        4. "entries": This is an array of lecture objects.
           For each entry, extract:
           - "day": The day initials (MON, TUE, WED, THU, FRI).
           - "startTime": Start time (e.g., "09:30").
           - "endTime": End time (e.g., "11:00").
           - "subjectInitial": The short code for the subject (e.g., "AI", "CC").
           - "facultyInitial": The short initials for the faculty (e.g., "NAK", "SPL").
           - "room": The specific room for that lecture. If not mentioned in the cell, use the "defaultRoom".
        
        LEGEND HANDLING:
        - You must also return "subjects" and "faculty" maps from the legends found in the text.
        - "subjects": { "INITIAL": { "fullName": "Full Subject Name", "code": "SubCode" } }
        - "faculty": { "INITIAL": "Full Faculty Name" }

        IGNORE:
        - "PBL", "Tea Break", "Lunch Break", "Break", "Project Based Learning", "MOOC".
        - Single letters like "A", "B", "C" used ALONE in cells are BATCH/GROUP identifiers, NOT subject names. Do NOT create entries for them.
        - If a cell contains a batch letter alongside a subject (e.g., "A: AI NAK MA105"), extract the subject but ignore the batch letter.

        CRITICAL: Return ONLY a valid JSON object. No explanation.
        Example Format:
        {
          "metadata": { "semester": 6, "division": "6EK2", "defaultRoom": "MA105" },
          "subjects": { "AI": { "fullName": "Artificial Intelligence", "code": "01CT0616" } },
          "faculty": { "NAK": "PROF. NISHITH KOTAK" },
          "entries": [
             { "day": "MON", "startTime": "09:30", "endTime": "11:00", "subjectInitial": "AI", "facultyInitial": "NAK", "room": "MA105" }
          ]
        }

        RAW TABLE TEXT:
        ${sheetDataText.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();
        
        const start = textResponse.indexOf('{');
        const end = textResponse.lastIndexOf('}');
        
        if (start === -1 || end === -1) return null;
        
        const jsonString = textResponse.substring(start, end + 1);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("AI Timetable Parsing Error:", error);
        return null;
    }
};
