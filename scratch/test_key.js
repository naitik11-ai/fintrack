import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyBT3TQS8pCgLvAsjdDGG8NJU1E9lDn9IzU";
const genAI = new GoogleGenerativeAI(key);

async function testModel(modelName) {
  console.log(`\nTesting ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello! What is 2+2?");
    const response = await result.response;
    console.log(`✅ Success for ${modelName}:`, response.text().trim());
  } catch (error) {
    console.log(`❌ Error for ${modelName}:`, error.message);
  }
}

async function run() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-1.5-pro');
}

run();
