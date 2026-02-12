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
