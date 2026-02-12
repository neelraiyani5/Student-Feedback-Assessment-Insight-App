import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Try to clean the key in case of stray quotes
const rawKey = process.env.GEMINI_API_KEY || "";
const cleanKey = rawKey.replace(/^["']|["']$/g, '');

console.log("Key Length:", cleanKey.length);
console.log("Key Prefix:", cleanKey.substring(0, 10));

const genAI = new GoogleGenerativeAI(cleanKey);

async function listModels() {
    try {
        console.log("Calling genAI.listModels()...");
        // The listModels method exists on the genAI object in some versions or via separate client
        // Actually, listing models usually requires more setup. 
        // Let's try a direct fetch to the API to see the raw response header/body
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("Error Fetching Models:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch Error:", error.message);
    }
}

listModels();
