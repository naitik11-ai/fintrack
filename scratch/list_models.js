import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
  try {
    const result = await genAI.listModels();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
