const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
require('dotenv').config();

// Ensure API key exists
if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
  });
  
const generationConfig = {
    temperature: 0.9,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048
};

module.exports = { model, generationConfig };
